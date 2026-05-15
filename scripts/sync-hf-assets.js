const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
dotenv.config();

const SOURCE_ROOT = process.env.L_ONE_ASSET_ROOT || "D:\\动画素材库";
const HF_DATASET_REPO = process.env.HF_DATASET_REPO || "macabyavaha7/L-One-Material-Library-assets";
const PUBLIC_DATA_FILE = path.resolve(__dirname, "../public/data/assets.json");
const PAGES_DATA_FILE = path.resolve(__dirname, "../data/assets.json");
const BATCH_SIZE = Number(process.env.HF_UPLOAD_BATCH_SIZE || 20);

const previewExtensions = new Set([".gif"]);
const videoExtensions = new Set([".mp4", ".mov", ".webm", ".mkv"]);
const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const supportedExtensions = new Set([
  ...previewExtensions,
  ...videoExtensions,
  ...imageExtensions
]);

function assertEnv() {
  if (!process.env.HF_TOKEN) {
    throw new Error("Missing HF_TOKEN. Create a Hugging Face write token and put it in .env.local.");
  }
}

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const absolutePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(absolutePath, files);
      continue;
    }

    if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (supportedExtensions.has(ext)) files.push(absolutePath);
    }
  }

  return files;
}

function toRepoPath(relativeFilePath) {
  return `media/${relativeFilePath.split(path.sep).join("/")}`;
}

function toHfUrl(repoPath) {
  return `https://huggingface.co/datasets/${HF_DATASET_REPO}/resolve/main/${repoPath
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}

function getCategory(relativeDirectory) {
  if (!relativeDirectory || relativeDirectory === ".") return "未分类";
  return relativeDirectory.split(path.sep).filter(Boolean)[0] || "未分类";
}

function pickFirstByExtension(files, extensions) {
  return files
    .filter((file) => extensions.has(file.ext))
    .sort((a, b) => a.ext.localeCompare(b.ext) || a.fileName.localeCompare(b.fileName, "zh-CN"))[0];
}

function makeUniqueId(baseId, usedIds) {
  let id = baseId;
  let count = 2;
  while (usedIds.has(id)) {
    id = `${baseId}_${count}`;
    count += 1;
  }
  usedIds.add(id);
  return id;
}

function groupFiles(files) {
  const groups = new Map();

  for (const absolutePath of files) {
    const relativeFilePath = path.relative(SOURCE_ROOT, absolutePath);
    const relativeDirectory = path.dirname(relativeFilePath);
    const parsed = path.parse(absolutePath);
    const key = `${relativeDirectory}::${parsed.name}`;
    const stats = fs.statSync(absolutePath);
    const ext = parsed.ext.toLowerCase();
    const repoPath = toRepoPath(relativeFilePath);
    const item = {
      absolutePath,
      relativeFilePath,
      relativeDirectory,
      baseName: parsed.name,
      fileName: path.basename(absolutePath),
      ext,
      repoPath,
      publicUrl: toHfUrl(repoPath),
      folderPath: path.dirname(absolutePath),
      createdAt: stats.birthtime.toISOString(),
      updatedAt: stats.mtime.toISOString()
    };

    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }

  return groups;
}

function createManifest(groups) {
  const usedIds = new Set();
  return [...groups.values()]
    .map((group) => {
      const gif = pickFirstByExtension(group, previewExtensions);
      const video = pickFirstByExtension(group, videoExtensions);
      const image = pickFirstByExtension(group, imageExtensions);
      const primary = video || gif || image || group[0];
      const fileTypes = [...new Set(group.map((file) => file.ext.replace(".", "")))].sort();

      return {
        id: makeUniqueId(primary.baseName, usedIds),
        title: primary.baseName,
        category: getCategory(primary.relativeDirectory),
        tags: [],
        previewGif: gif ? gif.publicUrl : undefined,
        video: video ? video.publicUrl : undefined,
        image: image ? image.publicUrl : undefined,
        fileName: primary.fileName,
        folderPath: primary.relativeDirectory === "." ? "未分类" : primary.relativeDirectory,
        relativePath: primary.relativeFilePath,
        fileTypes,
        createdAt: group.map((file) => file.createdAt).sort()[0],
        updatedAt: group.map((file) => file.updatedAt).sort().reverse()[0]
      };
    })
    .sort((a, b) => {
      const categoryCompare = a.category.localeCompare(b.category, "zh-CN");
      if (categoryCompare !== 0) return categoryCompare;
      return a.title.localeCompare(b.title, "zh-CN", { numeric: true });
    });
}

function chunk(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

async function uploadBatches(files) {
  const hub = await import("@huggingface/hub");
  const repo = { type: "dataset", name: HF_DATASET_REPO };
  const batches = chunk(files, BATCH_SIZE);

  for (let index = 0; index < batches.length; index += 1) {
    const batch = batches[index];
    console.log(`[hf] Uploading batch ${index + 1}/${batches.length}: ${batch.length} file(s)`);
    await hub.uploadFiles({
      repo,
      accessToken: process.env.HF_TOKEN,
      files: batch.map((file) => ({
        path: file.repoPath,
        content: pathToFileURL(file.absolutePath)
      })),
      commitTitle: `Sync L-One assets batch ${index + 1}`,
      useXet: false
    });
  }
}

async function main() {
  assertEnv();

  if (!fs.existsSync(SOURCE_ROOT)) {
    throw new Error(`Source folder not found: ${SOURCE_ROOT}`);
  }

  const files = walk(SOURCE_ROOT);
  const groups = groupFiles(files);
  const allFiles = [...groups.values()].flat();
  const manifest = createManifest(groups);

  await uploadBatches(allFiles);

  for (const outputFile of [PUBLIC_DATA_FILE, PAGES_DATA_FILE]) {
    fs.mkdirSync(path.dirname(outputFile), { recursive: true });
    fs.writeFileSync(outputFile, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  }

  console.log(`[sync-hf] Source: ${SOURCE_ROOT}`);
  console.log(`[sync-hf] Uploaded files: ${allFiles.length}`);
  console.log(`[sync-hf] Assets: ${manifest.length}`);
  console.log(`[sync-hf] Manifest: ${PAGES_DATA_FILE}`);
}

main().catch((error) => {
  console.error(`[sync-hf] ${error.message}`);
  process.exit(1);
});
