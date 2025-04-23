import { ReviewHistoryItem } from '@shared/schema';

/**
 * Spaced Repetition System (SRS) based on a modified version of the SuperMemo SM-2 algorithm.
 * This algorithm calculates optimal intervals between reviews based on how well
 * the user remembers each vocabulary word.
 */

/**
 * Calculate the next interval for a word review based on the SuperMemo SM-2 algorithm
 * @param quality Rating of how well the word was remembered (0-5)
 * @param repetitionLevel Current repetition level (starts at 0)
 * @param efFactor Current easiness factor (starts at 250 = 2.5)
 * @param previousInterval Previous interval in days (starts at 0)
 * @returns Object with new values for next review scheduling
 */
export function calculateNextReview(
  quality: number,
  repetitionLevel: number,
  efFactor: number,
  previousInterval: number = 0
) {
  // Calculate new EF (easiness factor)
  // The formula: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  // where q is the quality of response (0-5)
  let nextEfFactor = Math.max(
    130, // Minimum EF of 1.3
    Math.round(
      efFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)) * 100
    )
  );

  let nextRepetitionLevel;
  let nextInterval;

  // If the quality is < 3 (meaning the user didn't remember it well)
  // reset the repetition level and use a shorter interval
  if (quality < 3) {
    nextRepetitionLevel = 0;
    nextInterval = 1; // Review again in 1 day
  } else {
    // Increase repetition level
    nextRepetitionLevel = repetitionLevel + 1;

    // Calculate next interval based on repetition level
    if (nextRepetitionLevel === 1) {
      nextInterval = 1; // First successful review: 1 day
    } else if (nextRepetitionLevel === 2) {
      nextInterval = 3; // Second successful review: 3 days
    } else {
      // For subsequent reviews, use the formula:
      // interval = previous interval * easiness factor / 100
      nextInterval = Math.round(previousInterval * (nextEfFactor / 100));

      // Cap maximum interval at 365 days (~ 1 year)
      nextInterval = Math.min(nextInterval, 365);

      // Ensure a minimum progression
      if (nextInterval <= previousInterval) {
        nextInterval = previousInterval + 1;
      }
    }
  }

  // Calculate the next review date
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + nextInterval);

  return {
    nextRepetitionLevel,
    nextEfFactor,
    nextInterval,
    nextReviewDate
  };
}

/**
 * Create a new review history entry
 * @param quality Rating of how well the word was remembered (0-5)
 * @param interval Interval in days until next review
 * @param efFactor Easiness factor after this review
 * @returns Review history item object
 */
export function createReviewHistoryItem(
  quality: number,
  interval: number,
  efFactor: number
): ReviewHistoryItem {
  return {
    date: new Date().toISOString(),
    quality,
    interval,
    efFactor
  };
}

/**
 * Get words that are due for review based on their next review date
 * @param wordsWithProgress Array of word objects with progress data
 * @returns Array of words that should be reviewed
 */
export function getWordsForReview<T extends { nextReviewDate?: Date | string | null }>(
  wordsWithProgress: T[]
): T[] {
  const now = new Date();
  
  return wordsWithProgress.filter(word => {
    // If no next review date, consider it due
    if (!word.nextReviewDate) return true;
    
    // Convert string dates to Date objects if needed
    const reviewDate = typeof word.nextReviewDate === 'string' 
      ? new Date(word.nextReviewDate) 
      : word.nextReviewDate;
    
    // Check if the review date is today or earlier
    return reviewDate && reviewDate <= now;
  });
}

/**
 * Get estimated memory retention based on time elapsed since last review
 * @param daysSinceReview Number of days since the last review
 * @param initialRetention Initial retention rate (immediately after review)
 * @returns Estimated current retention percentage (0-100)
 */
export function estimateRetention(daysSinceReview: number, initialRetention: number = 100): number {
  // Using Ebbinghaus forgetting curve: R = e^(-t/S)
  // Where R is retention, t is time, and S is strength of memory
  // We'll use a simplified version

  // The decay factor determines how quickly retention drops
  // Higher values = slower decay
  const decayFactor = 5; // Adjust based on desired forgetting curve
  
  // Calculate retention using the exponential decay formula
  const retention = initialRetention * Math.exp(-daysSinceReview / decayFactor);
  
  // Return retention percentage (0-100)
  return Math.max(0, Math.min(100, Math.round(retention)));
}

/**
 * Get the optimal daily study limit based on user's capacity and available due items
 * @param userCapacity Maximum number of items a user can comfortably review per day
 * @param totalDueItems Total number of items due for review
 * @returns Recommended number of items to study
 */
export function getOptimalStudyLimit(userCapacity: number = 20, totalDueItems: number): number {
  // If there are fewer due items than capacity, study all of them
  if (totalDueItems <= userCapacity) {
    return totalDueItems;
  }
  
  // Otherwise, recommend a reasonable limit based on user capacity
  // We can adjust this with more sophisticated logic if needed
  return userCapacity;
}

/**
 * Calculate mastery level based on repetition level and average quality rating
 * @param repetitionLevel Current repetition level (0-n)
 * @param averageQuality Average quality rating from review history (0-5)
 * @returns Mastery percentage (0-100)
 */
export function calculateMasteryLevel(repetitionLevel: number, averageQuality: number): number {
  // Base mastery on repetition level (each level represents ~20% mastery)
  let baseMastery = Math.min(repetitionLevel * 20, 90);
  
  // Adjust based on average quality of answers
  const qualityFactor = Math.max(0, (averageQuality - 2.5) * 5);
  
  // Calculate final mastery percentage
  const mastery = Math.min(100, baseMastery + qualityFactor);
  
  return Math.round(mastery);
}

/**
 * Calculate the average quality rating from review history
 * @param reviewHistory Array of review history items
 * @returns Average quality rating (0-5)
 */
export function calculateAverageQuality(reviewHistory: ReviewHistoryItem[]): number {
  if (!reviewHistory || reviewHistory.length === 0) {
    return 0;
  }
  
  const sum = reviewHistory.reduce((acc, item) => acc + item.quality, 0);
  return sum / reviewHistory.length;
}