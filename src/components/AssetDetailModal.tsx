import { useEffect } from "react";
import type { AssetItem } from "../types/asset";
import { formatTypes, getDownloadSource, getPreviewSource } from "../utils/fileName";

type AssetDetailModalProps = {
  asset: AssetItem;
  onClose: () => void;
};

function AssetDetailModal({ asset, onClose }: AssetDetailModalProps) {
  const previewSource = getPreviewSource(asset);
  const downloadSource = getDownloadSource(asset);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="detail-backdrop" onClick={onClose}>
      <section className="detail-modal" onClick={(event) => event.stopPropagation()}>
        <button className="detail-close" type="button" onClick={onClose} aria-label="关闭详情">
          ×
        </button>

        <div className="detail-preview">
          {asset.video ? (
            <video src={asset.video} autoPlay muted loop playsInline />
          ) : (
            <img src={previewSource} alt={asset.title} />
          )}
        </div>

        <aside className="detail-info">
          <h1>{asset.title}</h1>
          <dl>
            <div>
              <dt>分类</dt>
              <dd>{asset.category}</dd>
            </div>
            <div>
              <dt>文件类型</dt>
              <dd>{formatTypes(asset.fileTypes)}</dd>
            </div>
            <div>
              <dt>GIF 路径</dt>
              <dd>{asset.previewGif || "无"}</dd>
            </div>
            <div>
              <dt>视频路径</dt>
              <dd>{asset.video || "无"}</dd>
            </div>
            <div>
              <dt>本地文件夹</dt>
              <dd>{asset.folderPath}</dd>
            </div>
          </dl>

          <a className="detail-download" href={downloadSource} download={asset.fileName}>
            下载素材
          </a>
        </aside>
      </section>
    </div>
  );
}

export default AssetDetailModal;
