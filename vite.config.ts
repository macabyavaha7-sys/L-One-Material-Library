import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";

const ASSET_ROOT = process.env.L_ONE_ASSET_ROOT || "D:\\动画素材库";

const mimeTypes: Record<string, string> = {
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

function isPathInside(parent: string, child: string) {
  const relative = path.relative(parent, child);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function parseRange(rangeHeader: string | undefined, size: number) {
  if (!rangeHeader) return null;
  const match = rangeHeader.match(/bytes=(\d*)-(\d*)/);
  if (!match) return null;

  const start = match[1] ? Number(match[1]) : 0;
  const end = match[2] ? Number(match[2]) : size - 1;
  if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= size) {
    return null;
  }

  return {
    start,
    end: Math.min(end, size - 1)
  };
}

export default defineConfig({
  base: process.env.GITHUB_PAGES ? "/L-One-Material-Library/" : "/",
  plugins: [
    react(),
    {
      name: "l-one-local-media",
      configureServer(server) {
        server.middlewares.use("/media", (req, res) => {
          try {
            const requestPath = decodeURIComponent((req.url || "").split("?")[0]);
            const relativePath = requestPath.replace(/^\/+/, "");
            const mediaPath = path.resolve(ASSET_ROOT, relativePath);
            const rootPath = path.resolve(ASSET_ROOT);

            if (!isPathInside(rootPath, mediaPath) || !fs.existsSync(mediaPath)) {
              res.statusCode = 404;
              res.end("Not found");
              return;
            }

            const stat = fs.statSync(mediaPath);
            if (!stat.isFile()) {
              res.statusCode = 404;
              res.end("Not found");
              return;
            }

            const ext = path.extname(mediaPath).toLowerCase();
            const contentType = mimeTypes[ext] || "application/octet-stream";
            const range = parseRange(req.headers.range, stat.size);

            res.setHeader("Content-Type", contentType);
            res.setHeader("Accept-Ranges", "bytes");
            res.setHeader("Cache-Control", "public, max-age=3600");

            if (range) {
              const length = range.end - range.start + 1;
              res.statusCode = 206;
              res.setHeader("Content-Range", `bytes ${range.start}-${range.end}/${stat.size}`);
              res.setHeader("Content-Length", length);
              if (req.method === "HEAD") {
                res.end();
                return;
              }
              fs.createReadStream(mediaPath, { start: range.start, end: range.end }).pipe(res);
              return;
            }

            res.statusCode = 200;
            res.setHeader("Content-Length", stat.size);
            if (req.method === "HEAD") {
              res.end();
              return;
            }
            fs.createReadStream(mediaPath).pipe(res);
          } catch {
            res.statusCode = 500;
            res.end("Media server error");
          }
        });
      }
    }
  ],
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true
  }
});
