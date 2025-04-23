import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Save, Eye, Edit, AlertTriangle } from "lucide-react";
import { RichTextEditorIntegration, RichTextContent } from "@/lib/rich-text-editor";
import { useToast } from "@/hooks/use-toast";

import { 
  QuantTopic, 
  QuantContent, 
  QuantContentFormValues, 
  quantContentSchema,
  initialRichTextValue,
} from "./types";

interface QuantContentFormProps {
  onSubmit: (data: QuantContentFormValues) => void;
  topics: QuantTopic[];
  selectedTopicId: number | null;
  editingContent: QuantContent | null;
  isPending: boolean;
  onCancel?: () => void;
}

const QuantContentForm: React.FC<QuantContentFormProps> = ({
  onSubmit,
  topics,
  selectedTopicId,
  editingContent,
  isPending,
  onCancel,
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("edit");

  // Function to parse and prepare content for the editor
  const prepareEditorContent = (content: any): string => {
    try {
      // If content is a string, try to parse it as JSON
      if (typeof content === 'string') {
        try {
          const parsedContent = JSON.parse(content);
          // If it's already in the correct format, stringify it back
          return JSON.stringify(parsedContent);
        } catch (e) {
          // If parsing fails, convert to paragraph format
          return JSON.stringify([{
            type: "paragraph",
            children: [{ text: content }]
          }]);
        }
      }

      // If content is an array, stringify it
      if (Array.isArray(content)) {
        return JSON.stringify(content);
      }

      // If content is an object with type and children, wrap in array
      if (content && typeof content === 'object' && 'type' in content && 'children' in content) {
        return JSON.stringify([content]);
      }

      // Default to initial value
      console.log("Using initial value for content", initialRichTextValue);
      return JSON.stringify(initialRichTextValue);
    } catch (e) {
      console.error('Error preparing editor content:', e);
      return JSON.stringify(initialRichTextValue);
    }
  };

  // Get form default values
  const getDefaultValues = (): QuantContentFormValues => {
    if (editingContent) {
      console.log('Processing editing content:', editingContent);
      const preparedContent = prepareEditorContent(editingContent.content);
      console.log('Prepared content:', preparedContent);

      return {
        title: editingContent.title || "",
        topicId: editingContent.topicId || selectedTopicId || 0,
        order: editingContent.order || 1,
        content: preparedContent
      };
    }

    return {
      title: "",
      topicId: selectedTopicId || 0,
      order: 1,
      content: JSON.stringify(initialRichTextValue)
    };
  };

  const form = useForm<QuantContentFormValues>({
    resolver: zodResolver(quantContentSchema),
    defaultValues: getDefaultValues(),
  });

  // Watch form fields for preview
  const watchContent = form.watch("content");
  const watchTitle = form.watch("title");
  const selectedTopic = topics.find(t => t.id === form.getValues().topicId);

  // Update form when editing content changes
  useEffect(() => {
    if (editingContent) {
      console.log('Resetting form with editing content:', editingContent);
      const values = getDefaultValues();
      console.log('Form values being set:', values);
      form.reset(values);
      setActiveTab("edit");
    }
  }, [editingContent, form]);

  const handleSubmit = (data: QuantContentFormValues) => {
    if (data.topicId === 0) {
      toast({
        title: "Please select a topic",
        description: "You must select a topic for this content.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Ensure content is in the correct format
      const processedData = {
        ...data,
        content: typeof data.content === 'string' ? data.content : JSON.stringify(data.content)
      };
      onSubmit(processedData);
    } catch (error) {
      console.error('Error processing content:', error);
      toast({
        title: "Invalid content format",
        description: "The content format appears to be invalid. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="bg-background border rounded-md p-4">
      <Tabs defaultValue="edit" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold">
              {editingContent ? `Edit Content: ${editingContent.title}` : "Add New Content"}
            </h3>
            {editingContent && (
              <p className="text-xs text-muted-foreground mt-1">
                ID: {editingContent.id} • Topic: {topics.find(t => t.id === editingContent.topicId)?.name || "Unknown"}
              </p>
            )}
          </div>
          <TabsList>
            <TabsTrigger value="edit" className="flex items-center gap-1">
              <Edit className="h-4 w-4" />
              Edit
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="edit" className="mt-0">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter content title" {...field} />
                      </FormControl>
                      <FormDescription>
                        A clear, descriptive title for this content section
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="topicId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Topic</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          defaultValue={field.value ? field.value.toString() : undefined}
                          value={field.value ? field.value.toString() : undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select topic" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {topics && topics.length > 0 ? (
                              topics.map((topic) => (
                                <SelectItem key={topic.id} value={topic.id.toString()}>
                                  {topic.name || `Topic ${topic.id}`}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="0" disabled>No topics available</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="order"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Order</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={1} 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <div className="border rounded-md min-h-[400px] overflow-hidden">
                        <RichTextEditorIntegration
                          value={field.value}
                          onChange={(value) => {
                            console.log("Editor value updated:", value);
                            field.onChange(value);
                          }}
                          placeholder="Enter content here..."
                          minHeight="400px"
                          className="w-full h-full"
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Use the rich text editor to format content with headings, lists, math formulas, etc.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end pt-4 space-x-2">
                {onCancel && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={onCancel}
                  >
                    Cancel
                  </Button>
                )}
                <Button 
                  type="submit" 
                  disabled={isPending}
                  className="flex items-center gap-1"
                >
                  {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  <Save className="h-4 w-4" />
                  {editingContent ? "Update Content" : "Create Content"}
                </Button>
              </div>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="preview" className="mt-0">
          <Card>
            <CardContent className="pt-6">
              {selectedTopic ? (
                <div className="text-sm text-muted-foreground mb-2">
                  Topic: {selectedTopic?.name || `Topic ${selectedTopic?.id}`}
                </div>
              ) : (
                <Alert className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    No topic selected. Please select a topic in the Edit tab.
                  </AlertDescription>
                </Alert>
              )}

              <h2 className="text-2xl font-bold mb-4">{watchTitle || "Untitled Content"}</h2>

              <ScrollArea className="h-[400px] rounded-md border p-4">
                <div>
                  <RichTextContent
                    content={watchContent}
                    className="prose dark:prose-invert max-w-none"
                    isEditing={!!editingContent}
                    emptyMessage={editingContent 
                      ? "This content is currently empty. Switch to the Edit tab to add content." 
                      : "No content to preview. Start editing in the Edit tab."}
                  />
                </div>
              </ScrollArea>

              <div className="mt-4 flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab("edit")}
                  className="flex items-center gap-1"
                >
                  <Edit className="h-4 w-4" />
                  Continue Editing
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QuantContentForm;