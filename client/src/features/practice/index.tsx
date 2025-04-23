import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { User } from '@shared/schema';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';

// Components
import PracticeSession from './components/PracticeSession';
import PracticeResults from './components/PracticeResults';
import TopicDifficultyView from './components/TopicDifficultyView';
import QuantitativePracticeView from './components/QuantitativePracticeView';
import VerbalPracticeView from './components/VerbalPracticeView';
import { VocabPracticePage } from '@/components/vocabulary';

// Hooks 
import usePracticeSession from './hooks/usePracticeSession';
import usePracticeTools from './hooks/usePracticeTools';

// Types
import { PracticeSet } from './types';

// Icons
import { 
  GraduationCap, 
  BookText, 
  Calculator, 
  Brain, 
  BarChart4, 
  Trophy, 
  Sparkles,
  FileText,
  BookMarked
} from 'lucide-react';

interface PracticeProps {
  userData?: User;
  showVocabPractice?: boolean;
}

/**
 * Main Practice component that handles different practice sections
 */
const Practice: React.FC<PracticeProps> = ({ userData, showVocabPractice: initialShowVocabPractice }) => {
  // Get practice session state and functions
  const {
    state,
    questionContainerRef,
    practiceSets,
    questions,
    setsLoading,
    handleTabChange,
    startPractice,
    handleAnswerChange,
    toggleFlagged,
    goToNextQuestion,
    goToPreviousQuestion,
    goToQuestion,
    resetPractice,
    exitPractice
  } = usePracticeSession();
  
  // Get practice tools state and functions
  const {
    toolsState,
    toggleTimer,
    toggleCalculator,
    toggleShowCorrectAnswer,
    togglePomodoro
  } = usePracticeTools();
  
  // Additional UI state
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [confirmExitDialogOpen, setConfirmExitDialogOpen] = useState(false);
  const [myAnswerTab, setMyAnswerTab] = useState(true);
  const [, setLocation] = useLocation();
  
  // Practice categories with enhanced styling and details
  const practiceCategories = [
    {
      id: 'quantitative',
      title: 'Quantitative Practice',
      description: 'Perfect your quantitative skills through targeted practice sets covering arithmetic, algebra, geometry, and data analysis.',
      icon: <Calculator className="h-6 w-6 text-blue-500" />,
      bgIcon: <Brain className="absolute right-6 bottom-6 w-24 h-24 text-blue-100/30 -z-10" />,
      gradient: 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40',
      border: 'border-blue-100 dark:border-blue-900/50',
      shadow: 'shadow-blue-200/30 dark:shadow-blue-900/20',
      buttonGradient: 'bg-gradient-to-r from-blue-500 to-indigo-500',
      textColor: 'text-blue-700 dark:text-blue-400',
      highlightColor: 'text-blue-600 dark:text-blue-300',
      type: 'quantitative',
      topics: practiceSets?.filter(set => set.type === 'quantitative').length || 0,
      progress: userData?.practiceCompleted ? Math.min(Math.floor(userData.practiceCompleted / 2), 100) : 0,
      badge: 'Popular',
    },
    {
      id: 'vocabulary',
      title: 'Vocabulary Practice',
      description: 'Build your vocabulary with flashcards, synonyms, antonyms, and multiple-choice exercises that improve word retention.',
      icon: <BookMarked className="h-6 w-6 text-amber-500" />,
      bgIcon: <Trophy className="absolute right-6 bottom-6 w-24 h-24 text-amber-100/30 -z-10" />,
      gradient: 'bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/40 dark:to-yellow-950/40',
      border: 'border-amber-100 dark:border-amber-900/50',
      shadow: 'shadow-amber-200/30 dark:shadow-amber-900/20',
      buttonGradient: 'bg-gradient-to-r from-amber-500 to-yellow-500',
      textColor: 'text-amber-700 dark:text-amber-400',
      highlightColor: 'text-amber-600 dark:text-amber-300',
      type: 'vocabulary',
      topics: 30, // Approximate number of vocabulary days/sets
      progress: userData?.wordsLearned ? Math.min(Math.floor(userData.wordsLearned / 5), 100) : 0,
      badge: 'Essential',
      path: '/vocabulary-practice' // Direct route to vocabulary practice
    },
    {
      id: 'verbal',
      title: 'Verbal Practice',
      description: 'Strengthen your verbal reasoning with practice sets focused on reading comprehension, text completion, and sentence equivalence.',
      icon: <BookText className="h-6 w-6 text-emerald-500" />,
      bgIcon: <BarChart4 className="absolute right-6 bottom-6 w-24 h-24 text-emerald-100/30 -z-10" />,
      gradient: 'bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/40 dark:to-green-950/40',
      border: 'border-emerald-100 dark:border-emerald-900/50',
      shadow: 'shadow-emerald-200/30 dark:shadow-emerald-900/20',
      buttonGradient: 'bg-gradient-to-r from-emerald-500 to-green-500',
      textColor: 'text-emerald-700 dark:text-emerald-400',
      highlightColor: 'text-emerald-600 dark:text-emerald-300',
      type: 'verbal',
      topics: practiceSets?.filter(set => set.type === 'verbal').length || 0,
      progress: userData?.practiceCompleted ? Math.min(Math.floor(userData.practiceCompleted / 3), 100) : 0,
      badge: 'Essential',
    },
    {
      id: 'essay',
      title: 'Essay Writing Practice',
      description: 'Develop and refine your analytical writing skills with practice prompts, structured feedback, and guided essay development.',
      icon: <FileText className="h-6 w-6 text-purple-500" />,
      bgIcon: <Sparkles className="absolute right-6 bottom-6 w-24 h-24 text-purple-100/30 -z-10" />,
      gradient: 'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/40 dark:to-pink-950/40',
      border: 'border-purple-100 dark:border-purple-900/50',
      shadow: 'shadow-purple-200/30 dark:shadow-purple-900/20',
      buttonGradient: 'bg-gradient-to-r from-purple-500 to-pink-500',
      textColor: 'text-purple-700 dark:text-purple-400',
      highlightColor: 'text-purple-600 dark:text-purple-300',
      type: 'essay',
      topics: 12, // Fixed number of essay prompts
      progress: 15, // Fixed progress percentage
      badge: 'Advanced',
      path: '/essays/prompts' // Direct path to essay prompts
    }
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 90,
        damping: 12
      }
    }
  };

  const headerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  // State for topic selection
  const [showTopics, setShowTopics] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<any>(null); // For detailed topic view
  const [showVocabPractice, setShowVocabPractice] = useState(initialShowVocabPractice || false); // State to control vocabulary practice view
  
  // Fetch topic data when needed
  const { data: quantTopics = [] } = useQuery<any[]>({
    queryKey: ['/api/quant/topics'],
    enabled: showTopics && selectedType === 'quantitative'
  });

  const { data: verbalTopics = [] } = useQuery<any[]>({
    queryKey: ['/api/verbal/topics'],
    enabled: showTopics && selectedType === 'verbal'
  });

  // Memoize the topic icons to prevent re-renders
  const calculatorIcon = React.useMemo(() => <Calculator className="h-5 w-5 text-blue-600" />, []);
  const brainIcon = React.useMemo(() => <Brain className="h-5 w-5 text-indigo-600" />, []);
  
  /**
   * Function to handle starting practice when a user clicks on a practice set
   */
  const handleStartPracticeSet = (set: PracticeSet) => {
    // Set up the practice session with the selected set
    startPractice(set);
  };
  
  /**
   * Function to go back to categories from topic view
   */
  const handleBackToCategories = () => {
    setShowTopics(false);
    setSelectedType('');
    setSelectedTopic(null);
  };
  
  /**
   * Function to go back to topics from topic detail view
   */
  const handleBackToTopics = () => {
    setSelectedTopic(null);
  };
  
  // Handle vocabulary practice via URL params or props
  useEffect(() => {
    // Check if there's a type parameter in the URL
    const params = new URLSearchParams(window.location.search);
    const practiceType = params.get('type');
    
    // If it's a vocabulary practice request via URL, show vocabulary practice page
    if (practiceType === 'vocabulary') {
      setShowVocabPractice(true);
    } else if (!initialShowVocabPractice) {
      // Only set to false if initialShowVocabPractice wasn't provided
      setShowVocabPractice(false);
    }
    // If initialShowVocabPractice is true, we keep the state as true
  }, [setLocation, initialShowVocabPractice]);
  
  // Define content based on view state, all hooks are called unconditionally
  let content;
  
  // Prepare levels for topic difficulty view
  const difficultyGroups = selectedTopic ? {
    easy: practiceSets?.filter(set => 
      set.type === selectedType && 
      (set.relatedTopicId === selectedTopic.id || set.title.toLowerCase().includes(selectedTopic.name.toLowerCase())) && 
      set.difficulty === 1
    ) || [],
    medium: practiceSets?.filter(set => 
      set.type === selectedType && 
      (set.relatedTopicId === selectedTopic.id || set.title.toLowerCase().includes(selectedTopic.name.toLowerCase())) && 
      set.difficulty === 2
    ) || [],
    hard: practiceSets?.filter(set => 
      set.type === selectedType && 
      (set.relatedTopicId === selectedTopic.id || set.title.toLowerCase().includes(selectedTopic.name.toLowerCase())) && 
      (set.difficulty === 3 || set.difficulty === 4 || set.difficulty === 5)
    ) || []
  } : null;
  
  const levels = selectedTopic ? [
    {
      title: 'Beginner',
      description: 'Start with the basics, build your foundation',
      color: 'emerald',
      icon: '🌱',
      targetAccuracy: 90,
      availableSets: difficultyGroups?.easy || [],
      tests: [],
      avgAccuracy: 0
    },
    {
      title: 'Intermediate',
      description: 'Challenge yourself with moderate difficulty',
      color: 'blue',
      icon: '📈',
      targetAccuracy: 75,
      availableSets: difficultyGroups?.medium || [],
      tests: [],
      avgAccuracy: 0
    },
    {
      title: 'Advanced',
      description: 'Master complex problems and advanced techniques',
      color: 'amber',
      icon: '🔥',
      targetAccuracy: 60,
      availableSets: difficultyGroups?.hard || [],
      tests: [],
      avgAccuracy: 0
    }
  ] : [];

  // Conditional content rendering
  if (state.isActive) {
    content = (
      <PracticeSession
        questions={questions}
        selectedSet={state.currentSet}
        currentQuestionIndex={state.currentQuestionIndex}
        userAnswers={state.userAnswers}
        timeSpent={state.timeSpent}
        reviewMode={state.reviewMode}
        showResults={state.showResults}
        currentSection={state.currentSection}
        totalSections={state.totalSections}
        showTimer={toolsState.showTimer}
        calculatorOpen={toolsState.calculatorOpen}
        showCorrectAnswer={toolsState.showCorrectAnswer}
        pomodoroOpen={toolsState.pomodoroOpen}
        showNavigator={state.showNavigator}
        navigatorCollapsed={state.navigatorCollapsed}
        reviewDialogOpen={reviewDialogOpen}
        confirmExitDialogOpen={confirmExitDialogOpen}
        myAnswerTab={myAnswerTab}
        onAnswerChange={handleAnswerChange}
        onToggleFlag={toggleFlagged}
        onNextQuestion={goToNextQuestion}
        onPreviousQuestion={goToPreviousQuestion}
        onToggleMyAnswerTab={setMyAnswerTab}
        onToggleTimer={toggleTimer}
        onToggleCalculator={toggleCalculator}
        onToggleCorrectAnswer={toggleShowCorrectAnswer}
        onToggleNavigator={() => {/* Implementation as needed */}}
        onTogglePomodoro={togglePomodoro}
        onReviewDialogOpenChange={(open) => setReviewDialogOpen(open)}
        onConfirmExitDialogOpenChange={(open) => setConfirmExitDialogOpen(open)}
        onSelectQuestion={goToQuestion}
        onExitPractice={exitPractice}
        onConfirmExit={exitPractice}
        questionContainerRef={questionContainerRef}
      />
    );
  } 
  else if (state.isCompleted) {
    content = (
      <PracticeResults
        score={state.score}
        totalQuestions={state.totalQuestions}
        timeSpent={state.timeSpent}
        onReviewAnswers={() => {/* Implementation as needed */}}
        onRestart={resetPractice}
        onExit={exitPractice}
        practiceName={state.currentSet?.title || "Practice"}
        practiceType={state.currentSet?.type || "general"}
      />
    );
  } 
  else if (showVocabPractice) {
    content = (
      <DashboardLayout title="Vocabulary Practice">
        <VocabPracticePage 
          onBackToPractice={() => {
            setShowVocabPractice(false);
            // Clear the type parameter from URL
            const url = new URL(window.location.href);
            url.searchParams.delete('type');
            window.history.replaceState({}, '', url);
          }} 
        />
      </DashboardLayout>
    );
  } 
  else if (showTopics && selectedTopic) {
    content = (
      <div className="container mx-auto max-w-6xl pb-16">
        <div className="flex items-center mb-6">
          <button 
            onClick={handleBackToTopics}
            className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Back to Topics</span>
          </button>
        </div>
        
        <TopicDifficultyView
          topicId={selectedTopic.id}
          topicName={selectedTopic.name}
          topicDescription={selectedTopic.description}
          levels={levels}
          onStartTest={(setId) => {
            const practiceSet = practiceSets?.find(set => set.id === setId);
            if (practiceSet) {
              handleStartPracticeSet(practiceSet);
            }
          }}
          icon={selectedTopic.icon}
        />
      </div>
    );
  } 
  else if (showTopics && selectedType === 'quantitative') {
    content = (
      <QuantitativePracticeView
        practiceSets={practiceSets}
        quantTopics={quantTopics}
        onStartPracticeSet={handleStartPracticeSet}
        onBackToCategories={handleBackToCategories}
      />
    );
  } 
  else if (showTopics && selectedType === 'verbal') {
    content = (
      <VerbalPracticeView
        practiceSets={practiceSets}
        verbalTopics={verbalTopics}
        onStartPracticeSet={handleStartPracticeSet}
        onBackToCategories={handleBackToCategories}
      />
    );
  } 
  else {
    // Default view: show practice categories
    content = (
      <DashboardLayout title="Practice">
        <div className="container max-w-6xl mx-auto px-4 py-8">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={headerVariants}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-2 flex items-center">
              <GraduationCap className="mr-2 h-8 w-8 text-primary" />
              GRE Practice
            </h1>
            <p className="text-gray-600 dark:text-gray-400 max-w-3xl">
              Strengthen your skills with targeted practice tailored to your needs. 
              Choose from different practice types below to start improving your score today.
            </p>
          </motion.div>
          
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {practiceCategories.map(category => (
              <motion.div
                key={category.id}
                variants={itemVariants}
                className={`relative overflow-hidden rounded-xl ${category.gradient} ${category.border} p-6 shadow-lg ${category.shadow} transition-all duration-300 hover:shadow-xl hover:scale-[1.02] group`}
              >
                <div className="flex flex-col h-full relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`rounded-full p-2.5 ${category.textColor} bg-white/80 dark:bg-gray-800/80`}>
                      {category.icon}
                    </div>
                    
                    {category.badge && (
                      <span className={`px-2.5 py-0.5 rounded-full text-sm font-medium ${category.textColor} bg-white/80 dark:bg-gray-800/80`}>
                        {category.badge}
                      </span>
                    )}
                  </div>
                  
                  <h2 className={`text-xl font-bold ${category.highlightColor} mb-2`}>
                    {category.title}
                  </h2>
                  
                  <p className="text-gray-600 dark:text-gray-300 mb-4 flex-grow">
                    {category.description}
                  </p>
                  
                  {category.progress !== undefined && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className={`font-medium ${category.textColor}`}>Your progress</span>
                        <span className={`${category.textColor}`}>{category.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full ${category.buttonGradient}`}
                          style={{ width: `${category.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {category.topics} {category.type === 'vocabulary' ? 'words' : 'sets'} available
                    </span>
                    
                    {category.path ? (
                      <Link to={category.path} className={`px-4 py-2 rounded-lg font-medium text-white ${category.buttonGradient} transition-all`}>
                        Start
                      </Link>
                    ) : (
                      <button
                        onClick={() => {
                          setShowTopics(true);
                          setSelectedType(category.type);
                        }}
                        className={`px-4 py-2 rounded-lg font-medium text-white ${category.buttonGradient} transition-all`}
                      >
                        Explore
                      </button>
                    )}
                  </div>
                </div>
                
                {category.bgIcon && (
                  <div className="absolute right-2 bottom-2 opacity-20 transform transition-transform duration-500 group-hover:scale-110 group-hover:rotate-[-5deg]">
                    {category.bgIcon}
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  // Return the content that was selected
  return content;
};

export default Practice;