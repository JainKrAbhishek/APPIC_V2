import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  RotateCcw, 
  ArrowRight,
  Star,
  HelpCircle,
  ThumbsUp,
  BookmarkPlus
} from 'lucide-react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import Flashcard from './Flashcard';
import { VocabWord } from '@/components/vocabulary/types';
import { calculateNextReview } from '@/components/vocabulary/utils/spaced-repetition';
import { ReviewHistoryItem } from '@shared/schema';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import Confetti from 'react-confetti';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface SpacedRepetitionGameProps {
  dueWords: VocabWord[];
  onComplete: () => void;
  onToggleBookmark?: (word: VocabWord) => void;
  bookmarkedWords?: VocabWord[];
}

const SpacedRepetitionGame: React.FC<SpacedRepetitionGameProps> = ({
  dueWords,
  onComplete,
  onToggleBookmark,
  bookmarkedWords = []
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviewsCompleted, setReviewsCompleted] = useState(0);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [showingRatingOptions, setShowingRatingOptions] = useState(false);
  const [reviewBatch, setReviewBatch] = useState<VocabWord[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [stats, setStats] = useState({
    remembered: 0,
    learning: 0,
    struggled: 0
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get word progress to track bookmarked status
  const isBookmarked = useMemo(() => {
    if (!bookmarkedWords || !bookmarkedWords.length || !reviewBatch.length) return false;
    
    const currentWord = reviewBatch[currentIndex];
    if (!currentWord) return false;
    
    return bookmarkedWords.some(word => word.word === currentWord.word);
  }, [currentIndex, reviewBatch, bookmarkedWords]);
  
  // Setup the mutation to submit the review
  const reviewMutation = useMutation({
    mutationFn: async (reviewData: { 
      wordId: number, 
      quality: number,
      reviewHistory: ReviewHistoryItem
    }) => {
      return apiRequest('/api/spaced-repetition/update-review', { 
        method: 'POST',
        data: reviewData
      });
    },
    onSuccess: () => {
      // Invalidate the query to refresh the due words list
      queryClient.invalidateQueries({ queryKey: ['/api/spaced-repetition/due-words'] });
      queryClient.invalidateQueries({ queryKey: ['/api/spaced-repetition/stats'] });
    },
    onError: (error) => {
      console.error('Error updating review:', error);
      toast({
        title: 'Review update failed',
        description: 'There was an error updating your progress.',
        variant: 'destructive'
      });
    }
  });
  
  useEffect(() => {
    // Initialize the game with the provided due words
    if (dueWords.length > 0 && reviewBatch.length === 0) {
      // Randomize and select 10 words for this batch
      const words = [...dueWords];
      const shuffled = words.sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, Math.min(10, words.length));
      setReviewBatch(selected);
    }
  }, [dueWords, reviewBatch.length]);
  
  // Handle flipping the flashcard
  const handleFlip = () => {
    if (!flipped) {
      setFlipped(true);
      setShowingRatingOptions(true);
    }
  };
  
  // Handle rating the recall quality
  const handleRate = (quality: number) => {
    setSelectedRating(quality);
    
    // Update the statistics
    if (quality >= 4) { // Good recall (4-5)
      setStats(prev => ({ ...prev, remembered: prev.remembered + 1 }));
    } else if (quality >= 2) { // Medium recall (2-3)
      setStats(prev => ({ ...prev, learning: prev.learning + 1 }));
    } else { // Poor recall (0-1)
      setStats(prev => ({ ...prev, struggled: prev.struggled + 1 }));
    }
    
    // Calculate next review interval using SM-2 algorithm
    const currentWord = reviewBatch[currentIndex];
    
    // Submit the review to the server
    if (currentWord && 'id' in currentWord) {
      const wordId = currentWord.id as number;
      
      // Create review history item
      const reviewHistory: ReviewHistoryItem = {
        date: new Date().toISOString(),
        quality: quality,
        efFactor: 2.5, // This will be updated by the server
        interval: 0 // This will be updated by the server
      };
      
      // Submit the review
      reviewMutation.mutate({
        wordId,
        quality,
        reviewHistory
      });
    }
    
    // Advance to the next card with a slight delay
    setTimeout(() => {
      setFlipped(false);
      setSelectedRating(null);
      setShowingRatingOptions(false);
      
      // If the current card was the last one, show completion state
      if (currentIndex >= reviewBatch.length - 1) {
        setIsCompleted(true);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000); // Stop confetti after 5 seconds
      } else {
        setCurrentIndex(currentIndex + 1);
      }
      
      setReviewsCompleted(reviewsCompleted + 1);
    }, 500);
  };
  
  // Handle bookmarking the current word
  const handleToggleBookmark = () => {
    if (onToggleBookmark && reviewBatch.length > 0) {
      onToggleBookmark(reviewBatch[currentIndex]);
    }
  };
  
  // Handle restarting the game
  const handleRestart = () => {
    // Reset all state
    setCurrentIndex(0);
    setFlipped(false);
    setReviewsCompleted(0);
    setSelectedRating(null);
    setShowingRatingOptions(false);
    setIsCompleted(false);
    
    // Reshuffle the words
    const words = [...dueWords];
    const shuffled = words.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(10, words.length));
    setReviewBatch(selected);
    
    setStats({
      remembered: 0,
      learning: 0,
      struggled: 0
    });
  };
  
  // Render the rating buttons for recall quality
  const renderRatingButtons = () => {
    const ratings = [
      { quality: 0, label: "Didn't know", icon: <XCircle className="h-4 w-4" />, color: 'text-red-500 bg-red-50 border-red-200 hover:bg-red-100' },
      { quality: 1, label: 'Incorrect', icon: <XCircle className="h-4 w-4" />, color: 'text-orange-500 bg-orange-50 border-orange-200 hover:bg-orange-100' },
      { quality: 2, label: 'Hard', icon: <HelpCircle className="h-4 w-4" />, color: 'text-amber-500 bg-amber-50 border-amber-200 hover:bg-amber-100' },
      { quality: 3, label: 'Medium', icon: <Clock className="h-4 w-4" />, color: 'text-blue-500 bg-blue-50 border-blue-200 hover:bg-blue-100' },
      { quality: 4, label: 'Good', icon: <ThumbsUp className="h-4 w-4" />, color: 'text-emerald-500 bg-emerald-50 border-emerald-200 hover:bg-emerald-100' },
      { quality: 5, label: 'Perfect', icon: <Star className="h-4 w-4" />, color: 'text-indigo-500 bg-indigo-50 border-indigo-200 hover:bg-indigo-100' },
    ];
    
    return (
      <div className="w-full flex flex-col items-center mt-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2">How well did you remember this word?</h3>
        <div className="grid grid-cols-3 gap-2 w-full max-w-lg">
          {ratings.map(rating => (
            <TooltipProvider key={rating.quality}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className={`flex flex-col items-center px-2 py-3 h-auto ${rating.color}`}
                    onClick={() => handleRate(rating.quality)}
                  >
                    {rating.icon}
                    <span className="text-xs mt-1">{rating.label}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{getRatingDescription(rating.quality)}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </div>
    );
  };
  
  // Get the description for each rating level
  const getRatingDescription = (quality: number): string => {
    switch (quality) {
      case 0: return "Complete blackout, didn't recognize the word at all";
      case 1: return "Incorrect response but recognized the word";
      case 2: return "Incorrect response but after seeing the answer, it felt familiar";
      case 3: return "Correct response but required effort to recall";
      case 4: return "Correct response with some hesitation";
      case 5: return "Perfect response, recalled the word easily";
      default: return "";
    }
  };
  
  // Render the completion screen
  const renderCompletionScreen = () => {
    const totalReviewed = stats.remembered + stats.learning + stats.struggled;
    
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-6 sm:p-8 flex flex-col items-center">
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-4">
            Review Session Complete!
          </h2>
          
          <div className="w-32 h-32 mb-6">
            <CircularProgressbar
              value={(stats.remembered / (totalReviewed || 1)) * 100}
              text={`${stats.remembered}/${totalReviewed}`}
              styles={buildStyles({
                textSize: '16px',
                pathColor: '#6366F1',
                textColor: '#1F2937',
                trailColor: '#E5E7EB',
              })}
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4 w-full mb-6">
            <div className="bg-green-50 rounded-lg p-3 text-center border border-green-100">
              <span className="text-green-600 text-lg font-semibold block">
                {stats.remembered}
              </span>
              <span className="text-xs text-gray-600">
                Remembered
              </span>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 text-center border border-blue-100">
              <span className="text-blue-600 text-lg font-semibold block">
                {stats.learning}
              </span>
              <span className="text-xs text-gray-600">
                Learning
              </span>
            </div>
            <div className="bg-amber-50 rounded-lg p-3 text-center border border-amber-100">
              <span className="text-amber-600 text-lg font-semibold block">
                {stats.struggled}
              </span>
              <span className="text-xs text-gray-600">
                Struggled
              </span>
            </div>
          </div>
          
          <p className="text-sm text-gray-600 text-center mb-6">
            Great job! Your next review session will be scheduled based on how well you remembered each word.
          </p>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="px-4"
              onClick={handleRestart}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Review More Words
            </Button>
            
            <Button
              onClick={onComplete}
              className="px-4 bg-primary"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Finish
            </Button>
          </div>
        </div>
      </div>
    );
  };
  
  // Show progress display
  const progress = isCompleted ? 100 : Math.round((reviewsCompleted / reviewBatch.length) * 100);
  
  if (reviewBatch.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-12">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-32 w-32 bg-gray-200 rounded-full mb-4"></div>
          <div className="h-6 w-40 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 w-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full">
      {showConfetti && <Confetti recycle={false} numberOfPieces={200} />}
      
      {isCompleted ? (
        renderCompletionScreen()
      ) : (
        <div className="w-full">
          {/* Progress bar */}
          <div className="w-full bg-gray-100 rounded-full h-2.5 mb-6 overflow-hidden">
            <div 
              className="bg-primary h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between items-center mb-4">
            <Badge variant="outline" className="text-gray-600">
              {currentIndex + 1} of {reviewBatch.length}
            </Badge>
            
            {onToggleBookmark && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleBookmark}
                className="flex items-center gap-1"
              >
                <BookmarkPlus 
                  className={`h-4 w-4 ${isBookmarked ? 'text-primary fill-primary' : ''}`} 
                />
                <span className="text-xs">
                  {isBookmarked ? 'Bookmarked' : 'Bookmark'}
                </span>
              </Button>
            )}
          </div>
          
          {/* Flashcard */}
          <Flashcard
            word={reviewBatch[currentIndex]}
            flipped={flipped}
            onFlip={handleFlip}
            index={currentIndex}
            total={reviewBatch.length}
            bookmarked={isBookmarked}
          />
          
          {/* Rating buttons (shown only when card is flipped) */}
          <AnimatePresence>
            {showingRatingOptions && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderRatingButtons()}
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Reveal button (shown only when card is not flipped) */}
          {!flipped && (
            <div className="w-full flex justify-center mt-6">
              <Button
                size="lg"
                onClick={handleFlip}
                className="px-8"
              >
                Reveal Answer
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SpacedRepetitionGame;