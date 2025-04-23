import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, InfoIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import QuantTopicForm from "./QuantTopicForm";
import QuantContentForm from "./QuantContentForm";
import TopicsList from "./TopicsList";
import ContentList from "./ContentList";
import ContentViewer from "./ContentViewer";
import DeleteConfirmDialog from "./DeleteConfirmDialog";
import TopicsFilter from "./TopicsFilter";
import { QuantTopic, QuantContent, initialRichTextValue } from "./types";
import {
  useQuantTopics,
  useQuantCategories,
  useQuantGroups,
  useQuantContentByTopic,
  useCreateQuantTopic,
  useUpdateQuantTopic,
  useDeleteQuantTopic,
  useCreateQuantContent,
  useUpdateQuantContent,
  useDeleteQuantContent
} from "./hooks";

interface QuantitativeContentManagerProps {
  searchTerm?: string;
}

const QuantitativeContentManager: React.FC<QuantitativeContentManagerProps> = ({ searchTerm: externalSearchTerm = "" }) => {
  const { toast } = useToast();

  // State for topics management
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [editingTopic, setEditingTopic] = useState<QuantTopic | null>(null);
  const [isDeleteTopicDialogOpen, setIsDeleteTopicDialogOpen] = useState(false);
  const [isTopicDialogOpen, setIsTopicDialogOpen] = useState(false);
  const [topicToDeleteId, setTopicToDeleteId] = useState<number | null>(null);

  // State for content management
  const [editingContent, setEditingContent] = useState<QuantContent | null>(null);
  const [viewingContent, setViewingContent] = useState<QuantContent | null>(null);
  const [isDeleteContentDialogOpen, setIsDeleteContentDialogOpen] = useState(false);
  const [contentToDeleteId, setContentToDeleteId] = useState<number | null>(null);
  const [isContentDialogOpen, setIsContentDialogOpen] = useState(false);

  // State for filtering
  const [internalSearchTerm, setInternalSearchTerm] = useState(externalSearchTerm);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);

  // Update internal search when external search changes
  useEffect(() => {
    setInternalSearchTerm(externalSearchTerm);
  }, [externalSearchTerm]);

  // Queries for data fetching with search term
  const {
    data: topics = [],
    isLoading: isTopicsLoading,
    refetch: refetchTopics
  } = useQuantTopics(internalSearchTerm);

  const { data: categories = [] } = useQuantCategories();
  const { data: groups = [] } = useQuantGroups();

  const {
    data: contents = [],
    isLoading: isContentsLoading,
    refetch: refetchContents
  } = useQuantContentByTopic(selectedTopicId);

  // Derive filtered topics
  const filteredTopics = topics?.filter(topic => {
    // Safety checks to prevent null/undefined errors
    if (!topic) return false;

    // Get topic name and description from schema
    const topicName = topic.name || '';
    const topicDescription = topic.description || '';
    const searchTermLower = internalSearchTerm.toLowerCase();

    const matchesSearch = topicName.toLowerCase().includes(searchTermLower) ||
                          topicDescription.toLowerCase().includes(searchTermLower);
    const matchesCategory = selectedCategory === "all" || topic.category === selectedCategory;
    const matchesGroup = selectedGroup === null || topic.groupNumber === selectedGroup;

    return matchesSearch && matchesCategory && matchesGroup;
  }) || [];

  // Reset content when topic selection changes
  useEffect(() => {
    setEditingContent(null);
    setViewingContent(null);
  }, [selectedTopicId]);

  // Add debug effect to log content updates
  useEffect(() => {
    if (selectedTopicId) {
      console.log(`[QuantManager] Selected Topic ID: ${selectedTopicId}`);
      console.log(`[QuantManager] Content count for topic: ${contents.length}`);
      console.log('[QuantManager] Content items:', contents.map(c => ({
        id: c.id,
        title: c.title,
        topicId: c.topicId
      })));
    }
  }, [selectedTopicId, contents]);


  // Mutations for data operations
  const createTopicMutation = useCreateQuantTopic();
  const updateTopicMutation = useUpdateQuantTopic();
  const deleteTopicMutation = useDeleteQuantTopic();
  const createContentMutation = useCreateQuantContent();
  const updateContentMutation = useUpdateQuantContent();
  const deleteContentMutation = useDeleteQuantContent();

  // Topic operations
  const handleTopicSubmit = async (data: any) => {
    try {
      if (editingTopic) {
        await updateTopicMutation.mutateAsync({ id: editingTopic.id, data });
        setEditingTopic(null);
      } else {
        await createTopicMutation.mutateAsync(data);
      }
    } catch (error) {
      console.error("Error submitting topic:", error);
    }
  };

  const handleEditTopic = (topic: QuantTopic) => {
    setEditingTopic(topic);
  };

  const handleDeleteTopic = (id: number) => {
    setTopicToDeleteId(id);
    setIsDeleteTopicDialogOpen(true);
  };

  const confirmDeleteTopic = async () => {
    if (topicToDeleteId) {
      try {
        await deleteTopicMutation.mutateAsync(topicToDeleteId);
        setIsDeleteTopicDialogOpen(false);
        setTopicToDeleteId(null);

        // If we deleted the currently selected topic, reset the selection
        if (selectedTopicId === topicToDeleteId) {
          setSelectedTopicId(null);
        }
      } catch (error) {
        console.error("Error deleting topic:", error);
        toast({
          title: "Error",
          description: "There was an error deleting the topic. It may have related content.",
          variant: "destructive",
        });
      }
    }
  };

  // Content operations
  const handleContentSubmit = async (data: any) => {
    try {
      if (editingContent) {
        await updateContentMutation.mutateAsync({ id: editingContent.id, data });
        setEditingContent(null);
      } else {
        await createContentMutation.mutateAsync(data);
      }
      setIsContentDialogOpen(false);
      refetchContents();
      toast({
        title: editingContent ? "Content Updated" : "Content Created",
        description: `Content was successfully ${editingContent ? "updated" : "created"}.`,
      });
    } catch (error) {
      console.error("Error submitting content:", error);
      toast({
        title: "Error",
        description: `There was an error ${editingContent ? "updating" : "creating"} the content.`,
        variant: "destructive",
      });
    }
  };

  const handleEditContent = (content: QuantContent) => {
    console.log("Editing content:", content);

    // Create a deep clone of the content to avoid reference issues
    let contentToEdit = JSON.parse(JSON.stringify(content));

    try {
      // If content is a string, parse it
      if (typeof contentToEdit.content === 'string') {
        // First try to parse the content as JSON
        try {
          const parsedContent = JSON.parse(contentToEdit.content);

          // If parsed content is empty array, use initial value
          if (Array.isArray(parsedContent) && parsedContent.length === 0) {
            contentToEdit.content = initialRichTextValue;
          }
          // If parsed content is array, keep it (valid Slate format)
          else if (Array.isArray(parsedContent)) {
            contentToEdit.content = parsedContent;
          }
          // If parsed content is single node, wrap in array
          else if (typeof parsedContent === 'object' && parsedContent !== null && 'type' in parsedContent) {
            contentToEdit.content = [parsedContent];
          }
          // Otherwise convert to paragraph
          else {
            contentToEdit.content = [{
              type: "paragraph",
              children: [{ text: JSON.stringify(parsedContent) }]
            }];
          }
        } catch (e) {
          // If parsing fails, treat as plain text
          contentToEdit.content = [{
            type: "paragraph",
            children: [{ text: contentToEdit.content || "" }]
          }];
        }
      }
      // If content is already parsed
      else if (typeof contentToEdit.content === 'object') {
        if (Array.isArray(contentToEdit.content)) {
          if (contentToEdit.content.length === 0) {
            contentToEdit.content = initialRichTextValue;
          }
        } else if (contentToEdit.content === null) {
          contentToEdit.content = initialRichTextValue;
        } else if ('type' in contentToEdit.content) {
          contentToEdit.content = [contentToEdit.content];
        }
      } else {
        contentToEdit.content = initialRichTextValue;
      }

      console.log("Prepared content for editor:", {
        type: typeof contentToEdit.content,
        value: contentToEdit.content
      });

      // Set the properly prepared content
      setEditingContent(contentToEdit);
      setViewingContent(null);
      setIsContentDialogOpen(true);

      // Add a small delay to ensure the dialog is open before focusing
      setTimeout(() => {
        const editor = document.querySelector('.rich-text-editor-wrapper');
        if (editor) {
          editor.scrollIntoView({ behavior: 'smooth' });
        }
      }, 200);
    } catch (error) {
      console.error("Error preparing content for editor:", error);
      toast({
        title: "Error",
        description: "Failed to load content into editor. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleViewContent = (content: QuantContent) => {
    setViewingContent(content);
    setEditingContent(null);
  };

  const handleDeleteContent = (id: number) => {
    setContentToDeleteId(id);
    setIsDeleteContentDialogOpen(true);
  };

  const confirmDeleteContent = async () => {
    if (contentToDeleteId && selectedTopicId) {
      try {
        await deleteContentMutation.mutateAsync({
          id: contentToDeleteId,
          topicId: selectedTopicId
        });
        setIsDeleteContentDialogOpen(false);
        setContentToDeleteId(null);
      } catch (error) {
        console.error("Error deleting content:", error);
      }
    }
  };

  // Render loading state
  if (isTopicsLoading) {
    return (
      <div className="space-y-6">
        <Card className="mb-8 border shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Quantitative Content Editor</CardTitle>
            <CardDescription>
              Create and edit math content with an intuitive rich text editor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full py-10 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <div className="text-sm text-muted-foreground">Loading content data...</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="mb-8 border shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Quantitative Content Editor</CardTitle>
          <CardDescription>
            Create and edit math content with an intuitive rich text editor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6 bg-blue-50 dark:bg-blue-950">
            <InfoIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertTitle className="text-blue-600 dark:text-blue-400">Content Editor</AlertTitle>
            <AlertDescription className="text-blue-700 dark:text-blue-300">
              Create and edit your quantitative content with the rich text editor below. Preview your content
              before publishing to ensure it appears correctly for students.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="w-full">
              {/* Topics list section */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Topics</CardTitle>
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditingTopic(null);
                      setIsTopicDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    New Topic
                  </Button>
                </CardHeader>
                <CardContent>
                  <TopicsFilter
                    searchTerm={internalSearchTerm}
                    onSearchChange={setInternalSearchTerm}
                    selectedCategory={selectedCategory}
                    onCategoryChange={setSelectedCategory}
                    groupNumber={selectedGroup}
                    onGroupChange={setSelectedGroup}
                    availableGroups={groups}
                  />

                  <div className="mt-4">
                    <TopicsList
                      topics={filteredTopics}
                      isLoading={isTopicsLoading}
                      onEditTopic={(topic) => {
                        handleEditTopic(topic);
                        setIsTopicDialogOpen(true);
                      }}
                      onDeleteTopic={handleDeleteTopic}
                      onSelectTopic={setSelectedTopicId}
                      selectedTopicId={selectedTopicId}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Topic Create/Edit Dialog */}
              <Dialog
                open={isTopicDialogOpen}
                onOpenChange={(open) => {
                  setIsTopicDialogOpen(open);
                  if (!open) setEditingTopic(null);
                }}
              >
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>
                      {editingTopic ? "Edit Topic" : "Create New Topic"}
                    </DialogTitle>
                    <DialogDescription>
                      Fill in the topic details below. Click save when you're done.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="py-4">
                    <QuantTopicForm
                      onSubmit={(data) => {
                        handleTopicSubmit(data);
                        setIsTopicDialogOpen(false);
                      }}
                      editingTopic={editingTopic}
                      isPending={createTopicMutation.isPending || updateTopicMutation.isPending}
                      allTopics={topics || []}
                    />
                  </div>

                  <DialogFooter className="flex items-center justify-between border-t pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsTopicDialogOpen(false);
                        setEditingTopic(null);
                      }}
                    >
                      Cancel
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Content Section */}
            {selectedTopicId && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>
                      Content for{" "}
                      {topics?.find(t => t.id === selectedTopicId)?.name || "Selected Topic"}
                    </CardTitle>
                    {topics?.find(t => t.id === selectedTopicId)?.description && (
                      <CardDescription>
                        {topics.find(t => t.id === selectedTopicId)?.description}
                      </CardDescription>
                    )}
                  </div>

                  <Button
                    size="sm"
                    onClick={() => {
                      setEditingContent(null);
                      setIsContentDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    New Content
                  </Button>
                </CardHeader>

                <CardContent>
                  {isContentsLoading ? (
                    <div className="p-10 flex items-center justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    </div>
                  ) : contents.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <p>No content available for this topic.</p>
                      <p className="text-sm mt-1">Click 'New Content' to add content to this topic.</p>
                    </div>
                  ) : viewingContent ? (
                    <ContentViewer
                      content={viewingContent}
                      onClose={() => setViewingContent(null)}
                      onEditComplete={(updatedContent) => {
                        setViewingContent(updatedContent);
                        refetchContents();
                      }}
                    />
                  ) : (
                    <ContentList
                      contents={contents}
                      isLoading={isContentsLoading}
                      onEditContent={handleEditContent}
                      onDeleteContent={handleDeleteContent}
                      onViewContent={handleViewContent}
                    />
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Content Create/Edit Dialog */}
          <Dialog
            open={isContentDialogOpen}
            onOpenChange={(open) => {
              setIsContentDialogOpen(open);
              if (!open) setEditingContent(null);
            }}
          >
            <DialogContent className="w-[95vw] sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingContent
                    ? `Edit Content: ${editingContent.title || "Untitled"}`
                    : "Create New Content"}
                </DialogTitle>
                <DialogDescription>
                  {editingContent
                    ? `Editing content ID: ${editingContent.id}. Make your changes and click save when done.`
                    : "Fill in the content details below. Click save when you're done."}
                </DialogDescription>
              </DialogHeader>

              <div className="py-4">
                <QuantContentForm
                  onSubmit={(data) => {
                    handleContentSubmit(data);
                    setIsContentDialogOpen(false);
                  }}
                  topics={topics}
                  selectedTopicId={selectedTopicId}
                  editingContent={editingContent}
                  isPending={createContentMutation.isPending || updateContentMutation.isPending}
                />
              </div>

              <DialogFooter className="flex items-center justify-between border-t pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsContentDialogOpen(false);
                    setEditingContent(null);
                  }}
                >
                  Cancel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete confirmation dialogs */}
          <DeleteConfirmDialog
            isOpen={isDeleteTopicDialogOpen}
            setIsOpen={setIsDeleteTopicDialogOpen}
            onConfirm={confirmDeleteTopic}
            isDeleting={deleteTopicMutation.isPending}
            title="Delete Topic"
            description="Are you sure you want to delete this topic? This will also delete all associated content and cannot be undone."
          />

          <DeleteConfirmDialog
            isOpen={isDeleteContentDialogOpen}
            setIsOpen={setIsDeleteContentDialogOpen}
            onConfirm={confirmDeleteContent}
            isDeleting={deleteContentMutation.isPending}
            title="Delete Content"
            description="Are you sure you want to delete this content? This action cannot be undone."
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default QuantitativeContentManager;