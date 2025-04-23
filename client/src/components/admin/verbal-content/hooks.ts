import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  VerbalTopic, 
  VerbalContent, 
  VerbalTopicFormValues, 
  VerbalContentFormValues 
} from "./types";

// Hook to fetch all verbal topics
export function useVerbalTopics(searchTerm?: string) {
  return useQuery<VerbalTopic[]>({
    queryKey: ["/api/verbal/topics", searchTerm],
    queryFn: async () => {
      const response = await apiRequest<VerbalTopic[]>("/api/verbal/topics", {
        params: searchTerm ? { search: searchTerm } : undefined
      });
      return response || [];
    }
  });
}

// Hook to fetch topics by type
export function useVerbalTopicsByType(type: string, searchTerm?: string) {
  return useQuery<VerbalTopic[]>({
    queryKey: ["/api/verbal/topics/by-type", type, searchTerm],
    queryFn: async () => {
      const response = await apiRequest<VerbalTopic[]>(`/api/verbal/topics/by-type/${type}`, {
        params: searchTerm ? { search: searchTerm } : undefined
      });
      return response || [];
    },
    enabled: !!type,
  });
}

// Hook to fetch distinct verbal types
export function useVerbalTypes() {
  return useQuery<string[]>({
    queryKey: ["/api/verbal/types"],
  });
}

// Hook to fetch verbal content by topic ID
export function useVerbalContentByTopic(topicId: number | null) {
  return useQuery<VerbalContent[]>({
    queryKey: ["/api/verbal/content/by-topic", topicId],
    queryFn: async () => {
      if (!topicId) return [];
      const response = await apiRequest<VerbalContent[]>(`/api/verbal/content/by-topic/${topicId}`);
      return response || [];
    },
    enabled: !!topicId && !isNaN(topicId),
  });
}

// Hook to create a verbal topic
export function useCreateVerbalTopic() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: VerbalTopicFormValues) => {
      return await apiRequest("/api/verbal/topics", {
        method: "POST",
        data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/verbal/topics"] });
      toast({
        title: "Success",
        description: "Verbal topic created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create verbal topic",
        variant: "destructive",
      });
      console.error("Error creating verbal topic:", error);
    },
  });
}

// Hook to update a verbal topic
export function useUpdateVerbalTopic() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: VerbalTopicFormValues }) => {
      return await apiRequest(`/api/verbal/topics/${id}`, {
        method: "PUT",
        data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/verbal/topics"] });
      toast({
        title: "Success",
        description: "Verbal topic updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update verbal topic",
        variant: "destructive",
      });
      console.error("Error updating verbal topic:", error);
    },
  });
}

// Hook to delete a verbal topic
export function useDeleteVerbalTopic() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/verbal/topics/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/verbal/topics"] });
      toast({
        title: "Success",
        description: "Verbal topic deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete verbal topic",
        variant: "destructive",
      });
      console.error("Error deleting verbal topic:", error);
    },
  });
}

// Hook to create verbal content
export function useCreateVerbalContent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: VerbalContentFormValues) => {
      return await apiRequest("/api/verbal/content", {
        method: "POST",
        data,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/verbal/content/by-topic", variables.topicId] 
      });
      toast({
        title: "Success",
        description: "Verbal content created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create verbal content",
        variant: "destructive",
      });
      console.error("Error creating verbal content:", error);
    },
  });
}

// Hook to update verbal content
export function useUpdateVerbalContent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: VerbalContentFormValues }) => {
      return await apiRequest(`/api/verbal/content/${id}`, {
        method: "PUT",
        data,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/verbal/content/by-topic", variables.data.topicId] 
      });
      toast({
        title: "Success",
        description: "Verbal content updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update verbal content",
        variant: "destructive",
      });
      console.error("Error updating verbal content:", error);
    },
  });
}

// Hook to delete verbal content
export function useDeleteVerbalContent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, topicId }: { id: number; topicId: number }) => {
      return await apiRequest(`/api/verbal/content/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/verbal/content/by-topic", variables.topicId] 
      });
      toast({
        title: "Success",
        description: "Verbal content deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete verbal content",
        variant: "destructive",
      });
      console.error("Error deleting verbal content:", error);
    },
  });
}