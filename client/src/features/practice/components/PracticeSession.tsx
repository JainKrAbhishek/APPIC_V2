import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PracticeHeader from './PracticeHeader';
import PracticeQuestion from './PracticeQuestion';
import PracticeReviewDialog from './PracticeReviewDialog';
import PracticeExitDialog from './PracticeExitDialog';
import GRECalculator from '@/components/tools/GRECalculator';
import QuestionBookmarkButton from '@/components/tools/QuestionBookmarkButton';
import PomodoroTimer from '@/components/tools/PomodoroTimer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Flag, 
  Eye, 
  BookOpen, 
  Calculator, 
  Book,
  ArrowRight,
  ArrowLeft,
  LightbulbIcon,
  PenLine,
  AlertCircle,
  Clock,
  CheckCircle,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatQuestionContent } from '../practice-utils';
import { PracticeSet, Question } from '@shared/schema';
import { AnswerState } from '../types';

interface PracticeSessionProps {
  questions: Question[] | undefined;
  selectedSet: PracticeSet | null;
  currentQuestionIndex: number;
  userAnswers: Record<number, AnswerState>;
  timeSpent: number;
  reviewMode: boolean;
  showResults: boolean;
  reviewDialogOpen: boolean;
  confirmExitDialogOpen: boolean;
  myAnswerTab: boolean;
  currentSection: number;
  totalSections: number;
  showTimer: boolean;
  calculatorOpen: boolean;
  showCorrectAnswer: boolean;
  showNavigator: boolean;
  navigatorCollapsed: boolean;
  pomodoroOpen: boolean;
  onReviewDialogOpenChange: (open: boolean) => void;
  onConfirmExitDialogOpenChange: (open: boolean) => void;
  onAnswerChange: (questionId: number, value: string | string[]) => void;
  onToggleFlag: (questionId: number) => void;
  onNextQuestion: () => void;
  onPreviousQuestion: () => void;
  onExitPractice: () => void;
  onConfirmExit: () => void;
  onToggleMyAnswerTab: (value: boolean) => void;
  onToggleTimer: () => void;
  onToggleCalculator: () => void;
  onToggleCorrectAnswer: () => void;
  onToggleNavigator: () => void;
  onTogglePomodoro: () => void;
  onSelectQuestion: (index: number) => void;
  questionContainerRef: React.RefObject<HTMLDivElement>;
}

// Helper components for a cleaner organization
const TypeIndicator = ({ type }: { type: string }) => {
  const config = {
    verbal: {
      icon: <BookOpen className="h-4 w-4 mr-1.5" />,
      text: "Verbal",
      bgClass: "bg-blue-50 dark:bg-blue-900/30",
      textClass: "text-blue-700 dark:text-blue-400"
    },
    quantitative: {
      icon: <Calculator className="h-4 w-4 mr-1.5" />,
      text: "Quantitative",
      bgClass: "bg-purple-50 dark:bg-purple-900/30",
      textClass: "text-purple-700 dark:text-purple-400"
    },
    vocabulary: {
      icon: <Book className="h-4 w-4 mr-1.5" />,
      text: "Vocabulary",
      bgClass: "bg-green-50 dark:bg-green-900/30",
      textClass: "text-green-700 dark:text-green-400"
    },
    default: {
      icon: <BookOpen className="h-4 w-4 mr-1.5" />,
      text: "Question",
      bgClass: "bg-gray-50 dark:bg-gray-800/30",
      textClass: "text-gray-700 dark:text-gray-400"
    }
  };

  const typeConfig = config[type as keyof typeof config] || config.default;

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "py-1 px-2.5 h-7 flex items-center border-0 gap-0.5",
        typeConfig.bgClass,
        typeConfig.textClass
      )}
    >
      {typeConfig.icon}
      <span>{typeConfig.text}</span>
    </Badge>
  );
};

/**
 * Component for the active practice session
 */
const PracticeSession: React.FC<PracticeSessionProps> = ({
  questions,
  selectedSet,
  currentQuestionIndex,
  userAnswers,
  timeSpent,
  reviewMode,
  showResults,
  reviewDialogOpen,
  confirmExitDialogOpen,
  myAnswerTab,
  currentSection,
  totalSections,
  showTimer,
  calculatorOpen,
  showCorrectAnswer,
  showNavigator,
  navigatorCollapsed,
  pomodoroOpen,
  onReviewDialogOpenChange,
  onConfirmExitDialogOpenChange,
  onAnswerChange,
  onToggleFlag,
  onNextQuestion,
  onPreviousQuestion,
  onExitPractice,
  onConfirmExit,
  onToggleMyAnswerTab,
  onToggleTimer,
  onToggleCalculator,
  onToggleCorrectAnswer,
  onToggleNavigator,
  onTogglePomodoro,
  onSelectQuestion,
  questionContainerRef
}) => {
  // Animation state for when question changes
  const [animation, setAnimation] = useState({
    entering: false,
    direction: 'next'
  });

  // Track last question index to determine animation direction
  const [lastQuestionIndex, setLastQuestionIndex] = useState(currentQuestionIndex);

  // Trigger animation when question changes
  useEffect(() => {
    if (currentQuestionIndex !== lastQuestionIndex) {
      const direction = currentQuestionIndex > lastQuestionIndex ? 'next' : 'prev';
      setAnimation({ entering: true, direction });
      
      const timer = setTimeout(() => {
        setAnimation({ entering: false, direction });
        setLastQuestionIndex(currentQuestionIndex);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [currentQuestionIndex, lastQuestionIndex]);

  if (!questions || questions.length === 0) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="bg-white dark:bg-gray-800 shadow-xl rounded-xl p-8 max-w-md text-center border border-gray-100 dark:border-gray-700"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/40 dark:to-amber-900/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
            <AlertCircle className="h-10 w-10 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="text-xl font-semibold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-amber-500 dark:from-amber-400 dark:to-amber-300">No Questions Found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            There are no questions added to this practice set yet, or an error occurred. Please select a different practice set.
          </p>
          <Button 
            variant="default" 
            onClick={onExitPractice}
            className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white shadow-md"
          >
            Return
          </Button>
        </motion.div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isPrevDisabled = currentQuestionIndex === 0;
  const isNextDisabled = currentQuestionIndex === questions.length - 1 && reviewMode;

  // Function to determine tab config based on the active tab
  const getTabConfig = (type: string) => {
    switch (type) {
      case 'verbal':
        return {
          mainColor: 'from-blue-600 to-blue-700',
          lightBg: 'bg-blue-50',
          darkBg: 'dark:bg-blue-950',
          accent: 'bg-blue-500',
          lightText: 'text-blue-700',
          darkText: 'dark:text-blue-400',
          hoverBg: 'hover:bg-blue-600/10',
          icon: <BookOpen className="h-5 w-5" />
        };
      case 'quantitative':
        return {
          mainColor: 'from-purple-600 to-purple-700',
          lightBg: 'bg-purple-50',
          darkBg: 'dark:bg-purple-950',
          accent: 'bg-purple-500',
          lightText: 'text-purple-700',
          darkText: 'dark:text-purple-400',
          hoverBg: 'hover:bg-purple-600/10',
          icon: <Calculator className="h-5 w-5" />
        };
      case 'vocabulary':
        return {
          mainColor: 'from-green-600 to-green-700',
          lightBg: 'bg-green-50',
          darkBg: 'dark:bg-green-950',
          accent: 'bg-green-500',
          lightText: 'text-green-700',
          darkText: 'dark:text-green-400',
          hoverBg: 'hover:bg-green-600/10',
          icon: <Book className="h-5 w-5" />
        };
      default:
        return {
          mainColor: 'from-gray-600 to-gray-700',
          lightBg: 'bg-gray-50',
          darkBg: 'dark:bg-gray-950',
          accent: 'bg-gray-500',
          lightText: 'text-gray-700',
          darkText: 'dark:text-gray-400',
          hoverBg: 'hover:bg-gray-600/10',
          icon: <BookOpen className="h-5 w-5" />
        };
    }
  };

  const tabConfig = getTabConfig(currentQuestion?.type || 'verbal');

  // Handle answered status
  const isQuestionAnswered = userAnswers[currentQuestion?.id]?.value && userAnswers[currentQuestion?.id]?.value !== '';
  const isFlagged = userAnswers[currentQuestion?.id]?.flagged;

  return (
    <div className="flex flex-col w-full h-full overflow-hidden max-h-[calc(100vh-64px)]">
      {/* Main content area */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        {/* Practice header */}
        <PracticeHeader
          activeTab={currentQuestion?.type || 'verbal'}
          currentQuestionIndex={currentQuestionIndex}
          totalQuestions={questions.length}
          currentSection={currentSection}
          totalSections={totalSections}
          timeSpent={timeSpent}
          reviewMode={reviewMode}
          myAnswerTab={myAnswerTab}
          setMyAnswerTab={onToggleMyAnswerTab}
          onPreviousClick={onPreviousQuestion}
          onNextClick={onNextQuestion}
          onExitClick={() => onConfirmExitDialogOpenChange(true)}
          onReviewClick={() => onReviewDialogOpenChange(true)}
          isPrevDisabled={isPrevDisabled}
          isNextDisabled={isNextDisabled}
          showTimer={showTimer}
          onToggleTimer={onToggleTimer}
          onOpenCalculator={onToggleCalculator}
          onToggleNavigator={onToggleNavigator}
          navigatorCollapsed={navigatorCollapsed}
          onTogglePomodoro={onTogglePomodoro}
        />

        {/* Question container with scroll */}
        <div
          ref={questionContainerRef}
          className="flex-1 overflow-y-auto px-4 py-6 md:px-6 md:py-8 bg-gray-50 dark:bg-gray-900/50"
        >
          <div className="max-w-5xl mx-auto">
            {/* Question info banner */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
              <div className="flex items-center gap-3">
                <TypeIndicator type={currentQuestion?.type || 'verbal'} />
                
                {selectedSet && (
                  <Badge 
                    variant="outline" 
                    className="py-1 px-3 h-7 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                  >
                    {selectedSet.title}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {/* Note: Timer is already shown in the PracticeHeader, so we're only showing the question count here */}
                
                {/* Progress indicator */}
                <Badge variant="outline" className="h-7 py-1 px-3 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                  {currentQuestionIndex + 1} / {questions.length}
                </Badge>
              </div>
            </div>
            
            {/* Question card with animation */}
            <div 
              className={cn(
                "transition-all duration-300 transform",
                animation.entering && animation.direction === 'next' ? 'translate-x-[50px] opacity-0' : 
                animation.entering && animation.direction === 'prev' ? 'translate-x-[-50px] opacity-0' : 
                'translate-x-0 opacity-100'
              )}
            >
              <Card className="mb-6 shadow-xl relative overflow-hidden rounded-xl bg-white dark:bg-gray-950 border-0 ring-1 ring-gray-200/50 dark:ring-gray-800/50">
                {/* Top accent line */}
                <div className={cn(
                  "absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r", 
                  `from-${currentQuestion?.type === 'verbal' ? 'blue' : 
                     currentQuestion?.type === 'quantitative' ? 'purple' : 
                     currentQuestion?.type === 'vocabulary' ? 'green' : 'gray'}-500/50`,
                  `via-${currentQuestion?.type === 'verbal' ? 'blue' : 
                     currentQuestion?.type === 'quantitative' ? 'purple' : 
                     currentQuestion?.type === 'vocabulary' ? 'green' : 'gray'}-500`,
                  `to-${currentQuestion?.type === 'verbal' ? 'blue' : 
                     currentQuestion?.type === 'quantitative' ? 'purple' : 
                     currentQuestion?.type === 'vocabulary' ? 'green' : 'gray'}-500/50`
                )}></div>
                
                {/* Card header with question number and actions */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 md:p-6 border-b dark:border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-11 h-11 rounded-full shadow-md flex items-center justify-center text-white font-bold shrink-0",
                      `bg-gradient-to-br ${tabConfig.mainColor}`
                    )}>
                      {currentQuestionIndex + 1}
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        {selectedSet?.title || "Practice Question"}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {currentQuestion.subtype === 'multiple_answer' ? 'Multiple Correct Answers' : 
                         currentQuestion.subtype === 'numeric' ? 'Numeric Answer' : 
                        'Single Correct Answer'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    {isQuestionAnswered && (
                      <Badge 
                        className={cn(
                          "h-7 py-1 px-2.5",
                          reviewMode ? 
                            (userAnswers[currentQuestion?.id]?.value === currentQuestion?.answer ? 
                              "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400" : 
                              "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400") : 
                            "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400"
                        )}
                      >
                        {reviewMode ? 
                          (userAnswers[currentQuestion?.id]?.value === currentQuestion?.answer ? 
                            <><CheckCircle className="h-3.5 w-3.5 mr-1" /> Correct Answer</> : 
                            <><Info className="h-3.5 w-3.5 mr-1" /> Incorrect Answer</>) : 
                          <><PenLine className="h-3.5 w-3.5 mr-1" /> Answered</>}
                      </Badge>
                    )}
                    
                    <Button
                      variant={isFlagged ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "relative h-7 px-3 border-gray-200 transition-all duration-300 overflow-hidden",
                        isFlagged ? 
                          "bg-amber-500 text-white hover:bg-amber-600 shadow-sm" :
                          "hover:border-amber-300 hover:text-amber-600"
                      )}
                      onClick={() => onToggleFlag(currentQuestion?.id)}
                    >
                      <Flag className={cn(
                        "h-3.5 w-3.5 mr-1.5 transition-all",
                        isFlagged ? "text-white" : "text-amber-500"
                      )} />
                      {isFlagged ? "Flagged" : "Flag"}
                    </Button>
                    
                    <QuestionBookmarkButton
                      questionId={currentQuestion?.id}
                      size="sm"
                      className="h-7 px-2.5 bg-transparent"
                    />
                  </div>
                </div>
                
                {/* Question content section */}
                <div className="p-4 md:p-6 bg-white dark:bg-gray-950">
                  {/* We're removing the duplicate content display here since PracticeQuestion already displays it */}
                  
                  {/* Practice question component */}
                  <PracticeQuestion
                    content={currentQuestion?.content}
                    options={Array.isArray(currentQuestion?.options) ? currentQuestion.options : []}
                    type={
                      currentQuestion?.subtype === 'multiple_answer'
                        ? 'multiple'
                        : currentQuestion?.subtype === 'numeric'
                        ? 'numeric'
                        : 'single'
                    }
                    currentAnswer={userAnswers[currentQuestion?.id]?.value || ''}
                    onAnswerChange={(value) => onAnswerChange(currentQuestion?.id, value)}
                    isDisabled={reviewMode && !myAnswerTab}
                    correctAnswer={
                      reviewMode && !myAnswerTab
                        ? currentQuestion?.answer
                        : undefined
                    }
                    showCorrectAnswer={reviewMode && showCorrectAnswer}
                    explanation={currentQuestion?.explanation}
                    showExplanation={reviewMode}
                  />
                </div>
                
                {/* Question footer with helpful tools */}
                <div className="p-4 md:px-6 md:py-4 border-t dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40 flex flex-wrap justify-end items-center gap-3">
                  {/* We're removing the duplicate navigation buttons here, as they already exist in the PracticeHeader component */}
                  <div className="flex items-center gap-2">
                    
                    {reviewMode && currentQuestionIndex === questions.length - 1 && (
                      <Button 
                        variant="default"
                        size="sm" 
                        className="h-9 px-4 bg-primary hover:bg-primary/90 shadow-sm"
                        onClick={onExitPractice}
                      >
                        Finish Practice
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </div>

            {/* Explanation card (only shown in review mode) */}
            {reviewMode && (
              <div 
                className={cn(
                  "transition-all duration-300 transform delay-100",
                  animation.entering ? 'translate-y-[30px] opacity-0' : 'translate-y-0 opacity-100'
                )}
              >
                <Card className="mb-6 shadow-sm border-0 ring-1 ring-gray-200/50 dark:ring-gray-800/50 relative overflow-hidden group transition-all hover:shadow-md bg-white dark:bg-gray-950 rounded-xl"
                  style={{
                    borderLeft: `5px solid ${userAnswers[currentQuestion?.id]?.value === currentQuestion?.answer
                      ? 'var(--green-500)'
                      : 'var(--red-500)'}`
                  }}
                >
                  {/* Content */}
                  <div className="p-4 md:p-6">
                    <div className="flex items-start gap-4 mb-5">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shrink-0",
                        userAnswers[currentQuestion?.id]?.value === currentQuestion?.answer
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      )}>
                        {userAnswers[currentQuestion?.id]?.value === currentQuestion?.answer ? "✓" : "✗"}
                      </div>
                      <div>
                        <h3 className="text-lg font-medium mb-1 flex items-center">
                          {userAnswers[currentQuestion?.id]?.value === currentQuestion?.answer
                            ? "Correct Answer!"
                            : "Incorrect Answer"
                          }
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {userAnswers[currentQuestion?.id]?.value === currentQuestion?.answer
                            ? "Great job! You answered this question correctly."
                            : "Don't worry! Review the explanation to understand the correct approach."
                          }
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex mb-5 bg-gray-100 dark:bg-gray-800/50 rounded-lg p-1">
                      <Button
                        variant={myAnswerTab ? "default" : "ghost"}
                        size="sm"
                        className={cn(
                          "flex-1 rounded-md transition-all",
                          myAnswerTab ? "shadow-sm" : ""
                        )}
                        onClick={() => onToggleMyAnswerTab(true)}
                      >
                        My Answer
                      </Button>
                      <Button
                        variant={!myAnswerTab ? "default" : "ghost"}
                        size="sm"
                        className={cn(
                          "flex-1 rounded-md transition-all",
                          !myAnswerTab ? "shadow-sm" : ""
                        )}
                        onClick={() => onToggleMyAnswerTab(false)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Correct Answer
                      </Button>
                    </div>
                    
                    <div className="explanation-content">
                      <div className="flex items-center mb-3 border-b dark:border-gray-800 pb-2">
                        <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/30 mr-2">
                          <LightbulbIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h4 className="font-medium text-blue-700 dark:text-blue-400">Explanation</h4>
                      </div>
                      <div 
                        className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 text-sm leading-relaxed"
                        dangerouslySetInnerHTML={{ 
                          __html: formatQuestionContent(currentQuestion?.explanation || "No explanation is available for this question. Please refer to the relevant learning materials for more information.").replace(/\n/g, '<br />')
                        }} 
                      />
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Calculator floating UI */}
      {calculatorOpen && (
        <div className="fixed bottom-16 right-4 z-20">
          <GRECalculator isOpen={calculatorOpen} onClose={onToggleCalculator} />
        </div>
      )}

      {/* Pomodoro Timer floating UI */}
      {pomodoroOpen && (
        <div className="fixed bottom-16 right-4 md:right-20 z-20">
          <PomodoroTimer isOpen={pomodoroOpen} onOpenChange={() => onTogglePomodoro()} />
        </div>
      )}

      {/* Review dialog */}
      <PracticeReviewDialog
        open={reviewDialogOpen}
        onOpenChange={onReviewDialogOpenChange}
        questions={questions}
        currentIndex={currentQuestionIndex}
        userAnswers={userAnswers}
        reviewMode={reviewMode}
        onQuestionSelect={onSelectQuestion}
      />

      {/* Exit confirmation dialog */}
      <PracticeExitDialog
        open={confirmExitDialogOpen}
        onOpenChange={onConfirmExitDialogOpenChange}
        onConfirmExit={onConfirmExit}
      />
    </div>
  );
};

export default PracticeSession;