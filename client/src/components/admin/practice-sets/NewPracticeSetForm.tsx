import React, { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useQuantitativeTopics, useVerbalTopics } from "./newHooks";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelect } from "../common/MultiSelect";
import { Switch } from "@/components/ui/switch";
import { 
  Loader2, Search, Filter, X, Info, CheckCircle, ChevronDown, 
  Star, ChevronsUpDown, Check 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Define types
interface PracticeSet {
  id: number;
  type: string;
  title: string;
  description: string;
  difficulty: number;
  questionIds: number[];
  isPublished?: boolean;
  timeLimit?: number | null;
  tags?: string | null;
  categoryFilter?: string | null;
  subtypeFilter?: string | null;
  topicFilter?: string | null;
  searchFilter?: string | null;
  randomizeQuestions?: boolean;
  passingScore?: number | null;
  relatedTopicId?: number | null;
  relatedTopicType?: string | null;
  showInTopic?: boolean;
}

interface Question {
  id: number;
  type: string;
  subtype: string;
  content: any;
  options: any[];
  correctAnswer: string | string[];
  explanation: string;
  difficulty: number;
  tags: string[];
  typeId?: number;
  category?: string | null;
  topic?: string | null;
  imageUrls?: string[] | null;
}

// Options for form selections
const typeOptions = [
  { value: "verbal", label: "Verbal" },
  { value: "vocabulary", label: "Vocabulary" },
  { value: "quantitative", label: "Quantitative" },
  { value: "mixed", label: "Mixed" },
];

const difficultyOptions = [
  { value: "1", label: "⭐ Easy (Level 1)" },
  { value: "2", label: "⭐⭐ Moderate (Level 2)" },
  { value: "3", label: "⭐⭐⭐ Challenging (Level 3)" },
  { value: "4", label: "⭐⭐⭐⭐ Difficult (Level 4)" },
  { value: "5", label: "⭐⭐⭐⭐⭐ Very Difficult (Level 5)" },
];

const categoryOptions = [
  { value: "none", label: "No Category" },
  { value: "algebra", label: "Algebra" },
  { value: "arithmetic", label: "Arithmetic" },
  { value: "geometry", label: "Geometry" },
  { value: "data_analysis", label: "Data Analysis" },
  { value: "reading", label: "Reading" },
  { value: "critical_reasoning", label: "Critical Reasoning" },
  { value: "sentence_completion", label: "Sentence Completion" },
  { value: "text_completion", label: "Text Completion" },
];

const subtypeOptions: Record<string, Array<{value: string, label: string}>> = {
  quantitative: [
    { value: "multiple_choice", label: "Multiple Choice" },
    { value: "numeric", label: "Numeric Entry" },
    { value: "quantitative_comparison", label: "Quantitative Comparison" },
  ],
  verbal: [
    { value: "text_completion", label: "Text Completion" },
    { value: "reading_comprehension", label: "Reading Comprehension" },
    { value: "sentence_equivalence", label: "Sentence Equivalence" },
  ],
  vocabulary: [
    { value: "multiple_choice", label: "Multiple Choice" },
    { value: "matching", label: "Matching" },
    { value: "fill_in_blank", label: "Fill in the Blank" },
  ],
  mixed: [
    { value: "multiple_choice", label: "Multiple Choice" },
    { value: "numeric", label: "Numeric Entry" },
    { value: "text_completion", label: "Text Completion" },
    { value: "reading_comprehension", label: "Reading Comprehension" },
  ]
};

// Define the validation schema
const practiceSetSchema = z.object({
  type: z.string(),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  difficulty: z.number().min(1).max(5),
  questionIds: z.array(z.number()).min(1, "Select at least one question"),
  isPublished: z.boolean().optional().default(true),
  timeLimit: z.number().nullable().optional(),
  tags: z.string().nullable().optional(),
  // Filter fields
  categoryFilter: z.string().nullable().optional().default("none"),
  subtypeFilter: z.string().nullable().optional().default("none"),
  topicFilter: z.string().nullable().optional().default("none"),
  searchFilter: z.string().nullable().optional().default(""),
  randomizeQuestions: z.boolean().optional().default(false),
  passingScore: z.number().nullable().optional().default(70),
  // Topic association fields
  relatedTopicId: z.number().nullable().optional(),
  relatedTopicType: z.string().nullable().optional(),
  showInTopic: z.boolean().optional().default(false),
});

type PracticeSetFormValues = z.infer<typeof practiceSetSchema>;

// Using imported QuantitativeTopic and VerbalTopic interfaces from newHooks.ts

interface PracticeSetFormProps {
  onSubmit: (data: PracticeSetFormValues) => void;
  editingItem: PracticeSet | null;
  questions: Question[];
  isLoading: boolean;
  isPending: boolean;
  onCancel: () => void;
}

const NewPracticeSetForm: React.FC<PracticeSetFormProps> = ({
  onSubmit,
  editingItem,
  questions = [],
  isLoading,
  isPending,
  onCancel
}) => {
  const { toast } = useToast();
  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState("basic");
  const [showFilters, setShowFilters] = useState(false);
  const [loadingTopics, setLoadingTopics] = useState(false);
  
  // Initialize form with default values
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
      categoryFilter: "none",
      subtypeFilter: "none",
      topicFilter: "none",
      searchFilter: "",
      randomizeQuestions: false,
      passingScore: 70,
      relatedTopicId: null,
      relatedTopicType: null,
      showInTopic: false,
    }
  });
  
  // Fetch topics when needed
  const relatedTopicType = form.watch("relatedTopicType");
  
  // Use custom hooks to fetch topics
  const { 
    data: quantTopics = [], 
    isLoading: loadingQuantTopics,
    error: quantError
  } = useQuantitativeTopics();
  
  const { 
    data: verbalTopics = [], 
    isLoading: loadingVerbalTopics,
    error: verbalError
  } = useVerbalTopics();
  
  // Set loading state based on active topic type query
  useEffect(() => {
    setLoadingTopics(
      (relatedTopicType === "quantitative" && loadingQuantTopics) || 
      (relatedTopicType === "verbal" && loadingVerbalTopics)
    );
  }, [relatedTopicType, loadingQuantTopics, loadingVerbalTopics]);
  
  // Handle errors in topic loading
  useEffect(() => {
    if (quantError || verbalError) {
      console.error("Error fetching topics:", quantError || verbalError);
      toast({
        title: "Error",
        description: "Failed to load topics. Please try again.",
        variant: "destructive"
      });
    }
  }, [quantError, verbalError, toast]);
  
  // Update form when editing item changes
  useEffect(() => {
    if (editingItem) {
      const formValues = {
        type: editingItem.type,
        title: editingItem.title,
        description: editingItem.description,
        difficulty: editingItem.difficulty,
        questionIds: editingItem.questionIds || [],
        isPublished: editingItem.isPublished ?? true,
        timeLimit: editingItem.timeLimit || null,
        tags: editingItem.tags || "",
        categoryFilter: editingItem.categoryFilter || "none",
        subtypeFilter: editingItem.subtypeFilter || "none",
        topicFilter: editingItem.topicFilter || "none",
        searchFilter: editingItem.searchFilter || "",
        randomizeQuestions: editingItem.randomizeQuestions || false,
        passingScore: editingItem.passingScore || 70,
        relatedTopicId: editingItem.relatedTopicId || null,
        relatedTopicType: editingItem.relatedTopicType || null,
        showInTopic: editingItem.showInTopic || false,
      };
      
      setSelectedQuestions(editingItem.questionIds || []);
      form.reset(formValues);
    }
  }, [editingItem, form]);
  
  // Get current form values
  const formType = form.watch("type");
  const categoryFilter = form.watch("categoryFilter");
  const subtypeFilter = form.watch("subtypeFilter");
  const topicFilter = form.watch("topicFilter");
  const searchFilterText = form.watch("searchFilter") || "";
  
  // Helper function to format question text for search
  function formatQuestionText(content: any): string {
    if (typeof content === 'string') {
      return content;
    } else if (content && typeof content === 'object') {
      if (content.text) {
        return content.text;
      } else if (Array.isArray(content)) {
        return JSON.stringify(content);
      } else {
        return JSON.stringify(content);
      }
    }
    return '';
  }
  
  // Filter questions based on selected filters and search term
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
    
    // Apply topic filter if selected
    if (topicFilter && topicFilter !== "none") {
      const topicFilterStr = String(topicFilter);
      const questionTopicStr = q.topic !== null ? String(q.topic) : '';
      
      if (questionTopicStr !== topicFilterStr) {
        return false;
      }
    }
    
    return true;
  });
  
  // Create question options for the MultiSelect component with improved formatting
  const questionOptions = filteredQuestions.map(q => {
    // Format the question text better for readability
    const questionText = formatQuestionText(q.content);
    const truncatedText = questionText.length > 60 
      ? `${questionText.substring(0, 60)}...` 
      : questionText;
    
    // Make the question ID stand out
    const idPart = `#${q.id}`;
    
    // Format the subtype to be more readable
    const subtypePart = q.subtype
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    // Add difficulty stars for better visual cue
    const difficultyStars = '★'.repeat(q.difficulty);
    
    // Create a more descriptive and formatted label
    return {
      value: q.id.toString(),
      label: `${idPart}: ${subtypePart} (${difficultyStars})`,
      description: truncatedText,
      category: q.category || 'Uncategorized',
      difficulty: q.difficulty,
      topic: q.topic || 'No Topic'
    };
  });
  
  // Handle question selection with improved feedback
  const handleQuestionSelection = (selectedIds: string[]) => {
    const numberIds = selectedIds.map(id => parseInt(id, 10));
    setSelectedQuestions(numberIds);
    form.setValue("questionIds", numberIds);
    
    // If first selection, show a toast with a tip
    if (selectedIds.length === 1 && selectedQuestions.length === 0) {
      toast({
        title: "Question selected",
        description: "Use filters above to find more related questions",
        variant: "default"
      });
    }
  };
  
  // Helper function to select all filtered questions
  const handleSelectAllFiltered = () => {
    const allFilteredIds = filteredQuestions.map(q => q.id.toString());
    handleQuestionSelection(allFilteredIds);
  };
  
  // Helper function to select questions by difficulty
  const handleSelectByDifficulty = (difficultyLevel: number) => {
    const byDifficultyIds = filteredQuestions
      .filter(q => q.difficulty === difficultyLevel)
      .map(q => q.id.toString());
    handleQuestionSelection(byDifficultyIds);
  };
  
  // Update available subtypes when type changes
  const availableSubtypes = subtypeOptions[formType] || [];
  
  // Get unique topics for the selected type
  const availableTopics = React.useMemo(() => {
    const topics = new Set<string>();
    questions
      .filter(q => q.type === formType && q.topic)
      .forEach(q => {
        if (q.topic) topics.add(q.topic);
      });
    return Array.from(topics).map(topic => ({ value: topic, label: topic }));
  }, [questions, formType]);
  
  // Get unique categories for the selected type
  const availableCategories = React.useMemo(() => {
    const categories = new Set<string>();
    questions
      .filter(q => q.type === formType && q.category)
      .forEach(q => {
        if (q.category) categories.add(q.category);
      });
    return Array.from(categories).map(category => ({ value: category, label: category }));
  }, [questions, formType]);
  
  // Function to validate and submit the form with improved feedback
  const handleSubmit = form.handleSubmit((data) => {
    // Validate all required fields
    const validationErrors = [];
    
    if (!data.title || data.title.trim().length < 3) {
      validationErrors.push("Title must be at least 3 characters");
    }
    
    if (!data.description || data.description.trim().length < 10) {
      validationErrors.push("Description must be at least 10 characters");
    }
    
    if (!data.questionIds || data.questionIds.length === 0) {
      validationErrors.push("Please select at least one question");
    }
    
    // If there are validation errors, show them in a toast
    if (validationErrors.length > 0) {
      toast({
        title: "Form Validation Error",
        description: (
          <ul className="list-disc pl-4 mt-2 space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index} className="text-sm">{error}</li>
            ))}
          </ul>
        ),
        variant: "destructive"
      });
      
      // Also highlight which tab has errors
      if (validationErrors.some(e => e.includes("Title") || e.includes("Description"))) {
        setActiveTab("basic");
      } else if (validationErrors.some(e => e.includes("question"))) {
        setActiveTab("questions");
      }
      
      return;
    }
    
    console.log("Form data to submit:", data);
    
    // Show submitting toast
    toast({
      title: "Submitting",
      description: "Saving your practice set...",
    });
    
    onSubmit(data);
  });
  
  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="questions">Questions</TabsTrigger>
            <TabsTrigger value="advanced">Advanced Settings</TabsTrigger>
            <TabsTrigger value="relations">Topic Relations</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Practice Set Type</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      // Reset filters when type changes
                      form.setValue("categoryFilter", "none");
                      form.setValue("subtypeFilter", "none");
                      form.setValue("topicFilter", "none");
                      // Clear selection when type changes
                      form.setValue("questionIds", []);
                      setSelectedQuestions([]);
                    }}
                    disabled={isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
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
                  <FormDescription>
                    The type determines which questions will be available for selection.
                  </FormDescription>
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
                    <Input 
                      placeholder="Enter practice set title" 
                      {...field} 
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormDescription>
                    A descriptive title for this practice set.
                  </FormDescription>
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
                      {...field} 
                      rows={3}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormDescription>
                    A detailed description of what this practice set covers.
                  </FormDescription>
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
                    value={field.value.toString()}
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    disabled={isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select difficulty" />
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
                  <FormDescription>
                    The overall difficulty level of this practice set.
                  </FormDescription>
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
                      placeholder="Enter comma-separated tags" 
                      {...field} 
                      value={field.value || ""}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional tags to help categorize this practice set (comma-separated).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
          
          <TabsContent value="questions" className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-medium">Question Selection</h3>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                {showFilters ? "Hide Filters" : "Show Filters"}
              </Button>
            </div>
            
            {showFilters && (
              <div className="bg-muted/50 p-4 rounded-lg space-y-4 mb-4">
                <h4 className="font-medium text-sm mb-2">Filter Questions</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="categoryFilter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select
                          value={field.value || "none"}
                          onValueChange={field.onChange}
                          disabled={isPending}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Any category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Any category</SelectItem>
                            {availableCategories.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="subtypeFilter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Question Type</FormLabel>
                        <Select
                          value={field.value || "none"}
                          onValueChange={field.onChange}
                          disabled={isPending}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Any type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Any type</SelectItem>
                            {availableSubtypes.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="topicFilter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Topic</FormLabel>
                        <Select
                          value={field.value || "none"}
                          onValueChange={field.onChange}
                          disabled={isPending}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Any topic" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Any topic</SelectItem>
                            {availableTopics.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="searchFilter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Search</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <div className="relative">
                              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="Search questions..."
                                className="pl-8"
                                {...field}
                                value={field.value || ""}
                                disabled={isPending}
                              />
                              {field.value && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-1 top-1 h-7 w-7 p-0"
                                  onClick={() => field.onChange("")}
                                  disabled={isPending}
                                >
                                  <X className="h-4 w-4" />
                                  <span className="sr-only">Clear search</span>
                                </Button>
                              )}
                            </div>
                          </FormControl>
                        </div>
                        <FormDescription>
                          Search by question content, ID, type, or category
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      form.setValue("categoryFilter", "none");
                      form.setValue("subtypeFilter", "none");
                      form.setValue("topicFilter", "none");
                      form.setValue("searchFilter", "");
                    }}
                    disabled={isPending}
                  >
                    Reset Filters
                  </Button>
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Question Selection Tools</h4>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAllFiltered}
                    disabled={filteredQuestions.length === 0 || isPending || isLoading}
                    className="gap-1"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Select All Filtered ({filteredQuestions.length})
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={filteredQuestions.length === 0 || isPending || isLoading}
                        className="gap-1"
                      >
                        <Star className="h-4 w-4" />
                        Select by Difficulty
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuLabel>Difficulty Level</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {[1, 2, 3, 4, 5].map(level => (
                        <DropdownMenuItem 
                          key={level}
                          onClick={() => handleSelectByDifficulty(level)}
                        >
                          Level {level} ({filteredQuestions.filter(q => q.difficulty === level).length})
                          {Array(level).fill(0).map((_, i) => (
                            <Star key={i} className="h-3 w-3 ml-0.5 inline-block text-amber-500" fill="currentColor" />
                          ))}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <FormField
                control={form.control}
                name="questionIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center justify-between">
                      <span>Select Questions</span>
                      <Badge variant="outline">
                        {selectedQuestions.length} selected
                      </Badge>
                    </FormLabel>
                    <FormControl>
                      <MultiSelect
                        options={questionOptions}
                        selected={selectedQuestions.map(id => id.toString())}
                        onChange={handleQuestionSelection}
                        placeholder="Select questions"
                        disabled={isPending || isLoading}
                        loading={isLoading}
                        className="min-h-[38px]"
                        maxDisplay={3}
                        sortable
                        showCount
                      />
                    </FormControl>
                    <FormDescription>
                      {filteredQuestions.length} questions available. 
                      {selectedQuestions.length > 0 && 
                        ` Selected ${selectedQuestions.length} questions.`}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedQuestions.length > 0 && (
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <h4 className="font-medium flex items-center justify-between mb-2 text-sm">
                    <span>Selected Questions Preview</span>
                    <Badge variant="secondary">
                      {selectedQuestions.length} questions
                    </Badge>
                  </h4>
                  <ScrollArea className="h-[200px] rounded-md border">
                    <div className="p-2 space-y-2">
                      {selectedQuestions.map(qId => {
                        const question = questions.find(q => q.id === qId);
                        if (!question) return null;
                        return (
                          <div 
                            key={question.id} 
                            className="border rounded-md p-3 bg-card text-sm relative group"
                          >
                            <div className="flex justify-between items-start mb-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">#{question.id}</Badge>
                                <Badge 
                                  variant="secondary"
                                  className="capitalize"
                                >
                                  {question.subtype.replace('_', ' ')}
                                </Badge>
                                <div className="text-amber-500">
                                  {Array(question.difficulty).fill(0).map((_, i) => (
                                    <Star key={i} className="h-3 w-3 inline-block" fill="currentColor" />
                                  ))}
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => {
                                  const newSelected = selectedQuestions.filter(id => id !== question.id);
                                  setSelectedQuestions(newSelected);
                                  form.setValue("questionIds", newSelected);
                                }}
                              >
                                <X className="h-4 w-4" />
                                <span className="sr-only">Remove question</span>
                              </Button>
                            </div>
                            <p className="text-muted-foreground text-xs truncate">
                              {formatQuestionText(question.content)}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
            
            <FormField
              control={form.control}
              name="randomizeQuestions"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Randomize Questions</FormLabel>
                    <FormDescription>
                      Present questions in a random order to each student
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isPending}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </TabsContent>
          
          <TabsContent value="advanced" className="space-y-4">
            <FormField
              control={form.control}
              name="isPublished"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Published</FormLabel>
                    <FormDescription>
                      Make this practice set available to students
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isPending}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="timeLimit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time Limit (minutes)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="No time limit"
                      {...field}
                      value={field.value === null ? "" : field.value}
                      onChange={(e) => {
                        const value = e.target.value === "" ? null : parseInt(e.target.value);
                        field.onChange(value);
                      }}
                      min={1}
                      max={180}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional time limit in minutes. Leave empty for no time limit.
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
                  <div className="flex flex-col space-y-4">
                    <FormControl>
                      <Slider
                        value={field.value ? [field.value] : [70]}
                        min={50}
                        max={100}
                        step={5}
                        onValueChange={(values) => field.onChange(values[0])}
                        disabled={isPending}
                        aria-label="Passing score"
                      />
                    </FormControl>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">50%</span>
                      <span className="font-medium">{field.value}%</span>
                      <span className="text-sm text-muted-foreground">100%</span>
                    </div>
                  </div>
                  <FormDescription>
                    Percentage of correct answers required to pass this practice set.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
          
          <TabsContent value="relations" className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg mb-4">
              <h4 className="font-medium flex items-center gap-2 mb-2">
                <Info className="h-4 w-4" />
                Topic Relationships
              </h4>
              <p className="text-sm text-muted-foreground">
                Relate this practice set to specific GRE topics to help students find relevant practice materials.
              </p>
            </div>
            
            <FormField
              control={form.control}
              name="relatedTopicType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Related Topic Type</FormLabel>
                  <Select
                    value={field.value || ""}
                    onValueChange={(value) => {
                      field.onChange(value === "" ? null : value);
                      // Reset topic ID when type changes
                      form.setValue("relatedTopicId", null);
                    }}
                    disabled={isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select topic type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="quantitative">Quantitative</SelectItem>
                      <SelectItem value="verbal">Verbal</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The type of topic this practice set is related to.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="relatedTopicId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Related Topic</FormLabel>
                  <Select
                    value={field.value === null ? "" : String(field.value)}
                    onValueChange={(value) => {
                      const numValue = value === "" ? null : parseInt(value, 10);
                      field.onChange(numValue);
                    }}
                    disabled={isPending || !form.watch("relatedTopicType") || loadingTopics}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={loadingTopics ? "Loading topics..." : "Select a topic"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {loadingTopics ? (
                        <div className="flex items-center justify-center p-2">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          <span>Loading topics...</span>
                        </div>
                      ) : form.watch("relatedTopicType") === "quantitative" ? (
                        quantTopics.length > 0 ? (
                          quantTopics.map((topic) => (
                            <SelectItem key={topic.id} value={String(topic.id)}>
                              {topic.title} (Category: {topic.category})
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="" disabled>No quantitative topics found</SelectItem>
                        )
                      ) : form.watch("relatedTopicType") === "verbal" ? (
                        verbalTopics.length > 0 ? (
                          verbalTopics.map((topic) => (
                            <SelectItem key={topic.id} value={String(topic.id)}>
                              {topic.title} (Type: {topic.type})
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="" disabled>No verbal topics found</SelectItem>
                        )
                      ) : (
                        <SelectItem value="" disabled>Select a topic type first</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select a specific topic this practice set is related to.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="showInTopic"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Show in Topic Page</FormLabel>
                    <FormDescription>
                      Display this practice set on the related topic's page. This will enable both in-page and full-page practice options.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isPending || !form.watch("relatedTopicId")}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="inline-block">
                    <Button 
                      type="button" 
                      variant="secondary" 
                      size="sm"
                      disabled={!form.watch("relatedTopicType") || !form.watch("relatedTopicId")}
                      onClick={() => {
                        // View link would normally go to the topic page
                        toast({
                          title: "Topic Link",
                          description: `This would navigate to the ${form.watch("relatedTopicType")} topic with ID ${form.watch("relatedTopicId")}`,
                        });
                      }}
                    >
                      Preview Related Topic
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {form.watch("relatedTopicType") && form.watch("relatedTopicId") 
                    ? "View the related topic page" 
                    : "Select a topic type and ID first"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </TabsContent>
        </Tabs>
        
        <Separator />
        
        {/* Form actions */}
        <div className="flex justify-end gap-2">
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
            {editingItem ? "Update Practice Set" : "Create Practice Set"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default NewPracticeSetForm;