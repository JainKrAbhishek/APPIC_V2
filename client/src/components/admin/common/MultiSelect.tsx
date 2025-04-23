import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, X, Loader2, Filter, ArrowDownNarrowWide, Search } from "lucide-react";
import { cn } from "@/utils/ui-utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface MultiSelectOption {
  label: string;
  value: string;
  description?: string;
  category?: string;
  difficulty?: number;
  icon?: React.ReactNode;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selectedValues: string[]) => void;
  placeholder?: string;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  maxDisplay?: number;
  maxHeight?: string;
  showCount?: boolean;
  sortable?: boolean;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  selected = [],
  onChange,
  placeholder = "Select options",
  loading = false,
  disabled = false,
  className,
  maxDisplay = 3,
  maxHeight = "400px",
  showCount = true,
  sortable = false
}) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Memoize options to avoid unnecessary re-renders
  const filteredOptions = React.useMemo(() => {
    let filtered = options.filter(option => 
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Apply sorting if enabled
    if (sortable && sortOrder) {
      filtered = [...filtered].sort((a, b) => {
        return sortOrder === "asc" 
          ? a.label.localeCompare(b.label)
          : b.label.localeCompare(a.label);
      });
    }
    
    return filtered;
  }, [options, searchTerm, sortOrder, sortable]);

  // Get display options for badges
  const displayOptions = selected.map(value => 
    options.find(option => option.value === value)
  ).filter(Boolean) as MultiSelectOption[];
  
  // Handle selection
  const handleSelect = useCallback((value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter(item => item !== value)
      : [...selected, value];
    onChange(newSelected);
  }, [selected, onChange]);
  
  // Handle remove
  const handleRemove = useCallback((value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter(item => item !== value));
  }, [selected, onChange]);
  
  // Handle clear all
  const handleClearAll = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  }, [onChange]);

  // Toggle sort order
  const toggleSortOrder = useCallback(() => {
    setSortOrder(prev => {
      if (prev === null) return "asc";
      if (prev === "asc") return "desc";
      return null;
    });
  }, []);

  // Focus search input when popover opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 10);
    }
  }, [open]);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Keyboard navigation for selection
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      setOpen(false);
    }
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls="options-listbox"
          aria-label={`Select ${placeholder}`}
          className={cn("w-full justify-between min-h-10", className)}
          onClick={() => !disabled && setOpen(!open)}
          disabled={disabled}
        >
          {selected.length > 0 ? (
            <div className="flex flex-wrap gap-1 max-w-[calc(100%-30px)]">
              {displayOptions.slice(0, maxDisplay).map(option => option && (
                <Badge 
                  variant="secondary" 
                  key={option.value}
                  className="mr-1 mb-1 text-xs"
                >
                  {option.label.length > 20 ? option.label.substring(0, 20) + "..." : option.label}
                  <span
                    className="ml-1 rounded-full outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer"
                    onClick={(e) => handleRemove(option.value, e)}
                    aria-label={`Remove ${option.label}`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleRemove(option.value, e as unknown as React.MouseEvent);
                      }
                    }}
                  >
                    <X className="h-3 w-3" />
                  </span>
                </Badge>
              ))}
              {selected.length > maxDisplay && (
                <Badge variant="outline" className="mb-1">
                  +{selected.length - maxDisplay} more
                </Badge>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <div className="flex items-center ml-1">
            {selected.length > 0 && (
              <span
                className="h-4 w-4 p-0 mr-1 cursor-pointer inline-flex items-center justify-center"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearAll(e);
                }}
                aria-label="Clear all selections"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.stopPropagation();
                    handleClearAll(e as unknown as React.MouseEvent);
                  }
                }}
              >
                <X className="h-3 w-3" />
              </span>
            )}
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="p-0 w-[var(--radix-popover-trigger-width)]" 
        align="start"
        side="bottom"
      >
        <div className="w-full" onKeyDown={handleKeyDown}>
          <div className="flex items-center p-2 border-b">
            <Search className="h-4 w-4 mr-2 text-muted-foreground" />
            <input
              ref={inputRef}
              className="flex h-9 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-none focus:outline-none focus-visible:outline-none"
              placeholder="Search options..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search options"
              aria-controls="options-listbox"
              role="searchbox"
            />
            {sortable && (
              <div
                className="ml-1 h-8 px-2 cursor-pointer rounded hover:bg-accent inline-flex items-center justify-center"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSortOrder();
                }}
                aria-label="Sort options"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.stopPropagation();
                    toggleSortOrder();
                  }
                }}
              >
                <ArrowDownNarrowWide className={cn(
                  "h-4 w-4",
                  sortOrder === "asc" && "text-primary",
                  sortOrder === "desc" && "text-primary rotate-180",
                )} />
              </div>
            )}
            {selected.length > 0 && (
              <div
                className="ml-1 h-8 px-2 cursor-pointer rounded hover:bg-accent inline-flex items-center justify-center"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearAll(e);
                }}
                aria-label="Clear all selections"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.stopPropagation();
                    handleClearAll(e as unknown as React.MouseEvent);
                  }
                }}
              >
                <X className="h-4 w-4" />
              </div>
            )}
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Loading options...
            </div>
          ) : (
            <>
              {filteredOptions.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No options found
                </div>
              ) : (
                <ScrollArea className={`overflow-y-auto max-h-[${maxHeight}]`}>
                  <div id="options-listbox" className="max-h-[60vh]" role="listbox" aria-label="Selectable options">
                    {filteredOptions.map(option => (
                      <div
                        key={option.value}
                        onClick={() => handleSelect(option.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleSelect(option.value);
                          }
                        }}
                        role="option"
                        aria-selected={selected.includes(option.value)}
                        tabIndex={0}
                        className={cn(
                          "relative flex flex-col cursor-default select-none rounded-sm px-2 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                          selected.includes(option.value) && "bg-accent/50"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-medium flex items-center gap-1 truncate pr-8">
                            {option.icon}
                            {option.label}
                          </div>
                          {option.category && (
                            <Badge variant="outline" className="text-xs">
                              {option.category}
                            </Badge>
                          )}
                        </div>
                        
                        {option.description && (
                          <div className="text-xs text-muted-foreground mt-1 truncate">
                            {option.description}
                          </div>
                        )}
                        
                        <Check
                          className={cn(
                            "absolute right-2 top-2 h-4 w-4",
                            selected.includes(option.value) ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </>
          )}
          
          {showCount && filteredOptions.length > 0 && (
            <div className="border-t p-2 flex justify-between items-center text-xs text-muted-foreground">
              <div className="flex items-center space-x-2">
                <span>{selected.length} of {options.length} selected</span>
                {searchTerm && (
                  <span className="text-muted-foreground">
                    ({filteredOptions.length} matching)
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {filteredOptions.length} items
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};