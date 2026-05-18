type TopNavProps = {
  onCategoryChange: (category: string) => void;
};

function TopNav({ onCategoryChange }: TopNavProps) {
  return (
    <header className="top-nav">
      <button className="brand-button" type="button" onClick={() => onCategoryChange("全部")} aria-label="回到全部素材">
        <span className="brand-logo">L-One</span>
        <span className="brand-copy">
          <span>Media Library</span>
          <span>私人视频素材索引系统</span>
        </span>
      </button>
      <a
        className="upload-link"
        href="https://huggingface.co/spaces/macabyavaha7/L-One-Material-Library-uploader"
        target="_blank"
        rel="noreferrer"
      >
        <UploadIcon />
        上传素材
      </a>
    </header>
  );
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 16V5" />
      <path d="m8 9 4-4 4 4" />
      <path d="M5 17v2h14v-2" />
    </svg>
  );
}

export default TopNav;
