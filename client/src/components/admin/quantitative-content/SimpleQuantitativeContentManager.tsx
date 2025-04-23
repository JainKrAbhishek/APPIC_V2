import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { QuantTopic, QuantContent } from '@shared/schema';

import SimpleContentList from './SimpleContentList';
import SimpleContentForm from './SimpleContentForm';
import SimpleContentViewer from './SimpleContentViewer';
import { 
  QuantitativeContentData,
  ContentSelectionState,
  TopicFormInput,
  ContentFormInput,
  ContentEventHandlers
} from './types';

/**
 * SimpleQuantitativeContentManager
 * A streamlined component for managing quantitative content with improved UX
 */
export const SimpleQuantitativeContentManager: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Track component state
  const [selection, setSelection] = useState<ContentSelectionState>({
    selectedTopicId: null,
    selectedContentId: null,
    isEditing: false,
    isCreatingTopic: false,
    isCreatingContent: false
  });

  // Fetch topics
  const { 
    data: topics = [], 
    isLoading: topicsLoading,
    error: topicsError 
  } = useQuery<QuantTopic[]>({
    queryKey: ['/api/quant/topics'],
  });

  // Fetch content based on selected topic
  const { 
    data: contents = [], 
    isLoading: contentsLoading,
    error: contentsError 
  } = useQuery<QuantContent[]>({
    queryKey: ['/api/quant/content', selection.selectedTopicId],
    enabled: !!selection.selectedTopicId,
  });

  // Create or update topic mutation
  const topicMutation = useMutation({
    mutationFn: async (data: TopicFormInput) => {
      if (selection.isCreatingTopic) {
        return apiRequest('/api/quant/topics', { method: 'POST', data });
      } else {
        const topicId = selection.selectedTopicId;
        return apiRequest(`/api/quant/topics/${topicId}`, { method: 'PATCH', data });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quant/topics'] });
      toast({
        title: selection.isCreatingTopic ? 'Topic created' : 'Topic updated',
        description: 'The topic has been saved successfully.',
      });
      setSelection(prev => ({
        ...prev,
        isCreatingTopic: false,
        isEditing: false
      }));
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to save topic: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Create or update content mutation
  const contentMutation = useMutation({
    mutationFn: async (data: ContentFormInput) => {
      if (selection.isCreatingContent) {
        return apiRequest('/api/quant/content', { method: 'POST', data });
      } else {
        const contentId = selection.selectedContentId;
        return apiRequest(`/api/quant/content/${contentId}`, { method: 'PATCH', data });
      }
    },
    onSuccess: () => {
      if (selection.selectedTopicId) {
        queryClient.invalidateQueries({ 
          queryKey: ['/api/quant/content', selection.selectedTopicId] 
        });
      }
      toast({
        title: selection.isCreatingContent ? 'Content created' : 'Content updated',
        description: 'The content has been saved successfully.',
      });
      setSelection(prev => ({
        ...prev,
        isCreatingContent: false,
        isEditing: false
      }));
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to save content: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Event handlers for content management
  const eventHandlers: ContentEventHandlers = {
    handleSelectTopic: (topicId: number) => {
      // If topicId is 0 or null, it means we're deselecting
      if (!topicId) {
        setSelection({
          selectedTopicId: null,
          selectedContentId: null,
          isEditing: false,
          isCreatingTopic: false,
          isCreatingContent: false
        });
      } else {
        setSelection({
          selectedTopicId: topicId,
          selectedContentId: null,
          isEditing: false,
          isCreatingTopic: false,
          isCreatingContent: false
        });
      }
    },

    handleSelectContent: (contentId: number) => {
      setSelection(prev => ({
        ...prev,
        selectedContentId: contentId,
        isEditing: false,
        isCreatingTopic: false,
        isCreatingContent: false
      }));
    },

    handleCreateTopic: () => {
      setSelection({
        selectedTopicId: null,
        selectedContentId: null,
        isEditing: true,
        isCreatingTopic: true,
        isCreatingContent: false
      });
    },

    handleCreateContent: () => {
      setSelection(prev => ({
        ...prev,
        selectedContentId: null,
        isEditing: true,
        isCreatingTopic: false,
        isCreatingContent: true
      }));
    },

    handleSaveTopic: async (data: TopicFormInput) => {
      await topicMutation.mutateAsync(data);
    },

    handleSaveContent: async (data: ContentFormInput) => {
      await contentMutation.mutateAsync(data);
    },

    handleCancelEdit: () => {
      setSelection(prev => ({
        ...prev,
        isEditing: false,
        isCreatingTopic: false,
        isCreatingContent: false
      }));
    },

    handleEdit: () => {
      setSelection(prev => ({
        ...prev,
        isEditing: true
      }));
    }
  };

  // Get currently selected topic and content
  const selectedTopic = topics.find(t => t.id === selection.selectedTopicId);
  const selectedContent = contents.find(c => c.id === selection.selectedContentId);
  
  // Calculate loading state
  const isLoading = topicsLoading || contentsLoading || 
                    topicMutation.isPending || contentMutation.isPending;

  // Data object for child components
  const contentData: QuantitativeContentData = {
    topics,
    contents,
    loading: isLoading,
    error: topicsError || contentsError
  };

  // Render the component
  return (
    <div className="grid md:grid-cols-12 gap-6">
      <div className="md:col-span-4">
        <SimpleContentList
          topics={topics}
          contents={contents}
          selectedTopicId={selection.selectedTopicId}
          selectedContentId={selection.selectedContentId}
          loading={isLoading}
          onSelectTopic={eventHandlers.handleSelectTopic}
          onSelectContent={eventHandlers.handleSelectContent}
          onCreateTopic={eventHandlers.handleCreateTopic}
          onCreateContent={eventHandlers.handleCreateContent}
        />
      </div>
      
      <div className="md:col-span-8">
        {selection.isEditing ? (
          <SimpleContentForm
            topic={selection.isCreatingTopic ? undefined : selectedTopic}
            content={selection.isCreatingContent ? undefined : selectedContent}
            topics={topics}
            isCreatingTopic={selection.isCreatingTopic}
            isCreatingContent={selection.isCreatingContent}
            loading={isLoading}
            onSaveTopic={eventHandlers.handleSaveTopic}
            onSaveContent={eventHandlers.handleSaveContent}
            onCancel={eventHandlers.handleCancelEdit}
          />
        ) : (
          <SimpleContentViewer
            content={selectedContent}
            topic={selectedTopic}
            loading={isLoading}
            onEdit={eventHandlers.handleEdit}
          />
        )}
      </div>
    </div>
  );
};

export default SimpleQuantitativeContentManager;