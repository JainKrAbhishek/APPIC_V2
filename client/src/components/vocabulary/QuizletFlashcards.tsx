import React, { useState, useEffect, useRef } from 'react';
import { Word } from '@shared/schema';
import { VocabWord } from '@/components/vocabulary/types';
import Flashcard from './Flashcard';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface QuizletFlashcardsProps {
  words: (Word | VocabWord)[];
  day: number;
  bookmarkedWords: Word[];
  onToggleBookmark: (wordId: number, bookmarked: boolean) => void;
  viewMode?: 'single' | 'carousel';
}

const QuizletFlashcards = ({ words, day, bookmarkedWords, onToggleBookmark, viewMode = 'carousel' }: QuizletFlashcardsProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchEndX, setTouchEndX] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  // Only reset index when the word list length changes, not on every re-render
  useEffect(() => {
    // Using words.length instead of words array as dependency to prevent refresh loops
    // This way the index only resets when a different number of words is shown
    setCurrentIndex(0);
  }, [words.length]);

  // Check if a word is bookmarked - memoized to prevent unnecessary recalculations
  const isBookmarked = React.useCallback((word: Word | VocabWord) => {
    if ('id' in word) {
      return bookmarkedWords.some(bookmarked => bookmarked.id === word.id);
    } else if ('key' in word) {
      // For VocabWord type, check if their key matches any bookmarked word id
      return bookmarkedWords.some(bookmarked => bookmarked.id === word.key);
    }
    return false;
  }, [bookmarkedWords]);
  
  // Get bookmarked words count per day - memoized to prevent unnecessary recalculations
  const getBookmarkedCountByDay = React.useCallback((dayNumber: number | undefined): number => {
    if (dayNumber === undefined) return 0;
    return bookmarkedWords.filter(word => word.day === dayNumber).length;
  }, [bookmarkedWords]);

  // Navigate to the previous card - memoized to prevent unnecessary rerenders
  const prevCard = React.useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : prevIndex));
  }, []);

  // Navigate to the next card - memoized to prevent unnecessary rerenders
  const nextCard = React.useCallback(() => {
    setDirection(1);
    setCurrentIndex((prevIndex) => (prevIndex < words.length - 1 ? prevIndex + 1 : prevIndex));
  }, [words.length]);

  // Set up keyboard navigation
  useEffect(() => {
    // Define a memoized handler to prevent unnecessary re-renders
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        prevCard();
      } else if (e.key === 'ArrowRight') {
        nextCard();
      }
    };

    // Add event listener only once during component mount
    window.addEventListener('keydown', handleKeyDown);
    
    // Clean up event listener on unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  // Include the memoized functions in the dependency array
  // This is fine because they're memoized and won't cause rerenders
  }, [prevCard, nextCard]);

  // Handle touch events for swipe - memoized to prevent unnecessary rerenders
  const handleTouchStart = React.useCallback((e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  }, []);

  const handleTouchMove = React.useCallback((e: React.TouchEvent) => {
    setTouchEndX(e.touches[0].clientX);
  }, []);

  const handleTouchEnd = React.useCallback(() => {
    const threshold = 50; // Minimum swipe distance
    
    if (touchStartX - touchEndX > threshold) {
      // Swiped left, go to next card
      nextCard();
    } else if (touchEndX - touchStartX > threshold) {
      // Swiped right, go to previous card
      prevCard();
    }
    
    // Reset touch coordinates
    setTouchStartX(0);
    setTouchEndX(0);
  }, [touchStartX, touchEndX, nextCard, prevCard]);

  // Variants for slide animations - optimized for faster performance
  const variants = {
    enter: (direction: number) => {
      return {
        x: direction > 0 ? 150 : -150,
        opacity: 0,
      };
    },
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => {
      return {
        x: direction < 0 ? 150 : -150,
        opacity: 0,
      };
    },
  };

  // Single card view mode
  if (viewMode === 'single') {
    return (
      <div className="flex flex-col">
        <div 
          className="w-full h-[380px] sm:h-[420px] relative overflow-hidden touch-manipulation"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentIndex}
              ref={cardRef}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 700, damping: 40, mass: 0.5 },
                opacity: { duration: 0.1 },
              }}
              className="absolute w-full h-full"
            >
              <Flashcard
                word={words[currentIndex]}
                index={currentIndex}
                total={words.length}
                day={day}
                bookmarked={isBookmarked(words[currentIndex])}
                onToggleBookmark={onToggleBookmark}
                bookmarkedCountInDay={getBookmarkedCountByDay('day' in words[currentIndex] ? words[currentIndex].day : day)}
                showBookmarkCount={true}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex justify-center mt-6 gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={prevCard}
            disabled={currentIndex === 0}
            className="text-gray-500 hover:text-primary h-12 w-12 sm:h-12 sm:w-12 bg-white active:bg-gray-100 border-gray-200 shadow-sm touch-manipulation"
            aria-label="Previous card"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <div className="text-center px-4 py-2 min-h-[48px] min-w-[90px] flex items-center justify-center bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
            <span className="font-medium">
              {currentIndex + 1} of {words.length}
            </span>
          </div>
          
          <Button
            variant="outline"
            size="icon"
            onClick={nextCard}
            disabled={currentIndex === words.length - 1}
            className="text-gray-500 hover:text-primary h-12 w-12 sm:h-12 sm:w-12 bg-white active:bg-gray-100 border-gray-200 shadow-sm touch-manipulation"
            aria-label="Next card"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    );
  }
  
  // Carousel view mode
  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {words.map((word, index) => (
          <div key={index} className="h-[320px] sm:h-[280px] p-1 touch-manipulation">
            <Flashcard
              word={word}
              index={index}
              total={words.length}
              day={day}
              bookmarked={isBookmarked(word)}
              onToggleBookmark={onToggleBookmark}
              bookmarkedCountInDay={getBookmarkedCountByDay('day' in word ? word.day : day)}
              showBookmarkCount={true}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuizletFlashcards;