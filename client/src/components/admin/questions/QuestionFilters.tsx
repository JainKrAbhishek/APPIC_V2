import React from "react";
import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface QuestionFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterType: string | null;
  setFilterType: (type: string | null) => void;
  filterCategory: string | null;
  setFilterCategory: (category: string | null) => void;
  filterDifficulty: number | null;
  setFilterDifficulty: (difficulty: number | null) => void;
  filterQuestionTypeId: number | null;
  setFilterQuestionTypeId: (id: number | null) => void;
  isFiltering: boolean;
  setIsFiltering: (isFiltering: boolean) => void;
  questionTypes: any[] | undefined;
  questionTypeOptions: { value: string, label: string }[];
}

const QuestionFilters: React.FC<QuestionFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  filterType,
  setFilterType,
  filterCategory,
  setFilterCategory,
  filterDifficulty,
  setFilterDifficulty,
  filterQuestionTypeId,
  setFilterQuestionTypeId,
  isFiltering,
  setIsFiltering,
  questionTypes,
  questionTypeOptions,
}) => {
  // Reset all filters
  const resetFilters = () => {
    setSearchTerm("");
    setFilterType(null);
    setFilterCategory(null);
    setFilterDifficulty(null);
    setFilterQuestionTypeId(null);
    setIsFiltering(false);
  };

  return (
    <div className="mb-4">
      <div className="flex flex-col md:flex-row gap-3 mb-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Search questions by content, explanation, or topic..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant={isFiltering ? "default" : "outline"}
          onClick={() => setIsFiltering(!isFiltering)}
        >
          <Filter className="mr-2" size={18} />
          Filters
        </Button>
        {(searchTerm !== "" || filterType !== null || filterCategory !== null || 
          filterDifficulty !== null || filterQuestionTypeId !== null) && (
          <Button variant="ghost" onClick={resetFilters}>
            <X className="mr-2" size={16} />
            Clear
          </Button>
        )}
      </div>
      
      {isFiltering && (
        <div className="flex flex-wrap gap-3 mt-3">
          <div className="w-full sm:w-48">
            <Select 
              value={filterType || ""} 
              onValueChange={(value) => setFilterType(value === "" ? null : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="quantitative">Quantitative</SelectItem>
                <SelectItem value="verbal">Verbal</SelectItem>
                <SelectItem value="vocabulary">Vocabulary</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-full sm:w-48">
            <Select 
              value={filterCategory || ""} 
              onValueChange={(value) => setFilterCategory(value === "" ? null : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="algebra">Algebra</SelectItem>
                <SelectItem value="arithmetic">Arithmetic</SelectItem>
                <SelectItem value="geometry">Geometry</SelectItem>
                <SelectItem value="data_analysis">Data Analysis</SelectItem>
                <SelectItem value="reading">Reading Comprehension</SelectItem>
                <SelectItem value="text_completion">Text Completion</SelectItem>
                <SelectItem value="sentence_equivalence">Sentence Equivalence</SelectItem>
                <SelectItem value="word_groups">Word Groups</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-full sm:w-48">
            <Select
              value={filterDifficulty ? String(filterDifficulty) : ""}
              onValueChange={(value) => setFilterDifficulty(value === "" ? null : Number(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Difficulties</SelectItem>
                <SelectItem value="1">Easy (1)</SelectItem>
                <SelectItem value="2">Medium Easy (2)</SelectItem>
                <SelectItem value="3">Medium (3)</SelectItem>
                <SelectItem value="4">Medium Hard (4)</SelectItem>
                <SelectItem value="5">Hard (5)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-full sm:w-48">
            <Select
              value={filterQuestionTypeId ? String(filterQuestionTypeId) : ""}
              onValueChange={(value) => setFilterQuestionTypeId(value === "" ? null : Number(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by Question Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Question Types</SelectItem>
                {questionTypeOptions.map((type) => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionFilters;