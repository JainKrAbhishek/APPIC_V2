/**
 * Types for the practice module
 */

export interface PracticeSet {
  id: number;
  type: string;
  title: string;
  description: string;
  difficulty?: number | null;
  tags?: string | null;
  questionIds: number[];
  timeLimit?: number | null;
  isPublished?: boolean | null;
  relatedTopicId?: number | null;
  relatedTopicType?: string | null;
  categoryFilter?: string | null;
  topicFilter?: string | null;
  passingScore?: number;
  showInTopic?: boolean | null;
  // Optional properties added when grouping by topic
  _topicName?: string;
  _topicCategory?: string;
  isCompleted?: boolean;
}

export interface PracticeProgress {
  practiceSetId: number;
  bestScore: number;
  lastAttempt?: Date | string;
  attemptCount: number;
  isComplete: boolean;
}