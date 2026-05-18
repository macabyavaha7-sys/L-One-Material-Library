export type ViewMode = "large" | "list" | "folders";
export type PreviewSize = "tiny" | "small" | "medium" | "large" | "max";

type LibraryFooterProps = {
  total: number;
  viewMode: ViewMode;
  previewSize: PreviewSize;
  onViewModeChange: (mode: ViewMode) => void;
  onPreviewSizeChange: (size: PreviewSize) => void;
};

const viewModes: Array<{ value: ViewMode; label: string }> = [
  { value: "large", label: "大窗口" },
  { value: "list", label: "列表" },
  { value: "folders", label: "分类文件夹式" }
];

const previewSizes: Array<{ value: PreviewSize; label: string }> = [
  { value: "tiny", label: "极小" },
  { value: "small", label: "小" },
  { value: "medium", label: "中" },
  { value: "large", label: "大" },
  { value: "max", label: "最大" }
];

function LibraryFooter({
  total,
  viewMode,
  previewSize,
  onViewModeChange,
  onPreviewSizeChange
}: LibraryFooterProps) {
  return (
    <footer className="library-footer" aria-label="素材视图设置">
      <p>当前可查看素材数量：{total}</p>
      <div className="footer-controls">
        <div className="segmented-control" aria-label="预览排列方式">
          {viewModes.map((mode) => (
            <button
              key={mode.value}
              type="button"
              className={viewMode === mode.value ? "is-active" : ""}
              onClick={() => onViewModeChange(mode.value)}
            >
              {mode.label}
            </button>
          ))}
        </div>
        <div className="segmented-control size-control" aria-label="预览窗口尺寸">
          {previewSizes.map((size) => (
            <button
              key={size.value}
              type="button"
              className={previewSize === size.value ? "is-active" : ""}
              onClick={() => onPreviewSizeChange(size.value)}
            >
              {size.label}
            </button>
          ))}
        </div>
      </div>
    </footer>
  );
}

export default LibraryFooter;
