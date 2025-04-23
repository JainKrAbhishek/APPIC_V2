/**
 * This file provides backward compatibility for imports as we restructure the codebase.
 * It re-exports components from their new locations so existing imports continue to work.
 */

// Re-export dashboard components from their new locations
export { default as ProgressCard } from '../../features/dashboard/components/ProgressCard';
export { default as ProgressChart } from '../../features/dashboard/components/ProgressChart';
export { default as ProgressTracker } from '../../features/dashboard/components/ProgressTracker';
export { default as RecentActivityCard } from '../../features/dashboard/components/RecentActivityCard';
export { default as SectionPerformanceCard } from '../../features/dashboard/components/SectionPerformanceCard';
export { default as TodaysChallengeCard } from '../../features/dashboard/components/TodaysChallengeCard';