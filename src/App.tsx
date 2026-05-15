import { useEffect, useMemo, useState } from "react";
import AssetDetailModal from "./components/AssetDetailModal";
import AssetGrid from "./components/AssetGrid";
import TopNav from "./components/TopNav";
import { useAssets } from "./hooks/useAssets";
import { useFilteredAssets } from "./hooks/useFilteredAssets";
import type { AssetItem } from "./types/asset";
import { categoryToPath, getCategoryFromLocation, normalizeCategory } from "./utils/category";

function App() {
  const { assets, loading, error } = useAssets();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(() => getCategoryFromLocation());
  const [selectedAsset, setSelectedAsset] = useState<AssetItem | null>(null);

  useEffect(() => {
    const onPopState = () => setSelectedCategory(getCategoryFromLocation());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(assets.map((asset) => asset.category || "未分类"))];
    return ["全部", ...uniqueCategories.sort((a, b) => a.localeCompare(b, "zh-CN"))];
  }, [assets]);

  const filteredAssets = useFilteredAssets(assets, selectedCategory, searchQuery);

  const handleCategoryChange = (category: string) => {
    const normalized = normalizeCategory(category);
    setSelectedCategory(normalized);
    window.history.pushState({}, "", categoryToPath(normalized));
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
          searchQuery={searchQuery}
          onAssetSelect={setSelectedAsset}
        />
      </main>

      {selectedAsset && (
        <AssetDetailModal asset={selectedAsset} onClose={() => setSelectedAsset(null)} />
      )}
    </div>
  );
}

export default App;
