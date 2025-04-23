import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Word } from '@shared/schema';
import { UserRecord } from '@shared/types';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb";
import { 
  BookOpen, 
  BrainCog, 
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Home, 
  Search, 
  BookMarked, 
  GraduationCap,
  Info,
  BookCheck,
  Calendar,
  LayoutGrid,
  Undo2,
  Filter
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  VocabWord,
  processWords,
  findWords,
  getWordsForDay,
  getTotalDays,
  DaySelector,
  Filters,
  QuizletFlashcards,
  StudyTips
} from '@/components/vocabulary';

interface VocabularyProps {
  user: UserRecord;
}

const Vocabulary = ({ user }: VocabularyProps) => {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for current day and filters
  const [selectedDays, setSelectedDays] = useState<number[]>([user.currentDay || 1]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'single' | 'carousel'>('carousel');
  
  // Fetch all vocabulary words
  const { data: allWords = [], isLoading: wordsLoading } = useQuery<Word[]>({
    queryKey: ['/api/words'],
    staleTime: 300000, // 5 minutes
    enabled: !!user,
  });
  
  // Fetch bookmarked words
  const { data: bookmarkedWords = [], isLoading: bookmarksLoading, refetch: refetchBookmarks } = useQuery<Word[]>({
    queryKey: ['/api/bookmarked-words'],
    staleTime: 60000, // 1 minute
    enabled: !!user,
  });
  
  // Toggle bookmark mutation
  const bookmarkMutation = useMutation({
    mutationFn: async (wordId: number) => {
      const isCurrentlyBookmarked = bookmarkedWords.some(w => w.id === wordId);
      
      return apiRequest('/api/bookmark-word', {
        method: 'POST',
        data: { 
          wordId, 
          bookmarked: !isCurrentlyBookmarked 
        }
      });
    },
    onSuccess: () => {
      // Invalidate bookmarked words query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/bookmarked-words'] });
      
      // Explicitly refetch bookmarks to ensure UI is updated
      setTimeout(() => {
        refetchBookmarks();
      }, 300);
    },
    onError: (error) => {
      console.error('Error toggling bookmark:', error);
      
      toast({
        title: 'Bookmark action failed',
        description: 'There was an error updating your bookmarks. Please try again.',
        variant: 'destructive'
      });
    }
  });
  
  // Transform Word objects to VocabWord format for components
  const transformToVocabWords = (words: Word[]): VocabWord[] => {
    return words.map(word => ({
      key: word.id,
      group: word.day || 1,
      word: word.word,
      definitions: [{
        part_of_speech: word.partOfSpeech || 'unknown',
        definition: word.definition || '',
        sentence: word.example || '',
        synonyms: word.synonyms || []
      }]
    }));
  };
  
  // Handle toggling bookmark for a word
  // Create a wrapper function to adapt between different signatures
  const handleToggleBookmark = (wordIdOrWord: number | VocabWord, bookmarked?: boolean) => {
    // If the first parameter is a VocabWord object
    if (typeof wordIdOrWord !== 'number') {
      const word = wordIdOrWord as VocabWord;
      // Extract the wordId from the VocabWord object's key
      const wordId = typeof word.key === 'number' ? word.key : parseInt(word.key as string);
      if (!isNaN(wordId)) {
        bookmarkMutation.mutate(wordId);
      }
    } else {
      // If the first parameter is a number (wordId)
      bookmarkMutation.mutate(wordIdOrWord);
    }
  };
  
  // Filter words based on selected days and search term
  const filteredWords = React.useMemo(() => {
    if (wordsLoading || !allWords.length) return [];
    
    const vocabWords = transformToVocabWords(allWords);
    
    // Filter words for selected days
    let wordsForSelectedDays = vocabWords;
    
    if (selectedDays.length > 0) {
      wordsForSelectedDays = vocabWords.filter(word => 
        selectedDays.includes(word.group)
      );
    }
    
    // Then, apply search term filter if any
    return searchTerm ? findWords(wordsForSelectedDays, searchTerm) : wordsForSelectedDays;
  }, [allWords, selectedDays, searchTerm, wordsLoading]);
  
  // Get total days from all words
  const totalDays = React.useMemo(() => {
    if (!allWords.length) return 0;
    return getTotalDays(transformToVocabWords(allWords));
  }, [allWords]);
  
  // Handle click outside dropdown
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.getElementById("day-dropdown");
      const button = document.getElementById("day-selector-button");
      
      if (dropdown && button && 
          !dropdown.contains(event.target as Node) && 
          !button.contains(event.target as Node)) {
        dropdown.classList.add("hidden");
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  return (
    <DashboardLayout title="Vocabulary" user={user}>
      <Helmet>
        <title>Vocabulary | PrepJet</title>
      </Helmet>

      <div className="container mx-auto px-4 max-w-6xl">
        {/* Breadcrumb navigation */}
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">
                  <Home className="h-3.5 w-3.5" />
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-3.5 w-3.5" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink>Vocabulary</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header with title */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">
              GRE Vocabulary
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Master essential GRE vocabulary words with flashcards and spaced repetition
            </p>
          </div>

          {/* Minimal navigation for mobile */}
          <div className="flex bg-gray-100 rounded-xl self-stretch sm:self-end p-1">
            <Button 
              variant="ghost"
              className="flex-1 flex justify-center items-center gap-1 h-10 bg-white shadow-sm rounded-lg"
            >
              <BookOpen className="h-4 w-4" />
              <span className="text-sm">Daily</span>
            </Button>
            <Button 
              variant="ghost"
              asChild
              className="flex-1 flex justify-center items-center gap-1 h-10 text-gray-600 rounded-lg"
            >
              <Link to="/vocabulary-spaced-repetition">
                <BrainCog className="h-4 w-4" />
                <span className="text-sm">Spaced</span>
              </Link>
            </Button>
            <Button 
              variant="ghost"
              asChild
              className="flex-1 flex justify-center items-center gap-1 h-10 text-gray-600 rounded-lg"
            >
              <Link to="/vocabulary-bookmarks">
                <BookMarked className="h-4 w-4" />
                <span className="text-sm">Saved</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Streamlined control panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-4">
          {/* No duplicate navigation tabs - using the mobile-style tabs from above */}
          
          {/* Multi-day selector with dropdown */}
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-3">
              {/* Day selector dropdown */}
              <div className="relative">
                <Button 
                  id="day-selector-button"
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-1 pr-8 pl-3 h-9 text-sm"
                  onClick={() => {
                    const dropdown = document.getElementById("day-dropdown");
                    if (dropdown) {
                      dropdown.classList.toggle("hidden");
                    }
                  }}
                >
                  <Filter className="h-3.5 w-3.5 mr-1 text-gray-500" />
                  {selectedDays.length === 0 ? "All Days" : 
                   selectedDays.length === 1 ? `Day ${selectedDays[0]}` : 
                   `${selectedDays.length} Days Selected`}
                  <ChevronDown className="h-3.5 w-3.5 absolute right-2" />
                </Button>
                
                <div 
                  id="day-dropdown" 
                  className="absolute left-0 top-full mt-1 bg-white border rounded-lg shadow-md z-10 w-56 hidden py-1"
                >
                  <div className="px-3 py-2 flex justify-between items-center">
                    <div className="text-xs font-medium text-gray-600">Filter by Days</div>
                    <div className="flex gap-1">
                      {selectedDays.length === 0 && totalDays > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-gray-500 hover:text-primary hover:bg-primary/5 px-2"
                          onClick={() => {
                            const allDays = Array.from({length: totalDays}, (_, i) => i + 1);
                            setSelectedDays(allDays);
                          }}
                        >
                          Select All
                        </Button>
                      )}
                      {selectedDays.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-gray-500 hover:text-primary hover:bg-primary/5 px-2"
                          onClick={() => {
                            setSelectedDays([]);
                          }}
                        >
                          Clear All
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="border-t my-1"></div>
                  
                  {/* All days option */}
                  <div 
                    className={`px-3 py-1.5 hover:bg-gray-50 cursor-pointer flex items-center ${selectedDays.length === 0 ? 'bg-primary/5 text-primary font-medium' : ''}`}
                    onClick={() => {
                      setSelectedDays([]);
                      document.getElementById("day-dropdown")?.classList.add("hidden");
                    }}
                  >
                    <div className={`w-4 h-4 mr-2 border rounded flex items-center justify-center
                      ${selectedDays.length === 0 ? 'border-primary bg-primary/10' : 'border-gray-300'}`}>
                      {selectedDays.length === 0 && (
                        <div className="w-2 h-2 rounded-sm bg-primary"></div>
                      )}
                    </div>
                    All Days
                  </div>
                  
                  <div className="border-t my-1"></div>
                  
                  {/* Individual days */}
                  {Array.from({length: totalDays}, (_, i) => i + 1).map((day) => (
                    <div 
                      key={day}
                      className={`px-3 py-1.5 hover:bg-gray-50 cursor-pointer flex items-center 
                        ${selectedDays.includes(day) ? 'bg-primary/5 text-primary font-medium' : ''}`}
                      onClick={() => {
                        // Toggle day selection
                        setSelectedDays(prev => 
                          prev.includes(day) 
                            ? prev.filter(d => d !== day) 
                            : [...prev, day]
                        );
                      }}
                    >
                      <div className={`w-4 h-4 mr-2 border rounded flex items-center justify-center
                        ${selectedDays.includes(day) ? 'border-primary bg-primary/10' : 'border-gray-300'}`}>
                        {selectedDays.includes(day) && (
                          <div className="w-2 h-2 rounded-sm bg-primary"></div>
                        )}
                      </div>
                      Day {day}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="font-medium text-sm text-gray-500">
                {filteredWords.length} vocabulary words
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* View toggle */}
              <div className="bg-gray-100 rounded-full p-1 flex">
                <Button 
                  variant="ghost"
                  size="sm"
                  className={`rounded-full h-8 w-8 p-0 ${viewMode === 'carousel' ? 'bg-white shadow-sm' : ''}`}
                  onClick={() => setViewMode('carousel')}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost"
                  size="sm"
                  className={`rounded-full h-8 w-8 p-0 ${viewMode === 'single' ? 'bg-white shadow-sm' : ''}`}
                  onClick={() => setViewMode('single')}
                >
                  <BookOpen className="h-4 w-4" />
                </Button>
              </div>
              
              <Button 
                variant="default"
                size="sm"
                asChild
                className="gap-1 rounded-full"
              >
                <Link to="/practice?type=vocabulary">
                  <GraduationCap className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1">Practice</span>
                </Link>
              </Button>
            </div>
          </div>
          
          {/* Search bar */}
          <div className="px-3 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search words..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 border-gray-200 bg-gray-50"
              />
            </div>
          </div>
        </div>
        
        {/* Main content area - clean and minimalist */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          {/* Content area with no distractions */}
          <div className="p-4 sm:p-6">
            {wordsLoading ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} className="h-[220px] rounded-xl" />
                  ))}
                </div>
              </div>
            ) : filteredWords.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                  <Search className="h-8 w-8 text-gray-300" />
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">No Words Found</h3>
                <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
                  {searchTerm ? (
                    `We couldn't find any vocabulary words matching "${searchTerm}". Try a different search term or browse by day.`
                  ) : selectedDays.length === 1 ? (
                    `There are no vocabulary words available for Day ${selectedDays[0]}. Please select a different day.`
                  ) : (
                    `There are no vocabulary words available for the selected days. Please try different days.`
                  )}
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedDays([user.currentDay || 1]);
                  }}
                  className="rounded-full"
                  size="sm"
                >
                  <Undo2 className="h-4 w-4 mr-1" />
                  Reset Filters
                </Button>
              </div>
            ) : (
              <QuizletFlashcards
                words={filteredWords}
                day={selectedDays.length === 1 ? selectedDays[0] : (user.currentDay || 1)}
                bookmarkedWords={bookmarkedWords}
                onToggleBookmark={handleToggleBookmark}
                viewMode={viewMode}
              />
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Vocabulary;