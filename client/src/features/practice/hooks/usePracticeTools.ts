import { useState } from 'react';
import { PracticeTools } from '../types';

/**
 * Hook for managing practice session tool states
 * Keeps track of timer, calculator, correct answer display, navigator, and pomodoro timer
 */
export default function usePracticeTools(): {
  toolsState: Omit<PracticeTools, 'toggleTimer' | 'toggleCalculator' | 'toggleCorrectAnswer' | 'toggleNavigator' | 'toggleNavigatorCollapse' | 'togglePomodoro'>;
  toggleTimer: () => void;
  toggleCalculator: () => void;
  toggleShowCorrectAnswer: () => void;
  toggleNavigator: () => void;
  toggleNavigatorCollapse: () => void;
  togglePomodoro: () => void;
} {
  // State for various practice tools and settings
  const [showTimer, setShowTimer] = useState(true);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [showNavigator, setShowNavigator] = useState(false);
  const [navigatorCollapsed, setNavigatorCollapsed] = useState(true);
  const [pomodoroOpen, setPomodoroOpen] = useState(false);
  
  // Toggle functions for each tool
  const toggleTimer = () => setShowTimer(prev => !prev);
  const toggleCalculator = () => {
    // Close other tools first
    setShowCorrectAnswer(false);
    setPomodoroOpen(false);
    // Toggle calculator
    setCalculatorOpen(prev => !prev);
  };
  
  const toggleShowCorrectAnswer = () => {
    // Close other tools first
    setCalculatorOpen(false);
    setPomodoroOpen(false);
    // Toggle correct answer display
    setShowCorrectAnswer(prev => !prev);
  };
  
  const toggleNavigator = () => {
    setShowNavigator(prev => !prev);
  };
  
  const toggleNavigatorCollapse = () => {
    setNavigatorCollapsed(prev => !prev);
  };
  
  const togglePomodoro = () => {
    // Close other tools first
    setCalculatorOpen(false);
    setShowCorrectAnswer(false);
    // Toggle pomodoro timer
    setPomodoroOpen(prev => !prev);
  };
  
  return {
    toolsState: {
      showTimer,
      calculatorOpen,
      showCorrectAnswer,
      showNavigator,
      navigatorCollapsed,
      pomodoroOpen
    },
    toggleTimer,
    toggleCalculator,
    toggleShowCorrectAnswer,
    toggleNavigator,
    toggleNavigatorCollapse,
    togglePomodoro
  };
}