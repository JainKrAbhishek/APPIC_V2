/**
 * Compatibility layer for backward compatibility with existing imports
 * This file ensures that existing code continues to work with our new structure
 */

// Re-export everything from components for backward compatibility
export * from './components';

// Practice related exports
export { 
  PracticeCard,
  PracticeExitDialog,
  PracticeHeader,
  PracticeQuestion,
  PracticeReviewDialog,
  PracticeSectionCard
} from '@/features/practice/components';

// Progress related exports
export {
  ProgressCard,
  ProgressChart,
  ProgressTracker
} from '@/features/progress/components';

// Tools related exports
export {
  GRECalculator,
  PomodoroTimer,
  QuestionNavigatorSidebar,
  QuestionBookmarkButton
} from '@/features/practice/components';

// Navigation related exports
export {
  ContentViewer,
  TopicList,
  KnowledgeMap,
  CategorySelector
} from '@/features/navigation/components';

// Effects related exports
export { 
  TopEnhancedLight, 
  EnhancedMonitorLightBar,
  MonitorLightBar,
  TopMonitorLight,
  BottomMonitorLight,
  Marquee
} from './components/effects';

// These exports would be necessary when we implement the corresponding directories
// export * from './core/hooks';
// export * from './core/utils';
// export * from './core/api';
// export * from './core/ui';

// Feature-specific re-exports
// export * from './features/vocabulary';
// export * from './features/verbal';
// export * from './features/quantitative';
// export * from './features/practice';
// export * from './features/dashboard';