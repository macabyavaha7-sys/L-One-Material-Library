import { useMemo } from "react";
import type { AssetItem } from "../types/asset";

export function useFilteredAssets(
  assets: AssetItem[],
  selectedCategory: string,
  selectedTag: string,
  searchQuery: string
) {
  return useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const tag = selectedTag.trim();

    return assets.filter((asset) => {
      const matchesCategory = selectedCategory === "全部" || asset.category === selectedCategory;
      if (!matchesCategory) return false;
      if (tag && !asset.tags.includes(tag)) return false;

      if (!query) return true;

      const searchable = [
        asset.title,
        asset.category,
        asset.fileName,
        asset.folderPath,
        asset.relativePath,
        ...asset.tags
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [assets, selectedCategory, selectedTag, searchQuery]);
}
