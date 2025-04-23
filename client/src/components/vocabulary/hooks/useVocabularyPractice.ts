import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Word } from '@shared/schema';
import { 
  VocabPracticeOptions, 
  ModeStats, 
  VocabPracticeState,
  PracticeMode 
} from '@/components/vocabulary';

/**
 * Custom hook for vocabulary practice functionality
 */
export function useVocabularyPractice() {
  const { toast } = useToast();
  
  // Initialize vocabulary practice state
  const [vocabState, setVocabState] = useState<VocabPracticeState>({
    isVocabPracticeActive: false,
    vocabPracticeMode: null,
    vocabPracticeWords: [],
    vocabPracticeDay: 1,
    vocabPracticeShowResults: false,
    vocabPracticeScore: { score: 0, total: 0 },
    practiceOptions: {
      questionsPerSession: 10,
      showHints: true,
      useBookmarked: false,
      selectedDays: [],
      mixedPractice: false
    }
  });
  
  // Fetch vocabulary words
  const { data: vocabWords, isLoading: vocabLoading } = useQuery<Word[]>({
    queryKey: ["/api/words"],
    enabled: true // Always fetch vocabulary words for better UX
  });
  
  // Fetch bookmarked vocabulary words
  const { data: bookmarkedWords, isLoading: bookmarkedLoading } = useQuery<Word[]>({
    queryKey: ["/api/bookmarked-words"],
    enabled: true // Always fetch bookmarked words for better UX
  });
  
  // Get distinct vocabulary days
  const distinctVocabDays = useMemo(() => {
    if (!vocabWords) return [];
    const days = Array.from(new Set(vocabWords.map(word => word.day))).filter(day => day !== undefined) as number[];
    return days.sort((a, b) => a - b);
  }, [vocabWords]);
  
  // Start vocabulary practice with selected mode
  const startVocabPractice = useCallback((
    mode: PracticeMode | PracticeMode[], 
    words: Word[], 
    day: number,
    options?: VocabPracticeOptions
  ) => {
    // Validate inputs
    if (!mode || words.length === 0) {
      toast({
        title: "Can't start practice",
        description: "No vocabulary words available for this selection.",
        variant: "destructive"
      });
      return;
    }
    
    // Update vocabulary practice state
    setVocabState((prev: VocabPracticeState) => ({
      ...prev,
      isVocabPracticeActive: true,
      vocabPracticeMode: mode,
      vocabPracticeWords: words,
      vocabPracticeDay: day,
      vocabPracticeShowResults: false,
      practiceOptions: options || prev.practiceOptions
    }));
  }, [toast]);
  
  // Handle completion of vocabulary practice
  const handleVocabPracticeComplete = useCallback((
    score: number, 
    total: number,
    modeStats?: ModeStats[]
  ) => {
    setVocabState((prev: VocabPracticeState) => ({
      ...prev,
      vocabPracticeShowResults: true,
      vocabPracticeScore: { score, total }
    }));
  }, []);
  
  // Reset vocabulary practice
  const resetVocabPractice = useCallback((preserveSelection: boolean = false) => {
    setVocabState((prev: VocabPracticeState) => ({
      ...prev,
      isVocabPracticeActive: false,
      vocabPracticeShowResults: false,
      vocabPracticeScore: { score: 0, total: 0 },
      // Only reset mode, words and day if preserveSelection is false
      ...(preserveSelection ? {} : {
        vocabPracticeMode: null,
        vocabPracticeWords: [],
        vocabPracticeDay: 1
      })
    }));
  }, []);
  
  // Get words for a specific day
  const getWordsForDay = useCallback((day: number, includePreviousDays: boolean = false): Word[] => {
    if (!vocabWords) return [];
    
    if (includePreviousDays) {
      return vocabWords.filter(word => word.day && word.day <= day);
    }
    
    return vocabWords.filter(word => word.day === day);
  }, [vocabWords]);
  
  // Get bookmarked words
  const getBookmarkedWords = useCallback((): Word[] => {
    return bookmarkedWords || [];
  }, [bookmarkedWords]);
  
  return {
    vocabState,
    vocabWords,
    bookmarkedWords,
    distinctVocabDays,
    vocabLoading,
    bookmarkedLoading,
    startVocabPractice,
    handleVocabPracticeComplete,
    resetVocabPractice,
    getWordsForDay,
    getBookmarkedWords
  };
}