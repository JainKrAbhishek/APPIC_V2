import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { 
  ContentAccessControl, 
  AccessRuleFormValues, 
  BulkActionFormValues,
  Content 
} from "./types";

// Custom hook for fetching access rules
export const useAccessRules = (contentType: string, userType: string) => {
  return useQuery<ContentAccessControl[]>({
    queryKey: ["/api/admin/content-access", contentType, userType],
    queryFn: async () => {
      return await apiRequest(`/api/admin/content-access?contentType=${contentType}&userType=${userType}`);
    },
  });
};

// Custom hook for fetching content list
export const useContentList = (contentType: string) => {
  return useQuery<Content[]>({
    queryKey: ["/api/admin/content", contentType],
    queryFn: async () => {
      return await apiRequest(`/api/admin/content?type=${contentType}`);
    },
  });
};

// Custom hook for fetching vocabulary days
export const useVocabularyDays = () => {
  return useQuery<number[]>({
    queryKey: ["/api/words/days"],
    queryFn: async () => {
      return await apiRequest("/api/words/days");
    },
  });
};

// Custom hook for creating access rules
export const useCreateAccessRule = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AccessRuleFormValues) => {
      return await apiRequest("/api/admin/content-access", {
        method: "POST",
        data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/content-access"] });
      toast({
        title: "Success",
        description: "Access rule created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create access rule. Please try again.",
        variant: "destructive",
      });
      console.error("Error creating access rule:", error);
    },
  });
};

// Custom hook for updating access rules
export const useUpdateAccessRule = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isAccessible }: { id: number; isAccessible: boolean }) => {
      return await apiRequest(`/api/admin/content-access/${id}`, {
        method: "PATCH",
        data: { isAccessible }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/content-access"] });
      toast({
        title: "Success",
        description: "Access rule updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update access rule. Please try again.",
        variant: "destructive",
      });
      console.error("Error updating access rule:", error);
    },
  });
};

// Custom hook for deleting access rules
export const useDeleteAccessRule = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/admin/content-access/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/content-access"] });
      toast({
        title: "Success",
        description: "Access rule deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete access rule. Please try again.",
        variant: "destructive",
      });
      console.error("Error deleting access rule:", error);
    },
  });
};

// Custom hook for bulk creating access rules
export const useBulkCreateAccessRules = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: BulkActionFormValues) => {
      return await apiRequest("/api/admin/content-access/bulk", {
        method: "POST",
        data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/content-access"] });
      toast({
        title: "Success",
        description: "Bulk access rules created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create bulk access rules. Please try again.",
        variant: "destructive",
      });
      console.error("Error creating bulk access rules:", error);
    },
  });
};