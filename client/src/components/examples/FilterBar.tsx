import { useState } from "react";
import FilterBar from "../FilterBar";

export default function FilterBarExample() {
  const [activeFilter, setActiveFilter] = useState<"all" | "available" | "rented">("all");

  return (
    <div className="bg-background p-8">
      <FilterBar activeFilter={activeFilter} onFilterChange={setActiveFilter} />
    </div>
  );
}
