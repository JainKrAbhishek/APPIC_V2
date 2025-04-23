import React, { useState } from 'react';
import { Search, SlidersHorizontal, ChevronDown, ChevronUp, View, Columns, ListFilter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface FiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  sortBy: 'alphabetical' | 'difficulty' | 'day' | 'default';
  onSortChange: (value: 'alphabetical' | 'difficulty' | 'day' | 'default') => void;
  viewMode: 'single' | 'carousel';
  onViewModeChange: (value: 'single' | 'carousel') => void;
  studyMode: 'all' | 'remaining';
  onStudyModeChange: (value: 'all' | 'remaining') => void;
  partOfSpeech: string | null;
  onPartOfSpeechChange: (value: string | null) => void;
  distinctPartOfSpeech: string[];
}

const Filters = ({
  searchTerm,
  onSearchChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  studyMode,
  onStudyModeChange,
  partOfSpeech,
  onPartOfSpeechChange,
  distinctPartOfSpeech
}: FiltersProps) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  return (
    <div className="bg-white/70 rounded-lg border border-gray-100 mb-3 overflow-hidden">
      {/* Main search always visible */}
      <div className="flex flex-wrap items-center p-2">
        <div className="flex-1 mr-2 min-w-[140px]">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              id="search"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search words..."
              className="pl-8 bg-white/90 h-9 text-sm"
            />
          </div>
        </div>
        
        {/* Quick view mode toggle */}
        <div className="flex-shrink-0 mr-2">
          <Button
            variant="outline" 
            size="sm"
            className="h-9 bg-white/90"
            onClick={() => onViewModeChange(viewMode === 'single' ? 'carousel' : 'single')}
          >
            {viewMode === 'single' ? (
              <><Columns size={14} className="mr-1" /> Grid</>
            ) : (
              <><View size={14} className="mr-1" /> Single</>
            )}
          </Button>
        </div>
        
        {/* Advanced filters toggle */}
        <div className="flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-9"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            <SlidersHorizontal size={14} className="mr-1" />
            Filters
            {showAdvancedFilters ? (
              <ChevronUp size={14} className="ml-1" />
            ) : (
              <ChevronDown size={14} className="ml-1" />
            )}
          </Button>
        </div>
      </div>
      
      {/* Advanced filters */}
      <AnimatePresence>
        {showAdvancedFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-gray-100"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-white/40">
              {/* Part of speech filter */}
              <div>
                <Label htmlFor="part-of-speech" className="mb-1 block text-xs font-medium text-gray-600">
                  Part of Speech
                </Label>
                <Select
                  value={partOfSpeech || 'all'}
                  onValueChange={(value) => onPartOfSpeechChange(value === 'all' ? null : value)}
                >
                  <SelectTrigger id="part-of-speech" className="bg-white/90 h-8 text-xs">
                    <SelectValue placeholder="All parts of speech" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All parts of speech</SelectItem>
                    {distinctPartOfSpeech.map((pos) => (
                      <SelectItem key={pos} value={pos}>
                        {pos}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort filter */}
              <div>
                <Label htmlFor="sort" className="mb-1 block text-xs font-medium text-gray-600">
                  Sort By
                </Label>
                <Select value={sortBy} onValueChange={(value: any) => onSortChange(value)}>
                  <SelectTrigger id="sort" className="bg-white/90 h-8 text-xs">
                    <SelectValue placeholder="Default order" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default order</SelectItem>
                    <SelectItem value="alphabetical">Alphabetical</SelectItem>
                    <SelectItem value="day">Day (ascending)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* View mode select */}
              <div>
                <Label className="mb-1 block text-xs font-medium text-gray-600">View Mode</Label>
                <RadioGroup
                  value={viewMode}
                  onValueChange={(value: any) => onViewModeChange(value)}
                  className="flex space-x-3"
                >
                  <div className="flex items-center space-x-1">
                    <RadioGroupItem value="single" id="single" className="h-3 w-3" />
                    <Label htmlFor="single" className="text-xs font-normal">Single Card</Label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <RadioGroupItem value="carousel" id="carousel" className="h-3 w-3" />
                    <Label htmlFor="carousel" className="text-xs font-normal">Carousel</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Filters;