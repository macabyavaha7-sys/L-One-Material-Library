import hashlib
import json
import os
import re
import shutil
import subprocess
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote

import gradio as gr
import requests
from huggingface_hub import HfApi


HF_TOKEN = os.environ.get("HF_TOKEN", "")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "")
DATASET_REPO = os.environ.get("HF_DATASET_REPO", "macabyavaha7/L-One-Material-Library-assets")
MANIFEST_PATH = "data/assets.json"
MAX_BYTES = 100 * 1024 * 1024
MAX_DURATION = 30.0
SUPPORTED_EXTENSIONS = {".mp4", ".mov", ".webm", ".gif", ".jpg", ".jpeg", ".png", ".webp"}
VIDEO_EXTENSIONS = {".mp4", ".mov", ".webm", ".gif"}
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


api = HfApi()


def now_iso():
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def public_url(repo_path: str) -> str:
    return f"https://huggingface.co/datasets/{DATASET_REPO}/resolve/main/" + "/".join(
        quote(part) for part in repo_path.split("/")
    )


def safe_segment(value: str, fallback: str) -> str:
    cleaned = re.sub(r"[\\/:*?\"<>|#%{}^~`\\[\\]]+", "-", (value or "").strip())
    cleaned = re.sub(r"\s+", "-", cleaned).strip("-._ ")
    return cleaned[:80] or fallback


def run_command(args):
    subprocess.run(args, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)


def probe_media(file_path: Path):
    result = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-print_format",
            "json",
            "-show_format",
            "-show_streams",
            str(file_path),
        ],
        check=True,
        capture_output=True,
        text=True,
    )
    data = json.loads(result.stdout or "{}")
    duration = None
    if data.get("format", {}).get("duration"):
        duration = float(data["format"]["duration"])
    video_stream = next((stream for stream in data.get("streams", []) if stream.get("codec_type") == "video"), {})
    return {
        "duration": duration,
        "width": video_stream.get("width"),
        "height": video_stream.get("height"),
        "codec": video_stream.get("codec_name"),
    }


def load_manifest():
    url = public_url(MANIFEST_PATH)
    response = requests.get(url, timeout=30)
    if response.status_code == 404:
        return []
    response.raise_for_status()
    text = response.text.lstrip("\ufeff").strip()
    return json.loads(text) if text else []


def upload_file(local_path: Path, repo_path: str, commit_message: str):
    api.upload_file(
        path_or_fileobj=str(local_path),
        path_in_repo=repo_path,
        repo_id=DATASET_REPO,
        repo_type="dataset",
        token=HF_TOKEN,
        commit_message=commit_message,
    )


def write_manifest(manifest):
    with tempfile.TemporaryDirectory() as tmp_dir:
        manifest_file = Path(tmp_dir) / "assets.json"
        manifest_file.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        upload_file(manifest_file, MANIFEST_PATH, "Update L-One asset manifest")


def validate_upload(password, file_path, category):
    if not HF_TOKEN:
        raise gr.Error("服务端缺少 HF_TOKEN，请检查 Space secrets。")
    if not ADMIN_PASSWORD:
        raise gr.Error("服务端缺少 ADMIN_PASSWORD，请检查 Space secrets。")
    if password != ADMIN_PASSWORD:
        raise gr.Error("上传口令错误。")
    if not file_path:
        raise gr.Error("请选择一个素材文件。")

    source = Path(file_path)
    extension = source.suffix.lower()
    if extension not in SUPPORTED_EXTENSIONS:
        raise gr.Error("格式不支持。允许：mp4 / mov / webm / gif / jpg / png / webp。")

    size = source.stat().st_size
    if size > MAX_BYTES:
        raise gr.Error(f"文件超过 100MB，当前约 {size / 1024 / 1024:.1f}MB。")

    info = probe_media(source)
    if extension in VIDEO_EXTENSIONS and info["duration"] and info["duration"] > MAX_DURATION:
        raise gr.Error(f"视频/GIF 超过 30 秒，当前约 {info['duration']:.1f} 秒。")

    return source, extension, size, info, safe_segment(category, "未分类")


def create_outputs(source: Path, extension: str, asset_id: str, work_dir: Path):
    original = work_dir / f"original{extension}"
    shutil.copy2(source, original)

    thumbnail = work_dir / "thumbnail.webp"
    preview = work_dir / "preview.webm"

    run_command(
        [
            "ffmpeg",
            "-y",
            "-hide_banner",
            "-loglevel",
            "error",
            "-i",
            str(original),
            "-vf",
            "scale=480:480:force_original_aspect_ratio=increase,crop=480:480",
            "-frames:v",
            "1",
            "-compression_level",
            "6",
            "-quality",
            "62",
            str(thumbnail),
        ]
    )

    if extension in VIDEO_EXTENSIONS:
        run_command(
            [
                "ffmpeg",
                "-y",
                "-hide_banner",
                "-loglevel",
                "error",
                "-t",
                "4",
                "-i",
                str(original),
                "-vf",
                "scale=640:-2:force_original_aspect_ratio=decrease,fps=15",
                "-an",
                "-c:v",
                "libvpx-vp9",
                "-b:v",
                "0",
                "-crf",
                "42",
                "-deadline",
                "good",
                "-row-mt",
                "1",
                str(preview),
            ]
        )
    else:
        preview = None

    return original, thumbnail, preview


def upload_asset(password, file, title, category, tags):
    source, extension, size, info, category_name = validate_upload(password, file, category)
    clean_title = (title or source.stem).strip() or source.stem
    digest = hashlib.sha1(f"{source.name}-{source.stat().st_size}-{datetime.now().isoformat()}".encode("utf-8")).hexdigest()[:10]
    asset_id = f"{datetime.now().strftime('%Y%m%d-%H%M%S')}-{digest}"
    tag_list = [tag.strip() for tag in re.split(r"[,，\\s]+", tags or "") if tag.strip()]

    with tempfile.TemporaryDirectory() as tmp_dir:
        work_dir = Path(tmp_dir)
        original, thumbnail, preview = create_outputs(source, extension, asset_id, work_dir)

        base_path = f"{category_name}/{asset_id}"
        original_repo_path = f"media/{base_path}/original{extension}"
        thumbnail_repo_path = f"optimized/{base_path}/thumbnail.webp"
        preview_repo_path = f"optimized/{base_path}/preview.webm" if preview else None

        upload_file(original, original_repo_path, f"Upload original asset {asset_id}")
        upload_file(thumbnail, thumbnail_repo_path, f"Upload thumbnail {asset_id}")
        if preview and preview.exists():
            upload_file(preview, preview_repo_path, f"Upload preview {asset_id}")

    manifest = load_manifest()
    created_at = now_iso()
    file_types = sorted({extension.replace(".", "")})
    item = {
        "id": asset_id,
        "title": clean_title,
        "category": category_name,
        "tags": tag_list,
        "thumbnail": public_url(thumbnail_repo_path),
        "previewVideo": public_url(preview_repo_path) if preview_repo_path else None,
        "previewGif": public_url(original_repo_path) if extension == ".gif" else None,
        "video": public_url(original_repo_path) if extension in {".mp4", ".mov", ".webm"} else None,
        "image": public_url(original_repo_path) if extension in IMAGE_EXTENSIONS else None,
        "fileName": source.name,
        "folderPath": category_name,
        "relativePath": original_repo_path,
        "fileTypes": file_types,
        "duration": info.get("duration"),
        "sizeBytes": size,
        "createdAt": created_at,
        "updatedAt": created_at,
    }
    item = {key: value for key, value in item.items() if value is not None}
    manifest.append(item)
    manifest.sort(key=lambda asset: (asset.get("category", ""), asset.get("title", "")))
    write_manifest(manifest)

    return (
        f"上传成功：{clean_title}\n"
        f"分类：{category_name}\n"
        f"大小：{size / 1024 / 1024:.1f}MB\n"
        f"时长：{info.get('duration') or 0:.1f}秒\n"
        f"素材 ID：{asset_id}\n"
        "主站刷新后即可看到。"
    )


with gr.Blocks(title="L-One 素材库上传") as demo:
    gr.Markdown("# L-One 素材库上传")
    gr.Markdown("限制：视频/GIF 不超过 30 秒，单文件不超过 100MB。系统会自动生成 WebP 缩略图和 WebM hover 预览。")
    with gr.Row():
        password = gr.Textbox(label="上传口令", type="password")
        category = gr.Textbox(label="分类", value="未分类")
    file = gr.File(label="素材文件", file_types=list(SUPPORTED_EXTENSIONS), type="filepath")
    title = gr.Textbox(label="标题（可选，不填则使用文件名）")
    tags = gr.Textbox(label="标签（可选，用逗号或空格分隔）")
    submit = gr.Button("上传并自动入库", variant="primary")
    output = gr.Textbox(label="处理结果", lines=8)

    submit.click(upload_asset, inputs=[password, file, title, category, tags], outputs=output)


if __name__ == "__main__":
    demo.launch()
