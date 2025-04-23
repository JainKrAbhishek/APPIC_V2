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
import * as toastUtils from "@/hooks/use-toast";
import { X } from "lucide-react";
import { Loader2, Timer, Tag, Filter, Zap, AlertTriangle, Check } from "lucide-react";
import { ArrowDownUp, Eye, EyeOff, Link as LinkIcon, Search } from "lucide-react";
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
  // Using toastUtils instead of direct hook
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
      <form onSubmit={(e) => {
          form.handleSubmit(
            (data) => {
              console.log("Form submitted with data:", data);
              // Log any form validation errors
              if (Object.keys(form.formState.errors).length > 0) {
                console.error("Form validation errors:", form.formState.errors);
              }
              onSubmit(data);
            }
          )(e).catch(err => {
            console.error("Form submission failed with errors:", err);
            toastUtils.toast({
              title: "Validation Error",
              description: "Please check the form for errors",
              variant: "destructive",
            });
          });
        }} className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" aria-label="Practice set configuration tabs">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="basic" aria-controls="basic-tab-content">Basic Info</TabsTrigger>
            <TabsTrigger value="questions" aria-controls="questions-tab-content">Questions</TabsTrigger>
            <TabsTrigger value="settings" aria-controls="settings-tab-content">Advanced Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent id="basic-tab-content" value="basic" className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="type-field">Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger id="type-field">
                        <SelectValue placeholder="Select practice set type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {typeOptions.map(option => (
                        <SelectItem key={option.value} value={option.value || "none"}>
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
                  <FormLabel htmlFor="title-field">Title</FormLabel>
                  <FormControl>
                    <Input id="title-field" placeholder="Enter practice set title" {...field} />
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
                  <FormLabel htmlFor="description-field">Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      id="description-field"
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
                  <FormLabel htmlFor="difficulty-field">Difficulty Level</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    defaultValue={field.value.toString()}
                    value={field.value.toString()}
                  >
                    <FormControl>
                      <SelectTrigger id="difficulty-field">
                        <SelectValue placeholder="Select difficulty level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {difficultyOptions.map(option => (
                        <SelectItem key={option.value} value={option.value || "0"}>
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
                  <FormLabel htmlFor="tags-field">Tags</FormLabel>
                  <FormControl>
                    <Input 
                      id="tags-field"
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
                    <FormLabel htmlFor="published-switch">Published</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Make this practice set available to users
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      id="published-switch"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      aria-label="Toggle published status"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </TabsContent>
          
          <TabsContent id="questions-tab-content" value="questions" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Question Selection</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-1"
                aria-expanded={showFilters}
                aria-controls="question-filters-panel"
              >
                <Filter className="h-4 w-4" />
                {showFilters ? "Hide Filters" : "Show Filters"}
              </Button>
            </div>
            
            {showFilters && (
              <div id="question-filters-panel" className="space-y-5 p-5 border rounded-md bg-muted/20 shadow-sm">
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
                    aria-label="Reset all question filters"
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    Reset All Filters
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="categoryFilter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="category-filter" className="flex items-center gap-1">
                          <Tag className="h-3.5 w-3.5" />
                          Category
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || "none"}
                        >
                          <FormControl>
                            <SelectTrigger id="category-filter">
                              <SelectValue placeholder="All Categories" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem key="category-filter-none" value="none">All Categories</SelectItem>
                            {categoryOptions.map((option: {value: string, label: string}) => (
                              <SelectItem 
                                key={`category-filter-${option.value}`} 
                                value={option.value || "none"}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 px-2 mt-1 text-xs"
                          onClick={() => form.setValue("categoryFilter", "none")}
                          aria-label="Clear category filter"
                        >
                          <X className="h-4 w-4" />
                          Clear
                        </Button>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="subtypeFilter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="subtype-filter" className="flex items-center gap-1">
                          <Zap className="h-3.5 w-3.5" />
                          Question Type
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || "none"}
                        >
                          <FormControl>
                            <SelectTrigger id="subtype-filter">
                              <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem key="subtype-filter-none" value="none">All Types</SelectItem>
                            {formType && 
                              subtypeOptions[formType as keyof typeof subtypeOptions]?.map((option: {value: string, label: string}) => (
                              <SelectItem 
                                key={`subtype-filter-${option.value}`} 
                                value={option.value || "none"}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 px-2 mt-1 text-xs"
                          onClick={() => form.setValue("subtypeFilter", "none")}
                          aria-label="Clear question type filter"
                        >
                          <X className="h-3 w-3" />
                          Clear
                        </Button>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="topicFilter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="topic-filter" className="flex items-center gap-1">
                          <LinkIcon className="h-3.5 w-3.5" />
                          Topic
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || "none"}
                        >
                          <FormControl>
                            <SelectTrigger id="topic-filter">
                              <SelectValue placeholder="All Topics" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {topicOptions.map((option: {value: string, label: string}) => (
                              <SelectItem 
                                key={option.value === "none" ? "topic-filter-none" : `topic-filter-${option.value}`} 
                                value={option.value || "none"}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 px-2 mt-1 text-xs"
                          onClick={() => form.setValue("topicFilter", "none")}
                          aria-label="Clear topic filter"
                        >
                          <X className="h-3 w-3" />
                          Clear
                        </Button>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="searchFilter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="search-filter" className="flex items-center gap-1">
                          <Search className="h-3.5 w-3.5" />
                          Search
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              id="search-filter"
                              placeholder="Search question content..." 
                              {...field} 
                              value={field.value || ""}
                              className="pr-8" 
                            />
                            {field.value && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-1 top-1 h-6 w-6 p-0"
                                onClick={() => form.setValue("searchFilter", "")}
                                aria-label="Clear search"
                              >
                                <X className="h-3 w-3" />
                                <span className="sr-only">Clear</span>
                              </Button>
                            )}
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="bg-muted/40 p-2 rounded-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-background">
                      <Filter className="h-3 w-3 mr-1" />
                      Showing {totalFilteredQuestions} questions
                    </Badge>
                    
                    <Badge variant="outline" className="bg-background">
                      <Check className="h-3 w-3 mr-1" />
                      {selectedQuestions} selected
                    </Badge>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {categoryFilter !== "none" && (
                      <Badge variant="secondary" className="gap-1">
                        Category: {categoryFilter}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 ml-1"
                          onClick={() => form.setValue("categoryFilter", "none")}
                          aria-label="Clear category filter"
                        >
                          <X className="h-3 w-3" />
                          <span className="sr-only">Clear category filter</span>
                        </Button>
                      </Badge>
                    )}
                    
                    {subtypeFilter !== "none" && (
                      <Badge variant="secondary" className="gap-1">
                        Type: {subtypeFilter && subtypeFilter.replace ? subtypeFilter.replace(/_/g, ' ') : subtypeFilter}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 ml-1"
                          onClick={() => form.setValue("subtypeFilter", "none")}
                          aria-label="Clear question type filter"
                        >
                          <X className="h-3 w-3" />
                          <span className="sr-only">Clear type filter</span>
                        </Button>
                      </Badge>
                    )}
                    
                    {topicFilter !== "none" && (
                      <Badge variant="secondary" className="gap-1">
                        Topic: {topicFilter}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 ml-1"
                          onClick={() => form.setValue("topicFilter", "none")}
                          aria-label="Clear topic filter"
                        >
                          <X className="h-3 w-3" />
                          <span className="sr-only">Clear topic filter</span>
                        </Button>
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="questionIds"
                render={({ field }) => (
                  <FormItem className="space-y-4">
                    <div className="flex justify-between">
                      <FormLabel className="text-base">Selected Questions</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        {field.value.length} questions selected
                      </p>
                    </div>
                    
                    <FormControl>
                      <MultiSelect
                        placeholder="Select questions to include"
                        selected={Array.isArray(field.value) ? field.value.map(id => id.toString()) : []}
                        options={questionOptions.map(opt => ({
                          ...opt,
                          value: opt.value.toString()
                        }))}
                        onChange={(values) => {
                          console.log("MultiSelect onChange triggered with values:", values);
                          const parsedValues = values.map(v => parseInt(v, 10));
                          console.log("Parsed integer values:", parsedValues);
                          field.onChange(parsedValues);
                          // Force form validation after selection change
                          form.trigger("questionIds");
                        }}
                        className="min-h-[200px]"
                        maxHeight="50vh"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="randomizeQuestions"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <Switch
                        id="randomize-questions"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        aria-label="Randomize question order"
                      />
                    </FormControl>
                    <FormLabel htmlFor="randomize-questions" className="font-normal">
                      Randomize question order
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>
          
          <TabsContent id="settings-tab-content" value="settings" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Time Settings</h3>
                
                <FormField
                  control={form.control}
                  name="timeLimit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="time-limit" className="flex items-center gap-1">
                        <Timer className="h-4 w-4" />
                        Time Limit (minutes)
                      </FormLabel>
                      <FormControl>
                        <Input 
                          id="time-limit"
                          type="number" 
                          placeholder="No time limit" 
                          {...field} 
                          value={field.value === null ? '' : field.value}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(value === '' ? null : parseInt(value));
                          }}
                          aria-label="Time limit in minutes"
                        />
                      </FormControl>
                      <FormDescription>
                        Leave empty for no time limit
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Topic Association</h3>
                
                <FormField
                  control={form.control}
                  name="relatedTopicType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="related-topic-type">Associated Learning Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || "none"}
                      >
                        <FormControl>
                          <SelectTrigger id="related-topic-type">
                            <SelectValue placeholder="Select type..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem key="related-topic-type-none" value="none">None</SelectItem>
                          <SelectItem key="related-topic-type-quant" value="quantitative">Quantitative</SelectItem>
                          <SelectItem key="related-topic-type-verbal" value="verbal">Verbal</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {watchRelatedTopicType && (
                  <FormField
                    control={form.control}
                    name="relatedTopicId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="related-topic-id">Associated Topic</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value ? field.value.toString() : "0"}
                          disabled={!watchRelatedTopicType}
                        >
                          <FormControl>
                            <SelectTrigger id="related-topic-id">
                              <SelectValue placeholder="Select topic..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem key="related-topic-none" value="0">None</SelectItem>
                            {topicsByType.map((topic) => (
                              <SelectItem key={topic.id} value={topic.id.toString()}>
                                {topic.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                {watchRelatedTopicId && (
                  <FormField
                    control={form.control}
                    name="showInTopic"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <Switch
                            id="show-in-topic"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            aria-label="Show in topic content"
                          />
                        </FormControl>
                        <FormLabel htmlFor="show-in-topic" className="font-normal">
                          Show in topic content
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Scoring Settings</h3>
              
              <FormField
                control={form.control}
                name="passingScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="passing-score">Passing Score Percentage ({field.value}%)</FormLabel>
                    <FormControl>
                      <Slider
                        id="passing-score"
                        value={[field.value || 70]}
                        min={60}
                        max={100}
                        step={5}
                        onValueChange={(value) => field.onChange(value[0])}
                        aria-label="Set passing score percentage"
                      />
                    </FormControl>
                    <FormDescription>
                      Users must score at least this percentage to pass the test
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <Accordion type="single" collapsible className="w-full" aria-label="Advanced configuration options">
              <AccordionItem value="advanced">
                <AccordionTrigger className="text-sm font-medium" aria-label="Toggle advanced options">
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" aria-hidden="true" />
                    Advanced Options
                  </span>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 py-4">
                  <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-md p-3 text-sm">
                    <p className="font-medium flex items-center gap-2 text-yellow-800 dark:text-yellow-300">
                      <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                      Warning: Advanced Options
                    </p>
                    <p className="text-yellow-700 dark:text-yellow-400 mt-1">
                      These options are intended for advanced users only. Incorrect configuration 
                      may affect the user experience of this practice set.
                    </p>
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
            aria-label="Cancel and return to practice set list"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isPending || selectedQuestions === 0}
            aria-label={`${editingItem ? 'Update' : 'Create'} practice set with ${selectedQuestions} questions`}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
            {editingItem ? 'Update' : 'Create'} Practice Set
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default PracticeSetForm;