/**
 * Common type definitions for vocabulary practice components
 */
import { Word } from '@shared/schema';

/**
 * Definition interface for vocab words
 */
export interface Definition {
  part_of_speech: string;
  definition: string;
  sentence?: string;
  synonyms?: string[];
}

/**
 * Interface for vocabulary words in the client application
 */
export interface VocabWord {
  key: number | string;
  id?: number;
  word: string;
  group: number;
  day?: number;
  definitions: Definition[];
}

/**
 * Defines the different modes available for vocabulary practice
 */
export type PracticeMode = 'synonym-matching' | 'definition-matching' | 'fill-blanks' | 'spelling';

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

/**
 * Interface for tracking question history during practice
 */
export interface QuestionHistory {
  wordId: number;
  word: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  definition: string;
  synonyms?: string[] | string;
  mode?: PracticeMode; // Track which mode was used for this question
}