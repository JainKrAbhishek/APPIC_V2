import React, { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Descendant } from "slate";
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
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, Save, Eye, Edit, AlertTriangle, 
  LayoutGrid, Bookmark, Copy, Download, 
  FileText, CheckSquare, Clock, ListChecks 
} from "lucide-react";
import { RichTextEditorIntegration, RichTextContent } from "@/lib/rich-text-editor";
import { CustomElement, CustomText } from "@/lib/rich-text-editor/types";
import { useToast } from "@/hooks/use-toast";
import './student-view.css';

import {
  VerbalContent,
  VerbalTopic,
  VerbalContentFormValues,
  verbalContentSchema,
  initialRichTextValue,
  RichTextContent as RichTextContentType,
  contentTemplates,
  ExtendedDescendant
} from "./types";

import { RichTextContentRenderer, isRichTextEmpty } from "./RichTextContentRenderer";

interface VerbalContentFormProps {
  onSubmit: (data: VerbalContentFormValues) => void;
  editingContent: VerbalContent | null;
  topics: VerbalTopic[];
  selectedTopicId: number | null;
  isPending: boolean;
  onCancel?: () => void;
}

/**
 * Enhanced converter that properly handles all rich text element types
 * Converts database format to Slate editor format with improved debugging
 */
const convertToEditorFormat = (content: any): RichTextContentType => {
  try {
    // Handle empty content
    if (!content) {
      console.debug("convertToEditorFormat: Empty content provided");
      return initialRichTextValue;
    }

    console.debug("convertToEditorFormat: Processing content:", { 
      type: typeof content, 
      isString: typeof content === 'string',
      sample: typeof content === 'string' ? content.substring(0, 50) + '...' : 'not a string',
      isObject: typeof content === 'object',
      isArray: Array.isArray(content)
    });

    // Parse string content if needed
    const parsedContent = typeof content === 'string' ? JSON.parse(content) : content;
    
    console.debug("convertToEditorFormat: After parsing:", { 
      isObject: typeof parsedContent === 'object',
      isArray: Array.isArray(parsedContent),
      type: Array.isArray(parsedContent) ? 'array' : typeof parsedContent,
      hasType: parsedContent && typeof parsedContent === 'object' && 'type' in parsedContent,
      hasBlocks: parsedContent && typeof parsedContent === 'object' && 'blocks' in parsedContent
    });

    // Handle database format with blocks
    if (parsedContent && typeof parsedContent === 'object' && 
        'type' in parsedContent && parsedContent.type === 'content' && 
        'blocks' in parsedContent && Array.isArray(parsedContent.blocks)) {
      
      console.debug("convertToEditorFormat: Converting database format with blocks", {
        blockCount: parsedContent.blocks.length,
        firstBlock: parsedContent.blocks.length > 0 ? parsedContent.blocks[0] : null
      });
      
      // Map blocks to Slate format
      return parsedContent.blocks.map((block: any) => {
        // Handle paragraph and headings
        if (block.type === 'paragraph' || 
            block.type === 'heading-one' || 
            block.type === 'heading-two' || 
            block.type === 'heading-three') {
          return {
            type: block.type,
            children: [{ text: block.data?.text || '' }]
          };
        }
        
        // Handle lists
        if (block.type === 'list' && block.data && Array.isArray(block.data.items)) {
          return {
            type: block.data.style === 'ordered' ? 'numbered-list' : 'bulleted-list',
            children: block.data.items.map((item: string) => ({
              type: 'list-item',
              children: [{ text: item || '' }]
            }))
          };
        }
        
        // Handle images
        if (block.type === 'image' && block.data) {
          return {
            type: 'image',
            url: block.data.url || '',
            alt: block.data.alt || '',
            caption: block.data.caption || '',
            imageAlign: block.data.align || 'center',
            children: [{ text: '' }]
          };
        }
        
        // Handle formulas/math
        if (block.type === 'formula' && block.data) {
          return {
            type: 'formula',
            formula: block.data.formula || '',
            children: [{ text: '' }]
          };
        }
        
        // Handle quotes
        if (block.type === 'quote' && block.data) {
          return {
            type: 'block-quote',
            children: [{ text: block.data.text || '' }]
          };
        }
        
        // Default case for any other block type or unknown structure
        return {
          type: 'paragraph',
          children: [{ 
            text: block.data && typeof block.data.text === 'string' 
              ? block.data.text 
              : '' 
          }]
        };
      });
    }

    // If already in editor format (array of nodes), validate and return
    if (Array.isArray(parsedContent)) {
      // Check if content has valid nodes
      const hasValidNodes = parsedContent.some(node => 
        typeof node === 'object' && node !== null && 'type' in node && 'children' in node
      );
      
      if (hasValidNodes) {
        console.debug("convertToEditorFormat: Content already in editor format");
        return parsedContent;
      } else {
        console.warn("convertToEditorFormat: Invalid array format, using default");
      }
    }

    // If we got here, we have an unknown format
    console.warn('convertToEditorFormat: Unknown content format, using default:', parsedContent);
    return initialRichTextValue;
  } catch (error) {
    console.error('convertToEditorFormat: Error converting to editor format', error);
    return initialRichTextValue;
  }
};

// Helper function to safely cast Slate Descendant type to CustomElement
// Uses our ExtendedDescendant type for safer property access
const asCustomElement = (node: Descendant): CustomElement => {
  const extendedNode = node as ExtendedDescendant;
  
  if (extendedNode.type && extendedNode.children) {
    return {
      type: extendedNode.type,
      children: extendedNode.children,
      ...extendedNode
    } as CustomElement;
  }
  
  // Fallback for text nodes or invalid nodes
  return {
    type: 'paragraph',
    children: [{ text: extendedNode.text || '' }]
  };
};

/**
 * Enhanced converter that properly preserves all rich text element types
 * Converts Slate editor format to database format
 */
const convertToDatabaseFormat = (content: RichTextContentType) => {
  return {
    type: 'content',
    blocks: content.map((node: ExtendedDescendant, index: number) => {
      // Safely cast to CustomElement
      const elem = asCustomElement(node);
      
      // Handle different node types
      switch (elem.type) {
        case 'paragraph':
          return {
            id: String(index + 1),
            type: 'paragraph',
            data: {
              text: elem.children?.map((child: { text: string }) => child.text).join('') || ''
            }
          };
          
        case 'heading-one':
        case 'heading-two':
        case 'heading-three':
          return {
            id: String(index + 1),
            type: elem.type,
            data: {
              text: elem.children?.map((child: { text: string }) => child.text).join('') || '',
              level: elem.type === 'heading-one' ? 1 : 
                    elem.type === 'heading-two' ? 2 : 3
            }
          };
          
        case 'bulleted-list':
        case 'numbered-list':
          return {
            id: String(index + 1),
            type: 'list',
            data: {
              style: elem.type === 'numbered-list' ? 'ordered' : 'unordered',
              items: elem.children?.map((item: any) => 
                item.children?.map((c: any) => c.text).join('') || ''
              ) || []
            }
          };
          
        case 'image':
          return {
            id: String(index + 1),
            type: 'image',
            data: {
              url: elem.url || '',
              caption: elem.caption || '',
              alt: elem.alt || '',
              align: elem.imageAlign || 'center'
            }
          };
          
        case 'formula':
          return {
            id: String(index + 1),
            type: 'formula',
            data: {
              formula: elem.formula || ''
            }
          };
          
        case 'block-quote':
          return {
            id: String(index + 1),
            type: 'quote',
            data: {
              text: elem.children?.map((child: { text: string }) => child.text).join('') || ''
            }
          };
          
        case 'code-block':
          return {
            id: String(index + 1),
            type: 'code',
            data: {
              text: elem.children?.map((child: { text: string }) => child.text).join('') || ''
            }
          };
          
        default:
          // Default case for unknown types
          return {
            id: String(index + 1),
            type: elem.type,
            data: {
              text: elem.children?.map((child: { text: string }) => child.text).join('') || ''
            }
          };
      }
    })
  };
};

/**
 * Enhanced Verbal Content Form component with real-time preview
 * and improved editor functionality
 */
const VerbalContentForm: React.FC<VerbalContentFormProps> = ({
  onSubmit,
  editingContent,
  topics,
  selectedTopicId,
  isPending,
  onCancel,
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("edit");
  const [editorContent, setEditorContent] = useState<RichTextContentType>(initialRichTextValue);
  const [wordCount, setWordCount] = useState<number>(0);
  const [charCount, setCharCount] = useState<number>(0);
  const [readTime, setReadTime] = useState<number>(0);
  const [studentView, setStudentView] = useState<boolean>(false);

  // Initialize form with validation
  const form = useForm<VerbalContentFormValues>({
    resolver: zodResolver(verbalContentSchema),
    defaultValues: {
      title: "",
      topicId: selectedTopicId || 0,
      order: 1,
      content: initialRichTextValue
    },
  });

  // Get watched values from form
  const watchTitle = form.watch("title");
  const watchTopicId = form.watch("topicId");
  
  // Find selected topic from topics array
  const selectedTopic = topics.find(t => t.id === watchTopicId) || 
    (selectedTopicId ? topics.find(t => t.id === selectedTopicId) : null);
  
  // Function to calculate text statistics
  const calculateTextStats = useCallback((content: RichTextContentType) => {
    let textContent = '';
    
    // Extract text from all nodes
    const extractText = (nodes: Descendant[]) => {
      nodes.forEach(node => {
        const extNode = node as ExtendedDescendant;
        if (extNode.text !== undefined) {
          // This is a text node (CustomText)
          textContent += extNode.text + ' ';
        } else if (extNode.children) {
          // This is an element node (CustomElement)
          extractText(extNode.children);
        }
      });
    };
    
    extractText(content);
    
    // Calculate statistics
    const words = textContent.trim().split(/\s+/).filter(Boolean).length;
    const chars = textContent.replace(/\s+/g, '').length;
    const wpm = 200; // Average reading speed words per minute
    const minutes = Math.ceil(words / wpm);
    
    setWordCount(words);
    setCharCount(chars);
    setReadTime(minutes);
  }, []);
    
  // Function to load a template based on the topic type
  const loadTemplate = useCallback((topicType: string) => {
    const template = contentTemplates[topicType] || initialRichTextValue;
    setEditorContent(template);
    calculateTextStats(template);
    form.setValue('content', template, { shouldValidate: true });
    
    toast({
      title: "Template loaded",
      description: `Loaded template for ${topicType.replace('_', ' ')} content`,
    });
  }, [form, toast, calculateTextStats]);

  // Function to calculate text statistics
  // Initialize form with existing content
  useEffect(() => {
    if (editingContent) {
      try {
        const editorFormat = convertToEditorFormat(editingContent.content);
        
        setEditorContent(editorFormat);
        calculateTextStats(editorFormat);
        
        form.reset({
          title: editingContent.title,
          topicId: editingContent.topicId,
          order: editingContent.order,
          content: editorFormat
        });
      } catch (error) {
        console.error('Error loading content:', error);
        toast({
          title: "Error loading content",
          description: "There was a problem loading the content. Some formatting may be lost.",
          variant: "destructive"
        });
      }
    } else {
      setEditorContent(initialRichTextValue);
      calculateTextStats(initialRichTextValue);
      
      form.reset({
        title: "",
        topicId: selectedTopicId || 0,
        order: 1,
        content: initialRichTextValue
      });
    }
  }, [editingContent, form, selectedTopicId, toast, calculateTextStats]);

  // Handle editor content changes
  const handleEditorChange = useCallback((newContent: RichTextContentType) => {
    // Debug the content received from the editor
    console.debug('Editor content changed:', {
      type: typeof newContent,
      isArray: Array.isArray(newContent),
      length: Array.isArray(newContent) ? newContent.length : 0,
      firstElement: Array.isArray(newContent) && newContent.length > 0 ? 
        JSON.stringify(newContent[0]).substring(0, 100) : 'none'
    });
    
    // Ensure we set consistent content
    let processedContent = newContent;
    if (!Array.isArray(newContent) || newContent.length === 0) {
      console.debug('Converting invalid editor content to initial value');
      processedContent = initialRichTextValue;
    }
    
    setEditorContent(processedContent);
    calculateTextStats(processedContent);
    form.setValue('content', processedContent, { shouldValidate: true });
  }, [form, calculateTextStats]);
  
  // Function to transform content based on the selected topic type
  const getContentProcessor = (content: React.ReactNode): React.ReactNode => {
    if (!selectedTopic || !studentView) {
      return content;
    }
    
    try {
      switch (selectedTopic.type) {
        case 'reading_comprehension':
          return (
            <div className="reading-comprehension-container">
              <div className="reading-passage-container">
                {content}
              </div>
              
              {/* Sample questions section */}
              <div className="reading-questions-container">
                <h3 className="text-lg font-semibold mb-4">Sample Questions</h3>
                
                {/* Question 1 */}
                <div className="question-item">
                  <div className="question-prompt">
                    1. According to the passage, what is the primary reason for the described phenomenon?
                  </div>
                  <div className="question-options">
                    <div className="option"><span className="option-letter">A.</span> Sample answer choice</div>
                    <div className="option"><span className="option-letter">B.</span> Sample answer choice</div>
                    <div className="option"><span className="option-letter">C.</span> Sample answer choice</div>
                    <div className="option"><span className="option-letter">D.</span> Sample answer choice</div>
                    <div className="option"><span className="option-letter">E.</span> Sample answer choice</div>
                  </div>
                </div>
                
                {/* Question 2 */}
                <div className="question-item mt-4">
                  <div className="question-prompt">
                    2. Which of the following would most weaken the argument presented in paragraph 2?
                  </div>
                  <div className="question-options">
                    <div className="option"><span className="option-letter">A.</span> Sample answer choice</div>
                    <div className="option"><span className="option-letter">B.</span> Sample answer choice</div>
                    <div className="option"><span className="option-letter">C.</span> Sample answer choice</div>
                    <div className="option"><span className="option-letter">D.</span> Sample answer choice</div>
                    <div className="option"><span className="option-letter">E.</span> Sample answer choice</div>
                  </div>
                </div>
              </div>
            </div>
          );
          
        case 'critical_reasoning':
          return (
            <div className="critical-reasoning-container">
              <div className="argument-container">
                {content}
              </div>
              
              <div className="question-container mt-4">
                <div className="question-prompt">
                  The argument above assumes that:
                </div>
                <div className="question-options">
                  <div className="option"><span className="option-letter">A.</span> Sample answer choice</div>
                  <div className="option"><span className="option-letter">B.</span> Sample answer choice</div>
                  <div className="option"><span className="option-letter">C.</span> Sample answer choice</div>
                  <div className="option"><span className="option-letter">D.</span> Sample answer choice</div>
                  <div className="option"><span className="option-letter">E.</span> Sample answer choice</div>
                </div>
              </div>
            </div>
          );
          
        case 'text_completion':
          return (
            <div className="text-completion-container">
              <div className="text-container">
                {content}
              </div>
              
              <div className="blanks-container mt-4">
                <div className="blank-section">
                  <div className="blank-label">Blank (i)</div>
                  <div className="blank-options">
                    <div className="option"><span className="option-letter">A.</span> Sample word</div>
                    <div className="option"><span className="option-letter">B.</span> Sample word</div>
                    <div className="option"><span className="option-letter">C.</span> Sample word</div>
                    <div className="option"><span className="option-letter">D.</span> Sample word</div>
                    <div className="option"><span className="option-letter">E.</span> Sample word</div>
                  </div>
                </div>
                
                <div className="blank-section mt-3">
                  <div className="blank-label">Blank (ii)</div>
                  <div className="blank-options">
                    <div className="option"><span className="option-letter">A.</span> Sample word</div>
                    <div className="option"><span className="option-letter">B.</span> Sample word</div>
                    <div className="option"><span className="option-letter">C.</span> Sample word</div>
                    <div className="option"><span className="option-letter">D.</span> Sample word</div>
                    <div className="option"><span className="option-letter">E.</span> Sample word</div>
                  </div>
                </div>
              </div>
            </div>
          );
          
        case 'sentence_equivalence':
          return (
            <div className="sentence-equivalence-container">
              <div className="sentence-container">
                {content}
              </div>
              
              <div className="instructions mt-2 text-sm">
                Select exactly two answer choices that, when used to complete the sentence, fit the meaning of the sentence as a whole and produce completed sentences that are alike in meaning.
              </div>
              
              <div className="options-container mt-3">
                <div className="option-row flex gap-2 flex-wrap">
                  <div className="option"><span className="option-letter">A.</span> Sample word</div>
                  <div className="option"><span className="option-letter">B.</span> Sample word</div>
                  <div className="option"><span className="option-letter">C.</span> Sample word</div>
                </div>
                <div className="option-row flex gap-2 flex-wrap mt-2">
                  <div className="option"><span className="option-letter">D.</span> Sample word</div>
                  <div className="option"><span className="option-letter">E.</span> Sample word</div>
                  <div className="option"><span className="option-letter">F.</span> Sample word</div>
                </div>
              </div>
            </div>
          );
          
        case 'arguments':
          return (
            <div className="arguments-analysis-container">
              <div className="argument-container">
                {content}
              </div>
              
              <div className="instructions-container mt-4 border-t pt-3">
                <div className="instruction-heading font-semibold">Your Task:</div>
                <div className="instruction-text">
                  Write a response in which you examine the stated and/or unstated assumptions of the argument above. Be sure to explain how the argument depends on these assumptions, and what the implications are for the argument if the assumptions prove unwarranted.
                </div>
              </div>
            </div>
          );
          
        default:
          return content;
      }
    } catch (error) {
      console.error("Error processing content for student view:", error);
      return content;
    }
  };
  
  // Function to copy content as markdown
  const copyAsMarkdown = () => {
    // Simple function to extract text from editor nodes
    const extractText = (nodes: Descendant[]): string => {
      let result = '';
      
      nodes.forEach(node => {
        const extNode = node as ExtendedDescendant;
        
        if (extNode.text !== undefined) {
          // Handle leaf text nodes
          let text = extNode.text;
          if (extNode.bold) text = `**${text}**`;
          if (extNode.italic) text = `*${text}*`;
          if (extNode.code) text = '`' + text + '`';
          result += text;
        } else if (extNode.type && extNode.children) {
          // Handle element nodes
          switch (extNode.type) {
            case 'paragraph':
              result += extractText(extNode.children) + '\n\n';
              break;
            case 'heading-one':
              result += '# ' + extractText(extNode.children) + '\n\n';
              break;
            case 'heading-two':
              result += '## ' + extractText(extNode.children) + '\n\n';
              break;
            case 'heading-three':
              result += '### ' + extractText(extNode.children) + '\n\n';
              break;
            case 'bulleted-list':
              extNode.children.forEach(item => {
                result += '- ' + extractText([item]) + '\n';
              });
              result += '\n';
              break;
            case 'numbered-list':
              extNode.children.forEach((item, i) => {
                result += `${i + 1}. ` + extractText([item]) + '\n';
              });
              result += '\n';
              break;
            case 'list-item':
              result += extractText(extNode.children);
              break;
            case 'block-quote':
              result += '> ' + extractText(extNode.children) + '\n\n';
              break;
            case 'formula':
              result += '$$\n' + extNode.formula + '\n$$\n\n';
              break;
            case 'image':
              result += `![${extNode.alt || 'image'}](${extNode.url})\n\n`;
              break;
            default:
              result += extractText(extNode.children) + '\n\n';
          }
        }
      });
      
      return result;
    };
    
    try {
      const markdown = extractText(editorContent);
      navigator.clipboard.writeText(markdown.trim());
      
      toast({
        title: "Copied to clipboard",
        description: "Content has been copied as markdown",
      });
    } catch (error) {
      console.error('Error copying as markdown:', error);
      toast({
        title: "Copy failed",
        description: "Could not copy content to clipboard",
        variant: "destructive"
      });
    }
  };
  
  // Handle form submission
  const handleSubmit = (data: VerbalContentFormValues) => {
    if (isRichTextEmpty(data.content)) {
      toast({
        title: "Validation Error",
        description: "Content cannot be empty",
        variant: "destructive"
      });
      return;
    }
    
    // Convert content to database format
    const formattedData = {
      ...data,
      content: convertToDatabaseFormat(data.content as RichTextContentType)
    };
    
    console.log('Submitting form with data:', formattedData);
    onSubmit(formattedData);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Left Column - Form Fields */}
            <div className="w-full md:w-3/12 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Content Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter content title" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="topicId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Topic</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value, 10))}
                          value={field.value?.toString()}
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a topic" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {topics.map((topic) => (
                              <SelectItem 
                                key={topic.id} 
                                value={topic.id.toString()}
                              >
                                {topic.title}
                              </SelectItem>
                            ))}
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
                            min="1"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                          />
                        </FormControl>
                        <FormDescription>
                          Order in which content appears
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              
              {/* Topic Type Information */}
              {selectedTopic && (
                <Card>
                  <CardHeader>
                    <CardTitle>Topic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <span className="font-semibold">Title: </span>
                      {selectedTopic.title}
                    </div>
                    <div>
                      <span className="font-semibold">Type: </span>
                      <Badge variant="secondary">
                        {selectedTopic.type.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-semibold">Description: </span>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedTopic.description}
                      </p>
                    </div>
                    
                    {selectedTopic.type && (
                      <Button 
                        type="button"
                        variant="outline" 
                        size="sm"
                        onClick={() => loadTemplate(selectedTopic.type)}
                        className="mt-2"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Load Template
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
              
              {/* Content Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle>Content Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-sm">{wordCount} words</span>
                    </div>
                    <div className="flex items-center">
                      <ListChecks className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-sm">{charCount} characters</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-sm">{readTime} min read time</span>
                    </div>
                    
                    <Separator className="my-2" />
                    
                    <Button 
                      type="button"
                      variant="outline" 
                      size="sm"
                      onClick={copyAsMarkdown}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy as Markdown
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Right Column - Content Editor & Preview */}
            <div className="w-full md:w-9/12">
              <Card className="h-full flex flex-col">
                <CardHeader className="pb-0">
                  <div className="flex justify-between items-center">
                    <CardTitle>
                      {watchTitle ? watchTitle : "New Verbal Content"}
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      {selectedTopic && (
                        <div className="flex items-center mr-4">
                          <input 
                            type="checkbox" 
                            id="student-view"
                            className="mr-2" 
                            checked={studentView} 
                            onChange={e => setStudentView(e.target.checked)}
                          />
                          <label htmlFor="student-view" className="text-sm">
                            Student View
                          </label>
                        </div>
                      )}
                      <Tabs 
                        value={activeTab} 
                        onValueChange={setActiveTab}
                        className="w-[200px]"
                      >
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="edit">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </TabsTrigger>
                          <TabsTrigger value="preview">
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="flex-grow pt-4">
                  <Tabs value={activeTab} className="h-full flex flex-col">
                    <TabsContent value="edit" className="flex-grow mt-0 h-full">
                      <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem className="h-full flex flex-col">
                            <FormControl className="flex-grow">
                              <div className="h-full min-h-[500px] border rounded-md">
                                <RichTextEditorIntegration
                                  initialValue={field.value as RichTextContentType}
                                  onChange={(value) => {
                                    field.onChange(value);
                                    handleEditorChange(value);
                                  }}
                                  minHeight="500px"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                    
                    <TabsContent value="preview" className="mt-0">
                      <div className="min-h-[500px] border rounded-md p-4 overflow-y-auto">
                        {isRichTextEmpty(editorContent) ? (
                          <div className="flex items-center justify-center h-full text-muted-foreground">
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            No content to preview
                          </div>
                        ) : (
                          <div>
                            {studentView && selectedTopic ? (
                              <div>
                                {/* DIRECT RENDERING OF CONTENT */}
                                <div className="rich-text-content prose dark:prose-invert max-w-none">
                                  {getContentProcessor(
                                    <div className="editor-content">
                                      <RichTextContentRenderer content={editorContent} />
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="rich-text-content prose dark:prose-invert max-w-none">
                                <RichTextContentRenderer content={editorContent} />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
                
                <CardFooter className="border-t pt-4">
                  <div className="flex justify-between w-full">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={onCancel}
                    >
                      Cancel
                    </Button>
                    
                    <Button 
                      type="submit" 
                      disabled={isPending}
                    >
                      {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <Save className="mr-2 h-4 w-4" />
                      {editingContent ? 'Update Content' : 'Save Content'}
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
};

export default VerbalContentForm;