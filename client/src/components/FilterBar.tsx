import { memo } from "react";

interface FilterBarProps {
  activeFilter: "all" | "available" | "sold";
  onFilterChange: (filter: "all" | "available" | "sold") => void;
}

const FilterBar = memo(function FilterBar({ activeFilter, onFilterChange }: FilterBarProps) {
  const filters = [
    { id: "all" as const, label: "Hammasi" },
    { id: "available" as const, label: "Mavjud" },
    { id: "sold" as const, label: "Sotilgan" },
  ];

  return (
    <div className="overflow-x-auto scrollbar-hide">
      <div className="flex space-x-2 p-2 glass rounded-full w-fit mx-auto min-w-max">
        {filters.map((filter) => (
          <button
            key={filter.id}
            data-testid={`button-filter-${filter.id}`}
            onClick={() => onFilterChange(filter.id)}
            className={`px-4 sm:px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap touch-manipulation ${
              activeFilter === filter.id
                ? "gradient-blue-purple text-white shadow-lg"
                : "text-muted-foreground hover-elevate"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>
    </div>
  );
});

export default FilterBar;
