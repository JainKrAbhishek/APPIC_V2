import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useLocation } from 'wouter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { GraduationCap, BookOpen, BrainCog, ChevronRight, Home, AlertTriangle, Check, Clock, BookMarked, RotateCcw } from 'lucide-react';
import { SpacedRepetitionGame, VocabWord } from '@/components/vocabulary';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Word } from '@shared/schema';
import { UserRecord } from '@shared/types';
import { useToast } from '@/hooks/use-toast';

interface VocabularySpacedRepetitionProps {
  user: UserRecord;
}

const VocabularySpacedRepetition = ({ user }: VocabularySpacedRepetitionProps) => {
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<string>('review');
  const [isReviewMode, setIsReviewMode] = useState<boolean>(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch due words for review
  const { data: dueWords = [], isLoading: dueWordsLoading, isError: dueWordsError } = useQuery<VocabWord[]>({
    queryKey: ['/api/spaced-repetition/due-words'],
    staleTime: 60000, // 1 minute - refresh fairly often during active study
    enabled: !!user,
  });
  
  // Fetch bookmarked words to show in the UI and track in the game
  const { data: rawBookmarkedWords = [], isLoading: bookmarksLoading, refetch: refetchBookmarks } = useQuery<any[]>({
    queryKey: ['/api/bookmarked-words'],
    staleTime: 60000, // 1 minute - refresh more frequently to reflect latest changes
    refetchOnWindowFocus: true, // Refresh when tab gets focus
    refetchOnMount: true, // Always refresh when component mounts
    enabled: !!user,
  });
  
  // Process raw bookmarked words into the VocabWord format
  const bookmarkedWords = React.useMemo(() => {
    if (!rawBookmarkedWords || !Array.isArray(rawBookmarkedWords)) {
      console.log('No bookmarked words data or invalid format:', rawBookmarkedWords);
      return [];
    }
    
    console.log(`Processing ${rawBookmarkedWords.length} raw bookmarked words`);
    
    // Map the database format to the VocabWord format expected by the components
    return rawBookmarkedWords.map(word => ({
      key: word.id,
      id: word.id,
      group: word.day || 1,
      word: word.word,
      definitions: [{
        part_of_speech: word.partOfSpeech || 'unknown',
        definition: word.definition || '',
        sentence: word.example || '',
        synonyms: word.synonyms || []
      }]
    }));
  }, [rawBookmarkedWords]);
  
  // Define type for statistics
  interface SpacedRepetitionStats {
    dueCount: number;
    learningCount: number;
    masteredCount: number;
    newCount: number;
    totalWords: number;
    nextReviewDate: string | null;
  }
  
  // Fetch spaced repetition statistics
  const { data: stats, isLoading: statsLoading, isError: statsError } = useQuery<SpacedRepetitionStats>({
    queryKey: ['/api/spaced-repetition/stats'],
    staleTime: 300000, // 5 minutes
    enabled: !!user,
  });
  
  // Toggle bookmark mutation with improved error handling and feedback
  const bookmarkMutation = useMutation({
    mutationFn: async (word: VocabWord) => {
      if (!word || !('id' in word)) {
        console.error('Invalid word object provided to bookmark function:', word);
        throw new Error('Invalid word object');
      }
      
      const wordId = word.id;
      const isCurrentlyBookmarked = bookmarkedWords.some((w: any) => w.id === wordId);
      
      console.log(`Toggling bookmark for word ${word.word} (ID: ${wordId}), current status: ${isCurrentlyBookmarked ? 'bookmarked' : 'not bookmarked'}`);
      
      // Use the correct API endpoint for bookmarking words
      return apiRequest('/api/bookmark-word', {
        method: 'POST',
        data: { 
          wordId, 
          bookmarked: !isCurrentlyBookmarked 
        }
      });
    },
    onSuccess: (_, variables) => {
      // Get current bookmarked status to show correct message
      const wordId = 'id' in variables ? variables.id : null;
      const isCurrentlyBookmarked = wordId ? bookmarkedWords.some((w: any) => w.id === wordId) : false;
      
      // Show success toast with appropriate message
      toast({
        title: isCurrentlyBookmarked ? 'Bookmark removed' : 'Word bookmarked',
        description: isCurrentlyBookmarked 
          ? 'The word has been removed from your bookmarks.' 
          : 'The word has been added to your bookmarks for quick reference.',
        variant: 'default'
      });
      
      // Invalidate bookmarked words query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/bookmarked-words'] });
      
      // Explicitly refetch bookmarks to ensure UI is updated
      setTimeout(() => {
        console.log('Explicitly refetching bookmarks');
        refetchBookmarks();
      }, 300); // Small delay to ensure server has processed the update
    },
    onError: (error, variables) => {
      const word = 'word' in variables ? variables.word : 'this word';
      console.error(`Error toggling bookmark for ${word}:`, error);
      
      toast({
        title: 'Bookmark action failed',
        description: 'There was an error updating your bookmarks. Please try again.',
        variant: 'destructive'
      });
    }
  });
  
  // Handle bookmark toggling with optimistic UI update
  const handleToggleBookmark = (word: VocabWord) => {
    if (!word || !('id' in word)) {
      console.error('Invalid word object provided to handleToggleBookmark:', word);
      return;
    }
    
    // Log the action for debugging
    console.log(`User requested to toggle bookmark for "${word.word}" (ID: ${word.id})`);
    
    // Execute the mutation
    bookmarkMutation.mutate(word);
  };
  
  // Handle completing the review session
  const handleCompleteReview = () => {
    setIsReviewMode(false);
    
    // Refresh the due words data
    queryClient.invalidateQueries({ queryKey: ['/api/spaced-repetition/due-words'] });
    queryClient.invalidateQueries({ queryKey: ['/api/spaced-repetition/stats'] });
    
    // Show success message
    toast({
      title: 'Review completed',
      description: 'Your progress has been saved.',
      variant: 'default'
    });
  };
  
  // Format stats for display
  const formatStats = () => {
    const defaultStats = {
      due: 0,
      learning: 0,
      mastered: 0,
      new: 0,
      total: 0,
      nextReview: null
    };
    
    if (!stats) return defaultStats;
    
    return {
      due: stats.dueCount || 0,
      learning: stats.learningCount || 0,
      mastered: stats.masteredCount || 0,
      new: stats.newCount || 0,
      total: stats.totalWords || 0,
      nextReview: stats.nextReviewDate ? new Date(stats.nextReviewDate) : null
    };
  };
  
  const formattedStats = formatStats();
  const masteredPercentage = Math.round((formattedStats.mastered / Math.max(formattedStats.total, 1)) * 100);
  
  // Format next review date
  const formatNextReview = () => {
    if (!formattedStats.nextReview) return 'No upcoming reviews';
    
    const now = new Date();
    const nextReview = formattedStats.nextReview;
    
    // If the next review is today
    if (nextReview.toDateString() === now.toDateString()) {
      return 'Later today';
    }
    
    // If the next review is tomorrow
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (nextReview.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }
    
    // Return formatted date
    return nextReview.toLocaleDateString(undefined, { 
      weekday: 'long',
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  // Start a new review session
  const startReview = () => {
    if (dueWords.length === 0) {
      toast({
        title: 'No words due for review',
        description: 'Check back later for your next scheduled review session.',
        variant: 'default'
      });
      return;
    }
    
    setIsReviewMode(true);
  };
  
  return (
    <div className="py-6 sm:py-12 bg-gradient-to-br from-primary/5 via-white to-[#B388FF]/5 min-h-screen">
      <Helmet>
        <title>Vocabulary Spaced Repetition | PrepJet</title>
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
              <BreadcrumbLink>Spaced Repetition</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header with title */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">
              Vocabulary Spaced Repetition
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Learn and review words at optimal intervals for long-term memory
            </p>
          </div>

          {/* Vocabulary section tabs */}
          <div className="flex gap-3">
            <Button variant="outline" asChild className="flex items-center gap-2">
              <Link to="/vocabulary">
                <BookOpen className="h-4 w-4" />
                <span>Daily Words</span>
              </Link>
            </Button>
            <Button className="flex items-center gap-2">
              <BrainCog className="h-4 w-4" />
              <span>Spaced Repetition</span>
            </Button>
          </div>
        </div>

        {/* Main content */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100 mb-8">
          {!isReviewMode ? (
            <div className="space-y-6">
              {/* Info box */}
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg mb-6">
                <h3 className="text-lg font-medium text-gray-800 mb-2 flex items-center">
                  <GraduationCap className="h-5 w-5 text-primary mr-2" />
                  About Spaced Repetition
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Spaced repetition is a learning technique that uses increasing time intervals between reviews of material
                  to exploit the psychological spacing effect. This system ensures you review words just as you're about to forget 
                  them, for maximum long-term retention.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div className="bg-white p-3 rounded-lg border border-gray-100">
                    <span className="font-medium text-gray-800">New Words</span>
                    <p className="text-gray-600">Words you haven't seen before.</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-gray-100">
                    <span className="font-medium text-gray-800">Learning Words</span>
                    <p className="text-gray-600">Words you're currently learning at short intervals.</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-gray-100">
                    <span className="font-medium text-gray-800">Mastered Words</span>
                    <p className="text-gray-600">Words you know well, reviewed at longer intervals.</p>
                  </div>
                </div>
              </div>

              {/* Stats and actions */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Review status card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      Review Status
                    </CardTitle>
                    <CardDescription>
                      Words due for review today
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {statsLoading ? (
                      <div className="space-y-2">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                      </div>
                    ) : statsError ? (
                      <div className="text-center p-4 text-amber-600">
                        <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm">Error loading review status</p>
                      </div>
                    ) : (
                      <div className="text-center py-2">
                        <div className="text-4xl font-bold text-primary mb-2">
                          {formattedStats.due}
                        </div>
                        <p className="text-sm text-gray-500">
                          words due for review
                        </p>
                        <div className="mt-4 text-sm text-gray-600">
                          <p>Next scheduled review: {formatNextReview()}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      onClick={startReview}
                      disabled={dueWordsLoading || formattedStats.due === 0}
                    >
                      {dueWordsLoading ? (
                        <>Loading...</>
                      ) : formattedStats.due > 0 ? (
                        <>Start Review</>
                      ) : (
                        <>No Words Due</>
                      )}
                    </Button>
                  </CardFooter>
                </Card>

                {/* Progress card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Check className="h-5 w-5 text-emerald-500" />
                      Mastery Progress
                    </CardTitle>
                    <CardDescription>
                      Your vocabulary learning journey
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {statsLoading ? (
                      <div className="space-y-2">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                      </div>
                    ) : statsError ? (
                      <div className="text-center p-4 text-amber-600">
                        <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm">Error loading progress data</p>
                      </div>
                    ) : (
                      <div className="py-2">
                        <div className="mb-2 flex justify-between items-center text-sm">
                          <span>Progress</span>
                          <span className="font-medium">{masteredPercentage}%</span>
                        </div>
                        <Progress value={masteredPercentage} className="h-2" />
                        
                        <div className="grid grid-cols-3 gap-2 mt-6">
                          <div className="text-center">
                            <div className="text-2xl font-semibold text-amber-500">
                              {formattedStats.new}
                            </div>
                            <p className="text-xs text-gray-500">New</p>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-semibold text-blue-500">
                              {formattedStats.learning}
                            </div>
                            <p className="text-xs text-gray-500">Learning</p>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-semibold text-emerald-500">
                              {formattedStats.mastered}
                            </div>
                            <p className="text-xs text-gray-500">Mastered</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <div className="text-sm text-gray-600 w-full text-center">
                      <p>Total: {formattedStats.total} vocabulary words</p>
                    </div>
                  </CardFooter>
                </Card>

                {/* Bookmarked words card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BookMarked className="h-5 w-5 text-blue-500" />
                      Bookmarked Words
                    </CardTitle>
                    <CardDescription>
                      Words you've saved for extra practice
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {bookmarksLoading ? (
                      <div className="space-y-2">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                      </div>
                    ) : (
                      <div className="text-center py-2">
                        <div className="text-4xl font-bold text-blue-500 mb-2">
                          {bookmarkedWords.length}
                        </div>
                        <p className="text-sm text-gray-500">
                          bookmarked words
                        </p>
                        
                        {bookmarkedWords.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-1 justify-center">
                            {bookmarkedWords.slice(0, 5).map((word: VocabWord) => (
                              <Badge key={word.key} variant="outline" className="bg-blue-50">
                                {word.word}
                              </Badge>
                            ))}
                            {bookmarkedWords.length > 5 && (
                              <Badge variant="outline" className="bg-gray-50">
                                +{bookmarkedWords.length - 5} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      asChild
                    >
                      <Link to="/vocabulary?tab=bookmarked">
                        View Bookmarked Words
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          ) : (
            <div>
              {/* Back button when in review mode */}
              <div className="mb-6">
                <Button 
                  variant="outline" 
                  className="text-sm"
                  onClick={() => setIsReviewMode(false)}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Exit Review
                </Button>
              </div>
              
              {/* Spaced repetition game component */}
              <SpacedRepetitionGame 
                dueWords={dueWords as VocabWord[]}
                onComplete={handleCompleteReview}
                onToggleBookmark={handleToggleBookmark}
                bookmarkedWords={bookmarkedWords as VocabWord[]}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VocabularySpacedRepetition;