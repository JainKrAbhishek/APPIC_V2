import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  closestCenter,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import GREQuestionPreviewFixed from './GREQuestionPreviewFixed';
import GREExamPreview from './GREExamPreview';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { 
  Loader2, 
  Plus, 
  Trash2, 
  MoveVertical, 
  Info,
  Check,
  X,
  AlertCircle,
  GripVertical
} from 'lucide-react';
// Import enhanced rich text editor components
import { RichTextEditorIntegration } from '@/lib/rich-text-editor';
// Keep legacy import for backward compatibility
import { RichTextEditor } from '@/lib/RichTextEditor';

import SortableItem from './SortableItem';
import { useToast } from '@/hooks/use-toast';

// Schema for validation
const questionSchema = z.object({
  type: z.string().min(1, 'Question type is required'),
  subtype: z.string().min(1, 'Question subtype is required'),
  category: z.string().optional(),
  content: z.any().refine(val => val !== null, 'Question content is required'),
  options: z.array(z.any()).optional(),
  answer: z.string().min(1, 'Answer is required'),
  explanation: z.any().optional(),
  difficulty: z.coerce.number().min(1).max(5).optional(),
  topic: z.string().optional(),
  tags: z.string().optional(),
  imageUrls: z.array(z.string()).optional(),
  latexFormulas: z.any().optional(),
  quantQuestionTypeId: z.number().optional(),
  verbalQuestionTypeId: z.number().optional(),
});

// Option item for multiple choice questions with drag-and-drop functionality
const OptionItem = ({ 
  id, 
  option, 
  index, 
  onDelete, 
  onChange, 
  handleExplanationChange 
}: {
  id: string;
  option: any;
  index: number;
  onDelete: (index: number) => void;
  onChange: (index: number, updatedOption: any) => void;
  handleExplanationChange: (index: number, explanation: any) => void;
}) => {
  const isCorrect = option.isCorrect;
  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const optionLetter = letters[index] || `Option ${index + 1}`;

  return (
    <div className="flex items-start gap-3 p-4 border rounded-md mb-3 bg-card hover:shadow-sm transition-shadow">
      <div className="flex flex-col items-center space-y-3">
        <div className="flex items-center cursor-move">
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
          isCorrect ? 'bg-green-100 text-green-700 ring-2 ring-green-500' : 'bg-muted text-muted-foreground'
        }`}>
          {optionLetter}
        </div>
      </div>
      
      <div className="flex-1 space-y-3">
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Switch 
                checked={isCorrect} 
                onCheckedChange={(checked) => {
                  onChange(index, { ...option, isCorrect: checked });
                }}
                id={`correct-${index}-${id}`}
              />
              <Label htmlFor={`correct-${index}-${id}`} className="font-medium flex items-center">
                {isCorrect ? (
                  <span className="flex items-center text-green-600">
                    <Check className="mr-1 h-4 w-4" />
                    Correct answer
                  </span>
                ) : (
                  'Mark as correct'
                )}
              </Label>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onDelete(index)} 
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Remove
            </Button>
          </div>
          
          <Label htmlFor={`option-text-${index}-${id}`} className="text-sm font-medium mb-1">
            Answer choice {optionLetter}
          </Label>
          <div className="mb-2">
            <RichTextEditorIntegration
              value={Array.isArray(option.text) ? JSON.stringify(option.text) : option.text || ''}
              onChange={(value) => {
                onChange(index, { ...option, text: value });
              }}
              placeholder={`Type the text for answer choice ${optionLetter}...`}
              minHeight="100px"
            />
          </div>
          
          <div className="pt-3 mt-2 border-t">
            <div className="flex items-center mb-2">
              <AlertCircle className="mr-2 h-4 w-4 text-amber-500" />
              <Label htmlFor={`explanation-${index}-${id}`} className="font-medium">
                {isCorrect ? 'Explanation for correct answer' : 'Explanation for incorrect answer'}
              </Label>
            </div>
            <FormDescription className="mb-2">
              {isCorrect 
                ? 'Provide a detailed explanation of why this answer is correct. This will be shown to students during review.'
                : 'Explain why this option might be tempting but is incorrect. This helps students understand common misconceptions.'}
            </FormDescription>
            <RichTextEditorIntegration
              value={Array.isArray(option.explanation) ? JSON.stringify(option.explanation) : option.explanation || ''}
              onChange={(value) => {
                handleExplanationChange(index, value);
              }}
              placeholder={isCorrect 
                ? "Explain why this is the correct answer, what concepts it tests, and how to approach similar problems..."
                : "Explain the misconception or error in this option..."}
              minHeight={isCorrect ? "150px" : "100px"}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Interface for the question form props
interface QuestionImprovedFormProps {
  onSubmit: (data: any) => void;
  editingQuestion?: any;
  isSubmitting?: boolean;
  topics?: any[];
  defaultType?: string;
}

// The main question form component with drag-and-drop options
const QuestionImprovedForm: React.FC<QuestionImprovedFormProps> = ({
  onSubmit,
  editingQuestion,
  isSubmitting = false,
  topics = [],
  defaultType
}) => {
  const { toast } = useToast();
  const [options, setOptions] = useState<any[]>([]);
  const [questionType, setQuestionType] = useState<string>('multiple_choice');
  const [activeTab, setActiveTab] = useState('question');
  
  // Configure form with zod validation
  const form = useForm({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      type: defaultType || 'quantitative',
      subtype: 'multiple_choice',
      category: '',
      content: null,
      options: [],
      answer: '',
      explanation: null,
      difficulty: 3,
      topic: 'no-topic',
      tags: '',
      imageUrls: [],
      latexFormulas: null,
      quantQuestionTypeId: undefined,
      verbalQuestionTypeId: undefined,
    },
  });
  
  // Sensors for drag-and-drop functionality
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end event for reordering options
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setOptions((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };
  
  // Initialize form when editing an existing question
  useEffect(() => {
    if (editingQuestion) {
      const questionTypeValue = editingQuestion.type || 'quantitative';
      const questionSubtypeValue = editingQuestion.subtype || 'multiple_choice';
      
      setQuestionType(questionSubtypeValue);
      
      // Parse options if present
      let parsedOptions: any[] = [];
      if (editingQuestion.options && typeof editingQuestion.options === 'string') {
        try {
          const optionsData = JSON.parse(editingQuestion.options);
          parsedOptions = Array.isArray(optionsData) 
            ? optionsData.map((opt, index) => ({
                ...opt,
                id: `option-${index}`,
              })) 
            : [];
        } catch (e) {
          console.error('Error parsing options:', e);
        }
      } else if (Array.isArray(editingQuestion.options)) {
        parsedOptions = editingQuestion.options.map((opt: any, index: number) => ({
          ...opt,
          id: `option-${index}`,
        }));
      }
      
      setOptions(parsedOptions);
      
      // Initialize form values from the editing question
      form.reset({
        type: questionTypeValue,
        subtype: questionSubtypeValue,
        category: editingQuestion.category || '',
        content: editingQuestion.content || null,
        options: parsedOptions,
        answer: editingQuestion.answer || '',
        explanation: editingQuestion.explanation || null,
        difficulty: editingQuestion.difficulty || 3,
        topic: editingQuestion.topic || 'no-topic',
        tags: editingQuestion.tags || '',
        imageUrls: editingQuestion.imageUrls || [],
        latexFormulas: editingQuestion.latexFormulas || null,
        quantQuestionTypeId: editingQuestion.quantQuestionTypeId,
        verbalQuestionTypeId: editingQuestion.verbalQuestionTypeId,
      });
    }
  }, [editingQuestion, form]);
  
  // Add a new option to the list
  const addOption = () => {
    const newOption = {
      id: `option-${options.length}`,
      text: [{ type: 'paragraph', children: [{ text: '' }] }],
      isCorrect: false,
      explanation: [{ type: 'paragraph', children: [{ text: '' }] }],
    };
    
    setOptions([...options, newOption]);
  };
  
  // Delete an option from the list
  const deleteOption = (index: number) => {
    // Prevent deleting if there's only one option left
    if (options.length <= 1) {
      toast({
        title: "Cannot delete the only option",
        description: "Multiple choice questions must have at least one option.",
        variant: "destructive",
      });
      return;
    }
    
    const newOptions = [...options];
    newOptions.splice(index, 1);
    setOptions(newOptions);
  };
  
  // Update an option's properties
  const handleOptionChange = (index: number, updatedOption: any) => {
    const newOptions = [...options];
    newOptions[index] = updatedOption;
    setOptions(newOptions);
  };
  
  // State for tracking quant topic selection
  const [selectedQuantTopicId, setSelectedQuantTopicId] = useState<number | null>(null);
  const [quantTopics, setQuantTopics] = useState<any[]>([]);
  const [quantCategories, setQuantCategories] = useState<string[]>([]);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  // Track verbal topics and types
  const [verbalTopics, setVerbalTopics] = useState<any[]>([]);
  const [verbalTypes, setVerbalTypes] = useState<string[]>([]);
  const [selectedVerbalTopicId, setSelectedVerbalTopicId] = useState<number | null>(null);
  
  // Topic filters for questions
  const [quantTopicFilter, setQuantTopicFilter] = useState<string>('all');
  const [verbalTopicFilter, setVerbalTopicFilter] = useState<string>('all');
  
  // Load appropriate topics when type changes
  useEffect(() => {
    async function fetchTopics() {
      const questionType = form.getValues().type;
      setIsLoadingTopics(true);
      
      if (questionType === 'quantitative') {
        try {
          const response = await fetch('/api/quant/topics');
          if (response.ok) {
            const data = await response.json();
            setQuantTopics(data);
          } else {
            console.error('Failed to fetch quantitative topics');
          }
        } catch (error) {
          console.error('Error fetching quant topics:', error);
        } finally {
          setIsLoadingTopics(false);
        }
      } 
      else if (questionType === 'verbal') {
        try {
          const response = await fetch('/api/verbal/topics');
          if (response.ok) {
            const data = await response.json();
            setVerbalTopics(data);
          } else {
            console.error('Failed to fetch verbal topics');
          }
        } catch (error) {
          console.error('Error fetching verbal topics:', error);
        } finally {
          setIsLoadingTopics(false);
        }
      }
    }
    
    fetchTopics();
  }, [form.getValues().type]);
  
  // Load categories and verbal types
  useEffect(() => {
    async function fetchCategoriesAndTypes() {
      const questionType = form.getValues().type;
      
      if (questionType === 'quantitative') {
        setIsLoadingCategories(true);
        try {
          const response = await fetch('/api/quant/categories');
          if (response.ok) {
            const data = await response.json();
            setQuantCategories(data.categories || []);
          } else {
            console.error('Failed to fetch quantitative categories');
          }
        } catch (error) {
          console.error('Error fetching quant categories:', error);
        } finally {
          setIsLoadingCategories(false);
        }
      } 
      else if (questionType === 'verbal') {
        setIsLoadingCategories(true);
        try {
          const response = await fetch('/api/verbal/types');
          if (response.ok) {
            const data = await response.json();
            setVerbalTypes(data || []);
          } else {
            console.error('Failed to fetch verbal types');
          }
        } catch (error) {
          console.error('Error fetching verbal types:', error);
        } finally {
          setIsLoadingCategories(false);
        }
      }
    }
    
    fetchCategoriesAndTypes();
  }, [form.getValues().type]);

  // Update an option's explanation
  const handleExplanationChange = (index: number, explanation: any) => {
    const newOptions = [...options];
    newOptions[index] = {
      ...newOptions[index],
      explanation,
    };
    setOptions(newOptions);
  };
  
  // State for text completion blanks
  const [textCompletionBlanks, setTextCompletionBlanks] = useState<number>(1);

  // State for preview toggle
  const [showPreview, setShowPreview] = useState(false);
  
  // Handle form submission
  const handleSubmit = (data: any) => {
    console.log("Form submission handler called with data:", data);
    
    // Process the topic field with detailed logging
    const originalTopic = data.topic;
    let processedTopic = null;
    
    // Log topic field details before processing
    console.log("Topic field details:", {
      value: originalTopic,
      type: typeof originalTopic,
      isNull: originalTopic === null,
      isUndefined: originalTopic === undefined,
      isNoTopic: originalTopic === 'no-topic' || originalTopic === 'no-topic-selected',
      valueToString: originalTopic ? originalTopic.toString() : 'null'
    });
    
    // Handle special topic values for better compatibility
    if (originalTopic === 'no-topic' || originalTopic === 'no-topic-selected' || originalTopic === '') {
      console.log("Setting topic field to null (special value detected)");
      processedTopic = null;
    } else if (originalTopic) {
      processedTopic = String(originalTopic);
      console.log(`Topic value processed: ${typeof processedTopic} (${processedTopic})`);
    } else {
      console.log("Topic is null or undefined, setting to null");
      processedTopic = null;
    }
    
    // Build the final data object to submit
    const finalData = {
      ...data,
      // Use processed topic value
      topic: processedTopic,
      options: JSON.stringify(options),
    };
    
    // Log the final data for debugging
    console.log("Prepared data for submission:", JSON.stringify(finalData));
    
    // If editing, include the ID
    if (editingQuestion?.id) {
      finalData.id = editingQuestion.id;
    }
    
    // For multiple choice questions, derive the answer from the selected correct option
    if (questionType === 'multiple_choice' || questionType === 'quantitative_comparison') {
      const correctOptions = options.filter(opt => opt.isCorrect);
      let answer;
      
      if (correctOptions.length === 1) {
        // Single correct answer
        const correctIndex = options.findIndex(opt => opt.isCorrect);
        answer = correctIndex !== -1 ? correctIndex.toString() : '0';
      } else if (correctOptions.length > 1) {
        // Multiple correct answers
        answer = options
          .map((opt, index) => opt.isCorrect ? index : null)
          .filter(index => index !== null)
          .join(',');
      } else {
        // No correct answer selected
        toast({
          title: "Validation Error",
          description: "Please select at least one correct answer.",
          variant: "destructive",
        });
        return;
      }
      
      finalData.answer = answer;
    } else if (questionType === 'multiple_select') {
      // For multiple select, join all correct answers with commas
      const correctOptions = options.filter(opt => opt.isCorrect);
      if (correctOptions.length === 0) {
        toast({
          title: "Validation Error", 
          description: "Please select at least one correct answer.",
          variant: "destructive",
        });
        return;
      }
      
      finalData.answer = options
        .map((opt, index) => opt.isCorrect ? index : null)
        .filter(index => index !== null)
        .join(',');
    } else if (questionType === 'numeric') {
      // For numeric entry, use the first option's value as the answer
      if (!options[0]?.text) {
        toast({
          title: "Validation Error",
          description: "Please enter a numeric answer value.",
          variant: "destructive", 
        });
        return;
      }
      finalData.answer = options[0].text;
    } else if (questionType === 'sentence_equivalence') {
      // For sentence equivalence, need to have exactly 2 correct answers
      const correctOptions = options.filter(opt => opt.isCorrect);
      if (correctOptions.length !== 2) {
        toast({
          title: "Validation Error",
          description: "Sentence equivalence questions must have exactly 2 correct answers.",
          variant: "destructive",
        });
        return;
      }
      
      finalData.answer = options
        .map((opt, index) => opt.isCorrect ? index : null)
        .filter(index => index !== null)
        .join(',');
    } else if (questionType === 'text_completion') {
      // For text completion, the answer format depends on blanks
      const blankCount = (data.content?.match(/_______/g) || []).length;
      
      if (blankCount === 0) {
        toast({
          title: "Validation Error",
          description: "Text completion questions must have at least one blank (use '_______' in content).",
          variant: "destructive",
        });
        return;
      }
      
      // For text completion with multiple blanks, group answers by blank
      if (blankCount > 1) {
        // Each blank has its own correct answer(s)
        const blankAnswers = Array(blankCount).fill('').map((_, i) => {
          const blankOptions = options.slice(i * 3, (i + 1) * 3);
          const correctIndex = blankOptions.findIndex(opt => opt.isCorrect);
          return correctIndex !== -1 ? correctIndex : 0;
        });
        
        finalData.answer = blankAnswers.join(',');
      } else {
        // Single blank, just use the correct option index
        const correctIndex = options.findIndex(opt => opt.isCorrect);
        finalData.answer = correctIndex !== -1 ? correctIndex.toString() : '0';
      }
    }
    
    // Convert numeric fields to numbers
    if (finalData.difficulty) {
      finalData.difficulty = parseInt(finalData.difficulty);
    }
    
    // Convert JSON content if needed
    if (typeof finalData.content === 'string' && finalData.content.trim().startsWith('[')) {
      try {
        finalData.content = JSON.parse(finalData.content);
      } catch (e) {
        // Keep it as string if parsing fails
        console.error('Failed to parse content as JSON:', e);
      }
    }
    
    // Debug info for updating
    if (editingQuestion?.id) {
      console.log('Updating question with ID:', editingQuestion.id);
    } else {
      console.log('Creating new question');
    }
    
    // Validate that required fields are present
    if (!finalData.type) {
      console.error("Missing required field: type");
      toast({
        title: "Error",
        description: "Question type is required",
        variant: "destructive"
      });
      return;
    }
    
    if (!finalData.subtype) {
      console.error("Missing required field: subtype");
      toast({
        title: "Error",
        description: "Question subtype is required",
        variant: "destructive"
      });
      return;
    }
    
    if (!finalData.content) {
      console.error("Missing required field: content");
      toast({
        title: "Error",
        description: "Question content is required",
        variant: "destructive"
      });
      return;
    }
    
    console.log('Submitting question data:', finalData);
    try {
      onSubmit(finalData);
      console.log('Form submission function called successfully');
    } catch (error) {
      console.error('Error in form submission:', error);
      toast({
        title: "Error",
        description: "Failed to submit the form. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <Form {...form}>
      <form 
        onSubmit={(e) => {
          console.log("Native form submission event triggered");
          form.handleSubmit((data) => {
            console.log("Form handleSubmit callback triggered with data:", data);
            handleSubmit(data);
          })(e);
        }} 
        className="space-y-6">
        {showPreview && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold flex items-center text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                GRE Question Preview
              </h3>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowPreview(false)} 
                className="text-muted-foreground"
              >
                Close Preview
              </Button>
            </div>
            
            <div className="border border-primary/20 rounded-md p-1 bg-primary/5">
              <div className="max-h-[600px] overflow-auto">
                <GREExamPreview
                  question={{
                    type: form.getValues().type,
                    subtype: form.getValues().subtype,
                    content: form.getValues().content || "Question content preview",
                    options: options.map(opt => opt.text),
                    explanation: form.getValues().explanation || "Explanation preview",
                    answer: form.getValues().answer
                  }}
                  showExplanation={true}
                  inlinePreview={true}
                />
              </div>
            </div>
          </div>
        )}
        
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full"
        >
          <div className="flex items-center justify-between mb-4">
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="question">Question Content</TabsTrigger>
              <TabsTrigger value="metadata">Question Metadata</TabsTrigger>
            </TabsList>
            
            {!showPreview && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowPreview(true)}
                className="text-sm gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                Preview Question
              </Button>
            )}
          </div>
          
          <TabsContent value="question" className="space-y-6">
            {/* First Section: Topic Selection and Question Type */}
            <div className="p-4 border border-primary/20 rounded-md space-y-6 bg-primary/5">
              <h3 className="text-lg font-medium text-primary flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><circle cx="11.5" cy="14.5" r="2.5"/><path d="M13.25 16.25 15 18"/></svg>
                Question Classification
              </h3>
              
              {/* Question Type and Topic Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Main Type Selection */}
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GRE Section</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          // Reset subtype when type changes
                          form.setValue('subtype', '');
                          form.setValue('topic', 'no-topic-selected');
                          // Reset topic filters when changing sections
                          setQuantTopicFilter('all');
                          setVerbalTopicFilter('all');
                        }}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select GRE section" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem key="quant" value="quantitative">Quantitative Reasoning</SelectItem>
                          <SelectItem key="verbal" value="verbal">Verbal Reasoning</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select the main GRE exam section
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Topic Selection */}
                <FormField
                  control={form.control}
                  name="topic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Associated Topic</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          if (form.getValues().type === 'quantitative') {
                            setSelectedQuantTopicId(value !== 'no-topic' ? parseInt(value) : null);
                          } else if (form.getValues().type === 'verbal') {
                            setSelectedVerbalTopicId(value !== 'no-topic' ? parseInt(value) : null);
                          }
                        }}
                        value={field.value || 'no-topic'}
                        disabled={!form.getValues().type}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a topic" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem key="no-topic" value="no-topic">No Topic</SelectItem>
                          {form.getValues().type === 'quantitative' && quantTopics.length > 0 ? (
                            quantTopics
                              .filter(topic => {
                                if (quantTopicFilter === 'all') return true;
                                
                                const topicName = (topic.title || topic.name || '').toLowerCase();
                                const topicDesc = (topic.description || '').toLowerCase();
                                
                                switch (quantTopicFilter) {
                                  case 'algebra':
                                    return topicName.includes('algebra') || 
                                           topicDesc.includes('algebra') ||
                                           topicName.includes('equation') || 
                                           topicName.includes('expression') ||
                                           topicName.includes('function');
                                  case 'geometry':
                                    return topicName.includes('geometry') || 
                                           topicDesc.includes('geometry') ||
                                           topicName.includes('angle') ||
                                           topicName.includes('circle') ||
                                           topicName.includes('triangle') ||
                                           topicName.includes('shape');
                                  case 'arithmetic':
                                    return topicName.includes('arithmetic') ||
                                           topicDesc.includes('arithmetic') ||
                                           topicName.includes('number') ||
                                           topicName.includes('fraction') ||
                                           topicName.includes('decimal') ||
                                           topicName.includes('percent');
                                  case 'data_analysis':
                                    return topicName.includes('data') ||
                                           topicDesc.includes('data') ||
                                           topicName.includes('statistic') ||
                                           topicName.includes('probability') ||
                                           topicName.includes('graph');
                                  default:
                                    return true;
                                }
                              })
                              .map((topic) => (
                                <SelectItem key={topic.id} value={topic.id.toString()}>
                                  {topic.title || topic.name}
                                </SelectItem>
                              ))
                          ) : form.getValues().type === 'verbal' && verbalTopics.length > 0 ? (
                            verbalTopics.map((topic) => (
                              <SelectItem key={topic.id} value={topic.id.toString()}>
                                {topic.title || topic.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem key="no-topics-available" value="no-topics-disabled" disabled>No topics available</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Link this question to a curriculum topic (recommended)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Topic Category Filter - Only for quantitative */}
              {form.getValues().type === 'quantitative' && (
                <div className="bg-muted/30 p-3 rounded-md border border-border/60">
                  <h4 className="font-medium text-sm mb-2 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                    Filter Topics by Category
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button" 
                      onClick={() => setQuantTopicFilter('all')}
                      className={`px-3 py-1 rounded-full text-xs border ${
                        quantTopicFilter === 'all' 
                          ? 'bg-primary text-primary-foreground border-primary font-medium' 
                          : 'bg-background border-input hover:bg-muted/50'
                      }`}
                    >
                      All Topics
                    </button>
                    <button
                      type="button" 
                      onClick={() => setQuantTopicFilter('algebra')}
                      className={`px-3 py-1 rounded-full text-xs border ${
                        quantTopicFilter === 'algebra' 
                          ? 'bg-primary text-primary-foreground border-primary font-medium' 
                          : 'bg-background border-input hover:bg-muted/50'
                      }`}
                    >
                      Algebra
                    </button>
                    <button
                      type="button" 
                      onClick={() => setQuantTopicFilter('geometry')}
                      className={`px-3 py-1 rounded-full text-xs border ${
                        quantTopicFilter === 'geometry' 
                          ? 'bg-primary text-primary-foreground border-primary font-medium' 
                          : 'bg-background border-input hover:bg-muted/50'
                      }`}
                    >
                      Geometry
                    </button>
                    <button
                      type="button" 
                      onClick={() => setQuantTopicFilter('arithmetic')}
                      className={`px-3 py-1 rounded-full text-xs border ${
                        quantTopicFilter === 'arithmetic' 
                          ? 'bg-primary text-primary-foreground border-primary font-medium' 
                          : 'bg-background border-input hover:bg-muted/50'
                      }`}
                    >
                      Arithmetic
                    </button>
                    <button
                      type="button" 
                      onClick={() => setQuantTopicFilter('data_analysis')}
                      className={`px-3 py-1 rounded-full text-xs border ${
                        quantTopicFilter === 'data_analysis' 
                          ? 'bg-primary text-primary-foreground border-primary font-medium' 
                          : 'bg-background border-input hover:bg-muted/50'
                      }`}
                    >
                      Data Analysis
                    </button>
                  </div>
                </div>
              )}
              
              {/* Question Format */}
              <FormField
                control={form.control}
                name="subtype"
                render={({ field }) => (
                  <FormItem className="mt-2">
                    <FormLabel>Question Format</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        setQuestionType(value);
                      }}
                      defaultValue={field.value}
                      disabled={!form.getValues().type}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select question format" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {form.getValues().type === 'quantitative' ? (
                          <>
                            <SelectItem key="mc" value="multiple_choice">Multiple Choice</SelectItem>
                            <SelectItem key="ms" value="multiple_select">Multiple Select</SelectItem>
                            <SelectItem key="num" value="numeric">Numeric Entry</SelectItem>
                            <SelectItem key="qc" value="quantitative_comparison">Quantitative Comparison</SelectItem>
                            <SelectItem key="di" value="data_interpretation">Data Interpretation</SelectItem>
                          </>
                        ) : form.getValues().type === 'verbal' ? (
                          <>
                            <SelectItem key="tc" value="text_completion">Text Completion</SelectItem>
                            <SelectItem key="se" value="sentence_equivalence">Sentence Equivalence</SelectItem>
                            <SelectItem key="rc" value="reading_comprehension">Reading Comprehension</SelectItem>
                            <SelectItem key="cr" value="critical_reasoning">Critical Reasoning</SelectItem>
                            <SelectItem key="aa" value="argument_analysis">Argument Analysis</SelectItem>
                          </>
                        ) : (
                          <SelectItem key="select-section-first" value="section-first-disabled" disabled>Select GRE section first</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the specific question format that matches official GRE exam
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Question Content */}
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question Content</FormLabel>
                  <FormControl>
                    <RichTextEditor
                      initialValue={field.value}
                      onChange={field.onChange}
                      minHeight="200px"
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the question text and any necessary diagrams or formulas
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Answer Options - Only for multiple choice questions */}
            {(questionType === 'multiple_choice' || questionType === 'quantitative_comparison') && (
              <Card className="border-t-4 border-t-primary">
                <CardContent className="pt-6 pb-4">
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-semibold flex items-center">
                          {questionType === 'multiple_choice' ? (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M8 2v4"></path><path d="M16 2v4"></path><rect width="18" height="18" x="3" y="6" rx="2"></rect><path d="M3 10h18"></path></svg>
                              GRE-Style Answer Choices
                            </>
                          ) : (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><rect width="9" height="9" x="2" y="2" rx="2"></rect><rect width="9" height="9" x="13" y="2" rx="2"></rect><rect width="9" height="9" x="2" y="13" rx="2"></rect><rect width="9" height="9" x="13" y="13" rx="2"></rect></svg>
                              Quantitative Comparison Options
                            </>
                          )}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Add answer choices and mark the correct one(s). Drag to reorder.
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addOption}
                        className="gap-1"
                      >
                        <Plus className="h-4 w-4" />
                        Add Choice
                      </Button>
                    </div>
                    
                    {questionType === 'quantitative_comparison' && options.length === 0 && (
                      <div className="bg-muted/50 p-3 rounded-md text-sm">
                        <p className="font-medium">Tip: Quantitative Comparison Format</p>
                        <p className="mt-1">Standard GRE quantitative comparison options are:</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                          <li>Quantity A is greater</li>
                          <li>Quantity B is greater</li>
                          <li>The two quantities are equal</li>
                          <li>The relationship cannot be determined</li>
                        </ul>
                      </div>
                    )}
                    
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                      modifiers={[restrictToVerticalAxis]}
                    >
                      <SortableContext
                        items={options.map(o => o.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-3">
                          {options.length === 0 ? (
                            <div className="text-center py-12 border border-dashed rounded-md bg-background flex flex-col items-center justify-center gap-3">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v8"></path><path d="M8 12h8"></path></svg>
                              <div>
                                <p className="text-muted-foreground">
                                  No answer choices added yet. 
                                </p>
                                <p className="text-muted-foreground text-sm mt-1">
                                  Click "Add Choice" above to create options.
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addOption}
                                className="mt-2"
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Add First Choice
                              </Button>
                            </div>
                          ) : (
                            options.map((option, index) => (
                              <SortableItem key={option.id} id={option.id}>
                                <OptionItem
                                  id={option.id}
                                  option={option}
                                  index={index}
                                  onDelete={deleteOption}
                                  onChange={handleOptionChange}
                                  handleExplanationChange={handleExplanationChange}
                                />
                              </SortableItem>
                            ))
                          )}
                        </div>
                      </SortableContext>
                    </DndContext>

                    {options.length > 0 && (
                      <div className="flex items-center justify-between border-t pt-3 mt-2">
                        <p className="text-sm text-muted-foreground">
                          {options.filter(opt => opt.isCorrect).length} of {options.length} marked as correct
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addOption}
                          className="gap-1"
                        >
                          <Plus className="h-4 w-4" />
                          Add Another
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Text Completion - Special fields for text completion questions */}
            {questionType === 'text_completion' && (
              <Card className="border-t-4 border-t-purple-500">
                <CardContent className="pt-6 pb-4">
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-base font-semibold flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><rect width="18" height="18" x="3" y="3" rx="2"></rect><path d="M9 3v18"></path><path d="M14 15h2"></path><path d="M14 9h5"></path><path d="M14 12h3"></path></svg>
                        Text Completion Configuration
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Configure the number of blanks and answer options for this text completion question
                      </p>
                    </div>
                    
                    <div className="bg-muted/50 p-3 rounded-md text-sm">
                      <p className="font-medium">GRE Text Completion Format:</p>
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>Single blank: One blank with 5 options</li>
                        <li>Double blank: Two blanks with 3 options each</li>
                        <li>Triple blank: Three blanks with 3 options each</li>
                      </ul>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Number of Blanks</label>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex border rounded-md">
                          {[1, 2, 3].map(num => (
                            <button
                              key={num}
                              type="button"
                              className={`px-4 py-2 ${textCompletionBlanks === num 
                                ? 'bg-primary text-primary-foreground font-medium' 
                                : 'bg-transparent hover:bg-muted'
                              }`}
                              onClick={() => setTextCompletionBlanks(num)}
                            >
                              {num} {num === 1 ? 'Blank' : 'Blanks'}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* Blank 1 Options */}
                    <div className="space-y-3 pt-3 border-t border-border/60">
                      <h4 className="font-medium">
                        Blank 1 Options
                      </h4>
                      <div className="space-y-3">
                        {Array.from({length: 5}).map((_, i) => (
                          <div key={`blank1-${i}`} className="flex items-center gap-3">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-medium ${
                              i === 0 ? 'bg-green-100 text-green-700 ring-2 ring-green-500' : 'bg-muted'
                            }`}>
                              {String.fromCharCode(65 + i)}
                            </div>
                            <Input
                              placeholder={`Option ${String.fromCharCode(65 + i)}`}
                              className="flex-1"
                            />
                            <div className="w-16">
                              {i === 0 ? (
                                <span className="text-xs text-green-600 font-medium flex items-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M20 6 9 17l-5-5"/></svg>
                                  Correct
                                </span>
                              ) : (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Blank 2 Options */}
                    {textCompletionBlanks >= 2 && (
                      <div className="space-y-3 pt-3 border-t border-border/60">
                        <h4 className="font-medium">
                          Blank 2 Options
                        </h4>
                        <div className="space-y-3">
                          {Array.from({length: 3}).map((_, i) => (
                            <div key={`blank2-${i}`} className="flex items-center gap-3">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-medium ${
                                i === 0 ? 'bg-green-100 text-green-700 ring-2 ring-green-500' : 'bg-muted'
                              }`}>
                                {String.fromCharCode(65 + i)}
                              </div>
                              <Input
                                placeholder={`Option ${String.fromCharCode(65 + i)}`}
                                className="flex-1"
                              />
                              <div className="w-16">
                                {i === 0 ? (
                                  <span className="text-xs text-green-600 font-medium flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M20 6 9 17l-5-5"/></svg>
                                    Correct
                                  </span>
                                ) : (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Blank 3 Options */}
                    {textCompletionBlanks >= 3 && (
                      <div className="space-y-3 pt-3 border-t border-border/60">
                        <h4 className="font-medium">
                          Blank 3 Options
                        </h4>
                        <div className="space-y-3">
                          {Array.from({length: 3}).map((_, i) => (
                            <div key={`blank3-${i}`} className="flex items-center gap-3">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-medium ${
                                i === 0 ? 'bg-green-100 text-green-700 ring-2 ring-green-500' : 'bg-muted'
                              }`}>
                                {String.fromCharCode(65 + i)}
                              </div>
                              <Input
                                placeholder={`Option ${String.fromCharCode(65 + i)}`}
                                className="flex-1"
                              />
                              <div className="w-16">
                                {i === 0 ? (
                                  <span className="text-xs text-green-600 font-medium flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M20 6 9 17l-5-5"/></svg>
                                    Correct
                                  </span>
                                ) : (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="pt-3 border-t">
                      <p className="text-sm text-muted-foreground mb-2">
                        Tip: In the content area above, use [BLANK1], [BLANK2], etc. to indicate where blanks should appear in the text.
                      </p>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-1"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                          Insert Blank in Content
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Numeric Answer - Only for numeric entry questions */}
            {questionType === 'numeric' && (
              <Card className="border-t-4 border-t-blue-500">
                <CardContent className="pt-6 pb-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-base font-semibold flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
                        Numeric Entry Answer
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Provide the exact numeric value that solves this problem
                      </p>
                    </div>
                    
                    <div className="bg-muted/50 p-3 rounded-md text-sm">
                      <p className="font-medium">GRE Numeric Entry Tips:</p>
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>Enter the exact value without rounding (e.g., "8" or "2.5")</li>
                        <li>For fractions, use either decimals or the form "x/y" (e.g., "3/4")</li>
                        <li>For negative values, use the minus sign (e.g., "-2")</li>
                      </ul>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="answer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base">Correct Answer</FormLabel>
                          <FormControl>
                            <div className="flex space-x-3">
                              <Input 
                                type="text" 
                                placeholder="e.g. 42 or 3.14 or 4/5" 
                                {...field} 
                                className="text-lg font-medium"
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Enter the exact numeric answer or formula that would be accepted
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="pt-3 border-t">
                      <label className="text-sm font-medium">Alternative Acceptable Answers</label>
                      <div className="flex items-center mt-2 gap-2">
                        <Input 
                          type="text" 
                          placeholder="e.g. 3/4 or 0.75 (optional)" 
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-1"
                        >
                          <Plus className="h-4 w-4" />
                          Add
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        You can add alternative forms of the correct answer that should be accepted, e.g. decimal and fraction forms
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* General Explanation */}
            <Card className="border-t-4 border-t-green-500">
              <CardContent className="pt-6 pb-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-semibold flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
                      Solution Explanation
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Provide a comprehensive explanation of the solution process and concepts tested
                    </p>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="explanation"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <RichTextEditor
                            initialValue={field.value}
                            onChange={field.onChange}
                            minHeight="200px"
                            placeholder="Explain the complete solution process, including: 
1. Key concepts being tested
2. Step-by-step solution approach
3. Common mistakes students might make
4. Connections to other topics or concepts"
                          />
                        </FormControl>
                        <FormDescription className="mt-2">
                          A thorough explanation helps students understand the underlying concepts
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="bg-green-50 dark:bg-green-950/30 p-3 rounded-md text-sm border border-green-200 dark:border-green-900">
                    <p className="font-medium text-green-800 dark:text-green-300 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><circle cx="12" cy="12" r="10"></circle><path d="m9 12 2 2 4-4"></path></svg>
                      Best Practices for GRE Explanations
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-1 text-green-700 dark:text-green-400">
                      <li>Include multiple approaches when relevant</li>
                      <li>Address common misconceptions</li>
                      <li>Use clear, step-by-step reasoning</li>
                      <li>Reference specific GRE strategies when applicable</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="metadata" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-base font-semibold mb-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                    Question Classification
                  </h3>
                  
                  {/* Category Field */}
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem className="mb-4">
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                          {form.getValues().type === 'quantitative' ? (
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value);
                                // Set filter for topics when category changes
                                setQuantTopicFilter(value);
                              }}
                              defaultValue={field.value}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {isLoadingCategories ? (
                                  <div className="p-2 flex items-center justify-center">
                                    <svg className="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span className="ml-2">Loading categories...</span>
                                  </div>
                                ) : (
                                  <>
                                    {quantCategories.map((category) => (
                                      <SelectItem key={category} value={category}>
                                        {category}
                                      </SelectItem>
                                    ))}
                                    {quantCategories.length === 0 && (
                                      <div className="p-2 text-sm text-muted-foreground">
                                        No categories found
                                      </div>
                                    )}
                                  </>
                                )}
                              </SelectContent>
                            </Select>
                          ) : form.getValues().type === 'verbal' ? (
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value);
                                // When verbal type changes, we should filter the topics
                                form.setValue('topic', 'no-topic-selected');
                                // Set filter for verbal topics
                                setVerbalTopicFilter(value);
                              }}
                              defaultValue={field.value}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a verbal category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {isLoadingCategories ? (
                                  <div className="p-2 flex items-center justify-center">
                                    <svg className="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span className="ml-2">Loading categories...</span>
                                  </div>
                                ) : (
                                  <>
                                    {verbalTypes.map((type) => (
                                      <SelectItem key={type} value={type}>
                                        {type}
                                      </SelectItem>
                                    ))}
                                    {verbalTypes.length === 0 && (
                                      <div className="p-2 text-sm text-muted-foreground">
                                        No verbal categories found
                                      </div>
                                    )}
                                  </>
                                )}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              placeholder="e.g. Algebra, Geometry, Reading Comprehension"
                              {...field}
                            />
                          )}
                        </FormControl>
                        <FormDescription>
                          General category this question belongs to
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Topic */}
                  <FormField
                    control={form.control}
                    name="topic"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Topic</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            if (form.getValues().type === 'quantitative') {
                              setSelectedQuantTopicId(value !== 'no-topic-selected' ? parseInt(value) : null);
                            }
                          }}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select topic" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem key="related-none" value="no-topic-selected">None</SelectItem>
                            
                            {form.getValues().type === 'quantitative' ? (
                              <>
                                {isLoadingTopics ? (
                                  <div className="flex items-center justify-center py-3">
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    <span className="text-sm">Loading quantitative topics...</span>
                                  </div>
                                ) : (
                                  quantTopics.length > 0 ? (
                                    // Group topics by category and filter by selected category
                                    (() => {
                                      // Filter topics by selected category
                                      const filteredTopics = quantTopics.filter(
                                        topic => quantTopicFilter === 'all' || topic.category === quantTopicFilter
                                      );
                                      
                                      if (filteredTopics.length === 0) {
                                        return (
                                          <div className="px-2 py-2 text-sm text-muted-foreground">
                                            No topics found for selected category
                                          </div>
                                        );
                                      }
                                      
                                      // Group filtered topics by category
                                      const groupedTopics = filteredTopics.reduce((acc: Record<string, any[]>, topic: any) => {
                                        const category = topic.category || 'Uncategorized';
                                        if (!acc[category]) acc[category] = [];
                                        acc[category].push(topic);
                                        return acc;
                                      }, {});
                                      
                                      // Render grouped topics
                                      return Object.entries(groupedTopics).map(([category, topicsInCategory]) => (
                                        <div key={category}>
                                          <div className="px-2 py-1.5 text-sm font-semibold bg-muted/60 my-1">
                                            {category}
                                          </div>
                                          {topicsInCategory.map((topic: any) => (
                                            <SelectItem key={topic.id} value={topic.id.toString()}>
                                              {topic.name}
                                            </SelectItem>
                                          ))}
                                        </div>
                                      ));
                                    })()
                                  ) : (
                                    <div className="px-2 py-2 text-sm text-muted-foreground">
                                      No quantitative topics found
                                    </div>
                                  )
                                )}
                              </>
                            ) : (
                              // Verbal topics filtered by type
                              (() => {
                                const filteredTopics = verbalTopics.filter(
                                  (topic) => verbalTopicFilter === 'all' || topic.type === verbalTopicFilter
                                );
                                
                                if (filteredTopics.length === 0) {
                                  return (
                                    <div className="px-2 py-2 text-sm text-muted-foreground">
                                      No verbal topics found for selected category
                                    </div>
                                  );
                                }
                                
                                return filteredTopics.map((topic) => (
                                  <SelectItem key={topic.id} value={topic.id.toString()}>
                                    {topic.title}
                                  </SelectItem>
                                ));
                              })()
                            )}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {form.getValues().type === 'quantitative' 
                            ? "Associate with a GRE Quantitative topic for curriculum organization"
                            : "Associate with a specific curriculum topic"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-base font-semibold mb-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
                    Difficulty & Presentation
                  </h3>
                  
                  {/* Difficulty Level */}
                  <FormField
                    control={form.control}
                    name="difficulty"
                    render={({ field }) => (
                      <FormItem className="mb-6">
                        <FormLabel>Difficulty Level</FormLabel>
                        <FormControl>
                          <div className="flex items-center space-x-3">
                            <div className="grid grid-cols-5 gap-1 flex-1">
                              {[1, 2, 3, 4, 5].map((level) => (
                                <Button
                                  key={level}
                                  type="button"
                                  variant={field.value === level ? "default" : "outline"}
                                  className={`h-10 ${field.value === level ? "ring-2 ring-primary" : ""}`}
                                  onClick={() => field.onChange(level)}
                                >
                                  {level}
                                </Button>
                              ))}
                            </div>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                              field.value <= 2 
                                ? "bg-green-500" 
                                : field.value === 3 
                                  ? "bg-yellow-500" 
                                  : "bg-red-500"
                            }`}>
                              {field.value}
                            </div>
                          </div>
                        </FormControl>
                        <FormDescription className="mt-2">
                          {field.value <= 2 
                            ? "Easy: Straightforward application of concepts" 
                            : field.value === 3 
                              ? "Medium: Moderate complexity, requires some analysis" 
                              : "Hard: Complex problem requiring deeper understanding and strategy"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>
            
            {/* Tags */}
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="algebra, equations, word-problem"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Comma-separated tags for better organization
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
        </Tabs>
        
        <div className="flex items-center justify-between space-x-2 pt-6 mt-4 border-t">
          <div>
            {editingQuestion && (
              <Button 
                type="button" 
                variant="outline"
                onClick={() => {
                  // Clone function would be implemented in the parent component
                  // This is just a placeholder for UI demonstration
                  alert('Clone functionality would be triggered here');
                }}
                className="gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>
                Clone Question
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => form.reset()}
              className="px-6"
            >
              Reset Form
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="gap-1 px-6 bg-primary hover:bg-primary/90"
              size="lg"
              onClick={(e) => {
                console.log("Submit button clicked directly");
                if (isSubmitting) {
                  e.preventDefault();
                  return;
                }
                
                // Manual form submission as a fallback
                try {
                  e.preventDefault();
                  const formData = form.getValues();
                  console.log("Manual submission with form data:", formData);
                  handleSubmit(formData);
                } catch (error) {
                  console.error("Error in manual form submission:", error);
                }
              }}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
              )}
              {editingQuestion ? 'Update Question' : 'Create Question'}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
};

export default QuestionImprovedForm;