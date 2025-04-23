import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/ui/page-header";
import { Loader2, BookOpen, Plus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";

import {
  useVerbalTopics,
  useVerbalTopicsByType,
  useVerbalTypes,
  useVerbalContentByTopic,
  useCreateVerbalTopic,
  useUpdateVerbalTopic,
  useDeleteVerbalTopic,
  useCreateVerbalContent,
  useUpdateVerbalContent,
  useDeleteVerbalContent,
} from "./hooks";

import { VerbalTopic, VerbalContent, VerbalTopicFormValues, VerbalContentFormValues } from "./types";
import TopicsList from "./TopicsList";
import ContentList from "./ContentList";
import VerbalTopicForm from "./VerbalTopicForm";
import VerbalContentForm from "./VerbalContentForm";

interface VerbalContentManagerProps {
  searchTerm?: string;
}

const VerbalContentManager: React.FC<VerbalContentManagerProps> = ({ searchTerm = "" }) => {
  // State
  const [activeTab, setActiveTab] = useState<string>("topics");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [editingTopic, setEditingTopic] = useState<VerbalTopic | null>(null);
  const [editingContent, setEditingContent] = useState<VerbalContent | null>(null);
  const [isTopicFormVisible, setIsTopicFormVisible] = useState<boolean>(false);
  const [isContentFormVisible, setIsContentFormVisible] = useState<boolean>(false);

  // Queries
  const allTopicsQuery = useVerbalTopics(searchTerm);
  const topicsByTypeQuery = useVerbalTopicsByType(selectedType || "", searchTerm);
  const typesQuery = useVerbalTypes();
  const contentByTopicQuery = useVerbalContentByTopic(
    selectedTopicId && !isNaN(selectedTopicId) ? selectedTopicId : null
  );

  // Mutations
  const createTopic = useCreateVerbalTopic();
  const updateTopic = useUpdateVerbalTopic();
  const deleteTopic = useDeleteVerbalTopic();
  const createContent = useCreateVerbalContent();
  const updateContent = useUpdateVerbalContent();
  const deleteContent = useDeleteVerbalContent();

  // Derived values
  const topics = selectedType ? topicsByTypeQuery.data : allTopicsQuery.data;
  const isLoadingTopics = selectedType ? topicsByTypeQuery.isLoading : allTopicsQuery.isLoading;
  const selectedTopic = selectedTopicId && topics && !isNaN(selectedTopicId)
    ? topics.find(t => t.id === selectedTopicId)
    : undefined;

  // Effects
  useEffect(() => {
    if (activeTab === "topics") {
      setEditingContent(null);
      setIsContentFormVisible(false);
    } else if (activeTab === "content") {
      setEditingTopic(null);
      setIsTopicFormVisible(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedTopicId && !isNaN(selectedTopicId)) {
      setActiveTab("content");
    }
  }, [selectedTopicId]);

  // Topic handlers
  const handleCreateTopic = () => {
    setEditingTopic(null);
    setIsTopicFormVisible(true);
  };

  const handleEditTopic = (topic: VerbalTopic) => {
    setEditingTopic(topic);
    setIsTopicFormVisible(true);
  };

  const handleDeleteTopic = (id: number) => {
    deleteTopic.mutate(id, {
      onSuccess: () => {
        if (selectedTopicId === id) {
          setSelectedTopicId(null);
          setActiveTab("topics");
        }
      }
    });
  };

  const handleTopicFormSubmit = (data: VerbalTopicFormValues) => {
    if (editingTopic) {
      updateTopic.mutate({ id: editingTopic.id, data }, {
        onSuccess: () => {
          setEditingTopic(null);
          setIsTopicFormVisible(false);
        }
      });
    } else {
      createTopic.mutate(data, {
        onSuccess: () => {
          setIsTopicFormVisible(false);
        }
      });
    }
  };

  const handleTopicSelect = (topicId: number) => {
    setSelectedTopicId(topicId);
  };

  const handleBackToTopics = () => {
    setSelectedTopicId(null);
    setActiveTab("topics");
  };

  // Content handlers
  const handleCreateContent = () => {
    setEditingContent(null);
    setIsContentFormVisible(true);
  };

  const handleEditContent = (content: VerbalContent) => {
    setEditingContent(content);
    setIsContentFormVisible(true);
  };

  const handleDeleteContent = ({ id, topicId }: { id: number; topicId: number }) => {
    deleteContent.mutate({ id, topicId });
  };

  const handleContentFormSubmit = (data: VerbalContentFormValues) => {
    if (editingContent) {
      updateContent.mutate({ id: editingContent.id, data }, {
        onSuccess: () => {
          setEditingContent(null);
          setIsContentFormVisible(false);
        }
      });
    } else {
      createContent.mutate(data, {
        onSuccess: () => {
          setIsContentFormVisible(false);
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="px-0">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-bold">
                Verbal Content Management
              </CardTitle>
              <p className="text-muted-foreground">
                Create and manage verbal learning content for GRE preparation
              </p>
            </div>
            {activeTab === "topics" && (
              <Button onClick={handleCreateTopic} className="shrink-0">
                <Plus className="h-4 w-4 mr-2" />
                New Topic
              </Button>
            )}
            {activeTab === "content" && selectedTopic && (
              <Button onClick={handleCreateContent} className="shrink-0">
                <Plus className="h-4 w-4 mr-2" />
                New Content
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="px-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="topics">Topics</TabsTrigger>
                <TabsTrigger
                  value="content"
                  disabled={!selectedTopicId || isNaN(selectedTopicId)}
                >
                  Content
                </TabsTrigger>
              </TabsList>

              {selectedTopicId && (
                <Button
                  variant="ghost"
                  onClick={handleBackToTopics}
                  className="ml-auto"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Topics
                </Button>
              )}
            </div>

            <div className="mt-4">
              <TabsContent value="topics" className="space-y-6">
                {isTopicFormVisible ? (
                  <>
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">
                        {editingTopic ? "Edit Topic" : "Create New Topic"}
                      </h3>
                      <Button
                        variant="ghost"
                        onClick={() => setIsTopicFormVisible(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                    <Separator className="my-4" />
                    <VerbalTopicForm
                      onSubmit={handleTopicFormSubmit}
                      editingTopic={editingTopic}
                      isPending={createTopic.isPending || updateTopic.isPending}
                    />
                  </>
                ) : (
                  <TopicsList
                    topics={topics}
                    isLoading={isLoadingTopics}
                    onEditTopic={handleEditTopic}
                    onDeleteTopic={handleDeleteTopic}
                    onSelectTopic={handleTopicSelect}
                    selectedTopicId={selectedTopicId}
                    availableTypes={typesQuery.data}
                    selectedType={selectedType}
                    onSelectType={setSelectedType}
                    isDeletingTopic={deleteTopic.isPending}
                  />
                )}
              </TabsContent>

              <TabsContent value="content" className="space-y-6">
                {!selectedTopicId || isNaN(selectedTopicId) ? (
                  <div className="flex justify-center py-8">
                    <p className="text-muted-foreground">Please select a topic first</p>
                  </div>
                ) : isContentFormVisible ? (
                  <>
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">
                        {editingContent ? "Edit Content" : "Create New Content"}
                      </h3>
                      <Button
                        variant="ghost"
                        onClick={() => setIsContentFormVisible(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                    <Separator className="my-4" />
                    <VerbalContentForm
                      onSubmit={handleContentFormSubmit}
                      editingContent={editingContent}
                      topics={topics}
                      selectedTopicId={selectedTopicId}
                      isPending={createContent.isPending || updateContent.isPending}
                    />
                  </>
                ) : contentByTopicQuery.isLoading ? (
                  <div className="flex justify-center py-8">
                    <Spinner size="lg" className="text-primary" />
                  </div>
                ) : (
                  <ContentList
                    contents={contentByTopicQuery.data}
                    selectedTopic={selectedTopic}
                    isLoading={contentByTopicQuery.isLoading}
                    onEditContent={handleEditContent}
                    onDeleteContent={handleDeleteContent}
                    onCreateContent={handleCreateContent}
                    onBackToTopics={handleBackToTopics}
                    isDeletingContent={deleteContent.isPending}
                  />
                )}
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerbalContentManager;