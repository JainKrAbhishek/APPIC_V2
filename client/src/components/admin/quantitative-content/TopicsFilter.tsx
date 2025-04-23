import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { categoryOptions } from "./types";

interface TopicsFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  groupNumber: number | null;
  onGroupChange: (value: number | null) => void;
  availableGroups: number[];
}

const TopicsFilter: React.FC<TopicsFilterProps> = ({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  groupNumber,
  onGroupChange,
  availableGroups,
}) => {
  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search topics..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Select
          value={selectedCategory || "all"}
          onValueChange={onCategoryChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Category filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categoryOptions.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={groupNumber ? groupNumber.toString() : "all"}
          onValueChange={(value) =>
            onGroupChange(value === "all" ? null : parseInt(value))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Group filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Groups</SelectItem>
            {availableGroups && Array.isArray(availableGroups) 
              ? availableGroups.map((group) => (
                  <SelectItem key={group} value={group.toString()}>
                    Group {group}
                  </SelectItem>
                ))
              : null}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default TopicsFilter;