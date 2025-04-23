import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, QueryClient, useQueryClient } from '@tanstack/react-query';
import { Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface QuestionBookmarkButtonProps {
  questionId: number;
  size?: "sm" | "lg";
  className?: string;
}

export const QuestionBookmarkButton: React.FC<QuestionBookmarkButtonProps> = ({ 
  questionId, 
  size = "sm", 
  className 
}) => {
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
        title: "Soru yer işaretlerine eklendi",
        description: "Yer işaretlerinizden bu soruya erişebilirsiniz.",
      });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Soru yer işaretlenirken bir hata oluştu. Lütfen tekrar deneyin.",
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
        title: "Yer işareti kaldırıldı",
        description: "Soru yer işaretlerinizden kaldırıldı.",
      });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Yer işareti kaldırılırken bir hata oluştu. Lütfen tekrar deneyin.",
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
      className={cn(
        "hover:bg-transparent px-2 relative transition-all duration-300",
        isBookmarked && "hover:opacity-80",
        className
      )}
      aria-label={isBookmarked ? "Yer işaretlerinden çıkar" : "Yer işaretlerine ekle"}
      title={isBookmarked ? "Yer işaretlerinden çıkar" : "Yer işaretlerine ekle"}
    >
      {isBookmarked ? (
        <Bookmark className="h-5 w-5 fill-amber-400 stroke-amber-500 transition-transform duration-300 transform hover:scale-110" />
      ) : (
        <Bookmark className="h-5 w-5 transition-transform duration-300 transform hover:scale-110" />
      )}
      
      {/* Subtle animation for interaction feedback */}
      {isDisabled && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="animate-ping h-2 w-2 rounded-full bg-primary opacity-75"></span>
        </span>
      )}
    </Button>
  );
};

export default QuestionBookmarkButton;