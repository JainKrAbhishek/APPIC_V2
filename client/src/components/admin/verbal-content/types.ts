import { z } from "zod";
import { type Descendant, type Element } from "slate";
import { CustomElement, CustomText } from "@/lib/rich-text-editor/types";

// Helper type for safer type casting
export type ExtendedDescendant = Descendant & {
  type?: string;
  children?: any[];
  text?: string;
  [key: string]: any;
};

// Verbal Topic Interface
export interface VerbalTopic {
  id: number;
  title: string;
  description: string;
  type: string;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

// Verbal Content Interface
export interface VerbalContent {
  id: number;
  topicId: number;
  title: string;
  content: any; // Rich text content
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

// Use Slate's Descendant type for our content
export type RichTextContent = Descendant[];
export type RichTextContentType = RichTextContent;

// Database content format
export interface DatabaseContent {
  type: 'content';
  blocks: Array<{
    id: string;
    type: string;
    data: {
      text: string;
    };
  }>;
}

// Validation schemas
export const verbalTopicSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  type: z.string(),
  order: z.number().int().positive(),
});

export const verbalContentSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  topicId: z.number().int().positive("Please select a topic"),
  order: z.number().int().positive(),
  content: z.any().refine(val => val !== null, "Content is required"),
});

// Form value types
export type VerbalTopicFormValues = z.infer<typeof verbalTopicSchema>;
export type VerbalContentFormValues = z.infer<typeof verbalContentSchema>;

// Type options
export const verbalTypeOptions = [
  { value: "reading", label: "Reading Comprehension" },
  { value: "sentence", label: "Sentence Completion" },
  { value: "critical", label: "Critical Reasoning" },
  { value: "text", label: "Text Completion" },
  { value: "arguments", label: "Arguments" },
];

// Initial values for Rich Text Editor
export const initialRichTextValue: RichTextContent = [
  { 
    type: "paragraph", 
    children: [{ text: "" }] 
  } as CustomElement
];

// Content templates for different verbal content types
export const contentTemplates: Record<string, RichTextContent> = {
  // Reading Comprehension template
  "reading": [
    {
      type: "heading-two",
      children: [{ text: "Passage Title" }]
    } as CustomElement,
    {
      type: "paragraph",
      children: [{ text: "Enter the reading passage text here. Reading comprehension passages are typically 400-600 words about academic topics from various fields." }]
    } as CustomElement,
    {
      type: "heading-three",
      children: [{ text: "Questions" }]
    } as CustomElement,
    {
      type: "paragraph",
      children: [{ text: "1. Question text goes here." }]
    } as CustomElement,
    {
      type: "paragraph",
      children: [{ text: "A. Option text" }]
    } as CustomElement,
    {
      type: "paragraph",
      children: [{ text: "B. Option text" }]
    } as CustomElement,
    {
      type: "paragraph",
      children: [{ text: "C. Option text" }]
    } as CustomElement,
    {
      type: "paragraph",
      children: [{ text: "D. Option text" }]
    } as CustomElement,
    {
      type: "paragraph",
      children: [{ text: "E. Option text" }]
    } as CustomElement,
  ],
  
  // Critical Reasoning template
  "critical": [
    {
      type: "heading-two",
      children: [{ text: "Argument" }]
    } as CustomElement,
    {
      type: "paragraph",
      children: [{ text: "Enter the argument text here. Critical reasoning arguments are short passages that present a conclusion based on evidence or premises." }]
    } as CustomElement,
    {
      type: "heading-three",
      children: [{ text: "Question" }]
    } as CustomElement,
    {
      type: "paragraph",
      children: [{ text: "Question text goes here. (e.g., 'Which of the following, if true, most strengthens/weakens the argument?')" }]
    } as CustomElement,
    {
      type: "paragraph",
      children: [{ text: "A. Option text" }]
    } as CustomElement,
    {
      type: "paragraph",
      children: [{ text: "B. Option text" }]
    } as CustomElement,
    {
      type: "paragraph",
      children: [{ text: "C. Option text" }]
    } as CustomElement,
    {
      type: "paragraph",
      children: [{ text: "D. Option text" }]
    } as CustomElement,
    {
      type: "paragraph",
      children: [{ text: "E. Option text" }]
    } as CustomElement,
  ],
  
  // Text Completion template
  "text": [
    {
      type: "heading-two",
      children: [{ text: "Text Completion" }]
    } as CustomElement,
    {
      type: "paragraph",
      children: [
        { text: "Enter text here with blanks indicated by " },
        { text: "________", bold: true },
        { text: " for missing words." }
      ]
    } as CustomElement,
    {
      type: "heading-three",
      children: [{ text: "Options" }]
    } as CustomElement,
    {
      type: "paragraph",
      children: [{ text: "Blank (i)" }]
    } as CustomElement,
    {
      type: "paragraph",
      children: [{ text: "A. Option text" }]
    } as CustomElement,
    {
      type: "paragraph",
      children: [{ text: "B. Option text" }]
    } as CustomElement,
    {
      type: "paragraph",
      children: [{ text: "C. Option text" }]
    } as CustomElement,
    {
      type: "paragraph",
      children: [{ text: "D. Option text" }]
    } as CustomElement,
    {
      type: "paragraph",
      children: [{ text: "E. Option text" }]
    } as CustomElement,
  ],
  
  // Sentence Completion template
  "sentence": [
    {
      type: "heading-two",
      children: [{ text: "Sentence Equivalence" }]
    } as CustomElement,
    {
      type: "paragraph",
      children: [
        { text: "Enter the sentence with a blank indicated by " },
        { text: "________", bold: true },
        { text: "." }
      ]
    } as CustomElement,
    {
      type: "paragraph",
      children: [{ text: "Select TWO answer choices that both complete the sentence and produce sentences with equivalent meanings." }]
    } as CustomElement,
    {
      type: "paragraph",
      children: [{ text: "A. Option text" }]
    } as CustomElement,
    {
      type: "paragraph",
      children: [{ text: "B. Option text" }]
    } as CustomElement,
    {
      type: "paragraph",
      children: [{ text: "C. Option text" }]
    } as CustomElement,
    {
      type: "paragraph",
      children: [{ text: "D. Option text" }]
    } as CustomElement,
    {
      type: "paragraph",
      children: [{ text: "E. Option text" }]
    } as CustomElement,
    {
      type: "paragraph",
      children: [{ text: "F. Option text" }]
    } as CustomElement,
  ],
  
  // Arguments template
  "arguments": [
    {
      type: "heading-two",
      children: [{ text: "Argument Analysis" }]
    } as CustomElement,
    {
      type: "paragraph",
      children: [{ text: "Enter the argument text here. This should be a short passage presenting reasoning or a position on an issue." }]
    } as CustomElement,
    {
      type: "heading-three",
      children: [{ text: "Instructions" }]
    } as CustomElement,
    {
      type: "paragraph",
      children: [{ text: "Write a response in which you examine the stated and/or unstated assumptions of the argument. Be sure to explain how the argument depends on these assumptions and what the implications are for the argument if the assumptions prove unwarranted." }]
    } as CustomElement,
    {
      type: "heading-three",
      children: [{ text: "Analysis Points" }]
    } as CustomElement,
    {
      type: "bulleted-list",
      children: [
        {
          type: "list-item",
          children: [{ text: "Key assumption 1" }]
        },
        {
          type: "list-item",
          children: [{ text: "Key assumption 2" }]
        },
        {
          type: "list-item",
          children: [{ text: "Key assumption 3" }]
        }
      ]
    } as unknown as CustomElement,
  ]
};