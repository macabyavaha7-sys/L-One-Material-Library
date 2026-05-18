type CategoryMenuProps = {
  categories: string[];
  currentCategory: string;
  expanded: boolean;
  onCategoryChange: (category: string) => void;
  onToggleExpanded: () => void;
  onCustomFilter: () => void;
};

function CategoryMenu({
  categories,
  currentCategory,
  expanded,
  onCategoryChange,
  onToggleExpanded,
  onCustomFilter
}: CategoryMenuProps) {
  return (
    <div className={`category-toolbar ${expanded ? "is-expanded" : ""}`}>
      <nav className="category-strip" aria-label="素材分类">
        {categories.map((category) => (
          <button
            className={`category-item ${category === currentCategory ? "is-active" : ""}`}
            type="button"
            key={category}
            onClick={() => {
              if (category === "全部") onToggleExpanded();
              onCategoryChange(category);
            }}
          >
            {category}
          </button>
        ))}
      </nav>
      <button className="filter-button" type="button" onClick={onCustomFilter}>
        <FilterIcon />
        筛选
      </button>
    </div>
  );
}

function FilterIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 7h14" />
      <path d="M8 12h8" />
      <path d="M10 17h4" />
    </svg>
  );
}

export default CategoryMenu;
