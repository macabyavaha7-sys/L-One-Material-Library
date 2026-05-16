import type { AssetItem } from "../types/asset";

export function getPreviewSource(asset: AssetItem) {
  return asset.thumbnail || asset.previewGif || asset.image || asset.video || "";
}

export function getDownloadSource(asset: AssetItem) {
  return asset.video || asset.previewGif || asset.image || "";
}

export function formatTypes(fileTypes: string[]) {
  return fileTypes.map((type) => type.toUpperCase()).join(" / ");
}
