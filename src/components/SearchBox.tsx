type SearchBoxProps = {
  value: string;
  onChange: (value: string) => void;
};

function SearchBox({ value, onChange }: SearchBoxProps) {
  return (
    <section className="search-panel" aria-label="搜索素材">
      <label className="search-box">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="6.6" />
          <path d="m16.2 16.2 4.1 4.1" />
        </svg>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="搜索素材 / 文件夹 / 关键词"
          type="search"
        />
        <span className="search-shortcut">⌘ K</span>
      </label>
      <div className="search-trends">近期搜索热词</div>
    </section>
  );
}

export default SearchBox;
