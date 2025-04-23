import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Define interfaces for the topic data
export interface QuantitativeTopic {
  id: number;
  title: string;
  description: string;
  category: string;
  groupNumber: number;
  order: number;
}

export interface VerbalTopic {
  id: number;
  title: string;
  description: string;
  type: string;
  order: number;
}

// Define hook for fetching quantitative topics
export function useQuantitativeTopics() {
  return useQuery<QuantitativeTopic[]>({
    queryKey: ["/api/quant/topics"],
    queryFn: async () => {
      const response = await fetch("/api/quant/topics");
      if (!response.ok) {
        throw new Error("Failed to fetch quantitative topics");
      }
      return response.json();
    }
  });
}

// Define hook for fetching verbal topics
export function useVerbalTopics() {
  return useQuery<VerbalTopic[]>({
    queryKey: ["/api/verbal/topics"],
    queryFn: async () => {
      const response = await fetch("/api/verbal/topics");
      if (!response.ok) {
        throw new Error("Failed to fetch verbal topics");
      }
      return response.json();
    }
  });
}

// Helper functions for selecting topics
export function getTopicIdsByType(
  topicType: string | null,
  quantTopics: QuantitativeTopic[] | undefined,
  verbalTopics: VerbalTopic[] | undefined
): { id: number; title: string }[] {
  if (!topicType) return [];
  
  if (topicType === "quantitative" && quantTopics) {
    return quantTopics.map(topic => ({
      id: topic.id,
      title: `${topic.title} (${topic.category})`
    }));
  }
  
  if (topicType === "verbal" && verbalTopics) {
    return verbalTopics.map(topic => ({
      id: topic.id,
      title: `${topic.title} (${topic.type})`
    }));
  }
  
  return [];
}

// Helper function to get topic details by ID
export function getTopicById(
  topicId: number | null,
  topicType: string | null,
  quantTopics: QuantitativeTopic[] | undefined,
  verbalTopics: VerbalTopic[] | undefined
): QuantitativeTopic | VerbalTopic | null {
  if (!topicId || !topicType) return null;
  
  if (topicType === "quantitative" && quantTopics) {
    return quantTopics.find(topic => topic.id === topicId) || null;
  }
  
  if (topicType === "verbal" && verbalTopics) {
    return verbalTopics.find(topic => topic.id === topicId) || null;
  }
  
  return null;
}

// Helper function to format topic ID and title for dropdown
export function formatTopicOption(
  topic: QuantitativeTopic | VerbalTopic
): { value: string; label: string } {
  if ("category" in topic) {
    // Quantitative topic
    return {
      value: topic.id.toString(),
      label: `${topic.title} (${topic.category})`
    };
  } else {
    // Verbal topic
    return {
      value: topic.id.toString(),
      label: `${topic.title} (${topic.type})`
    };
  }
}