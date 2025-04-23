import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Word } from '@shared/schema';
import { UserRecord } from '@shared/types';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
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
  LayoutGrid,
  Filter
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { VocabWord, findWords, QuizletFlashcards } from '@/components/vocabulary';

interface VocabularyBookmarksProps {
  user: UserRecord;
}

const VocabularyBookmarks = ({ user }: VocabularyBookmarksProps) => {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  // State for view mode, search, and day filter
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'single' | 'carousel'>('carousel');
  const [selectedDays, setSelectedDays] = useState<number[]>([]); // Empty array means all days
  
  // Fetch bookmarked words
  const { data: bookmarkedWords = [], isLoading: bookmarksLoading, refetch: refetchBookmarks } = useQuery<Word[]>({
    queryKey: ['/api/bookmarked-words'],
    staleTime: 60000, // 1 minute
    enabled: !!user,
  });
  
  // Toggle bookmark mutation
  const bookmarkMutation = {
    mutate: async (wordId: number) => {
      try {
        const response = await apiRequest('/api/bookmark-word', {
          method: 'POST',
          data: { 
            wordId, 
            bookmarked: false // Always removing from bookmarks in this view
          }
        });
        
        // Refetch bookmarks after toggling
        refetchBookmarks();
        
        toast({
          title: 'Bookmark removed',
          description: 'The word has been removed from your bookmarks.',
        });
        
        return response;
      } catch (error) {
        console.error('Error toggling bookmark:', error);
        
        toast({
          title: 'Bookmark action failed',
          description: 'There was an error updating your bookmarks. Please try again.',
          variant: 'destructive'
        });
      }
    }
  };
  
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
  
  // Get a list of all days that have bookmarked words
  const daysList = React.useMemo(() => {
    if (bookmarksLoading || !bookmarkedWords.length) return [];
    
    const days = bookmarkedWords.map(word => word.day || 1);
    const uniqueDays = Array.from(new Set(days)).sort((a, b) => a - b);
    return uniqueDays;
  }, [bookmarkedWords, bookmarksLoading]);
  
  // Filter bookmarked words based on search term and selected days
  const filteredBookmarkedWords = React.useMemo(() => {
    if (bookmarksLoading || !bookmarkedWords.length) return [];
    
    const vocabWords = transformToVocabWords(bookmarkedWords);
    
    // First filter by days if specific days are selected
    const dayFiltered = selectedDays.length > 0
      ? vocabWords.filter(word => selectedDays.includes(word.group))
      : vocabWords;
    
    // Then apply search filter if needed
    return searchTerm ? findWords(dayFiltered, searchTerm) : dayFiltered;
  }, [bookmarkedWords, searchTerm, selectedDays, bookmarksLoading]);
  
  // Log processing for debugging
  React.useEffect(() => {
    if (bookmarkedWords.length > 0) {
      console.log(`Processing ${bookmarkedWords.length} raw bookmarked words`);
    }
  }, [bookmarkedWords]);

  // Add event listener to close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.getElementById("day-dropdown");
      const daySelector = document.getElementById("day-selector-button");
      
      if (dropdown && !dropdown.contains(event.target as Node) && 
          daySelector && !daySelector.contains(event.target as Node)) {
        dropdown.classList.add("hidden");
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  return (
    <DashboardLayout title="Bookmarked Words" user={user}>
      <Helmet>
        <title>Bookmarked Words | PrepJet</title>
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
              <BreadcrumbLink asChild>
                <Link to="/vocabulary">Vocabulary</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-3.5 w-3.5" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink>Bookmarked Words</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header with title */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">
              Bookmarked Words
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Review your saved vocabulary words for focused practice
            </p>
          </div>

          {/* Minimal navigation for mobile */}
          <div className="flex bg-gray-100 rounded-xl self-stretch sm:self-end p-1">
            <Button 
              variant="ghost"
              asChild
              className="flex-1 flex justify-center items-center gap-1 h-10 text-gray-600 rounded-lg"
            >
              <Link to="/vocabulary">
                <BookOpen className="h-4 w-4" />
                <span className="text-sm">Daily</span>
              </Link>
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
              className="flex-1 flex justify-center items-center gap-1 h-10 bg-white shadow-sm rounded-lg"
            >
              <BookMarked className="h-4 w-4" />
              <span className="text-sm">Saved</span>
            </Button>
          </div>
        </div>

        {/* Streamlined control panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-4">
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
                      {selectedDays.length === 0 && daysList.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-gray-500 hover:text-primary hover:bg-primary/5 px-2"
                          onClick={() => {
                            setSelectedDays([...daysList]);
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
                  {daysList.map((day) => (
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
                {filteredBookmarkedWords.length} bookmarked words
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
            </div>
          </div>
          
          {/* Search bar */}
          <div className="px-3 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search bookmarked words..."
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
            {bookmarksLoading ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} className="h-[220px] rounded-xl" />
                  ))}
                </div>
              </div>
            ) : filteredBookmarkedWords.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                  <BookMarked className="h-8 w-8 text-gray-300" />
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">No Bookmarked Words</h3>
                <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
                  {searchTerm ? (
                    `We couldn't find any bookmarked words matching "${searchTerm}". Try a different search term.`
                  ) : selectedDays.length > 0 ? (
                    `You don't have any bookmarked words for ${selectedDays.length === 1 ? `Day ${selectedDays[0]}` : 'the selected days'}. Select "All Days" to see all your bookmarks or try bookmarking words from ${selectedDays.length === 1 ? 'this day' : 'these days'}.`
                  ) : (
                    `You haven't bookmarked any vocabulary words yet. Browse vocabulary and click the bookmark icon to save words for later review.`
                  )}
                </p>
                <Button 
                  variant="outline"
                  asChild
                  className="rounded-full"
                  size="sm"
                >
                  <Link to="/vocabulary">
                    Browse Vocabulary
                  </Link>
                </Button>
              </div>
            ) : (
              <QuizletFlashcards
                words={filteredBookmarkedWords}
                day={0} // No specific day for bookmarked words
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

export default VocabularyBookmarks;