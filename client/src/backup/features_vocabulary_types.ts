import { PracticeMode } from '@/components/vocabulary/types';
import { Word } from '@shared/schema';

/**
 * Statistics for each practice mode
 * Used to show performance in the results screen
 */
export interface ModeStats {
  mode: PracticeMode;
  correct: number;
  total: number;
  percentage: number;
}

/**
 * Options for vocabulary practice sessions
 */
export interface VocabPracticeOptions {
  questionsPerSession?: number;
  showHints?: boolean;
  useBookmarked?: boolean;
  selectedDays?: number[];
  mixedPractice?: boolean;
}

/**
 * State for vocabulary practice
 */
export interface VocabPracticeState {
  isVocabPracticeActive: boolean;
  vocabPracticeMode: PracticeMode | PracticeMode[] | null;
  vocabPracticeWords: Word[];
  vocabPracticeDay: number;
  vocabPracticeShowResults: boolean;
  vocabPracticeScore: {
    score: number;
    total: number;
  };
  practiceOptions: VocabPracticeOptions;
}