import React from "react";
import { Search, Filter, X, Clock, PlusCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  typeFilter: string | null;
  onTypeFilterChange: (value: string | null) => void;
  difficultyFilter: number | null;
  onDifficultyFilterChange: (value: number | null) => void;
  sortOption: string;
  onSortOptionChange: (value: string) => void;
  activeFiltersCount: number;
  onClearFilters: () => void;
  onAddNew?: () => void;
}

const FilterBar: React.FC<FilterBarProps> = ({
  search,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  difficultyFilter,
  onDifficultyFilterChange,
  sortOption,
  onSortOptionChange,
  activeFiltersCount,
  onClearFilters,
  onAddNew,
}) => {
  return (
    <div className="flex flex-col space-y-2 bg-card p-3 rounded-md border">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search practice sets..."
            className="pl-8"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {search && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-9 w-9 p-0"
              onClick={() => onSearchChange("")}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Clear search</span>
            </Button>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          <Select
            value={sortOption}
            onValueChange={onSortOptionChange}
          >
            <SelectTrigger className="w-[130px]">
              <Clock className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="a-z">Name (A-Z)</SelectItem>
              <SelectItem value="z-a">Name (Z-A)</SelectItem>
              <SelectItem value="difficulty-asc">Easiest First</SelectItem>
              <SelectItem value="difficulty-desc">Hardest First</SelectItem>
              <SelectItem value="questions-asc">Fewest Questions</SelectItem>
              <SelectItem value="questions-desc">Most Questions</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-[130px] gap-2"
            onClick={() => {
              // Toggle filter visibility
            }}
          >
            <Filter className="h-4 w-4" />
            <span>Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}</span>
          </Button>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 pt-2">
        {/* Type badges */}
        <Select
          value={typeFilter || "all_types"}
          onValueChange={(value) => onTypeFilterChange(value === "all_types" ? null : value)}
        >
          <SelectTrigger className="h-8 w-[130px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_types">All Types</SelectItem>
            <SelectItem value="verbal">Verbal</SelectItem>
            <SelectItem value="quantitative">Quantitative</SelectItem>
            <SelectItem value="vocabulary">Vocabulary</SelectItem>
            <SelectItem value="mixed">Mixed</SelectItem>
          </SelectContent>
        </Select>
        
        {/* Difficulty filter */}
        <Select
          value={difficultyFilter?.toString() || "all_levels"}
          onValueChange={(value) => 
            onDifficultyFilterChange(value === "all_levels" ? null : parseInt(value, 10))
          }
        >
          <SelectTrigger className="h-8 w-[130px]">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_levels">All Levels</SelectItem>
            <SelectItem value="1">⭐ Level 1</SelectItem>
            <SelectItem value="2">⭐⭐ Level 2</SelectItem>
            <SelectItem value="3">⭐⭐⭐ Level 3</SelectItem>
            <SelectItem value="4">⭐⭐⭐⭐ Level 4</SelectItem>
            <SelectItem value="5">⭐⭐⭐⭐⭐ Level 5</SelectItem>
          </SelectContent>
        </Select>
        
        {onAddNew && (
          <Button 
            variant="default" 
            size="sm" 
            className="h-8 px-3 ml-auto"
            onClick={onAddNew}
          >
            <X className="mr-1 h-4 w-4 rotate-45" />
            Add New
          </Button>
        )}
        
        {/* Clear filters button - only show if we have filters */}
        {activeFiltersCount > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 px-2 text-muted-foreground"
            onClick={onClearFilters}
          >
            <X className="mr-1 h-4 w-4" />
            Clear Filters
          </Button>
        )}
        
        {/* Display active filters as badges */}
        {typeFilter && (
          <Badge variant="secondary" className="h-8 gap-1 px-2">
            {typeFilter.charAt(0).toUpperCase() + typeFilter.slice(1)}
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 text-muted-foreground"
              onClick={() => onTypeFilterChange(null)}
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Remove filter</span>
            </Button>
          </Badge>
        )}
        
        {difficultyFilter && (
          <Badge variant="secondary" className="h-8 gap-1 px-2">
            Difficulty: {"★".repeat(difficultyFilter)}
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 text-muted-foreground"
              onClick={() => onDifficultyFilterChange(null)}
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Remove filter</span>
            </Button>
          </Badge>
        )}
      </div>
    </div>
  );
};

export default FilterBar;