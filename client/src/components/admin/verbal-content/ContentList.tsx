import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { 
  Pencil, 
  Trash2, 
  MoreVertical, 
  Plus, 
  ArrowLeft, 
  Loader2,
  FileText
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { VerbalContent, VerbalTopic } from "./types";
// Import enhanced rich text editor components
import { RichTextContent } from "@/lib/rich-text-editor";

interface ContentListProps {
  contents: VerbalContent[] | undefined;
  selectedTopic: VerbalTopic | undefined;
  isLoading: boolean;
  onEditContent: (content: VerbalContent) => void;
  onDeleteContent: (params: { id: number; topicId: number }) => void;
  onCreateContent: () => void;
  onBackToTopics: () => void;
  isDeletingContent: boolean;
}

const ContentList: React.FC<ContentListProps> = ({
  contents = [],
  selectedTopic,
  isLoading,
  onEditContent,
  onDeleteContent,
  onCreateContent,
  onBackToTopics,
  isDeletingContent,
}) => {
  const [contentToDelete, setContentToDelete] = useState<number | null>(null);
  const [contentToView, setContentToView] = useState<VerbalContent | null>(null);
  
  const handleDeleteClick = (contentId: number) => {
    setContentToDelete(contentId);
  };

  const handleDeleteConfirm = () => {
    if (contentToDelete !== null && selectedTopic) {
      onDeleteContent({ id: contentToDelete, topicId: selectedTopic.id });
      setContentToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setContentToDelete(null);
  };

  const handleViewContent = (content: VerbalContent) => {
    setContentToView(content);
  };

  function parseContent(content: any) {
    if (typeof content === 'string') {
      try {
        return JSON.parse(content);
      } catch (e) {
        return content;
      }
    }
    return content;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={onBackToTopics}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardTitle>{selectedTopic?.title} - Content</CardTitle>
        </div>
        <Button onClick={onCreateContent}>
          <Plus className="mr-2 h-4 w-4" />
          New Content
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : contents.length === 0 ? (
          <EmptyState
            title="No content found"
            description={`No content has been added to the "${selectedTopic?.title}" topic yet.`}
            actionText="Add Content"
            onAction={onCreateContent}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Order</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contents.map((content) => (
                <TableRow key={content.id}>
                  <TableCell className="font-medium">{content.title}</TableCell>
                  <TableCell>{content.order}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleViewContent(content)}>
                          <FileText className="mr-2 h-4 w-4" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEditContent(content)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDeleteClick(content.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <AlertDialog open={contentToDelete !== null} onOpenChange={handleDeleteCancel}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this content? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeletingContent}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isDeletingContent}
              >
                {isDeletingContent && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Content Preview Dialog */}
        <Dialog open={contentToView !== null} onOpenChange={() => setContentToView(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{contentToView?.title}</DialogTitle>
              <DialogDescription>
                Content Preview
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              {contentToView && (
                <RichTextContent
                  content={typeof contentToView.content === 'string'
                    ? contentToView.content
                    : JSON.stringify(contentToView.content)
                  }
                  className="prose dark:prose-invert max-w-none"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default ContentList;
