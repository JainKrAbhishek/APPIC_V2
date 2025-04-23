import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  QuantTopic, 
  QuantContent, 
  QuantTopicFormValues, 
  QuantContentFormValues 
} from "./types";

// Hook to fetch all quant topics
export function useQuantTopics(searchTerm?: string) {
  return useQuery<QuantTopic[]>({
    queryKey: ["/api/quant/topics", searchTerm],
    queryFn: async () => {
      const response = await apiRequest<QuantTopic[]>("/api/quant/topics", {
        params: searchTerm ? { search: searchTerm } : undefined
      });
      return response || [];
    }
  });
}

// Hook to fetch topics by category
export function useQuantTopicsByCategory(category: string) {
  return useQuery<QuantTopic[]>({
    queryKey: ["/api/quant/topics/by-category", category],
    enabled: !!category,
  });
}

// Hook to fetch topics by group
export function useQuantTopicsByGroup(groupNumber: number) {
  return useQuery<QuantTopic[]>({
    queryKey: ["/api/quant/topics/by-group", groupNumber],
    enabled: groupNumber > 0,
  });
}

// Hook to fetch distinct categories
export function useQuantCategories() {
  return useQuery<string[]>({
    queryKey: ["/api/quant/categories"],
  });
}

// Hook to fetch distinct groups
export function useQuantGroups() {
  return useQuery<number[]>({
    queryKey: ["/api/quant/groups"],
  });
}

// Hook to fetch quant content by topic ID
export function useQuantContentByTopic(topicId: number | null) {
  const queryClient = useQueryClient();

  return useQuery<QuantContent[]>({
    queryKey: ["/api/quant/content/by-topic", topicId],
    queryFn: async () => {
      if (!topicId) return [];
      try {
        const response = await apiRequest<QuantContent[]>(`/api/quant/content/by-topic/${topicId}`);
        console.log(`Fetched ${response?.length || 0} content items for topic ${topicId}`);
        return response || [];
      } catch (error) {
        console.error(`Error fetching content for topic ${topicId}:`, error);
        return [];
      }
    },
    enabled: !!topicId,
  });
}

// Hook to create a quant topic
export function useCreateQuantTopic() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: QuantTopicFormValues) => {
      return await apiRequest("/api/quant/topics", {
        method: "POST",
        data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quant/topics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quant/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quant/groups"] });
      toast({
        title: "Success",
        description: "Topic created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create topic",
        variant: "destructive",
      });
      console.error("Error creating topic:", error);
    },
  });
}

// Hook to update a quant topic
export function useUpdateQuantTopic() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: QuantTopicFormValues }) => {
      return await apiRequest(`/api/quant/topics/${id}`, {
        method: "PATCH",
        data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quant/topics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quant/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quant/groups"] });
      toast({
        title: "Success",
        description: "Topic updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update topic",
        variant: "destructive",
      });
      console.error("Error updating topic:", error);
    },
  });
}

// Hook to delete a quant topic
export function useDeleteQuantTopic() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/quant/topics/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quant/topics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quant/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quant/groups"] });
      toast({
        title: "Success",
        description: "Topic deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete topic",
        variant: "destructive",
      });
      console.error("Error deleting topic:", error);
    },
  });
}

// Hook to create quant content
export function useCreateQuantContent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: QuantContentFormValues) => {
      return await apiRequest("/api/quant/content", {
        method: "POST",
        data,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/quant/content/by-topic", variables.topicId] 
      });
      toast({
        title: "Success",
        description: "Content created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create content",
        variant: "destructive",
      });
      console.error("Error creating content:", error);
    },
  });
}

// Hook to update quant content
export function useUpdateQuantContent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: QuantContentFormValues }) => {
      return await apiRequest(`/api/quant/content/${id}`, {
        method: "PATCH",
        data,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/quant/content/by-topic", variables.data.topicId] 
      });
      toast({
        title: "Success",
        description: "Content updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update content",
        variant: "destructive",
      });
      console.error("Error updating content:", error);
    },
  });
}

// Hook to delete quant content
export function useDeleteQuantContent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, topicId }: { id: number; topicId: number }) => {
      return await apiRequest(`/api/quant/content/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/quant/content/by-topic", variables.topicId] 
      });
      toast({
        title: "Success",
        description: "Content deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete content",
        variant: "destructive",
      });
      console.error("Error deleting content:", error);
    },
  });
}