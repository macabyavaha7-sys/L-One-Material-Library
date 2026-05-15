import type { AssetItem } from "../types/asset";
import AssetCard from "./AssetCard";

type AssetGridProps = {
  assets: AssetItem[];
  loading: boolean;
  error: string | null;
  currentCategory: string;
  searchQuery: string;
  onAssetSelect: (asset: AssetItem) => void;
};

function AssetGrid({
  assets,
  loading,
  error,
  currentCategory,
  searchQuery,
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
    const hasFilter = currentCategory !== "全部" || searchQuery.trim();
    return (
      <section className="asset-section">
        {currentCategory !== "全部" && <h1 className="section-title">{currentCategory}</h1>}
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
      <div className="asset-grid">
        {assets.map((asset) => (
          <AssetCard key={asset.id} asset={asset} onSelect={onAssetSelect} />
        ))}
      </div>
    </section>
  );
}

export default AssetGrid;
