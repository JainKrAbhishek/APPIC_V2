import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PracticeSet, Question } from "./types";
import { invalidateAllPracticeSetQueries } from "@/features/practice/hooks"; // Import the central utility

// Hook to fetch practice sets
export function usePracticeSets() {
  const { data, isLoading, refetch } = useQuery<PracticeSet[]>({
    queryKey: ["/api/practice-sets"],
  });
  
  return { practiceSets: data, isLoading, refetch };
}

// Hook to fetch questions
export function useQuestions() {
  const { data, isLoading } = useQuery<Question[]>({
    queryKey: ["/api/questions"],
  });
  
  return { questions: data, isLoading };
}

// Hook to filter practice sets
export function useFilteredPracticeSets(
  practiceSets: PracticeSet[] | undefined,
  searchTerm: string,
  filterType: string | null,
  selectedDifficulty: number | null
) {
  const filteredPracticeSets = useMemo(() => {
    if (!practiceSets) return [];
    
    return practiceSets.filter(set => {
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch = searchTerm === "" || 
        set.title.toLowerCase().includes(searchTermLower) ||
        set.description.toLowerCase().includes(searchTermLower) ||
        (set.tags && set.tags.toLowerCase().includes(searchTermLower)) ||
        (set.searchFilter && set.searchFilter.toLowerCase().includes(searchTermLower));
        
      const matchesType = !filterType || set.type === filterType;
      
      const matchesDifficulty = !selectedDifficulty || set.difficulty === selectedDifficulty;
      
      return matchesSearch && matchesType && matchesDifficulty;
    });
  }, [practiceSets, searchTerm, filterType, selectedDifficulty]);
  
  const isFiltering = searchTerm !== "" || filterType !== null || selectedDifficulty !== null;
  
  return { filteredPracticeSets, isFiltering };
}

// Hook for creating a practice set
export function useCreatePracticeSet() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Omit<PracticeSet, "id">) => {
      // Log data being sent for debugging
      console.log("Creating practice set with data:", data);
      
      // Ensure questionIds is an array
      if (!data.questionIds || !Array.isArray(data.questionIds)) {
        console.warn("WARNING: questionIds is not set or not an array", data.questionIds);
        // Ensure it's at least an empty array if missing
        data.questionIds = Array.isArray(data.questionIds) ? data.questionIds : [];
      }
      
      try {
        const response = await apiRequest("/api/practice-sets", {
          method: "POST",
          data,
        });
        console.log("Practice set creation response:", response);
        return response;
      } catch (error) {
        console.error("API request error creating practice set:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Successfully created practice set:", data);
      
      // First directly update the cache with the new data to ensure immediate UI update
      queryClient.setQueryData(["/api/practice-sets"], (oldData: PracticeSet[] | undefined) => {
        if (!oldData) return [data];
        return [...oldData, data];
      });
      
      // Then invalidate all practice set related queries to ensure consistency
      invalidateAllPracticeSetQueries([data.type], { 
        immediate: true,
        includeQuestions: false
      });
      
      toast({
        title: "Success",
        description: "Practice set created successfully",
      });
    },
    onError: (error: any) => {
      console.error("Error creating practice set:", error);
      
      // Extract error message if available
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          "Failed to create practice set";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
}

// Hook for updating a practice set
export function useUpdatePracticeSet() {
  const { toast } = useToast();
  const queryClient = useQueryClient(); // Still needed for the direct cache update
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<PracticeSet> }) => {
      // Log what's being sent to the server for debugging
      console.log("Updating practice set:", id);
      console.log("Data being sent:", JSON.stringify(data, null, 2));
      
      // Ensure questionIds is included and is an array
      if (!data.questionIds || !Array.isArray(data.questionIds)) {
        console.warn("WARNING: questionIds is missing or not an array:", data.questionIds);
      }
      
      return await apiRequest(`/api/practice-sets/${id}`, {
        method: "PATCH", // Changed from PUT to PATCH to match the server endpoint
        data,
      });
    },
    onSuccess: (data) => {
      console.log("Success response:", JSON.stringify(data, null, 2));
      
      // Force cache update with the returned data
      queryClient.setQueryData(["/api/practice-sets"], (oldData: PracticeSet[] | undefined) => {
        if (!oldData) return [data];
        return oldData.map(item => item.id === data.id ? data : item);
      });
      
      // Invalidate all practice set related queries
      invalidateAllPracticeSetQueries(); // Use the central utility function
      
      toast({
        title: "Success",
        description: "Practice set updated successfully",
      });
    },
    onError: (error) => {
      console.error("Error updating practice set (detailed):", error);
      toast({
        title: "Error",
        description: "Failed to update practice set",
        variant: "destructive",
      });
    },
  });
}

// Hook for deleting a practice set
export function useDeletePracticeSet() {
  const { toast } = useToast();
  // queryClient is now accessed via the central utility function
  
  return useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/practice-sets/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      // Invalidate all practice set related queries
      invalidateAllPracticeSetQueries(); // Use the central utility function
      toast({
        title: "Success",
        description: "Practice set deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete practice set",
        variant: "destructive",
      });
      console.error("Error deleting practice set:", error);
    },
  });
}

// Hook for bulk deleting practice sets
export function useBulkDeletePracticeSets() {
  const { toast } = useToast();
  // queryClient is now accessed via the central utility function
  
  return useMutation({
    mutationFn: async (ids: number[]) => {
      return await apiRequest("/api/practice-sets/bulk/delete", {
        method: "POST",
        data: { ids },
      });
    },
    onSuccess: (_, variables) => {
      // Invalidate all practice set related queries
      invalidateAllPracticeSetQueries(); // Use the central utility function
      toast({
        title: "Success",
        description: `${variables.length} practice sets deleted successfully`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete practice sets",
        variant: "destructive",
      });
      console.error("Error deleting practice sets:", error);
    },
  });
}

// Hook for bulk copying practice sets
export function useBulkCopyPracticeSets() {
  const { toast } = useToast();
  // queryClient is now accessed via the central utility function
  
  return useMutation({
    mutationFn: async (ids: number[]) => {
      return await apiRequest("/api/practice-sets/bulk/copy", {
        method: "POST",
        data: { ids },
      });
    },
    onSuccess: (_, variables) => {
      // Invalidate all practice set related queries
      invalidateAllPracticeSetQueries(); // Use the central utility function
      toast({
        title: "Success",
        description: `${variables.length} practice sets copied successfully`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to copy practice sets",
        variant: "destructive",
      });
      console.error("Error copying practice sets:", error);
    },
  });
}

// Hook for bulk updating practice sets
export function useBulkUpdatePracticeSets() {
  const { toast } = useToast();
  // queryClient is now accessed via the central utility function
  
  return useMutation({
    mutationFn: async ({ ids, data }: { ids: number[]; data: Partial<PracticeSet> }) => {
      return await apiRequest("/api/practice-sets/bulk/update", {
        method: "POST",
        data: { ids, ...data },
      });
    },
    onSuccess: (_, variables) => {
      // Invalidate all practice set related queries
      invalidateAllPracticeSetQueries(); // Use the central utility function
      toast({
        title: "Success",
        description: `${variables.ids.length} practice sets updated successfully`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update practice sets",
        variant: "destructive",
      });
      console.error("Error updating practice sets:", error);
    },
  });
}