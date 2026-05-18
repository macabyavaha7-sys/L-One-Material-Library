type FilterGroup = {
  title: string;
  options: string[];
};

type FilterPanelProps = {
  open: boolean;
  groups: FilterGroup[];
  selectedFilters: string[];
  onToggleFilter: (filter: string) => void;
  onClear: () => void;
};

function FilterPanel({
  open,
  groups,
  selectedFilters,
  onToggleFilter,
  onClear
}: FilterPanelProps) {
  if (!open) return null;

  return (
    <section className="filter-panel" aria-label="筛选关键词清单">
      <div className="filter-panel-header">
        <div>
          <h2>筛选关键词</h2>
          <p>选择一个或多个条件后，下方素材会自动收窄。</p>
        </div>
        <button type="button" onClick={onClear} disabled={!selectedFilters.length}>
          清空筛选
        </button>
      </div>
      <div className="filter-groups">
        {groups.map((group) => (
          <div className="filter-group" key={group.title}>
            <h3>{group.title}</h3>
            <div className="filter-options">
              {group.options.map((option) => (
                <button
                  key={`${group.title}-${option}`}
                  type="button"
                  className={selectedFilters.includes(option) ? "is-selected" : ""}
                  onClick={() => onToggleFilter(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export type { FilterGroup };
export default FilterPanel;
