import CategoryMenu from "./CategoryMenu";
import SearchBox from "./SearchBox";

type TopNavProps = {
  categories: string[];
  currentCategory: string;
  searchQuery: string;
  onCategoryChange: (category: string) => void;
  onSearchChange: (query: string) => void;
};

function TopNav({
  categories,
  currentCategory,
  searchQuery,
  onCategoryChange,
  onSearchChange
}: TopNavProps) {
  return (
    <header className="top-nav">
      <button className="brand-button" type="button" onClick={() => onCategoryChange("全部")}>
        L-One素材库
      </button>
      <CategoryMenu
        categories={categories}
        currentCategory={currentCategory}
        onCategoryChange={onCategoryChange}
      />
      <SearchBox value={searchQuery} onChange={onSearchChange} />
    </header>
  );
}

export default TopNav;
