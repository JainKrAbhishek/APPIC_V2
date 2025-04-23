import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, QueryClient, useQueryClient } from '@tanstack/react-query';
import { Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface QuestionBookmarkButtonProps {
  questionId: number;
  size?: "sm" | "lg";
}

export const QuestionBookmarkButton: React.FC<QuestionBookmarkButtonProps> = ({ questionId, size = "sm" }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Check if the question is bookmarked
  const { data, isLoading } = useQuery({
    queryKey: ['/api/questions', questionId, 'bookmark'],
    queryFn: async () => {
      try {
        const response = await apiRequest(`/api/questions/${questionId}/bookmark`);
        return response && typeof response === 'object' && 'isBookmarked' in response 
          ? response.isBookmarked 
          : false;
      } catch (error) {
        // If unauthorized or other error, assume not bookmarked
        return false;
      }
    },
    // Don't refetch on window focus to prevent flickering
    refetchOnWindowFocus: false
  });
  
  const isBookmarked = data || false;
  
  // Mutation to bookmark a question
  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/questions/${questionId}/bookmark`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/questions', questionId, 'bookmark'] });
      queryClient.invalidateQueries({ queryKey: ['/api/questions/bookmarked'] });
      toast({
        title: "Question bookmarked",
        description: "You can find it in your bookmarked questions.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to bookmark the question. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Mutation to remove a bookmark
  const removeBookmarkMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/questions/${questionId}/bookmark`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/questions', questionId, 'bookmark'] });
      queryClient.invalidateQueries({ queryKey: ['/api/questions/bookmarked'] });
      toast({
        title: "Bookmark removed",
        description: "Question has been removed from your bookmarks.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove the bookmark. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  const handleToggleBookmark = () => {
    if (isBookmarked) {
      removeBookmarkMutation.mutate();
    } else {
      bookmarkMutation.mutate();
    }
  };
  
  const isDisabled = isLoading || bookmarkMutation.isPending || removeBookmarkMutation.isPending;
  
  return (
    <Button
      variant="ghost"
      size={size}
      onClick={handleToggleBookmark}
      disabled={isDisabled}
      className="hover:bg-transparent px-2"
      aria-label={isBookmarked ? "Remove bookmark" : "Bookmark question"}
      title={isBookmarked ? "Remove bookmark" : "Bookmark question"}
    >
      {isBookmarked ? (
        <Bookmark className="h-5 w-5 fill-yellow-400 stroke-yellow-500" />
      ) : (
        <Bookmark className="h-5 w-5" />
      )}
    </Button>
  );
};

export default QuestionBookmarkButton;