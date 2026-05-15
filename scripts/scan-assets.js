const fs = require("node:fs");
const path = require("node:path");

const SOURCE_ROOT = process.env.L_ONE_ASSET_ROOT || "D:\\动画素材库";
const OUTPUT_FILE = path.resolve(__dirname, "../public/data/assets.json");

const previewExtensions = new Set([".gif"]);
const videoExtensions = new Set([".mp4", ".mov", ".webm", ".mkv"]);
const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const supportedExtensions = new Set([
  ...previewExtensions,
  ...videoExtensions,
  ...imageExtensions
]);

function toPublicMediaUrl(relativeFilePath) {
  return `/media/${relativeFilePath
    .split(path.sep)
    .map((segment) => encodeURIComponent(segment))
    .join("/")}`;
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
      if (supportedExtensions.has(ext)) {
        files.push(absolutePath);
      }
    }
  }

  return files;
}

function getCategory(relativeDirectory) {
  if (!relativeDirectory || relativeDirectory === ".") return "未分类";
  return relativeDirectory.split(path.sep).filter(Boolean)[0] || "未分类";
}

function pickFirstByExtension(files, extensions) {
  return files
    .filter((file) => extensions.has(file.ext))
    .sort((a, b) => a.ext.localeCompare(b.ext) || a.fileName.localeCompare(b.fileName, "zh-CN"))
    [0];
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

function scanAssets() {
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });

  if (!fs.existsSync(SOURCE_ROOT)) {
    fs.writeFileSync(OUTPUT_FILE, "[]\n", "utf8");
    console.warn(`[scan-assets] Source folder not found: ${SOURCE_ROOT}`);
    console.warn(`[scan-assets] Wrote empty manifest: ${OUTPUT_FILE}`);
    return [];
  }

  const files = walk(SOURCE_ROOT);
  const groups = new Map();

  for (const absolutePath of files) {
    const relativeFilePath = path.relative(SOURCE_ROOT, absolutePath);
    const relativeDirectory = path.dirname(relativeFilePath);
    const parsed = path.parse(absolutePath);
    const key = `${relativeDirectory}::${parsed.name}`;
    const stats = fs.statSync(absolutePath);
    const item = {
      absolutePath,
      relativeFilePath,
      relativeDirectory,
      baseName: parsed.name,
      fileName: path.basename(absolutePath),
      ext: parsed.ext.toLowerCase(),
      folderPath: path.dirname(absolutePath),
      createdAt: stats.birthtime.toISOString(),
      updatedAt: stats.mtime.toISOString()
    };

    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }

  const usedIds = new Set();
  const assets = [...groups.values()]
    .map((group) => {
      const gif = pickFirstByExtension(group, previewExtensions);
      const video = pickFirstByExtension(group, videoExtensions);
      const image = pickFirstByExtension(group, imageExtensions);
      const primary = video || gif || image || group[0];
      const fileTypes = [...new Set(group.map((file) => file.ext.replace(".", "")))].sort();
      const baseId = primary.baseName;

      return {
        id: makeUniqueId(baseId, usedIds),
        title: primary.baseName,
        category: getCategory(primary.relativeDirectory),
        tags: [],
        previewGif: gif ? toPublicMediaUrl(gif.relativeFilePath) : undefined,
        video: video ? toPublicMediaUrl(video.relativeFilePath) : undefined,
        image: image ? toPublicMediaUrl(image.relativeFilePath) : undefined,
        fileName: primary.fileName,
        folderPath: primary.folderPath,
        relativePath: primary.relativeFilePath,
        fileTypes,
        createdAt: group
          .map((file) => file.createdAt)
          .sort()[0],
        updatedAt: group
          .map((file) => file.updatedAt)
          .sort()
          .reverse()[0]
      };
    })
    .sort((a, b) => {
      const categoryCompare = a.category.localeCompare(b.category, "zh-CN");
      if (categoryCompare !== 0) return categoryCompare;
      return a.title.localeCompare(b.title, "zh-CN", { numeric: true });
    });

  fs.writeFileSync(OUTPUT_FILE, `${JSON.stringify(assets, null, 2)}\n`, "utf8");
  console.log(`[scan-assets] Source: ${SOURCE_ROOT}`);
  console.log(`[scan-assets] Assets: ${assets.length}`);
  console.log(`[scan-assets] Manifest: ${OUTPUT_FILE}`);
  return assets;
}

scanAssets();
