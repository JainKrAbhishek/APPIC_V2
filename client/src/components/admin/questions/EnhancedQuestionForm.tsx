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
  GripVertical,
  Eye,
  EyeOff
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

// Import preview components
import GREQuestionPreviewFixed from './GREQuestionPreviewFixed';
import GREExamPreview from './GREExamPreview';

// Import rich text editor components
import { RichTextEditorIntegration } from '@/lib/rich-text-editor';
import { RichTextEditor } from '@/lib/RichTextEditor';

// Import sortable item component
import SortableItem from './SortableItem';

// Schema for form validation
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

// Sortable option item component with improved UI
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
  
  // Local state for expanded explanation section
  const [isExplanationExpanded, setIsExplanationExpanded] = useState(false);

  return (
    <div className="relative group border rounded-md mb-4 bg-card overflow-hidden hover:shadow-md transition-all">
      {/* Option header with drag handle and letter indicator */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b">
        <div className="flex items-center">
          <div className="flex items-center cursor-move mr-3 p-1 rounded-md hover:bg-muted">
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
            isCorrect ? 'bg-green-100 text-green-700 ring-2 ring-green-500' : 'bg-muted text-muted-foreground'
          }`}>
            {optionLetter}
          </div>
          <span className="ml-2 font-medium">
            {isCorrect ? 'Correct Answer' : 'Answer Choice'}
          </span>
        </div>
        
        <div className="flex items-center">
          <Switch 
            checked={isCorrect} 
            onCheckedChange={(checked) => {
              onChange(index, { ...option, isCorrect: checked });
            }}
            id={`correct-${index}-${id}`}
            className="mr-2"
          />
          <Label htmlFor={`correct-${index}-${id}`} className="mr-4 text-sm cursor-pointer">
            {isCorrect ? (
              <span className="flex items-center text-green-600">
                <Check className="mr-1 h-4 w-4" />
                Correct
              </span>
            ) : 'Mark as correct'}
          </Label>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onDelete(index)} 
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Option body with content editor */}
      <div className="p-4">
        <Label htmlFor={`option-text-${index}-${id}`} className="text-sm font-medium mb-2 block">
          Text for Answer Choice {optionLetter}
        </Label>
        <div className="mb-3">
          <RichTextEditorIntegration
            value={Array.isArray(option.text) ? JSON.stringify(option.text) : option.text || ''}
            onChange={(value) => {
              onChange(index, { ...option, text: value });
            }}
            placeholder={`Type the text for answer choice ${optionLetter}...`}
            minHeight="100px"
          />
        </div>
        
        {/* Expandable explanation section */}
        <div className="mt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsExplanationExpanded(!isExplanationExpanded)}
            className="w-full flex items-center justify-between text-sm"
          >
            <span className="flex items-center">
              <AlertCircle className="mr-2 h-4 w-4 text-amber-500" />
              {isCorrect ? 'Explanation for Correct Answer' : 'Explanation for Incorrect Choice'}
            </span>
            {isExplanationExpanded ? (
              <EyeOff className="h-4 w-4 ml-2" />
            ) : (
              <Eye className="h-4 w-4 ml-2" />
            )}
          </Button>
          
          {isExplanationExpanded && (
            <div className="mt-3 pt-3 border-t">
              <FormDescription className="mb-2 text-sm">
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
          )}
        </div>
      </div>
    </div>
  );
};

// Interface for the question form props
interface EnhancedQuestionFormProps {
  onSubmit: (data: any) => void;
  editingQuestion?: any;
  isSubmitting?: boolean;
  topics?: any[];
  defaultType?: string;
}

// The main enhanced question form component
const EnhancedQuestionForm: React.FC<EnhancedQuestionFormProps> = ({
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
  const [showPreview, setShowPreview] = useState(false);
  
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
        topic: editingQuestion.topic ? editingQuestion.topic.toString() : 'no-topic',
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
  
  // Update an option's explanation
  const handleExplanationChange = (index: number, explanation: any) => {
    const newOptions = [...options];
    newOptions[index] = {
      ...newOptions[index],
      explanation,
    };
    setOptions(newOptions);
  };
  
  // State for tracking topic selection
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
  
  // Listen for subtype changes to update the form accordingly
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'subtype') {
        setQuestionType(value.subtype as string);
        
        // Initialize options if needed
        if (options.length === 0 && (
          value.subtype === 'multiple_choice' || 
          value.subtype === 'multiple_select' ||
          value.subtype === 'quantitative_comparison' ||
          value.subtype === 'numeric' ||
          value.subtype === 'sentence_equivalence' ||
          value.subtype === 'text_completion'
        )) {
          // Add default options based on question type
          const defaultOption = {
            id: 'option-0',
            text: [{ type: 'paragraph', children: [{ text: '' }] }],
            isCorrect: true,
            explanation: [{ type: 'paragraph', children: [{ text: '' }] }],
          };
          
          setOptions([defaultOption]);
        }
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form.watch, options.length]);
  
  // Handle form submission with validation
  const handleSubmit = (data: any) => {
    // Process the data before submission
    const finalData = { ...data };
    
    try {
      // Process the options field
      if (options.length > 0) {
        finalData.options = options;
      }
      
      // Handle different question types for answer format
      if (questionType === 'multiple_choice') {
        // For multiple choice, select the index of the correct option
        const correctIndex = options.findIndex(opt => opt.isCorrect);
        if (correctIndex === -1) {
          toast({
            title: "Validation Error", 
            description: "Please select a correct answer.",
            variant: "destructive"
          });
          return;
        }
        
        finalData.answer = correctIndex.toString();
      } else if (questionType === 'multiple_select') {
        // For multiple select, join all correct answers with commas
        const correctOptions = options.filter(opt => opt.isCorrect);
        if (correctOptions.length === 0) {
          toast({
            title: "Validation Error", 
            description: "Please select at least one correct answer.",
            variant: "destructive"
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
            description: "Please provide a numeric answer.",
            variant: "destructive"
          });
          return;
        }
        finalData.answer = options[0].text;
      }
      
      // Call the provided onSubmit function
      onSubmit(finalData);
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
          e.preventDefault();
          form.handleSubmit((data) => {
            handleSubmit(data);
          })(e);
        }} 
        className="space-y-6"
      >
        {/* Sticky header with actions - Always visible */}
        <div className="sticky top-0 z-10 bg-background pb-3 pt-1 mb-4 border-b flex flex-col">
          <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
            <h2 className="text-xl font-semibold flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-primary">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                <polyline points="14 2 14 8 20 8"/>
                <path d="M10 13L8 17h8l-2-4"/>
                <path d="M10 13l1 4"/>
                <path d="M14 13l-1 4"/>
              </svg>
              {editingQuestion ? `Edit Question #${editingQuestion.id}` : 'Create New Question'}
            </h2>
            <div className="flex items-center gap-2">
              <Button 
                type="button" 
                variant={showPreview ? "default" : "outline"}
                onClick={() => setShowPreview(!showPreview)}
                className="text-sm gap-1 h-9"
              >
                {showPreview ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-1" />
                    Hide Preview
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-1" />
                    Preview Question
                  </>
                )}
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting} 
                className="h-9"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingQuestion ? 'Save Changes' : 'Create Question'}
              </Button>
            </div>
          </div>
        </div>
        
        {/* Preview section */}
        {showPreview && (
          <div className="mb-6 border rounded-md overflow-hidden animate-in fade-in-50 duration-300">
            <div className="bg-muted/30 px-4 py-2 flex items-center justify-between">
              <h3 className="text-base font-medium flex items-center text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                Student View
              </h3>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 16v-4"></path>
                  <path d="M12 8h.01"></path>
                </svg>
                Changes appear in preview after you update each field
              </div>
            </div>
            
            <div className="p-5 max-h-[600px] overflow-auto bg-white">
              <GREExamPreview
                question={{
                  type: form.getValues().type,
                  subtype: form.getValues().subtype,
                  content: form.getValues().content || "Question content preview",
                  options: options.length > 0
                    ? options
                    : form.getValues().options || [],
                  explanation: form.getValues().explanation || "Explanation preview",
                  answer: form.getValues().answer
                }}
              />
            </div>
          </div>
        )}
        
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="w-full mb-4">
            <TabsTrigger value="question" className="flex-1 gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 3H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-1"/>
                <path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z"/>
                <path d="M15 11h2"/>
                <path d="M15 15h2"/>
                <path d="M7 11h6"/>
                <path d="M7 15h6"/>
                <path d="M7 19h14"/>
              </svg>
              Question Content
            </TabsTrigger>
            <TabsTrigger value="metadata" className="flex-1 gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2H2v10h10V2z"/>
                <path d="M22 12h-10v10h10V12z"/>
                <path d="M12 12H2v10h10V12z"/>
                <path d="M12 2h10v10H12V2z"/>
              </svg>
              Question Metadata
            </TabsTrigger>
          </TabsList>
          <TabsContent value="question" className="space-y-6 mt-0">
            {/* Question Classification Panel */}
            <Card className="overflow-hidden border-primary/20">
              <div className="bg-primary/5 px-4 py-3 border-b border-primary/20">
                <h3 className="text-base font-medium text-primary flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <circle cx="11.5" cy="14.5" r="2.5"/>
                    <path d="M13.25 16.25 15 18"/>
                  </svg>
                  Question Classification
                </h3>
              </div>
              
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* GRE Section Type */}
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
                          value={field.value}
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
                  
                  {/* Question Format/Subtype */}
                  <FormField
                    control={form.control}
                    name="subtype"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Question Format</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            setQuestionType(value);
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select question format" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {form.getValues().type === 'quantitative' ? (
                              <>
                                <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                                <SelectItem value="multiple_select">Multiple Answer</SelectItem>
                                <SelectItem value="numeric">Numeric Entry</SelectItem>
                                <SelectItem value="quantitative_comparison">Quantitative Comparison</SelectItem>
                              </>
                            ) : form.getValues().type === 'verbal' ? (
                              <>
                                <SelectItem value="reading_comprehension">Reading Comprehension</SelectItem>
                                <SelectItem value="text_completion">Text Completion</SelectItem>
                                <SelectItem value="sentence_equivalence">Sentence Equivalence</SelectItem>
                              </>
                            ) : (
                              <SelectItem value="select-section-first" disabled>Select GRE section first</SelectItem>
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
              </CardContent>
            </Card>
            
            {/* Question Content Panel */}
            <Card className="overflow-hidden border-primary/20">
              <div className="bg-primary/5 px-4 py-3 border-b border-primary/20">
                <h3 className="text-base font-medium text-primary flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Question Content
                </h3>
              </div>
              
              <CardContent className="p-4">
                {/* Question Content */}
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Question Text</FormLabel>
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
              
                {/* Answer Options Section */}
                {(questionType === 'multiple_choice' || 
                  questionType === 'multiple_select' || 
                  questionType === 'quantitative_comparison' ||
                  questionType === 'sentence_equivalence' ||
                  questionType === 'text_completion') && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-base font-medium flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                          <path d="M21 2H3v18h18V2Z"/>
                          <path d="m9 16 3-4 3 4"/>
                          <path d="m9 8 3 4 3-4"/>
                        </svg>
                        Answer Choices
                      </h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addOption}
                        className="flex items-center text-sm"
                      >
                        <Plus className="mr-1 h-4 w-4" />
                        Add Option
                      </Button>
                    </div>
                    
                    {/* Question-type specific guidance */}
                    <div className="bg-muted/30 p-3 rounded-md mb-4 text-sm">
                      {questionType === 'multiple_choice' && (
                        <div className="flex items-start">
                          <Info className="h-5 w-5 mr-2 text-blue-500 mt-0.5" />
                          <p>Select exactly <strong>one</strong> correct answer. The correct answer will be indicated to students during review.</p>
                        </div>
                      )}
                      {questionType === 'multiple_select' && (
                        <div className="flex items-start">
                          <Info className="h-5 w-5 mr-2 text-blue-500 mt-0.5" />
                          <p>Select <strong>all</strong> correct answers. Students must select all correct options to earn credit.</p>
                        </div>
                      )}
                      {questionType === 'sentence_equivalence' && (
                        <div className="flex items-start">
                          <Info className="h-5 w-5 mr-2 text-blue-500 mt-0.5" />
                          <p>Select <strong>exactly two</strong> correct answers that produce sentences with the same meaning.</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Sortable Options List */}
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                      modifiers={[restrictToVerticalAxis]}
                    >
                      <SortableContext
                        items={options.map(option => option.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {options.map((option, index) => (
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
                        ))}
                      </SortableContext>
                    </DndContext>
                    
                    {options.length === 0 && (
                      <div className="text-center p-6 border border-dashed rounded-md">
                        <p className="text-muted-foreground mb-3">No answer options yet</p>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={addOption}
                          className="mx-auto"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add First Option
                        </Button>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Numeric Entry */}
                {questionType === 'numeric' && (
                  <div className="mt-6">
                    <h4 className="text-base font-medium mb-3">Numeric Answer</h4>
                    <div className="bg-muted/30 p-3 rounded-md mb-4 text-sm">
                      <div className="flex items-start">
                        <Info className="h-5 w-5 mr-2 text-blue-500 mt-0.5" />
                        <p>Provide the exact numeric value that should be considered correct.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 w-full max-w-md p-4 border rounded-md">
                      <span className="text-sm font-medium">Correct Answer:</span>
                      <Input
                        type="text"
                        value={options[0]?.text || ''}
                        onChange={(e) => {
                          if (options.length === 0) {
                            setOptions([{
                              id: 'option-0',
                              text: e.target.value,
                              isCorrect: true,
                              explanation: ''
                            }]);
                          } else {
                            const newOptions = [...options];
                            newOptions[0] = {
                              ...newOptions[0],
                              text: e.target.value
                            };
                            setOptions(newOptions);
                          }
                        }}
                        placeholder="e.g. 42 or 3.14"
                        className="flex-1"
                      />
                    </div>
                  </div>
                )}
                
                {/* Explanation Field */}
                <div className="mt-6">
                  <FormField
                    control={form.control}
                    name="explanation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Overall Explanation</FormLabel>
                        <FormControl>
                          <RichTextEditor
                            initialValue={field.value}
                            onChange={field.onChange}
                            minHeight="200px"
                          />
                        </FormControl>
                        <FormDescription>
                          Provide a comprehensive explanation of the solution process that will help students understand the underlying concepts
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="metadata" className="space-y-6 mt-0">
            {/* Classification Panel */}
            <Card className="overflow-hidden border-primary/20">
              <div className="bg-primary/5 px-4 py-3 border-b border-primary/20">
                <h3 className="text-base font-medium text-primary flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                    <line x1="3" x2="21" y1="9" y2="9"/>
                    <line x1="3" x2="21" y1="15" y2="15"/>
                    <line x1="9" x2="9" y1="3" y2="21"/>
                    <line x1="15" x2="15" y1="3" y2="21"/>
                  </svg>
                  Category & Topic
                </h3>
              </div>
              
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Category Field */}
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Question Category</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {form.getValues().type === 'quantitative' ? (
                              isLoadingCategories ? (
                                <div className="flex items-center justify-center p-2">
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  Loading categories...
                                </div>
                              ) : (
                                quantCategories.map(category => (
                                  <SelectItem key={category} value={category}>
                                    {category}
                                  </SelectItem>
                                ))
                              )
                            ) : (
                              verbalTypes.map(type => (
                                <SelectItem key={type} value={type}>
                                  {type.replace(/_/g, ' ')}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {form.getValues().type === 'quantitative' 
                            ? "Choose the mathematical category this question belongs to"
                            : "Select the verbal reasoning category for this question"}
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
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a topic" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-[300px]">
                            <SelectItem value="no-topic">No specific topic</SelectItem>
                            
                            {form.getValues().type === 'quantitative' ? (
                              // Show filter for quantitative topics by category
                              <>
                                <div className="px-2 py-1 sticky top-0 bg-background border-b z-10">
                                  <Select
                                    onValueChange={setQuantTopicFilter}
                                    value={quantTopicFilter}
                                  >
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue placeholder="Filter by category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="all">All Categories</SelectItem>
                                      {quantCategories.map(category => (
                                        <SelectItem key={category} value={category}>
                                          {category}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Separator className="my-1" />
                                
                                {/* Render filtered and grouped topics */}
                                {quantTopics.length > 0 ? (
                                  (() => {
                                    // Filter topics by category if needed
                                    const filteredTopics = quantTopicFilter === 'all' 
                                      ? quantTopics 
                                      : quantTopics.filter(topic => topic.category === quantTopicFilter);
                                    
                                    if (filteredTopics.length === 0) {
                                      return (
                                        <div className="px-2 py-2 text-sm text-muted-foreground">
                                          No topics in the selected category
                                        </div>
                                      );
                                    }
                                    
                                    // Group topics by category
                                    const groupedTopics = filteredTopics.reduce((acc: any, topic: any) => {
                                      const category = topic.category || 'Uncategorized';
                                      if (!acc[category]) {
                                        acc[category] = [];
                                      }
                                      acc[category].push(topic);
                                      return acc;
                                    }, {});
                                    
                                    // Render grouped topics
                                    return Object.entries(groupedTopics).map(([category, topicsInCategory]: [string, any]) => (
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
                </div>
              </CardContent>
            </Card>
            
            {/* Difficulty and Tags Panel */}
            <Card className="overflow-hidden border-primary/20">
              <div className="bg-primary/5 px-4 py-3 border-b border-primary/20">
                <h3 className="text-base font-medium text-primary flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                  </svg>
                  Difficulty & Metadata
                </h3>
              </div>
              
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Difficulty Level - Now with visual slider */}
                  <FormField
                    control={form.control}
                    name="difficulty"
                    render={({ field }) => (
                      <FormItem className="mb-6">
                        <FormLabel>Difficulty Level</FormLabel>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Easy</span>
                            <span className="text-sm text-muted-foreground">Medium</span>
                            <span className="text-sm text-muted-foreground">Hard</span>
                          </div>
                          <FormControl>
                            <Slider
                              min={1}
                              max={5}
                              step={1}
                              value={[field.value]}
                              onValueChange={(values) => field.onChange(values[0])}
                              defaultValue={[field.value]}
                              className="w-full"
                            />
                          </FormControl>
                          <div className="flex justify-between px-1">
                            {[1, 2, 3, 4, 5].map((value) => (
                              <Button
                                key={value}
                                variant="ghost"
                                size="sm"
                                className={`w-8 h-8 p-0 ${field.value === value ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}`}
                                onClick={() => field.onChange(value)}
                              >
                                {value}
                              </Button>
                            ))}
                          </div>
                          <div className="flex justify-center mt-1">
                            <Badge 
                              variant={field.value <= 2 ? "outline" : field.value === 3 ? "secondary" : "default"}
                              className="px-3"
                            >
                              {field.value <= 2 ? "Easy" : field.value === 3 ? "Medium" : "Hard"} ({field.value}/5)
                            </Badge>
                          </div>
                        </div>
                        <FormDescription>
                          Rate the question difficulty from 1 (easiest) to 5 (hardest)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Tags Field */}
                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tags</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter tags separated by commas (e.g., equations, exponential, functions)"
                            {...field}
                            className="min-h-[80px] resize-y"
                          />
                        </FormControl>
                        <FormDescription>
                          Add tags to help categorize and search for this question
                        </FormDescription>
                        <FormMessage />
                        
                        {field.value && (
                          <div className="mt-4">
                            <Label className="text-sm mb-2 block">Preview Tags</Label>
                            <div className="flex flex-wrap gap-1.5">
                              {field.value.split(',').map((tag, i) => tag.trim() && (
                                <Badge key={i} variant="secondary" className="px-2 py-0.5">
                                  {tag.trim()}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Bottom action buttons */}
        <div className="flex justify-end space-x-3 pt-3 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? (
              <>
                <EyeOff className="mr-2 h-4 w-4" />
                Hide Preview
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                Preview Question
              </>
            )}
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editingQuestion ? 'Save Changes' : 'Create Question'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default EnhancedQuestionForm;