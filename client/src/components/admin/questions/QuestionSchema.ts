import { z } from "zod";

// Form schema for questions
export const questionSchema = z.object({
  type: z.string().min(1, "Type is required"),
  subtype: z.string().min(1, "Subtype is required"),
  category: z.string().optional(), // Added category field
  topic: z.string().optional(), // Added topic field
  difficulty: z.number().int().min(1).max(5),
  content: z.any().optional(), // Rich text content
  options: z.array(z.any()).min(2, "At least 2 options are required"),
  answer: z.string().min(1, "Correct answer is required"),
  explanation: z.any().optional(), // Rich text explanation
  imageUrls: z.array(z.string()).optional(),
  latexFormulas: z.any().optional(),
  tags: z.string().optional(), // Added tags field for better categorization
  quantQuestionTypeId: z.number().optional(), // ID reference to quantitative question type
  verbalQuestionTypeId: z.number().optional(), // ID reference to verbal question type
});

export type QuestionFormValues = z.infer<typeof questionSchema>;

// Empty content for the rich text editor
export const emptyContent = [{ type: 'paragraph', children: [{ text: '' }] }];