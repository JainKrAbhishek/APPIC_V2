import React, { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelect } from "../common/MultiSelect";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
// Import all icons we need
import { X } from "lucide-react";
import { 
  Loader2, 
  Timer, 
  Tag, 
  Filter, 
  Zap, 
  AlertTriangle, 
  Check, 
  ArrowDownUp,
  Eye,
  EyeOff,
  Link as LinkIcon,
  Search
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Slider } from "@/components/ui/slider";

import { 
  PracticeSet, 
  Question, 
  practiceSetSchema, 
  PracticeSetFormValues,
  typeOptions,
  difficultyOptions,
  categoryOptions,
  subtypeOptions
} from "./types";

interface PracticeSetFormProps {
  onSubmit: (data: PracticeSetFormValues) => void;
  editingItem: PracticeSet | null;
  questions: Question[] | undefined;
  isLoading: boolean;
  isPending: boolean;
  onCancel: () => void;
}

const PracticeSetForm: React.FC<PracticeSetFormProps> = ({
  onSubmit,
  editingItem,
  questions = [],
  isLoading,
  isPending,
  onCancel
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("basic");
  const [showFilters, setShowFilters] = useState(false);
  
  const form = useForm<PracticeSetFormValues>({
    resolver: zodResolver(practiceSetSchema),
    defaultValues: {
      type: "verbal",
      title: "",
      description: "",
      difficulty: 1,
      questionIds: [],
      isPublished: true,
      timeLimit: null,
      tags: "",
      // New fields
      categoryFilter: "none",
      subtypeFilter: "none",
      topicFilter: "none",
      searchFilter: "",
      randomizeQuestions: false,
      passingScore: 70,
      // Topic association fields
      relatedTopicId: null,
      relatedTopicType: null,
      showInTopic: false,
    }
  });

  // Update form when editing item changes
  useEffect(() => {
    if (editingItem) {
      form.reset({
        type: editingItem.type,
        title: editingItem.title,
        description: editingItem.description,
        difficulty: editingItem.difficulty,
        questionIds: editingItem.questionIds,
        isPublished: editingItem.isPublished ?? true,
        timeLimit: editingItem.timeLimit || null,
        tags: editingItem.tags || "",
        // New fields - use defaults if not present in existing item
        categoryFilter: editingItem.categoryFilter || "none",
        subtypeFilter: editingItem.subtypeFilter || "none",
        topicFilter: editingItem.topicFilter || "none",
        searchFilter: editingItem.searchFilter || "",
        randomizeQuestions: editingItem.randomizeQuestions || false,
        passingScore: editingItem.passingScore || 70,
        // Topic association fields
        relatedTopicId: editingItem.relatedTopicId || null,
        relatedTopicType: editingItem.relatedTopicType || null,
        showInTopic: editingItem.showInTopic || false,
      });
    }
  }, [editingItem, form]);

  // Get current form values
  const formType = form.watch("type");
  const categoryFilter = form.watch("categoryFilter");
  const subtypeFilter = form.watch("subtypeFilter");
  const topicFilter = form.watch("topicFilter");
  
  // Topic associations
  const watchRelatedTopicType = form.watch("relatedTopicType");
  const watchRelatedTopicId = form.watch("relatedTopicId");
  const watchShowInTopic = form.watch("showInTopic");
  
  // Helper function to format question text for search
  function formatQuestionText(content: any): string {
    if (typeof content === 'string') {
      return content;
    } else if (content && typeof content === 'object') {
      if (content.text) {
        return content.text;
      } else if (Array.isArray(content)) {
        // Handle Slate array format or similar
        return JSON.stringify(content);
      } else {
        // Last resort - stringify the object
        return JSON.stringify(content);
      }
    }
    return '';
  }
  
  // Get search filter text
  const searchFilterText = form.watch("searchFilter") || "";
  
  // Filter questions based on all selected filters with improved type handling and search
  const filteredQuestions = questions.filter(q => {
    // Base type filter (always applied)
    if (q.type.toLowerCase() !== formType.toLowerCase()) {
      return false;
    }
    
    // Apply full-text search filter if entered
    if (searchFilterText.trim() !== "") {
      const searchTermLower = searchFilterText.toLowerCase().trim();
      const questionText = formatQuestionText(q.content).toLowerCase();
      const questionId = String(q.id);
      const questionType = q.subtype ? q.subtype.toLowerCase() : '';
      const questionCategory = q.category ? q.category.toLowerCase() : '';
      
      // Check if search term is found in question content, ID, type or category
      const matchesSearch = 
        questionText.includes(searchTermLower) || 
        questionId === searchTermLower || 
        questionType.includes(searchTermLower) ||
        questionCategory.includes(searchTermLower);
      
      if (!matchesSearch) {
        return false;
      }
    }
    
    // Apply category filter if selected
    if (categoryFilter && categoryFilter !== "none" && q.category !== categoryFilter) {
      return false;
    }
    
    // Apply subtype filter if selected
    if (subtypeFilter && subtypeFilter !== "none" && q.subtype !== subtypeFilter) {
      return false;
    }
    
    // Apply topic filter if selected with improved type handling
    if (topicFilter && topicFilter !== "none") {
      // Normalize both values to strings for consistent comparison
      const topicFilterStr = String(topicFilter);
      const questionTopicStr = q.topic !== null ? String(q.topic) : '';
      
      if (questionTopicStr !== topicFilterStr) {
        return false;
      }
    }
    
    return true;
  });
  
  // Get unique topics from filtered questions for the topic dropdown
  const availableTopics = Array.from(new Set(
    filteredQuestions
      .filter(q => q.topic)
      .map(q => q.topic)
  )).map(topic => ({
    value: topic || "none",
    label: topic || "None"
  }));
  
  // Add "none" option to topics
  const topicOptions = [
    { value: "none", label: "All Topics" },
    ...availableTopics
  ];
  
  // Define types for topic data structure
  type QuantitativeTopic = {
    id: number;
    title: string;
    category: string;
  };
  
  type VerbalTopic = {
    id: number;
    title: string;
    type: string;
  };
  
  type TopicUnion = QuantitativeTopic | VerbalTopic;
  
  // Temporary mock data for quantitative topics
  // This would normally come from an API call
  const quantTopics: QuantitativeTopic[] = [
    { id: 1, title: "Arithmetic", category: "Basic Math" },
    { id: 2, title: "Algebra", category: "Basic Math" },
    { id: 3, title: "Geometry", category: "Basic Math" },
    { id: 4, title: "Data Analysis", category: "Advanced Math" },
    { id: 5, title: "Word Problems", category: "Applied Math" }
  ];
  
  // Temporary mock data for verbal topics
  // This would normally come from an API call
  const verbalTopics: VerbalTopic[] = [
    { id: 101, title: "Reading Comprehension", type: "Reading" },
    { id: 102, title: "Text Completion", type: "Vocabulary" },
    { id: 103, title: "Sentence Equivalence", type: "Vocabulary" },
    { id: 104, title: "Critical Reasoning", type: "Reading" }
  ];
  
  // Get topics based on selected type
  const topicsByType: TopicUnion[] = watchRelatedTopicType === "quantitative" 
    ? quantTopics 
    : watchRelatedTopicType === "verbal" 
      ? verbalTopics 
      : [];
  
  // Transform questions for multi-select
  const questionOptions = filteredQuestions.map(q => {
    // Format display text based on question content
    let displayText = "Question";
    
    if (q.content) {
      // Handle different content formats
      if (typeof q.content === 'string') {
        displayText = q.content.substring(0, 60);
      } else if (q.content.text) {
        displayText = q.content.text.substring(0, 60);
      } else if (Array.isArray(q.content) && q.content.length > 0) {
        displayText = JSON.stringify(q.content).substring(0, 60);
      }
      
      if (displayText.length > 59) {
        displayText += "...";
      }
    }
    
    // Add enhanced metadata including topic for better identification
    const metadata = [
      q.subtype && `Type: ${q.subtype.replace(/_/g, ' ')}`,
      q.category && `Category: ${q.category}`,
      q.difficulty && `Difficulty: ${q.difficulty}`,
      q.topic !== undefined && q.topic !== null && `Topic: ${q.topic}`
    ].filter(Boolean).join(' | ');
    
    return {
      label: `${q.id}: ${displayText}${metadata ? ` (${metadata})` : ''}`,
      value: q.id
    };
  });

  // Calculate stats for selected questions
  const selectedQuestions = form.watch("questionIds").length;
  const totalFilteredQuestions = filteredQuestions.length;
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="questions">Questions</TabsTrigger>
            <TabsTrigger value="settings">Advanced Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select practice set type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {typeOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
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
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter practice set title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter practice set description" 
                      rows={3} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="difficulty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Difficulty Level</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    defaultValue={field.value.toString()}
                    value={field.value.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select difficulty level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {difficultyOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
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
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter comma-separated tags (e.g. math, algebra, gre)" 
                      {...field} 
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Tags help categorize and filter practice sets
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="isPublished"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between space-y-0 rounded-md border p-3">
                  <div>
                    <FormLabel>Published</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Make this practice set available to users
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </TabsContent>
          
          <TabsContent value="questions" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Question Selection</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-1"
              >
                <Filter className="h-4 w-4" />
                {showFilters ? "Hide Filters" : "Show Filters"}
              </Button>
            </div>
            
            {showFilters && (
              <div className="space-y-5 p-5 border rounded-md bg-muted/20 shadow-sm">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <Filter className="h-4 w-4 text-primary" />
                    Question Filter Options
                  </h4>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      form.setValue("categoryFilter", "none");
                      form.setValue("subtypeFilter", "none");
                      form.setValue("topicFilter", "none");
                      form.setValue("searchFilter", "");
                    }}
                    className="text-xs h-8"
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    Reset All Filters
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="searchFilter"
                    render={({ field }) => (
                      <FormItem className="col-span-1 md:col-span-2">
                        <FormLabel className="flex items-center gap-1.5">
                          <Search className="h-3.5 w-3.5 text-muted-foreground" />
                          Search Questions
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              placeholder="Search by content, ID, or metadata..."
                              className="pl-8 pr-8"
                              value={typeof field.value === 'string' ? field.value : ""}
                              onChange={(e) => {
                                field.onChange(e.target.value);
                              }}
                            />
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            {field.value && (
                              <button 
                                type="button"
                                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                                onClick={() => field.onChange("")}
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </FormControl>
                        <FormDescription>
                          Search by question text, ID, or question properties
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="categoryFilter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5">
                          <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                          Category
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || "none"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Filter by category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categoryOptions.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {field.value !== "none" ? (
                            <span className="flex items-center gap-1">
                              <Badge variant="outline" className="font-normal text-xs">
                                {categoryOptions.find(o => o.value === field.value)?.label || field.value}
                              </Badge>
                              <button 
                                type="button" 
                                className="text-muted-foreground hover:text-foreground"
                                onClick={() => field.onChange("none")}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ) : (
                            "Filter by question category"
                          )}
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="subtypeFilter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5">
                          <ArrowDownUp className="h-3.5 w-3.5 text-muted-foreground" />
                          Question Type
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || "none"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Filter by type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(formType && 
                              subtypeOptions[formType as keyof typeof subtypeOptions] && 
                              Array.isArray(subtypeOptions[formType as keyof typeof subtypeOptions]) ? 
                                subtypeOptions[formType as keyof typeof subtypeOptions] : []).map((option: {value: string, label: string}) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {field.value !== "none" ? (
                            <span className="flex items-center gap-1">
                              <Badge variant="outline" className="font-normal text-xs">
                                {formType && 
                                  subtypeOptions[formType as keyof typeof subtypeOptions] && 
                                  Array.isArray(subtypeOptions[formType as keyof typeof subtypeOptions]) ? 
                                    subtypeOptions[formType as keyof typeof subtypeOptions].find((o: {value: string, label: string}) => o.value === field.value)?.label 
                                    : field.value}
                              </Badge>
                              <button 
                                type="button" 
                                className="text-muted-foreground hover:text-foreground"
                                onClick={() => field.onChange("none")}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ) : (
                            "Filter by question format/type"
                          )}
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="flex items-center justify-between border-t pt-3 mt-2">
                  <div className="text-sm flex items-center gap-2">
                    <span className="text-muted-foreground">Results:</span> 
                    <Badge variant="secondary">
                      {totalFilteredQuestions} questions
                    </Badge>
                    {(categoryFilter !== "none" || subtypeFilter !== "none" || topicFilter !== "none" || searchFilterText) && (
                      <Badge variant="outline" className="gap-1 text-xs">
                        <Filter className="h-3 w-3" />
                        Filtered
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <FormField
                      control={form.control}
                      name="topicFilter"
                      render={({ field }) => (
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || "none"}
                        >
                          <FormControl>
                            <SelectTrigger className="h-8 text-xs w-[180px]">
                              <SelectValue placeholder="Filter by topic" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {topicOptions.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    
                    {selectedQuestions > 0 && (
                      <Button
                        type="button" 
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs flex items-center gap-1"
                        onClick={() => form.setValue("questionIds", [])}
                      >
                        <X className="h-3 w-3" />
                        Clear All Selected
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <FormField
              control={form.control}
              name="questionIds"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>Question Selection</span>
                      <Badge variant="secondary">
                        {selectedQuestions} of {questionOptions.length} available
                      </Badge>
                    </div>
                    {field.value.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => field.onChange([])}
                        className="h-8 px-2 text-xs flex items-center gap-1"
                      >
                        <X className="h-3 w-3" />
                        Clear selection
                      </Button>
                    )}
                  </FormLabel>
                  <FormControl>
                    <MultiSelect
                      selected={field.value.map(id => id.toString())}
                      options={questionOptions.map(option => ({
                        ...option, 
                        value: option.value.toString()
                      }))}
                      onChange={(values) => {
                        field.onChange(values.map(val => parseInt(val)));
                      }}
                      placeholder="Select questions from the list below"
                      loading={isLoading}
                      maxDisplay={3}
                      maxHeight="50vh"
                      showCount={true}
                      sortable={true}
                      className="min-h-11"
                    />
                  </FormControl>
                  <FormDescription>
                    Select questions from the filtered list to include in this practice set. 
                    Use the filters above to narrow down the available questions.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="randomizeQuestions"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between space-y-0 rounded-md border p-3">
                  <div>
                    <FormLabel>Randomize Questions</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Questions will be presented in random order during practice
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-5">
            <h3 className="text-lg font-medium">Advanced Settings</h3>
            
            <div className="p-4 border rounded-md mb-6">
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                Topic Association
              </h4>
              <p className="text-sm text-muted-foreground mb-4">
                Link this practice set to a specific topic to make it available directly from the topic page.
                This helps students practice the topic they're currently learning.
              </p>
              
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="relatedTopicType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Related Topic Type</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          // Store the value directly, null handling in reset/submit
                          field.onChange(value);
                          // Reset the topic ID when changing type
                          form.setValue("relatedTopicId", null);
                          // If none is selected, ensure showInTopic is false
                          if (value === "none") {
                            form.setValue("showInTopic", false);
                          }
                        }}
                        value={field.value || "none"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select topic type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem key="topic-type-none" value="none">None</SelectItem>
                          <SelectItem key="topic-type-quant" value="quantitative">Quantitative</SelectItem>
                          <SelectItem key="topic-type-verbal" value="verbal">Verbal</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose whether this practice set is related to a quant or verbal topic
                      </FormDescription>
                    </FormItem>
                  )}
                />
                
                {form.watch("relatedTopicType") && (
                  <FormField
                    control={form.control}
                    name="relatedTopicId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Related Topic</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(value === "none" ? null : parseInt(value))}
                          value={field.value?.toString() || "none"}
                          disabled={!form.watch("relatedTopicType")}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a specific topic" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem key="related-topic-none" value="no-topic">None</SelectItem>
                            {topicsByType.map(topic => (
                              <SelectItem 
                                key={topic.id} 
                                value={topic.id.toString()}
                              >
                                {topic.title}
                                {watchRelatedTopicType === "quantitative" && 
                                  'category' in topic && topic.category && 
                                  <span className="ml-1 text-muted-foreground">({topic.category})</span>
                                }
                                {watchRelatedTopicType === "verbal" && 
                                  'type' in topic && topic.type && 
                                  <span className="ml-1 text-muted-foreground">({topic.type})</span>
                                }
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choose the specific topic this practice set is related to
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                )}
                
                {form.watch("relatedTopicId") && (
                  <FormField
                    control={form.control}
                    name="showInTopic"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between space-y-0 rounded-md border p-3">
                        <div>
                          <FormLabel>Show in Topic Page</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Display this practice set in the topic page
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>
            
            <FormField
              control={form.control}
              name="timeLimit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time Limit (minutes)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Enter time limit (leave empty for no limit)"
                      min={0}
                      max={180} 
                      {...field}
                      value={field.value === null ? "" : field.value}
                      onChange={(e) => {
                        const value = e.target.value === "" ? null : parseInt(e.target.value);
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Set a time limit for completing this practice set (0 or empty = no limit)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="passingScore"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Passing Score (%)</FormLabel>
                  <div className="flex items-center gap-6">
                    <FormControl className="flex-1">
                      <Slider
                        min={50}
                        max={100}
                        step={5}
                        value={[field.value || 70]}
                        onValueChange={(values) => field.onChange(values[0])}
                      />
                    </FormControl>
                    <div className="w-16 text-center font-medium">
                      {field.value || 70}%
                    </div>
                  </div>
                  <FormDescription>
                    Minimum percentage score required to pass the practice set
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="help">
                <AccordionTrigger className="text-sm">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    About advanced settings
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p><strong>Time Limit:</strong> Sets a maximum time for completing the practice set. Students will see a timer counting down.</p>
                    <p><strong>Passing Score:</strong> Defines the minimum percentage needed to mark the practice set as completed successfully.</p>
                    <p><strong>Randomize Questions:</strong> When enabled, questions will be presented in a different order each time.</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editingItem ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default PracticeSetForm;