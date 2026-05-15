const fs = require("node:fs");
const path = require("node:path");
const { HeadObjectCommand, PutObjectCommand, S3Client } = require("@aws-sdk/client-s3");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
dotenv.config();

const SOURCE_ROOT = process.env.L_ONE_ASSET_ROOT || "D:\\动画素材库";
const PUBLIC_DATA_FILE = path.resolve(__dirname, "../public/data/assets.json");
const PAGES_DATA_FILE = path.resolve(__dirname, "../data/assets.json");

const requiredEnv = [
  "CLOUDFLARE_ACCOUNT_ID",
  "R2_BUCKET",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_PUBLIC_BASE_URL"
];

const previewExtensions = new Set([".gif"]);
const videoExtensions = new Set([".mp4", ".mov", ".webm", ".mkv"]);
const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const supportedExtensions = new Set([
  ...previewExtensions,
  ...videoExtensions,
  ...imageExtensions
]);

const mimeTypes = {
  ".gif": "image/gif",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
  ".mkv": "video/x-matroska"
};

function assertEnv() {
  const missing = requiredEnv.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing R2 config: ${missing.join(", ")}. Copy .env.example to .env.local and fill it in.`);
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

function toR2Key(relativeFilePath) {
  return `media/${relativeFilePath.split(path.sep).join("/")}`;
}

function toPublicUrl(key) {
  const base = process.env.R2_PUBLIC_BASE_URL.replace(/\/+$/, "");
  return `${base}/${key.split("/").map(encodeURIComponent).join("/")}`;
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
    const r2Key = toR2Key(relativeFilePath);
    const item = {
      absolutePath,
      relativeFilePath,
      relativeDirectory,
      baseName: parsed.name,
      fileName: path.basename(absolutePath),
      ext,
      r2Key,
      publicUrl: toPublicUrl(r2Key),
      folderPath: path.dirname(absolutePath),
      size: stats.size,
      createdAt: stats.birthtime.toISOString(),
      updatedAt: stats.mtime.toISOString()
    };

    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }

  return groups;
}

async function uploadIfNeeded(client, file) {
  const bucket = process.env.R2_BUCKET;
  let shouldUpload = true;

  try {
    const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: file.r2Key }));
    shouldUpload = Number(head.ContentLength) !== file.size;
  } catch {
    shouldUpload = true;
  }

  if (!shouldUpload) {
    console.log(`[skip] ${file.r2Key}`);
    return;
  }

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: file.r2Key,
      Body: fs.createReadStream(file.absolutePath),
      ContentType: mimeTypes[file.ext] || "application/octet-stream",
      CacheControl: "public, max-age=31536000, immutable"
    })
  );
  console.log(`[upload] ${file.r2Key}`);
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
        folderPath: primary.folderPath,
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

async function main() {
  assertEnv();

  if (!fs.existsSync(SOURCE_ROOT)) {
    throw new Error(`Source folder not found: ${SOURCE_ROOT}`);
  }

  const endpoint = `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const client = new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
    }
  });

  const files = walk(SOURCE_ROOT);
  const groups = groupFiles(files);
  const allFiles = [...groups.values()].flat();

  for (const file of allFiles) {
    await uploadIfNeeded(client, file);
  }

  const manifest = createManifest(groups);
  for (const outputFile of [PUBLIC_DATA_FILE, PAGES_DATA_FILE]) {
    fs.mkdirSync(path.dirname(outputFile), { recursive: true });
    fs.writeFileSync(outputFile, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  }

  console.log(`[sync-r2] Source: ${SOURCE_ROOT}`);
  console.log(`[sync-r2] Uploaded/checked files: ${allFiles.length}`);
  console.log(`[sync-r2] Assets: ${manifest.length}`);
  console.log(`[sync-r2] Manifest: ${PAGES_DATA_FILE}`);
}

main().catch((error) => {
  console.error(`[sync-r2] ${error.message}`);
  process.exit(1);
});
