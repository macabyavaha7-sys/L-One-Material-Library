import { useEffect, useMemo, useState } from "react";
import AssetDetailModal from "./components/AssetDetailModal";
import AssetGrid from "./components/AssetGrid";
import TopNav from "./components/TopNav";
import { useAssets } from "./hooks/useAssets";
import { useFilteredAssets } from "./hooks/useFilteredAssets";
import type { AssetItem } from "./types/asset";
import {
  categoryToPath,
  getRouteFromLocation,
  normalizeCategory,
  normalizeTag,
  tagToPath
} from "./utils/category";

function App() {
  const { assets, loading, error } = useAssets();
  const [searchQuery, setSearchQuery] = useState("");
  const [route, setRoute] = useState(() => getRouteFromLocation());
  const [selectedAsset, setSelectedAsset] = useState<AssetItem | null>(null);

  useEffect(() => {
    const onPopState = () => setRoute(getRouteFromLocation());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(assets.map((asset) => asset.category || "未分类"))];
    return ["全部", ...uniqueCategories.sort((a, b) => a.localeCompare(b, "zh-CN"))];
  }, [assets]);

  const selectedCategory = route.type === "category" ? route.value : "全部";
  const selectedTag = route.type === "tag" ? route.value : "";
  const filteredAssets = useFilteredAssets(assets, selectedCategory, selectedTag, searchQuery);

  const handleCategoryChange = (category: string) => {
    const normalized = normalizeCategory(category);
    setRoute({ type: "category", value: normalized });
    window.history.pushState({}, "", categoryToPath(normalized));
  };

  const handleTagChange = (tag: string) => {
    const normalized = normalizeTag(tag);
    if (!normalized) return;
    setRoute({ type: "tag", value: normalized });
    setSelectedAsset(null);
    window.history.pushState({}, "", tagToPath(normalized));
  };

  return (
    <div className="app-shell">
      <TopNav
        categories={categories}
        currentCategory={selectedCategory}
        searchQuery={searchQuery}
        onCategoryChange={handleCategoryChange}
        onSearchChange={setSearchQuery}
      />

      <main className="page-main">
        <AssetGrid
          assets={filteredAssets}
          loading={loading}
          error={error}
          currentCategory={selectedCategory}
          currentTag={selectedTag}
          searchQuery={searchQuery}
          onAssetSelect={setSelectedAsset}
        />
      </main>

      {selectedAsset && (
        <AssetDetailModal
          asset={selectedAsset}
          onClose={() => setSelectedAsset(null)}
          onTagSelect={handleTagChange}
        />
      )}
    </div>
  );
}

export default App;
