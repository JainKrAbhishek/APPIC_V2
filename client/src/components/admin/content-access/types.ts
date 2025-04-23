import { z } from "zod";

// Interface definitions
export interface ContentAccessControl {
  id: number;
  contentType: string;
  contentId: number;
  userType: string;
  isAccessible: boolean;
  dailyWordLimit?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Content {
  id: number;
  name?: string;
  title?: string;
  description?: string;
  type?: string;
  category?: string;
}

export interface VocabularyDay {
  day: number;
  wordCount: number;
}

// Constants
export const contentTypeOptions = [
  { value: "quant_topic", label: "Quantitative Topic" },
  { value: "verbal_topic", label: "Verbal Topic" },
  { value: "practice_set", label: "Practice Set" },
  { value: "question", label: "Question" },
  { value: "vocabulary_day", label: "Vocabulary Day" },
  { value: "vocabulary_word", label: "Vocabulary Word" },
];

export const userTypeOptions = [
  { value: "free", label: "Free User" },
  { value: "premium", label: "Premium User" },
  { value: "business", label: "Business User" },
  { value: "admin", label: "Admin" },
];

// Form schemas
export const accessRuleSchema = z.object({
  contentType: z.string(),
  contentId: z.coerce.number().positive(),
  userType: z.string(),
  isAccessible: z.boolean().default(true),
  dailyWordLimit: z.coerce.number().min(0).optional(),
});

export type AccessRuleFormValues = z.infer<typeof accessRuleSchema>;

export const bulkActionSchema = z.object({
  contentType: z.string(),
  userType: z.string(),
  isAccessible: z.boolean().default(true),
  contentIds: z.array(z.number()).optional(),
  dailyWordLimit: z.coerce.number().min(0).optional(),
});

export type BulkActionFormValues = z.infer<typeof bulkActionSchema>;

// Helper functions
export function getContentTitle(content: Content): string {
  if (content.title) return content.title;
  if (content.name) return content.name;
  return `ID: ${content.id}`;
}

export function getContentDescription(content: Content): string {
  if (!content.description) return '';
  return content.description.length > 100 
    ? content.description.substring(0, 100) + '...' 
    : content.description;
}