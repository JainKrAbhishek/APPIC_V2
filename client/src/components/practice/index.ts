/**
 * Re-export practice components from features directory
 * This file maintains backward compatibility while consolidating components
 * 
 * NOTE: This is part of a code consolidation effort.
 * New components should be added to the features/practice/components directory
 * and imported from there directly. This re-export file will be deprecated
 * in a future update.
 */

// Import directly from features/practice/components
import { 
  PracticeCard,
  PracticeExitDialog,
  PracticeHeader,
  PracticeQuestion,
  PracticeResults,
  PracticeReviewDialog,
  PracticeSession,
  PracticeSectionCard
} from '../../features/practice/components';

// Re-export the components
export {
  PracticeCard,
  PracticeExitDialog,
  PracticeHeader,
  PracticeQuestion,
  PracticeResults,
  PracticeReviewDialog,
  PracticeSession,
  PracticeSectionCard
};