type CategoryMenuProps = {
  categories: string[];
  currentCategory: string;
  onCategoryChange: (category: string) => void;
};

function CategoryMenu({ categories, currentCategory, onCategoryChange }: CategoryMenuProps) {
  return (
    <div className="category-menu">
      <button className="icon-button category-trigger" type="button" aria-label="展开分类">
        <span />
        <span />
        <span />
      </button>
      <nav className="category-panel" aria-label="素材分类">
        {categories.map((category) => (
          <button
            className={`category-item ${category === currentCategory ? "is-active" : ""}`}
            type="button"
            key={category}
            onClick={() => onCategoryChange(category)}
          >
            {category}
          </button>
        ))}
      </nav>
    </div>
  );
}

export default CategoryMenu;
