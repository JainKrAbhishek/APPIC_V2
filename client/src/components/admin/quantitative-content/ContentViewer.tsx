import React, { useState } from "react";
import { X, Maximize2, Minimize2, Code, Eye, Edit, Save, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
// Import the enhanced rich text editor integration
import { RichTextEditorIntegration, RichTextContent } from "@/lib/rich-text-editor";
// Keep legacy import for backward compatibility
import { RichTextEditor } from "@/lib/RichTextEditor";
import { QuantContent, QuantContentFormValues } from "./types";
import { useUpdateQuantContent } from "./hooks";

interface ContentViewerProps {
  content: QuantContent | null;
  onClose: () => void;
  onEditComplete?: (updatedContent: QuantContent) => void;
}

const ContentViewer: React.FC<ContentViewerProps> = ({ 
  content, 
  onClose,
  onEditComplete
}) => {
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("preview");
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState<any>(null);
  const [showJsonWarning, setShowJsonWarning] = useState(false);
  
  // Mutation for updating content
  const updateContentMutation = useUpdateQuantContent();
  
  if (!content) return null;

  // Function to parse content if it's a string
  const getParsedContent = () => {
    if (!content.content) return null;
    
    // If content is already an array of objects (slate format)
    if (Array.isArray(content.content)) {
      return content.content;
    }
    
    // If content is a string, try to parse it
    if (typeof content.content === 'string') {
      try {
        return JSON.parse(content.content);
      } catch (e) {
        return null;
      }
    }
    
    return content.content;
  };
  
  const parsedContent = getParsedContent();

  // Start editing mode
  const handleEditClick = () => {
    console.log("Starting edit mode with content:", { 
      title: content.title, 
      parsedContent, 
      rawContent: content.content
    });
    
    setEditTitle(content.title);
    
    // Make sure to properly format the content for the editor
    let formattedContent;
    
    // Handle different content formats
    if (typeof content.content === 'string') {
      // Check if it's already valid JSON
      try {
        const parsed = JSON.parse(content.content);
        
        // If it parses successfully, check if it's the right format
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Valid Slate array format
          formattedContent = content.content; // Keep as JSON string
          console.log("Content is valid Slate array JSON string");
        } else if (typeof parsed === 'object' && parsed !== null && 
                  'type' in parsed && 'children' in parsed) {
          // Single Slate element, wrap in array
          formattedContent = JSON.stringify([parsed]);
          console.log("Content is single Slate element, wrapping in array");
        } else {
          // Not in Slate format, convert to paragraph
          formattedContent = JSON.stringify([{
            type: 'paragraph',
            children: [{ text: JSON.stringify(parsed) }]
          }]);
          console.log("Content is not in Slate format, converting to paragraph");
        }
      } catch (e) {
        // Not valid JSON, convert to paragraph
        formattedContent = JSON.stringify([{
          type: 'paragraph',
          children: [{ text: content.content }]
        }]);
        console.log("Content is not valid JSON, converting to paragraph");
      }
    } else if (typeof content.content === 'object' && content.content !== null) {
      // Already an object, check format
      if (Array.isArray(content.content) && content.content.length > 0) {
        // Proper Slate array
        formattedContent = JSON.stringify(content.content);
        console.log("Content is Slate array object, stringifying");
      } else if ('type' in content.content && 'children' in content.content) {
        // Single element, wrap in array
        formattedContent = JSON.stringify([content.content]);
        console.log("Content is single Slate element object, wrapping & stringifying");
      } else {
        // Unknown object format
        formattedContent = JSON.stringify([{
          type: 'paragraph',
          children: [{ text: JSON.stringify(content.content) }]
        }]);
        console.log("Content is unknown object format, converting to paragraph");
      }
    } else {
      // Fallback for null or undefined
      formattedContent = JSON.stringify([{
        type: 'paragraph',
        children: [{ text: '' }]
      }]);
      console.log("Content is null/undefined, creating empty editor");
    }
    
    // Set the content for the editor
    setEditContent(formattedContent);
    console.log("Editor content set to:", formattedContent.substring(0, 100) + "...");
    
    // First set editing mode and then set the active tab after a small delay
    // This ensures the tab content is rendered properly before setting the active tab
    setIsEditing(true);
    
    // Use a small timeout to ensure the edit tab is fully rendered before switching to it
    setTimeout(() => {
      setActiveTab("edit");
    }, 50);
  };

  // Save changes
  const handleSaveClick = async () => {
    try {
      if (!content) return;
      
      // Ensure content is properly formatted for storage
      let formattedContent = editContent;
      
      // Handle different content formats for submission
      if (typeof editContent !== 'string') {
        formattedContent = JSON.stringify(editContent);
      } else {
        // Check if it's already a stringified JSON (to avoid double stringifying)
        try {
          JSON.parse(editContent);
          // It's already valid JSON string, keep as is
          formattedContent = editContent;
        } catch (e) {
          // Not a valid JSON string, wrap it in the basic structure
          formattedContent = JSON.stringify([{
            type: 'paragraph',
            children: [{ text: editContent }]
          }]);
        }
      }
      
      const updatedData: QuantContentFormValues = {
        title: editTitle,
        content: formattedContent,
        topicId: content.topicId,
        order: content.order,
      };
      
      console.log("Saving content with format:", typeof formattedContent, 
                  formattedContent.substring(0, 100) + "...");
      
      await updateContentMutation.mutateAsync({
        id: content.id,
        data: updatedData
      });
      
      // Update local content state if needed
      if (onEditComplete) {
        onEditComplete({
          ...content,
          title: editTitle,
          content: formattedContent,
        });
      }
      
      setIsEditing(false);
      setActiveTab("preview");
      
      toast({
        title: "Success",
        description: "Content updated successfully",
      });
    } catch (error) {
      console.error("Error updating content:", error);
      
      toast({
        title: "Error",
        description: "Failed to update content",
        variant: "destructive",
      });
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditTitle("");
    setEditContent(null);
    setActiveTab("preview");
  };

  return (
    <Card className={`border rounded-lg shadow-md overflow-hidden transition-all duration-300 ${isExpanded ? 'fixed inset-4 z-50' : 'mb-6'}`}>
      <div className="flex justify-between items-center p-4 border-b">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-bold">{content.title}</h3>
          <Badge variant="outline">ID: {content.id}</Badge>
          <Badge variant="secondary">Topic ID: {content.topicId}</Badge>
        </div>
        <div className="flex gap-2">
          {!isEditing && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleEditClick}
              title="Edit content"
              className="flex items-center gap-1"
            >
              <Edit className="h-4 w-4" />
              <span className="hidden sm:inline">Edit</span>
            </Button>
          )}
          
          {isEditing && (
            <>
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleSaveClick}
                title="Save changes"
                className="flex items-center gap-1"
                disabled={updateContentMutation.isPending}
              >
                {updateContentMutation.isPending ? (
                  <>
                    <span className="h-4 w-4 animate-spin mr-1" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span className="hidden sm:inline">Save</span>
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCancelEdit}
                title="Cancel editing"
                className="flex items-center gap-1"
              >
                <X className="h-4 w-4" />
                <span className="hidden sm:inline">Cancel</span>
              </Button>
            </>
          )}
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Minimize" : "Maximize"}
          >
            {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          
          <Button variant="ghost" size="icon" onClick={onClose} title="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 m-4">
          <TabsTrigger value="preview" className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            Preview
          </TabsTrigger>
          {isEditing && (
            <TabsTrigger value="edit" className="flex items-center gap-1">
              <Edit className="h-4 w-4" />
              Edit
            </TabsTrigger>
          )}
          <TabsTrigger value="code" className="flex items-center gap-1">
            <Code className="h-4 w-4" />
            JSON Structure
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="preview" className="mt-0">
          <CardContent>
            <ScrollArea className={`${isExpanded ? 'h-[calc(100vh-200px)]' : 'h-[500px]'}`}>
              <div className="p-4">
                {parsedContent ? (
                  <RichTextContent 
                    content={typeof parsedContent === 'string' 
                      ? parsedContent 
                      : JSON.stringify(parsedContent)
                    }
                    className="prose dark:prose-invert max-w-none"
                  />
                ) : (
                  <div className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-800">
                    <p className="font-medium mb-2">Content format error:</p>
                    <p className="text-sm text-muted-foreground">
                      The content could not be parsed properly. Check the JSON Structure tab for details.
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </TabsContent>
        
        {isEditing && (
          <TabsContent value="edit" className="mt-0">
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-title">Title</Label>
                  <Input 
                    id="edit-title"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-content">Content</Label>
                  <div className="mt-1">
                    <RichTextEditorIntegration 
                      value={(() => {
                        try {
                          if (typeof editContent === 'string') {
                            return JSON.parse(editContent);
                          } else {
                            return editContent || [{ type: 'paragraph', children: [{ text: '' }] }];
                          }
                        } catch (err) {
                          console.error('Failed to parse content:', err);
                          return [{ type: 'paragraph', children: [{ text: editContent || '' }] }];
                        }
                      })()}
                      onChange={(value) => {
                        setEditContent(value);
                        setShowJsonWarning(true);
                      }}
                      minHeight="400px"
                    />
                  </div>
                </div>
                
                {showJsonWarning && (
                  <Alert className="bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800/30 dark:text-yellow-500">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Changes to the content will be saved in the editor format. 
                      If you need to modify the JSON structure directly, use the JSON Structure tab.
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="flex justify-end gap-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveClick}
                    disabled={updateContentMutation.isPending}
                  >
                    {updateContentMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </TabsContent>
        )}
        
        <TabsContent value="code" className="mt-0">
          <CardContent>
            <ScrollArea className={`${isExpanded ? 'h-[calc(100vh-200px)]' : 'h-[500px]'}`}>
              <pre className="text-xs rounded bg-muted p-4 overflow-auto">
                {JSON.stringify(content.content, null, 2)}
              </pre>
            </ScrollArea>
          </CardContent>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default ContentViewer;