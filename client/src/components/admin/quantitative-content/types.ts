import { QuantContent, QuantTopic } from '@shared/schema';

// Re-export types from schema for easier module consumption
export type { QuantTopic, QuantContent };
import { z } from 'zod';

// Category options for quantitative topics
export const categoryOptions = [
  { value: 'arithmetic', label: 'Arithmetic' },
  { value: 'algebra', label: 'Algebra' },
  { value: 'geometry', label: 'Geometry' },
  { value: 'data_analysis', label: 'Data Analysis' },
  { value: 'word_problems', label: 'Word Problems' },
  { value: 'advanced_topics', label: 'Advanced Topics' },
];

// Core types for quantitative content management
export interface QuantitativeContentData {
  topics: QuantTopic[];
  contents: QuantContent[];
  loading: boolean;
  error: Error | null;
}

// Form validation schema for content
export const contentFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  order: z.number().int().min(0, 'Order must be a positive number'),
  topicId: z.number().int().min(1, 'Topic must be selected'),
});

// Alias for backward compatibility
export const quantContentSchema = contentFormSchema;

// Type for content form values
export type QuantContentFormValues = z.infer<typeof contentFormSchema>;

// Initial value for rich text editor
export const initialRichTextValue = [
  {
    type: 'paragraph',
    children: [{ text: '' }],
  },
];

// Form validation schema for topic
export const topicFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(2, 'Category is required'),
  groupNumber: z.number().int().min(1, 'Group number must be at least 1'),
  order: z.number().int().min(0, 'Order must be a positive number'),
});

// Alias for backward compatibility
export const quantTopicSchema = topicFormSchema;

// Form input types derived from schemas
export type ContentFormInput = z.infer<typeof contentFormSchema>;
export type TopicFormInput = z.infer<typeof topicFormSchema>;

// States for managing content selection and editing
export interface ContentSelectionState {
  selectedTopicId: number | null;
  selectedContentId: number | null;
  isEditing: boolean;
  isCreatingTopic: boolean;
  isCreatingContent: boolean;
}

// Props for content list component
export interface ContentListProps {
  topics: QuantTopic[];
  contents: QuantContent[];
  selectedTopicId: number | null;
  selectedContentId: number | null;
  loading: boolean;
  onSelectTopic: (topicId: number) => void;
  onSelectContent: (contentId: number) => void;
  onCreateTopic: () => void;
  onCreateContent: () => void;
}

// Props for content form component
export interface ContentFormProps {
  topic?: QuantTopic;
  content?: QuantContent;
  topics: QuantTopic[];
  isCreatingTopic: boolean;
  isCreatingContent: boolean;
  loading: boolean;
  onSaveTopic: (data: TopicFormInput) => void;
  onSaveContent: (data: ContentFormInput) => void;
  onCancel: () => void;
}

// Props for content viewer component
export interface ContentViewerProps {
  content?: QuantContent;
  topic?: QuantTopic;
  loading: boolean;
  onEdit: () => void;
}

// Event handlers for content management
export interface ContentEventHandlers {
  handleSelectTopic: (topicId: number) => void;
  handleSelectContent: (contentId: number) => void;
  handleCreateTopic: () => void;
  handleCreateContent: () => void;
  handleSaveTopic: (data: TopicFormInput) => Promise<void>;
  handleSaveContent: (data: ContentFormInput) => Promise<void>;
  handleCancelEdit: () => void;
  handleEdit: () => void;
}