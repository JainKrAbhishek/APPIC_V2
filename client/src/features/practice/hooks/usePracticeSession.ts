import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { AnswerState, PracticeSessionState, PracticeSet } from '../types';
import { Question } from '@shared/schema';

export default function usePracticeSession() {
  const [location, setLocation] = useLocation();
  const questionContainerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Basic state with proper typing
  const [state, setState] = useState<PracticeSessionState>({
    isPracticeActive: false,
    activeTab: 'all',
    selectedSet: null,
    currentQuestionIndex: 0,
    userAnswers: {},
    score: 0,
    timeSpent: 0,
    showResults: false,
    reviewMode: false,
    currentSection: 1,
    totalSections: 1
  });
  
  // Fetch practice sets
  const { data: practiceSets = [], isLoading: setsLoading } = useQuery<PracticeSet[]>({ 
    queryKey: ['/api/practice-sets'],
    enabled: true
  });
  
  // Fetch all questions 
  const { data: allQuestions = [] } = useQuery<Question[]>({
    queryKey: ['/api/questions'],
    enabled: true
  });
  
  // Filter questions based on selected practice set
  const questions = (() => {
    if (!state.selectedSet) return [];
    
    // Log practice set details for debugging
    console.log('Selected practice set:', state.selectedSet.title, 
                'Type:', state.selectedSet.type, 
                'Category Filter:', state.selectedSet.categoryFilter || '',
                'Subtype Filter:', state.selectedSet.subtypeFilter || '',
                'Topic Filter:', state.selectedSet.topicFilter || '');
    
    // Initialize filtered questions by type (base filter)
    let filteredQuestions = allQuestions.filter(q => q.type === state.selectedSet?.type);
    console.log(`Base filtered ${filteredQuestions.length} questions by type from ${allQuestions.length} total`);
    
    // Apply subtype filter if present
    if (state.selectedSet.subtypeFilter) {
      filteredQuestions = filteredQuestions.filter(q => q.subtype === state.selectedSet?.subtypeFilter);
      console.log(`After subtype filter: ${filteredQuestions.length} questions remaining`);
    }
    
    // Apply category filter if present
    if (state.selectedSet.categoryFilter) {
      filteredQuestions = filteredQuestions.filter(q => q.category === state.selectedSet?.categoryFilter);
      console.log(`After category filter: ${filteredQuestions.length} questions remaining`);
    }
    
    // Apply topic filter if present
    if (state.selectedSet.topicFilter) {
      filteredQuestions = filteredQuestions.filter(q => q.topic === state.selectedSet?.topicFilter);
      console.log(`After topic filter: ${filteredQuestions.length} questions remaining`);
    }
    
    // If we have specific question IDs in the practice set, use those
    if (state.selectedSet.questionIds && state.selectedSet.questionIds.length > 0) {
      // If questionIds exist, prioritize those over other filters
      // IMPORTANT: Ensure we only include questions that match the type of the practice set
      const questionsByIds = allQuestions.filter(q => 
        state.selectedSet?.questionIds.includes(q.id) && 
        q.type === state.selectedSet?.type // Only include questions that match the type
      );
      
      console.log(`Found ${questionsByIds.length} questions by specific IDs (filtered by type)`);
      
      // Return questions by IDs if any were found
      if (questionsByIds.length > 0) {
        return questionsByIds;
      } else {
        console.log('Warning: No matching questions found by IDs that match practice set type');
      }
    }
    
    return filteredQuestions;
  })();
  
  // Timer implementation - start timer when practice is active
  useEffect(() => {
    if (state.isPracticeActive && !state.showResults && !state.reviewMode) {
      // Clear any existing timers
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // Start a new timer
      timerRef.current = setInterval(() => {
        setState(prev => ({
          ...prev,
          timeSpent: prev.timeSpent + 1
        }));
      }, 1000);
    } else if (timerRef.current) {
      // Stop timer when practice is inactive or when showing results
      clearInterval(timerRef.current);
    }
    
    // Clean up on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [state.isPracticeActive, state.showResults, state.reviewMode]);
  
  // Practice session functions
  const handleTabChange = (tab: string) => {
    setState(prev => ({ ...prev, activeTab: tab }));
  };
  
  const startPractice = (set: PracticeSet) => {
    setState(prev => ({ 
      ...prev, 
      isPracticeActive: true,
      selectedSet: set,
      currentQuestionIndex: 0,
      userAnswers: {},
      timeSpent: 0, // Reset timer when starting new practice
      showResults: false,
      reviewMode: false
    }));
  };
  
  const handleAnswerChange = (questionId: number, value: string | string[]) => {
    setState(prev => {
      const currentAnswerState = prev.userAnswers[questionId] as AnswerState || { 
        value: '', 
        flagged: false,
        visited: true 
      };
      
      return {
        ...prev,
        userAnswers: {
          ...prev.userAnswers,
          [questionId]: {
            ...currentAnswerState,
            value,
            visited: true
          }
        }
      };
    });
  };
  
  const toggleFlagged = (questionId: number) => {
    setState(prev => {
      const currentAnswerState = prev.userAnswers[questionId] as AnswerState || { 
        value: '', 
        flagged: false,
        visited: true 
      };
      
      return {
        ...prev,
        userAnswers: {
          ...prev.userAnswers,
          [questionId]: {
            ...currentAnswerState,
            flagged: !currentAnswerState.flagged
          }
        }
      };
    });
  };
  
  const goToNextQuestion = () => {
    const nextIndex = Math.min(state.currentQuestionIndex + 1, questions.length - 1);
    
    setState(prev => ({
      ...prev,
      currentQuestionIndex: nextIndex,
      // Show results if we're at the end and not in review mode
      showResults: nextIndex === questions.length - 1 && !prev.reviewMode ? true : prev.showResults
    }));
    
    // Scroll to top of container
    if (questionContainerRef.current) {
      questionContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  const goToPreviousQuestion = () => {
    const prevIndex = Math.max(state.currentQuestionIndex - 1, 0);
    
    setState(prev => ({
      ...prev,
      currentQuestionIndex: prevIndex
    }));
    
    // Scroll to top of container
    if (questionContainerRef.current) {
      questionContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  const goToQuestion = (index: number) => {
    setState(prev => ({
      ...prev,
      currentQuestionIndex: index,
      reviewMode: true,
      showResults: false
    }));
  };
  
  const backToResults = () => {
    setState(prev => ({
      ...prev,
      showResults: true,
      reviewMode: false
    }));
  };
  
  const submitPractice = () => {
    // Calculate score
    const score = calculateScore(questions, state.userAnswers);
    
    setState(prev => ({
      ...prev,
      score,
      showResults: true
    }));
  };
  
  const exitPractice = () => {
    setState(prev => ({
      ...prev,
      isPracticeActive: false,
      selectedSet: null,
      userAnswers: {},
      reviewMode: false
    }));
  };
  
  const resetPractice = () => {
    setState(prev => ({
      ...prev,
      currentQuestionIndex: 0,
      userAnswers: {},
      score: 0,
      showResults: false,
      reviewMode: false
    }));
  };
  
  // Enhanced score calculation with proper typing
  const calculateScore = (questions: Question[], userAnswers: Record<number, AnswerState>): number => {
    if (!questions.length) return 0;
    
    let correct = 0;
    
    questions.forEach(question => {
      if (!userAnswers[question.id]) return;
      
      const userAnswer = userAnswers[question.id].value;
      const correctAnswer = question.answer;
      
      // Handle different question types
      if (Array.isArray(userAnswer) && Array.isArray(correctAnswer)) {
        // For multiple select questions, check if arrays match
        if (userAnswer.length === correctAnswer.length && 
            userAnswer.every(ans => correctAnswer.includes(ans))) {
          correct++;
        }
      } else if (Array.isArray(userAnswer) && typeof correctAnswer === 'string') {
        // For single select questions with multi-answer UI
        if (userAnswer.length === 1 && userAnswer[0] === correctAnswer) {
          correct++;
        }
      } else if (typeof userAnswer === 'string' && typeof correctAnswer === 'string') {
        // For text input or single select questions
        if (userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()) {
          correct++;
        }
      }
    });
    
    return Math.round((correct / questions.length) * 100);
  };
  
  return {
    state,
    questionContainerRef,
    practiceSets,
    questions,
    setsLoading,
    reviewingFromResults: state.reviewMode,
    handleTabChange,
    startPractice,
    handleAnswerChange,
    toggleFlagged,
    goToNextQuestion,
    goToPreviousQuestion,
    goToQuestion,
    backToResults,
    submitPractice,
    exitPractice,
    resetPractice
  };
}