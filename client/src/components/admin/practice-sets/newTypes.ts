import { z } from "zod";

/**
 * Practice Set interface
 * Represents a set of practice questions grouped together
 */
export interface PracticeSet {
  id: number;
  type: string;
  title: string;
  description: string;
  difficulty: number;
  questionIds: number[];
  isPublished?: boolean;
  timeLimit?: number | null;
  tags?: string | null;
  createdAt?: string;
  updatedAt?: string;
  // Fields for filtering and organization
  categoryFilter?: string | null;
  subtypeFilter?: string | null;
  topicFilter?: string | null;
  searchFilter?: string | null;
  randomizeQuestions?: boolean;
  passingScore?: number | null;
  // Fields for relating to topics
  relatedTopicId?: number | null;
  relatedTopicType?: string | null;
  showInTopic?: boolean;
}

/**
 * Question interface
 * Represents a practice question that can be included in practice sets
 */
export interface Question {
  id: number;
  type: string;
  subtype: string;
  content: any;
  options: any[];
  correctAnswer: string | string[];
  explanation: string;
  difficulty: number;
  tags: string[];
  typeId?: number;
  category?: string | null;
  topic?: string | null;
  imageUrls?: string[] | null;
}

/**
 * Practice Set form validation schema
 */
export const practiceSetSchema = z.object({
  type: z.string(),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  difficulty: z.number().min(1).max(5),
  questionIds: z.array(z.number()).min(1, "Select at least one question"),
  isPublished: z.boolean().optional().default(true),
  timeLimit: z.number().nullable().optional(),
  tags: z.string().nullable().optional(),
  // Filter fields
  categoryFilter: z.string().nullable().optional().default("none"),
  subtypeFilter: z.string().nullable().optional().default("none"),
  topicFilter: z.string().nullable().optional().default("none"),
  searchFilter: z.string().nullable().optional().default(""),
  randomizeQuestions: z.boolean().optional().default(false),
  passingScore: z.number().nullable().optional().default(70),
  // Topic association fields
  relatedTopicId: z.number().nullable().optional(),
  relatedTopicType: z.string().nullable().optional(),
  showInTopic: z.boolean().optional().default(false),
});

/**
 * Form values type derived from the validation schema
 */
export type PracticeSetFormValues = z.infer<typeof practiceSetSchema>;

/**
 * Type for bulk action form values
 */
export interface BulkActionFormValues {
  type?: string;
  difficulty?: number;
  isPublished?: boolean;
}

/**
 * Options for practice set type selection
 */
export const typeOptions = [
  { value: "verbal", label: "Verbal" },
  { value: "vocabulary", label: "Vocabulary" },
  { value: "quantitative", label: "Quantitative" },
];

/**
 * Options for difficulty level selection
 */
export const difficultyOptions = [
  { value: "1", label: "⭐ Easy (Level 1)" },
  { value: "2", label: "⭐⭐ Moderate (Level 2)" },
  { value: "3", label: "⭐⭐⭐ Challenging (Level 3)" },
  { value: "4", label: "⭐⭐⭐⭐ Difficult (Level 4)" },
  { value: "5", label: "⭐⭐⭐⭐⭐ Very Difficult (Level 5)" },
];

/**
 * Options for category selection
 */
export const categoryOptions = [
  { value: "none", label: "No Category" },
  { value: "algebra", label: "Algebra" },
  { value: "arithmetic", label: "Arithmetic" },
  { value: "geometry", label: "Geometry" },
  { value: "data_analysis", label: "Data Analysis" },
  { value: "reading", label: "Reading" },
  { value: "critical_reasoning", label: "Critical Reasoning" },
  { value: "sentence_completion", label: "Sentence Completion" },
  { value: "text_completion", label: "Text Completion" },
];

/**
 * Options for question subtype selection by main type
 */
export const subtypeOptions: Record<string, Array<{value: string, label: string}>> = {
  quantitative: [
    { value: "multiple_choice", label: "Multiple Choice" },
    { value: "numeric", label: "Numeric Entry" },
    { value: "quantitative_comparison", label: "Quantitative Comparison" },
  ],
  verbal: [
    { value: "text_completion", label: "Text Completion" },
    { value: "reading_comprehension", label: "Reading Comprehension" },
    { value: "sentence_equivalence", label: "Sentence Equivalence" },
  ],
  vocabulary: [
    { value: "multiple_choice", label: "Multiple Choice" },
    { value: "matching", label: "Matching" },
    { value: "fill_in_blank", label: "Fill in the Blank" },
  ]
};

/**
 * Helper function to get type badge variant based on practice set type
 */
export const getTypeBadgeVariant = (type: string): "default" | "secondary" | "outline" => {
  switch (type) {
    case "verbal":
      return "default";
    case "vocabulary":
      return "secondary";
    case "quantitative":
      return "outline";
    default:
      return "outline";
  }
};

/**
 * Helper function to get type icon based on practice set type
 */
export const getTypeIcon = (type: string) => {
  switch (type) {
    case "verbal":
      return "📝";
    case "vocabulary":
      return "📚";
    case "quantitative":
      return "🔢";
    default:
      return "📋";
  }
};