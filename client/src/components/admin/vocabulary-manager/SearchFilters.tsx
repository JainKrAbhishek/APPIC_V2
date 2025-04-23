import React, { useState, useEffect, useCallback, memo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  Filter, 
  X, 
  SlidersHorizontal, 
  ChevronDown,
  FilterX,
  Sliders 
} from "lucide-react";
import { SearchFiltersProps } from "./types";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const SearchFilters: React.FC<SearchFiltersProps> = ({
  searchTerm,
  onSearchChange,
  filterDay,
  onFilterDayChange,
  isFiltering,
  onClearFilters,
}) => {
  // State for mobile filters sheet
  const [isFiltersOpen, setFiltersOpen] = useState(false);
  
  // When user types, wait a brief moment before applying the search
  const [localSearch, setLocalSearch] = useState(searchTerm);
  const [mobileSearch, setMobileSearch] = useState(searchTerm);
  const [mobileDay, setMobileDay] = useState<string>(filterDay !== null ? filterDay.toString() : "all");
  
  // Memoized handlers to improve performance
  const handleSearchClear = useCallback(() => {
    setLocalSearch("");
    setMobileSearch("");
    onSearchChange("");
  }, [onSearchChange]);
  
  const handleDayFilterChange = useCallback((value: string) => {
    const day = value === "all" ? null : parseInt(value);
    setMobileDay(value);
    onFilterDayChange(day);
  }, [onFilterDayChange]);
  
  const handleMobileFiltersApply = useCallback(() => {
    onSearchChange(mobileSearch);
    handleDayFilterChange(mobileDay);
    setFiltersOpen(false);
  }, [mobileSearch, mobileDay, onSearchChange, handleDayFilterChange]);
  
  const handleMobileFiltersClear = useCallback(() => {
    setMobileSearch("");
    setMobileDay("all");
    onClearFilters();
    setFiltersOpen(false);
  }, [onClearFilters]);
  
  // Sync local state with props
  useEffect(() => {
    setLocalSearch(searchTerm);
    setMobileSearch(searchTerm);
  }, [searchTerm]);
  
  useEffect(() => {
    setMobileDay(filterDay !== null ? filterDay.toString() : "all");
  }, [filterDay]);
  
  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchTerm) {
        onSearchChange(localSearch);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, onSearchChange, searchTerm]);
  
  return (
    <div className="space-y-4">
      {/* Desktop view - hidden on mobile */}
      <div className="hidden md:flex md:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <Search className="h-4 w-4" />
          </div>
          <Input
            placeholder="Search words by term, definition..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-10 h-10 text-sm border-gray-200 rounded-md bg-white focus:border-primary focus:ring-1 focus:ring-primary"
          />
          {localSearch && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSearchClear}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Clear search</span>
            </Button>
          )}
        </div>
        
        {/* Day Filter */}
        <div className="flex gap-2">
          <div className="relative w-56">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-full">
                    <Select
                      value={filterDay !== null ? filterDay.toString() : "all"}
                      onValueChange={handleDayFilterChange}
                    >
                      <SelectTrigger className="h-10 text-sm border-gray-200 rounded-md w-full bg-white">
                        <div className="flex items-center">
                          <SlidersHorizontal className="h-4 w-4 mr-2 text-gray-500" />
                          <SelectValue placeholder="Filter by day" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="text-sm">All Days</SelectItem>
                        <div className="max-h-[200px] overflow-y-auto py-1">
                          {Array.from({ length: 34 }, (_, i) => i + 1).map((day) => (
                            <SelectItem key={day} value={day.toString()} className="text-sm">
                              Day {day}
                            </SelectItem>
                          ))}
                        </div>
                      </SelectContent>
                    </Select>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">Filter words by their assigned day</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          {/* Clear Filters Button - Shown only when filters are active */}
          {isFiltering && (
            <Button
              variant="outline"
              size="default"
              onClick={onClearFilters}
              className="h-10 px-3 text-sm border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            >
              <X className="h-4 w-4 mr-2" />
              <span>Clear</span>
            </Button>
          )}
        </div>
      </div>
      
      {/* Mobile view - hidden on desktop */}
      <div className="flex md:hidden gap-2 items-center">
        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <Search className="h-4 w-4" />
          </div>
          <Input
            placeholder="Search words..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-10 h-10 text-sm border-gray-200 rounded-md bg-white"
          />
          {localSearch && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSearchClear}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 text-gray-400"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <Sheet open={isFiltersOpen} onOpenChange={setFiltersOpen}>
          <SheetTrigger asChild>
            <Button 
              variant="outline" 
              size="icon" 
              className={`h-10 w-10 ${isFiltering ? 'border-primary text-primary' : 'border-gray-200'}`}
            >
              <Filter className="h-4 w-4" />
              {isFiltering && (
                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-primary rounded-full" />
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh] sm:max-w-md sm:h-[60vh]">
            <SheetHeader className="text-left mb-4">
              <SheetTitle>Filter Words</SheetTitle>
              <SheetDescription>
                Apply filters to find specific vocabulary words
              </SheetDescription>
            </SheetHeader>
            
            <div className="space-y-6 my-6">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Search</h3>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <Search className="h-4 w-4" />
                  </div>
                  <Input
                    placeholder="Search words by term, definition..."
                    value={mobileSearch}
                    onChange={(e) => setMobileSearch(e.target.value)}
                    className="pl-10 h-10 text-sm border-gray-200 rounded-md bg-white w-full"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Day</h3>
                <Select
                  value={mobileDay}
                  onValueChange={setMobileDay}
                >
                  <SelectTrigger className="w-full h-10 text-sm border-gray-200 rounded-md bg-white">
                    <SelectValue placeholder="Select a day" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-sm">All Days</SelectItem>
                    <div className="max-h-[200px] overflow-y-auto py-1">
                      {Array.from({ length: 34 }, (_, i) => i + 1).map((day) => (
                        <SelectItem key={day} value={day.toString()} className="text-sm">
                          Day {day}
                        </SelectItem>
                      ))}
                    </div>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex gap-3 mt-10">
              <Button 
                variant="outline" 
                className="flex-1" 
                onClick={handleMobileFiltersClear}
              >
                <FilterX className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
              <Button 
                className="flex-1"
                onClick={handleMobileFiltersApply}
              >
                <Filter className="w-4 h-4 mr-2" />
                Apply Filters
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
      
      {/* Active Filters Display */}
      {isFiltering && (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50/80 rounded-md border border-gray-200">
          <span className="hidden sm:inline text-sm font-medium text-gray-500 mr-1">Active filters:</span>
          <div className="flex flex-wrap gap-2">
            {filterDay !== null && (
              <Badge variant="outline" className="bg-white flex items-center gap-1 py-1 px-3 text-sm border-gray-200 shadow-sm">
                <span className="font-medium text-gray-700">Day {filterDay}</span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => onFilterDayChange(null)} 
                  className="h-5 w-5 p-0 ml-1 hover:bg-gray-100 rounded-full"
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove day filter</span>
                </Button>
              </Badge>
            )}
            {searchTerm && (
              <Badge variant="outline" className="bg-white flex items-center gap-1 py-1 px-3 text-sm border-gray-200 shadow-sm">
                <span className="font-medium text-gray-700">
                  <span className="hidden sm:inline">Search: </span>
                  "{searchTerm.length > 20 ? `${searchTerm.substring(0, 20)}...` : searchTerm}"
                </span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleSearchClear} 
                  className="h-5 w-5 p-0 ml-1 hover:bg-gray-100 rounded-full"
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Clear word search</span>
                </Button>
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(SearchFilters);