import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sparkles, BookMarked } from 'lucide-react';
import { 
  ModernVocabPracticeModeSelector, 
  VocabPracticeMode, 
  VocabPracticeResults,
  PracticeMode, 
  ModeStats, 
  VocabPracticeOptions 
} from '@/components/vocabulary';
import { Word } from '@shared/schema';
import { useVocabularyPractice } from './hooks';
import { motion } from 'framer-motion';

interface VocabPracticePageProps {
  onBackToPractice: () => void;
}

/**
 * Vocabulary Practice Page component
 * Handles vocabulary-specific practice functionality
 * Updated with modern UI and animations
 */
const VocabPracticePage: React.FC<VocabPracticePageProps> = ({ onBackToPractice }) => {
  const {
    vocabState,
    vocabWords,
    bookmarkedWords,
    distinctVocabDays,
    vocabLoading,
    startVocabPractice,
    handleVocabPracticeComplete,
    resetVocabPractice
  } = useVocabularyPractice();

  /**
   * Animation variants for page transitions
   */
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.2 } }
  };

  /**
   * Render the appropriate component based on the current state
   */
  const renderVocabularyPractice = () => {
    const {
      isVocabPracticeActive,
      vocabPracticeShowResults,
      vocabPracticeScore,
      vocabPracticeDay,
      vocabPracticeMode,
      vocabPracticeWords,
      practiceOptions
    } = vocabState;

    if (isVocabPracticeActive) {
      if (vocabPracticeShowResults) {
        return (
          <motion.div
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
          >
            <VocabPracticeResults
              score={vocabPracticeScore.score}
              total={vocabPracticeScore.total}
              day={vocabPracticeDay}
              mode={vocabPracticeMode!}
              onTryAgain={() => {
                resetVocabPractice(true);
              }}
              onBackToModes={() => resetVocabPractice()}
              useBookmarked={practiceOptions.useBookmarked}
              selectedDays={practiceOptions.selectedDays}
              mixedPractice={practiceOptions.mixedPractice}
            />
          </motion.div>
        );
      }
      
      return (
        <motion.div
          initial="initial"
          animate="animate"
          exit="exit"
          variants={pageVariants}
        >
          <VocabPracticeMode
            words={vocabPracticeWords}
            day={vocabPracticeDay}
            mode={vocabPracticeMode!}
            onComplete={handleVocabPracticeComplete}
            onBack={() => resetVocabPractice(true)}
            questionsPerSession={practiceOptions.questionsPerSession}
            showHints={practiceOptions.showHints}
            useBookmarked={practiceOptions.useBookmarked}
            selectedDays={practiceOptions.selectedDays}
            mixedPractice={practiceOptions.mixedPractice}
          />
        </motion.div>
      );
    }
    
    return (
      <motion.div 
        className="vocab-practice-mode-selection"
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
      >
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-[800px] h-[600px] bg-gradient-to-br from-green-400/5 via-green-300/5 to-green-400/5 rounded-full filter blur-[120px] -z-10 opacity-80 transform translate-x-1/3 -translate-y-1/3 animate-slow-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-green-300/5 via-green-400/5 to-green-500/5 rounded-full filter blur-[100px] -z-10 opacity-70 transform -translate-x-1/3 translate-y-1/3 animate-slow-drift"></div>
        
        {/* Enhanced breadcrumb/back navigation */}
        <div className="flex items-center mb-6 py-2">
          <div className="flex items-center py-2 text-sm bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border border-gray-100 dark:border-gray-800 rounded-lg px-4 shadow-sm overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-50/10 via-transparent to-green-50/10 dark:from-green-900/10 dark:to-green-900/10"></div>
            <div className="relative flex items-center">
              <Button
                variant="ghost"
                size="sm"
                className="px-0 text-primary/80 hover:text-primary transition-colors font-medium flex items-center gap-1 hover:bg-transparent"
                onClick={onBackToPractice}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Practice Center
              </Button>
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mx-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-gray-900 font-semibold dark:text-gray-100 flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>
                  Vocabulary Practice
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Page header with modern styling */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-green-600 to-green-700 dark:from-green-500 dark:to-green-400 bg-clip-text text-transparent flex items-center">
            <BookMarked className="mr-3 h-8 w-8 text-green-500" />
            Vocabulary Practice
          </h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-3xl pl-11">
            Test your vocabulary knowledge with various interactive practice modes.
            Select a practice mode and customize options to get started.
          </p>
        </div>
        
        <ModernVocabPracticeModeSelector
          words={vocabWords || []}
          bookmarkedWords={bookmarkedWords}
          days={distinctVocabDays}
          onSelectMode={(
            mode: PracticeMode | PracticeMode[],
            words: Word[],
            day: number,
            options?: VocabPracticeOptions
          ) => {
            startVocabPractice(mode, words, day, options);
          }}
          onBack={onBackToPractice}
        />
      </motion.div>
    );
  };

  return (
    <div className="vocabulary-practice-container relative">
      {renderVocabularyPractice()}
    </div>
  );
};

export default VocabPracticePage;