import type { AssetItem } from "../types/asset";
import AssetCard from "./AssetCard";
import type { PreviewSize, ViewMode } from "./LibraryFooter";

type AssetGridProps = {
  assets: AssetItem[];
  loading: boolean;
  error: string | null;
  currentCategory: string;
  currentTag: string;
  searchQuery: string;
  viewMode: ViewMode;
  previewSize: PreviewSize;
  onAssetSelect: (asset: AssetItem) => void;
};

function AssetGrid({
  assets,
  loading,
  error,
  currentCategory,
  currentTag,
  searchQuery,
  viewMode,
  previewSize,
  onAssetSelect
}: AssetGridProps) {
  if (loading) {
    return (
      <section className="asset-section">
        <div className="grid-status">正在读取素材清单</div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="asset-section">
        <div className="empty-state">
          <h1>素材清单读取失败</h1>
          <p>{error}</p>
          <button type="button" onClick={() => window.location.reload()}>
            重新加载
          </button>
        </div>
      </section>
    );
  }

  if (!assets.length) {
    const hasFilter = currentCategory !== "全部" || currentTag || searchQuery.trim();
    return (
      <section className="asset-section">
        {currentCategory !== "全部" && <h1 className="section-title">{currentCategory}</h1>}
        {currentTag && <h1 className="section-title">#{currentTag}</h1>}
        <div className="empty-state">
          <h1>{hasFilter ? "没有匹配的素材" : "未识别到素材"}</h1>
          <p>
            {hasFilter
              ? "请调整分类或搜索关键词。"
              : "请确认 D:\\动画素材库 中包含 .gif、.mp4、.mov 或 .webm 文件。"}
          </p>
          <button
            type="button"
            onClick={() => window.alert("请在项目目录运行：npm run rescan，然后刷新页面。")}
          >
            重新扫描素材
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="asset-section">
      {currentCategory !== "全部" && <h1 className="section-title">{currentCategory}</h1>}
      {currentTag && <h1 className="section-title">#{currentTag}</h1>}
      {viewMode === "folders" ? (
        <div className={`folder-grid size-${previewSize}`}>
          {Object.entries(groupByCategory(assets)).map(([category, categoryAssets]) => (
            <section className="folder-group" key={category}>
              <h2>{category}</h2>
              <div className="asset-grid">
                {categoryAssets.map((asset) => (
                  <AssetCard key={asset.id} asset={asset} onSelect={onAssetSelect} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className={`asset-grid view-${viewMode} size-${previewSize}`}>
          {assets.map((asset) => (
            <AssetCard key={asset.id} asset={asset} onSelect={onAssetSelect} />
          ))}
        </div>
      )}
    </section>
  );
}

function groupByCategory(assets: AssetItem[]) {
  return assets.reduce<Record<string, AssetItem[]>>((groups, asset) => {
    const category = asset.category || "未分类";
    groups[category] = groups[category] || [];
    groups[category].push(asset);
    return groups;
  }, {});
}

export default AssetGrid;
