import { z } from "zod";
import { Word } from "@shared/schema";

// Form schema for vocabulary words
export const wordSchema = z.object({
  word: z.string().min(1, "Word is required"),
  definition: z.string().min(1, "Definition is required"),
  example: z.string().min(1, "Example is required"),
  pronunciation: z.string().optional(),
  day: z.number().int().min(1).max(34),
  order: z.number().int().min(1),
});

export type WordFormValues = z.infer<typeof wordSchema>;

// Import status tracking
export interface ImportStatus {
  imported: number;
  skipped: number;
  errors: number;
  total: number;
  inProgress: boolean;
}

export interface WordTableProps {
  words: Word[];
  isLoading: boolean;
  selectedWords: number[];
  onToggleSelection: (wordId: number) => void;
  onEdit: (word: Word) => void;
  onDelete: (id: number, wordText: string) => void;
  onSelectAll: () => void;
  selectAll: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
}

export interface SearchFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterDay: number | null;
  onFilterDayChange: (day: number | null) => void;
  isFiltering: boolean;
  onClearFilters: () => void;
}

export interface WordFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: WordFormValues) => void;
  defaultValues: WordFormValues;
  isEditing: boolean;
}

export interface VocabularyBulkActionsProps {
  selectedWords: number[];
  onDelete: () => void;
  onImport: () => void;
  isImporting: boolean;
  deleteInProgress: boolean;
  importStatus: ImportStatus;
}