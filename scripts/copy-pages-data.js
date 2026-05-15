const fs = require("node:fs");
const path = require("node:path");

const source = path.resolve(__dirname, "../data/assets.json");
const destination = path.resolve(__dirname, "../dist/data/assets.json");

if (!fs.existsSync(source)) {
  throw new Error(`Missing Pages asset manifest: ${source}`);
}

fs.mkdirSync(path.dirname(destination), { recursive: true });
fs.copyFileSync(source, destination);

const assets = JSON.parse(fs.readFileSync(destination, "utf8"));
console.log(`[copy-pages-data] Copied ${assets.length} assets to ${destination}`);
