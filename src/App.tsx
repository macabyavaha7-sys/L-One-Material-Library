import { useEffect, useMemo, useState } from "react";
import AssetDetailModal from "./components/AssetDetailModal";
import AssetGrid from "./components/AssetGrid";
import CategoryMenu from "./components/CategoryMenu";
import LibraryFooter, { type PreviewSize, type ViewMode } from "./components/LibraryFooter";
import SearchBox from "./components/SearchBox";
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
  const [isCategoryExpanded, setIsCategoryExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("large");
  const [previewSize, setPreviewSize] = useState<PreviewSize>("medium");

  useEffect(() => {
    const onPopState = () => setRoute(getRouteFromLocation());
    window.addEventListener("popstate", onPopState);
    window.addEventListener("hashchange", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("hashchange", onPopState);
    };
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

  const handleCustomFilter = () => {
    const value = window.prompt("输入要筛选的分类名称");
    const normalized = normalizeCategory(value || "");
    if (normalized === "全部") return;
    handleCategoryChange(normalized);
  };

  return (
    <div className="app-shell">
      <TopNav onCategoryChange={handleCategoryChange} />

      <main className="page-main">
        <SearchBox value={searchQuery} onChange={setSearchQuery} />
        <CategoryMenu
          categories={categories}
          currentCategory={selectedCategory}
          expanded={isCategoryExpanded}
          onCategoryChange={handleCategoryChange}
          onToggleExpanded={() => setIsCategoryExpanded((expanded) => !expanded)}
          onCustomFilter={handleCustomFilter}
        />
        <AssetGrid
          assets={filteredAssets}
          loading={loading}
          error={error}
          currentCategory={selectedCategory}
          currentTag={selectedTag}
          searchQuery={searchQuery}
          viewMode={viewMode}
          previewSize={previewSize}
          onAssetSelect={setSelectedAsset}
        />
      </main>

      <LibraryFooter
        total={filteredAssets.length}
        viewMode={viewMode}
        previewSize={previewSize}
        onViewModeChange={setViewMode}
        onPreviewSizeChange={setPreviewSize}
      />

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
