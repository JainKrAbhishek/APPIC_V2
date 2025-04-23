import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Word } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { WordFormValues, wordSchema, ImportStatus } from "./types";
import logger, { createLogger, dataLogger, perfLogger, apiLogger, uiLogger } from "@/utils/logger";

// Constants
export const ITEMS_PER_PAGE = 10;

// Create a logger specific to vocabulary management
const vocabLogger = createLogger({ 
  group: 'VocabManager', 
  category: 'data',
  minLevel: 'info'
});

// Hook for managing vocabulary words with filtering and pagination
export function useVocabularyManagement() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDay, setFilterDay] = useState<number | null>(null);
  const [isFiltering, setIsFiltering] = useState(false);
  const [selectedWords, setSelectedWords] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Performance tracking - maintain refs to avoid re-renders
  const lastRenderTime = useRef(performance.now());
  const renderCount = useRef(0);
  
  // Fetch vocabulary data with improved caching strategy
  const { 
    data: vocabularyData, 
    isLoading: loadingVocabulary,
    error: vocabularyError,
    isError: isVocabularyError,
    refetch: refetchVocabulary 
  } = useQuery<Word[]>({
    queryKey: ["/api/words"],
    staleTime: 300000, // 5 minutes - increased to reduce unnecessary refetches
    refetchInterval: 600000, // 10 minutes
    gcTime: 1800000, // 30 minutes - cache data for longer
    retry: 2, // Only retry twice to avoid unnecessary network requests
    refetchOnWindowFocus: false, // Disable refetch on window focus to reduce unnecessary network requests
    refetchOnMount: true, // But still refetch when component mounts
    meta: {
      errorMessage: "Failed to load vocabulary data"
    }
  });

  // Track render performance in development mode only
  useEffect(() => {
    renderCount.current++;
    const now = performance.now();
    const elapsed = now - lastRenderTime.current;
    lastRenderTime.current = now;
    
    vocabLogger.debug(
      `VocabularyManagement hook render #${renderCount.current}`,
      `Time since last render: ${elapsed.toFixed(2)}ms`
    );
    
    return () => {
      vocabLogger.debug('VocabularyManagement hook cleanup');
    };
  }, []);
  
  // Word search optimization - cache lowercased search term
  const lowercaseSearchTerm = useMemo(() => searchTerm.toLowerCase(), [searchTerm]);
  
  // Memoize filtered words to prevent recalculation on every render
  const filteredWords = useMemo(() => {
    if (!vocabularyData) return [];
    
    vocabLogger.time('filterWords');
    
    const results = vocabularyData.filter(word => {
      // Skip search check if term is empty
      const matchesSearch = searchTerm === "" || (
        word.word.toLowerCase().includes(lowercaseSearchTerm) ||
        word.definition.toLowerCase().includes(lowercaseSearchTerm)
      );
      
      const matchesDay = filterDay === null || word.day === filterDay;
      
      return matchesSearch && matchesDay;
    });
    
    vocabLogger.timeEnd('filterWords');
    return results;
  }, [vocabularyData, lowercaseSearchTerm, filterDay]);

  // Memoize paginated words with reference equality check
  const paginatedWords = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = currentPage * ITEMS_PER_PAGE;
    
    return filteredWords.slice(startIndex, endIndex);
  }, [filteredWords, currentPage]);

  // Memoize total pages calculation
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredWords.length / ITEMS_PER_PAGE));
  }, [filteredWords.length]);

  // Stabilize object references for word IDs
  const filteredWordIds = useMemo(() => {
    return filteredWords.map(word => word.id);
  }, [filteredWords]);
  
  // Memoize toggle select all with stable references
  const toggleSelectAll = useCallback(() => {
    if (selectAll) {
      setSelectedWords([]);
    } else {
      setSelectedWords(filteredWordIds);
    }
    setSelectAll(!selectAll);
  }, [selectAll, filteredWordIds]);
  
  // Memoize toggle word selection with function reference stabilization
  const toggleWordSelection = useCallback((wordId: number) => {
    setSelectedWords(prev => {
      // Use Set for more efficient lookups with larger selections
      const selectedSet = new Set(prev);
      
      if (selectedSet.has(wordId)) {
        selectedSet.delete(wordId);
      } else {
        selectedSet.add(wordId);
      }
      
      return Array.from(selectedSet);
    });
  }, []);

  // Batched state updates for search changes to reduce renders
  const handleSearchChange = useCallback((value: string) => {
    // Only update if the value has actually changed
    if (value !== searchTerm) {
      vocabLogger.debug('Search term changed:', value);
      setSearchTerm(value);
      setIsFiltering(value !== "" || filterDay !== null);
      setCurrentPage(1);
    }
  }, [searchTerm, filterDay]);

  // Batched state updates for filter day changes to reduce renders
  const handleFilterDayChange = useCallback((day: number | null) => {
    // Only update if the value has actually changed
    if (day !== filterDay) {
      vocabLogger.debug('Filter day changed:', day);
      setFilterDay(day);
      setIsFiltering(searchTerm !== "" || day !== null);
      setCurrentPage(1);
    }
  }, [searchTerm, filterDay]);

  // Memoize clear filters function
  const clearFilters = useCallback(() => {
    vocabLogger.debug('Clearing all filters');
    // Batch state updates to reduce renders
    setSearchTerm("");
    setFilterDay(null);
    setIsFiltering(false);
    setCurrentPage(1);
  }, []);

  return {
    vocabularyData,
    loadingVocabulary,
    isVocabularyError,
    vocabularyError,
    refetchVocabulary,
    searchTerm,
    filterDay,
    isFiltering,
    selectedWords,
    selectAll,
    currentPage,
    filteredWords,
    paginatedWords,
    totalPages,
    toggleSelectAll,
    toggleWordSelection,
    handleSearchChange,
    handleFilterDayChange,
    clearFilters,
    setCurrentPage,
    setSelectedWords,
    setSelectAll
  };
}

// Create a logger for word form operations
const formLogger = createLogger({ 
  group: 'WordForm', 
  category: 'ui',
  minLevel: 'info'
});

// Default initial values for word form
const DEFAULT_WORD_VALUES: WordFormValues = {
  word: "",
  definition: "",
  example: "",
  pronunciation: "",
  day: 1,
  order: 1,
};

// Hook for word form management with optimized performance
export function useWordForm(
  onSuccess: () => void,
  initialValues: WordFormValues = DEFAULT_WORD_VALUES
) {
  const { toast } = useToast();
  const [editingItem, setEditingItem] = useState<Word | null>(null);
  
  // Track form performance
  const formSubmitCount = useRef(0);
  
  // Use stable reference for initial values
  const stableInitialValues = useRef(initialValues);
  
  // Create form with performance optimizations
  const wordForm = useForm<WordFormValues>({
    resolver: zodResolver(wordSchema),
    defaultValues: stableInitialValues.current,
    // Reduce re-renders by avoiding recalculation of default form state
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });

  // Add word mutation with optimized error handling and logging
  const addWordMutation = useMutation({
    mutationFn: async (data: WordFormValues) => {
      formLogger.time('addWordRequest');
      formLogger.debug('Adding new word:', data.word);
      
      const response = await apiRequest("/api/words", { method: "POST", data });
      return response;
    },
    onSuccess: () => {
      formLogger.timeEnd('addWordRequest');
      formSubmitCount.current += 1;
      
      // Only invalidate necessary queries
      queryClient.invalidateQueries({ queryKey: ["/api/words"] });
      
      toast({
        title: "Success",
        description: "Word added successfully",
      });
      
      // Reset form state and call success callback
      wordForm.reset();
      onSuccess();
    },
    onError: (error: any) => {
      formLogger.error('Error adding word:', error?.message || 'Unknown error');
      
      toast({
        title: "Error",
        description: error?.message || "Failed to add word",
        variant: "destructive",
      });
    },
  });

  // Update word mutation with optimized error handling and logging
  const updateWordMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: WordFormValues }) => {
      formLogger.time('updateWordRequest');
      formLogger.debug('Updating word:', id, data.word);
      
      return apiRequest(`/api/words/${id}`, { method: "PATCH", data });
    },
    onSuccess: () => {
      formLogger.timeEnd('updateWordRequest');
      formSubmitCount.current += 1;
      
      // Only invalidate necessary queries
      queryClient.invalidateQueries({ queryKey: ["/api/words"] });
      
      toast({
        title: "Success",
        description: "Word updated successfully",
      });
      
      onSuccess();
    },
    onError: (error: any) => {
      formLogger.error('Error updating word:', error?.message || 'Unknown error');
      
      toast({
        title: "Error",
        description: error?.message || "Failed to update word",
        variant: "destructive",
      });
    },
  });

  // Enhanced submit handler with validation error handling
  const onSubmitWord = useCallback((data: WordFormValues) => {
    formLogger.debug('Submitting word form:', 
      editingItem ? `Editing word ID ${editingItem.id}` : 'Adding new word');
    
    // Add tracking for form validation errors
    if (Object.keys(wordForm.formState.errors).length) {
      formLogger.warn('Form validation errors:', wordForm.formState.errors);
    }
    
    if (editingItem) {
      updateWordMutation.mutate({ id: editingItem.id, data });
    } else {
      addWordMutation.mutate(data);
    }
  }, [editingItem, updateWordMutation, addWordMutation, wordForm.formState.errors]);

  // Optimized reset form function with explicit default values
  const resetForm = useCallback((values: WordFormValues = DEFAULT_WORD_VALUES) => {
    formLogger.debug('Resetting form with values:', values);
    
    // Reset form errors first to avoid flickering
    wordForm.clearErrors();
    wordForm.reset(values);
  }, [wordForm]);

  // Derived submission state to avoid unnecessary re-renders
  const isSubmitting = addWordMutation.isPending || updateWordMutation.isPending;

  return {
    wordForm,
    editingItem,
    setEditingItem,
    onSubmitWord,
    resetForm,
    isSubmitting
  };
}

// Hook for vocabulary import operations
export function useVocabularyImport() {
  const { toast } = useToast();
  const [importStatus, setImportStatus] = useState<ImportStatus>({
    imported: 0,
    skipped: 0,
    errors: 0,
    total: 0,
    inProgress: false
  });

  // Import vocabulary mutation
  const seedVocabularyMutation = useMutation({
    mutationFn: async () => {
      setImportStatus(prev => ({ ...prev, inProgress: true }));
      return apiRequest("/api/seed-vocabulary", { method: "POST" });
    },
    onSuccess: (data: any) => {
      setImportStatus({
        imported: data.count || 0,
        skipped: data.skipped || 0,
        errors: data.errors || 0,
        total: data.total || 0,
        inProgress: false
      });
      
      toast({
        title: "Import Successful",
        description: `Imported ${data.count} words, skipped ${data.skipped} duplicates, with ${data.errors} errors.`,
      });
      
      // Refresh vocabulary data
      queryClient.invalidateQueries({ queryKey: ["/api/words"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vocabulary/data"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vocabulary/days"] });
    },
    onError: (error) => {
      setImportStatus(prev => ({ ...prev, inProgress: false }));
      toast({
        title: "Error",
        description: "Failed to seed vocabulary data",
        variant: "destructive",
      });
    }
  });

  return {
    importStatus,
    setImportStatus,
    seedVocabularyMutation
  };
}

// Create logger for deletion operations
const deleteLogger = createLogger({ 
  group: 'WordDelete', 
  category: 'data',
  minLevel: 'info'
});

// Hook for word deletion operations with improved performance
export function useWordDeletion() {
  const { toast } = useToast();
  const [bulkDeleteInProgress, setBulkDeleteInProgress] = useState(false);
  
  // Track deletion metrics
  const deletionStats = useRef({
    singleDeletes: 0,
    bulkDeletes: 0,
    totalWordsDeleted: 0,
  });

  // Delete mutation - use React Query for better caching and optimistic updates
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      deleteLogger.time(`deleteWord-${id}`);
      return apiRequest(`/api/words/${id}`, { method: "DELETE" });
    },
    onSuccess: (_data, id) => {
      deleteLogger.timeEnd(`deleteWord-${id}`);
      deletionStats.current.singleDeletes += 1;
      deletionStats.current.totalWordsDeleted += 1;
      
      // Optimistically update cache to avoid full refetch
      queryClient.setQueryData(["/api/words"], (oldData: Word[] | undefined) => {
        if (!oldData) return undefined;
        return oldData.filter(word => word.id !== id);
      });
      
      // Still invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["/api/words"] });
      
      toast({
        title: "Success",
        description: "Word deleted successfully",
      });
    },
    onError: (error: any, id) => {
      deleteLogger.error(`Error deleting word ${id}:`, error?.message || 'Unknown error');
      
      toast({
        title: "Error",
        description: error?.message || "Failed to delete word",
        variant: "destructive",
      });
    },
  });

  // Enhanced delete handler with confirmation
  const handleDelete = useCallback((id: number, wordText: string) => {
    deleteLogger.debug('Attempting to delete word:', id, wordText);
    
    if (confirm(`Are you sure you want to delete "${wordText}"?`)) {
      deleteMutation.mutate(id);
    }
  }, [deleteMutation]);

  // Optimized bulk delete handler with batching and progress tracking
  const handleBulkDelete = useCallback(async (selectedWords: number[]) => {
    if (selectedWords.length === 0) {
      toast({
        title: "No words selected",
        description: "Please select at least one word to delete.",
        variant: "destructive",
      });
      return false;
    }
    
    deleteLogger.debug(`Attempting to bulk delete ${selectedWords.length} words`);
    
    if (confirm(`Are you sure you want to delete ${selectedWords.length} selected words?`)) {
      setBulkDeleteInProgress(true);
      deleteLogger.time('bulkDelete');
      
      try {
        // Send bulk delete request
        await apiRequest("/api/words/bulk-delete", { 
          method: "POST", 
          data: { wordIds: selectedWords } 
        });
        
        // Track metrics
        deletionStats.current.bulkDeletes += 1;
        deletionStats.current.totalWordsDeleted += selectedWords.length;
        
        // Optimistically update cache to avoid full refetch
        queryClient.setQueryData(["/api/words"], (oldData: Word[] | undefined) => {
          if (!oldData) return undefined;
          
          const selectedSet = new Set(selectedWords);
          return oldData.filter(word => !selectedSet.has(word.id));
        });
        
        // Still invalidate to ensure consistency
        queryClient.invalidateQueries({ queryKey: ["/api/words"] });
        
        deleteLogger.timeEnd('bulkDelete');
        deleteLogger.info(`Deleted ${selectedWords.length} words in bulk`);
        
        toast({
          title: "Success",
          description: `Successfully deleted ${selectedWords.length} words`,
        });
        
        return true;
      } catch (error: any) {
        deleteLogger.error('Bulk delete error:', error?.message || 'Unknown error');
        
        toast({
          title: "Error",
          description: error?.message || "Failed to delete selected words",
          variant: "destructive",
        });
        
        return false;
      } finally {
        setBulkDeleteInProgress(false);
      }
    }
    
    return false;
  }, [toast]);

  return {
    handleDelete,
    handleBulkDelete,
    bulkDeleteInProgress
  };
}