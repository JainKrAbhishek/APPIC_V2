import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, Search, Filter, BookOpen, Settings, Info,
  AlertCircle, Check, X, ChevronUp, ChevronDown,
  Loader2, Pencil, Trash, EyeIcon, Tag, LayoutGrid
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { createLogger } from '@/utils/logger';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Pagination, 
  PaginationContent, 
  PaginationEllipsis, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';

// Import performance optimization utilities
import { 
  useDebounce, 
  useStableState, 
  useTrackedCallback, 
  useMemoizedValue 
} from '@/utils/performance';

import QuestionImprovedForm from './QuestionImprovedForm';
import EnhancedQuestionForm from './EnhancedQuestionForm';
import GREQuestionPreviewFixed from './GREQuestionPreviewFixed';

// Create a specialized logger for questions management with appropriate log level
const questionLogger = createLogger({
  group: 'Questions',
  category: 'admin',
  minLevel: 'warn' // Restrict logging to warnings and errors by default
});

// Define interfaces used throughout the component
interface QuantTopic {
  id: number;
  name: string;           // From database schema
  description: string;
  category: string;
  groupNumber: number;
  order: number;
  title?: string;         // For compatibility with other components
}

interface Question {
  id: number;
  type: string;
  subtype: string;
  content: any;
  options: any;
  answer: string;
  explanation: any;
  difficulty: number;
  topic: string | number | null; // Can be string or number depending on context
  tags: string;
  typeId: number | null;
  category?: string | null; // Category can be null or optional
  createdAt: string;
  updatedAt: string;
}

// Helper functions
const getDifficultyColor = (difficulty: number | null) => {
  if (difficulty === null) return 'bg-gray-300';
  
  const colors = [
    'bg-green-500', // 1 - Easy
    'bg-green-400', // 2
    'bg-amber-400', // 3 - Medium
    'bg-orange-400', // 4
    'bg-red-500', // 5 - Hard
  ];
  
  return colors[Math.min(Math.max(0, difficulty - 1), 4)];
};

const formatQuestionText = (text: any): string => {
  if (!text) return '';
  
  if (typeof text === 'string') {
    // Simple HTML stripping for string content
    return text.replace(/<[^>]*>?/gm, '').substring(0, 100) + (text.length > 100 ? '...' : '');
  }
  
  if (typeof text === 'object') {
    // This is for Slate/rich text format
    try {
      if (Array.isArray(text)) {
        return text.map(node => {
          if (node.children) {
            return node.children.map((child: any) => child.text || '').join(' ');
          }
          return '';
        }).join(' ').substring(0, 100) + (text.toString().length > 100 ? '...' : '');
      }
      
      return JSON.stringify(text).substring(0, 100) + '...';
    } catch (e) {
      return '[Complex content]';
    }
  }
  
  return '[Unknown format]';
};

const QuestionRow = ({
  question,
  onEdit,
  onDelete,
  onView,
  onClone,
  topicMap = {}
}: {
  question: Question;
  onEdit: (question: Question) => void;
  onDelete: (id: number) => void;
  onView: (question: Question) => void;
  onClone: (question: Question) => void;
  topicMap?: Record<string, QuantTopic>;
}) => {
  // Create metadata object for debugging and comprehensive display
  const questionMetadata = {
    id: question.id,
    type: question.type,
    subtype: question.subtype,
    difficulty: question.difficulty,
    topic: question.topic,
    topicType: typeof question.topic,
    category: question.category,
    tags: question.tags
  };
  
  // Conditionally log metadata for debugging when needed
  // console.debug("Question metadata:", questionMetadata);
  
  return (
    <TableRow className="hover:bg-accent/10">
      <TableCell className="font-medium">{question.id}</TableCell>
      <TableCell>
        <div className="flex flex-col">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${getDifficultyColor(question.difficulty)}`}></div>
            <span>{formatQuestionText(question.content)}</span>
          </div>
          {question.category && (
            <div className="mt-1">
              <Badge variant="outline" className="text-xs mr-1">
                {question.category}
              </Badge>
              {question.tags && (
                <span className="text-xs text-muted-foreground">
                  {Array.isArray(question.tags) 
                    ? question.tags.join(', ') 
                    : typeof question.tags === 'string' 
                      ? question.tags 
                      : ''}
                </span>
              )}
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="text-xs uppercase">
          {question.type}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant="secondary" className="text-xs">
          {question.subtype.replace(/_/g, ' ')}
        </Badge>
      </TableCell>
      <TableCell>
        {question.topic ? (
          topicMap[String(question.topic)] ? (
            <Badge className="text-xs" variant="outline">
              {topicMap[String(question.topic)].title || topicMap[String(question.topic)].name}
              <span className="ml-1 opacity-50">(ID: {String(question.topic)})</span>
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs opacity-60">
              Topic ID: {String(question.topic)}
            </Badge>
          )
        ) : (
          <span className="text-muted-foreground text-xs">No topic</span>
        )}
      </TableCell>
      <TableCell>
        <div className="flex space-x-2 justify-end">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onView(question)}
            title="View question"
          >
            <EyeIcon className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onEdit(question)}
            title="Edit question"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onClone(question)}
            title="Clone question"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="8" y="8" width="12" height="12" rx="2" />
              <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
            </svg>
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() => onDelete(question.id)}
            title="Delete question"
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

// Use memo to optimize the QuestionRow component to prevent unnecessary re-renders
const MemoizedQuestionRow = memo(QuestionRow);

interface QuestionsManagerProps {
  searchTerm?: string;
}

const QuestionsManager: React.FC<QuestionsManagerProps> = ({ searchTerm: externalSearchTerm }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for managing UI with optimized state management
  const [editingQuestion, setEditingQuestion] = useStableState<Question | null>(null);
  const [viewingQuestion, setViewingQuestion] = useStableState<Question | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useStableState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useStableState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useStableState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useStableState(false);
  const [questionToDeleteId, setQuestionToDeleteId] = useStableState<number | null>(null);
  
  // Load active tab from localStorage to maintain state across renders
  const [activeTab, setActiveTab] = useStableState<'quantitative' | 'verbal'>(() => {
    // Check if we have a stored preference
    const storedTab = localStorage.getItem('questionsManagerTab');
    // Return stored value or default to 'quantitative'
    return (storedTab === 'quantitative' || storedTab === 'verbal') 
      ? storedTab 
      : 'quantitative';
  });
  
  // Custom hook for questions data with auto-refresh on tab change
  function useQuestionsData(activeTab: string) {
    const questionsQuery = useQuery<Question[]>({
      queryKey: ['/api/questions'],
      select: useCallback((data: Question[] | undefined) => data || [], []),
      retry: 2,
      staleTime: 30000, // 30 seconds
      refetchOnWindowFocus: true,
      refetchOnMount: true,
    });
    
    // Auto-refresh when tab changes - using useCallback to prevent recreation
    useEffect(() => {
      const refetchWithDelay = () => {
        questionLogger.debug(`Refetching questions for tab: ${activeTab}`);
        return questionsQuery.refetch();
      };
      
      // Adding a small delay to ensure UI updates before API call
      const timer = setTimeout(refetchWithDelay, 200);
      
      return () => clearTimeout(timer);
    }, [activeTab, questionsQuery]);
    
    return questionsQuery;
  }

  // Save active tab to localStorage and sessionStorage when it changes
  useEffect(() => {
    localStorage.setItem('questionsManagerTab', activeTab);
    sessionStorage.setItem('questionsManagerTab', activeTab);
  }, [activeTab]);
  
  // Prevent component from interfering with parent component's navigation
  useEffect(() => {
    // This helps prevent navigation issues between different admin dashboard sections
    const originalPushState = window.history.pushState;
    
    return () => {
      // Ensure current tab state is preserved before unmounting
      if (activeTab) {
        sessionStorage.setItem('questionsManagerTabBackup', activeTab);
      }
      window.history.pushState = originalPushState;
    };
  }, [activeTab]);
  
  // State for filters with debounced search to reduce updates
  const [searchTerm, setSearchTermInternal] = useState(externalSearchTerm || '');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  // Update search term when external prop changes
  useEffect(() => {
    if (externalSearchTerm !== undefined) {
      setSearchTermInternal(externalSearchTerm);
    }
  }, [externalSearchTerm]);
  
  // Define these states before using them in callbacks
  const [subtype, setSubtype] = useStableState<string>('all');
  const [difficulty, setDifficulty] = useStableState<string>('all');
  const [topicFilter, setTopicFilter] = useStableState<string>('all');
  const [currentPage, setCurrentPage] = useStableState(1);
  
  // Now we can define setSearchTerm after currentPage is defined
  const setSearchTerm = useTrackedCallback((value: string) => {
    questionLogger.debug(`Search term changed to: "${value}"`);
    setSearchTermInternal(value);
    // Reset to first page when search changes
    setCurrentPage(1);
  }, [setSearchTermInternal, setCurrentPage], "setSearchTerm");
  const itemsPerPage = 10;
  
  // Using our custom hook to get questions data with auto-refresh
  const {
    data: questions = [] as Question[],
    isLoading: isQuestionsLoading,
    isError: isQuestionsError,
    error: questionsError,
    refetch: refetchQuestions,
  } = useQuestionsData(activeTab);
  
  // Using the QuantTopic interface defined at the top of the file
  
  // Query for fetching topics
  const {
    data: quantTopics = [] as QuantTopic[],
    isLoading: isTopicsLoading,
  } = useQuery<QuantTopic[]>({
    queryKey: ['/api/quant/topics'],
    select: (data: QuantTopic[] | undefined) => data || [],
  });
  
  // Create a topic map for easy lookup
  const topicMap: Record<string, QuantTopic> = quantTopics.reduce((acc: Record<string, QuantTopic>, topic: QuantTopic) => {
    acc[topic.id] = topic;
    return acc;
  }, {});
  
  // Mutations for CRUD operations
  const createQuestionMutation = useMutation({
    mutationFn: (data: any) => {
      questionLogger.info("Submitting question data:", data);
      
      // First, verify if we're authenticated
      return new Promise((resolve, reject) => {
        // Verify authentication first
        fetch('/api/auth/user')
          .then(response => response.json())
          .then(authData => {
            if (!authData.success) {
              questionLogger.error("Authentication check failed before submitting question:", authData.message);
              reject(new Error("Authentication required. Please log in as an admin."));
              return;
            }
            
            // If authenticated, proceed with question creation
            questionLogger.debug("Authentication verified, proceeding with question submission");
            
            // Create a deep copy to avoid mutations
            const processedData = {...data};
            
            // Process topic field with more detailed logging
            const originalTopic = data.topic;
            
            // Log topic field details before processing
            questionLogger.debug("Topic field details:", {
              value: originalTopic,
              type: typeof originalTopic,
              isNull: originalTopic === null,
              isUndefined: originalTopic === undefined,
              isNoTopic: originalTopic === 'no-topic' || originalTopic === 'no-topic-selected',
              valueToString: originalTopic ? originalTopic.toString() : 'null'
            });
            
            // Handle special topic values for better compatibility
            if (originalTopic === 'no-topic' || originalTopic === 'no-topic-selected' || originalTopic === '') {
              questionLogger.debug("Setting topic field to null (special value detected)");
              processedData.topic = null;
            } else if (originalTopic) {
              // Convert to number if it's a numeric string
              if (typeof originalTopic === 'string' && /^\d+$/.test(originalTopic)) {
                processedData.topic = parseInt(originalTopic, 10);
                questionLogger.debug(`Converted topic string to number: ${processedData.topic}`);
              } else if (typeof originalTopic === 'number') {
                processedData.topic = originalTopic;
                questionLogger.debug(`Topic is already a number: ${processedData.topic}`);
              } else {
                processedData.topic = String(originalTopic);
                questionLogger.debug(`Topic value processed as string: ${processedData.topic}`);
              }
            } else {
              questionLogger.debug("Topic is null or undefined, setting to null");
              processedData.topic = null;
            }
            
            // Process content field
            if (typeof data.content === 'object' && data.content !== null) {
              processedData.content = JSON.stringify(data.content);
              questionLogger.debug("Stringified content object");
            }
            
            // Process explanation field
            if (typeof data.explanation === 'object' && data.explanation !== null) {
              processedData.explanation = JSON.stringify(data.explanation);
              questionLogger.debug("Stringified explanation object");
            }
            
            // Process options field more carefully
            if (typeof data.options === 'string') {
              try {
                // Try to parse it to see if it's already a JSON string
                JSON.parse(data.options);
                // If no error, it's valid JSON - keep it as is
                processedData.options = data.options;
                questionLogger.debug("Options field is already a valid JSON string");
              } catch (e) {
                // Not valid JSON, stringify it
                processedData.options = JSON.stringify(data.options);
                questionLogger.debug("Options field is not a valid JSON string, stringifying");
              }
            } else if (Array.isArray(data.options)) {
              processedData.options = JSON.stringify(data.options);
              questionLogger.debug("Stringified options array");
            } else if (data.options === null || data.options === undefined) {
              // Provide an empty array as default for null/undefined options
              processedData.options = JSON.stringify([]);
              questionLogger.debug("Options field is null/undefined, using empty array");
            }
            
            // Ensure difficulty is a number
            if (processedData.difficulty) {
              processedData.difficulty = Number(processedData.difficulty);
              questionLogger.debug(`Processed difficulty: ${processedData.difficulty}`);
            }
            
            // Final data to be submitted
            questionLogger.debug("Final processed data for submission:", processedData);
            
            // Proceed with API request
            apiRequest('/api/questions', { method: 'POST', data: processedData })
              .then(result => {
                questionLogger.info("Question created successfully:", result);
                resolve(result);
              })
              .catch(apiError => {
                questionLogger.error("API Error during question creation:", apiError);
                reject(apiError);
              });
          })
          .catch(authError => {
            questionLogger.error("Error checking authentication:", authError);
            reject(new Error("Failed to verify authentication. Please try again."));
          });
      });
    },
    onSuccess: (data) => {
      questionLogger.info('Question creation succeeded with response:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/questions'] });
      
      // Close the dialog
      setIsAddDialogOpen(false);
      
      // Show success message
      toast({
        title: 'Success',
        description: 'Question created successfully',
        variant: 'default',
      });
    },
    onError: (error: any) => {
      questionLogger.error('Error creating question:', error);
      
      // Try to parse the error response for more details
      let errorMessage = 'Failed to create question';
      let isAuthError = false;
      
      if (error.message && error.message.includes("Authentication")) {
        isAuthError = true;
        errorMessage = error.message;
      } else if (error.response) {
        questionLogger.error('Error response:', error.response);
        try {
          // Try to get error details from response
          if (error.response.data && error.response.data.message) {
            errorMessage = error.response.data.message;
            if (errorMessage.includes("authenticated") || error.response.status === 401) {
              isAuthError = true;
            }
          } else if (error.response.data && error.response.data.error) {
            errorMessage = error.response.data.error;
          } else if (typeof error.response.data === 'string') {
            errorMessage = error.response.data;
          }
          
          // Check status code
          if (error.response.status === 401 || error.response.status === 403) {
            isAuthError = true;
          }
        } catch (e) {
          questionLogger.error('Error parsing error response:', e);
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Display error message
      toast({
        title: isAuthError ? 'Authentication Error' : 'Error',
        description: errorMessage,
        variant: 'destructive',
        duration: isAuthError ? 5000 : 3000, // Show auth errors longer
      });
      
      // For auth errors, redirect to login
      if (isAuthError) {
        questionLogger.debug("Authentication error detected, suggesting login");
        toast({
          title: 'Session Expired',
          description: 'Your session may have expired. Please log in again.',
          variant: 'destructive',
          duration: 5000,
        });
        return;
      }
      
      // Check for potential database connection issues
      questionLogger.debug('Checking database connectivity...');
      fetch('/api/questions/check-db-connection', { method: 'GET' })
        .then(response => response.json())
        .then(data => {
          questionLogger.debug('Database connectivity check:', data);
          if (!data.success) {
            toast({
              title: 'Database Error',
              description: 'Could not connect to the database. Please try again later.',
              variant: 'destructive',
            });
          }
        })
        .catch(dbError => {
          questionLogger.error('Failed to check database connectivity:', dbError);
        });
    },
  });
  
  const updateQuestionMutation = useMutation({
    mutationFn: (data: any) => {
      questionLogger.info("Updating question data:", { id: data.id, type: data.type });
      
      // Create a deep copy to avoid mutations
      const processedData = {...data};
      
      // Process topic field with more detailed logging
      const originalTopic = data.topic;
      
      // Log topic field details before processing using debug level
      questionLogger.debug("Topic field details for update:", {
        value: originalTopic,
        type: typeof originalTopic,
        isNull: originalTopic === null,
        isUndefined: originalTopic === undefined,
        isNoTopic: originalTopic === 'no-topic' || originalTopic === 'no-topic-selected',
        valueToString: originalTopic ? originalTopic.toString() : 'null'
      });
      
      // Handle special topic values for better compatibility
      if (originalTopic === 'no-topic' || originalTopic === 'no-topic-selected' || originalTopic === '') {
        questionLogger.debug("Setting topic field to null (special value detected)");
        processedData.topic = null;
      } else if (originalTopic) {
        // Convert to number if it's a numeric string
        if (typeof originalTopic === 'string' && /^\d+$/.test(originalTopic)) {
          processedData.topic = parseInt(originalTopic, 10);
          questionLogger.debug(`Converted topic string to number: ${processedData.topic}`);
        } else if (typeof originalTopic === 'number') {
          processedData.topic = originalTopic;
          questionLogger.debug(`Topic is already a number: ${processedData.topic}`);
        } else {
          processedData.topic = String(originalTopic);
          questionLogger.debug(`Topic value processed as string: ${processedData.topic}`);
        }
      } else {
        questionLogger.debug("Topic is null or undefined, setting to null");
        processedData.topic = null;
      }
      
      // Process content field
      if (typeof data.content === 'object' && data.content !== null) {
        processedData.content = JSON.stringify(data.content);
        questionLogger.debug("Stringified content object");
      }
      
      // Process explanation field
      if (typeof data.explanation === 'object' && data.explanation !== null) {
        processedData.explanation = JSON.stringify(data.explanation);
        questionLogger.debug("Stringified explanation object");
      }
      
      // Process options field more carefully
      if (typeof data.options === 'string') {
        try {
          // Try to parse it to see if it's already a JSON string
          JSON.parse(data.options);
          // If no error, it's valid JSON - keep it as is
          processedData.options = data.options;
          questionLogger.debug("Options field is already a valid JSON string");
        } catch (e) {
          // Not valid JSON, stringify it
          processedData.options = JSON.stringify(data.options);
          questionLogger.debug("Options field is not a valid JSON string, stringifying");
        }
      } else if (Array.isArray(data.options)) {
        processedData.options = JSON.stringify(data.options);
        questionLogger.debug("Stringified options array");
      } else if (data.options === null || data.options === undefined) {
        // Provide an empty array as default for null/undefined options
        processedData.options = JSON.stringify([]);
        questionLogger.debug("Options field is null/undefined, using empty array");
      }
      
      // Ensure difficulty is a number
      if (processedData.difficulty) {
        processedData.difficulty = Number(processedData.difficulty);
        questionLogger.debug(`Processed difficulty: ${processedData.difficulty}`);
      }
      
      // Use debug level to reduce log clutter
      questionLogger.debug("Final processed data for update");
      return apiRequest(`/api/questions/${data.id}`, { method: 'PATCH', data: processedData });
    },
    onSuccess: (data) => {
      questionLogger.info('Question updated successfully', { id: data?.id });
      queryClient.invalidateQueries({ queryKey: ['/api/questions'] });
      setIsEditDialogOpen(false);
      setEditingQuestion(null);
      toast({
        title: 'Success',
        description: 'Question updated successfully',
        variant: 'default',
      });
    },
    onError: (error: any) => {
      questionLogger.error('Error updating question:', error);
      // Extract detailed error message if available
      const errorDetails = error?.response?.data?.message || error?.message || 'Unknown error';
      toast({
        title: 'Error',
        description: `Failed to update question: ${errorDetails}`,
        variant: 'destructive',
      });
    },
  });
  
  const deleteQuestionMutation = useMutation({
    mutationFn: (id: number) => {
      questionLogger.info(`Deleting question with ID: ${id}`);
      return apiRequest(`/api/questions/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      questionLogger.info('Question deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['/api/questions'] });
      setIsDeleteDialogOpen(false);
      setQuestionToDeleteId(null);
      toast({
        title: 'Success',
        description: 'Question deleted successfully',
        variant: 'default',
      });
    },
    onError: (error: any) => {
      questionLogger.error('Error deleting question:', error);
      const errorDetails = error?.response?.data?.message || error?.message || 'Unknown error';
      toast({
        title: 'Error',
        description: `Failed to delete question: ${errorDetails}`,
        variant: 'destructive',
      });
    },
  });
  
  // Event handlers with useCallback to prevent recreation on every render
  const handleEditQuestion = useTrackedCallback((question: Question) => {
    questionLogger.debug("Editing question:", question.id);
    setEditingQuestion(question);
    setIsEditDialogOpen(true);
  }, [setEditingQuestion, setIsEditDialogOpen], "handleEditQuestion");
  
  const handleViewQuestion = useTrackedCallback((question: Question) => {
    questionLogger.debug("Viewing question:", question.id);
    setViewingQuestion(question);
    setIsViewDialogOpen(true);
  }, [setViewingQuestion, setIsViewDialogOpen], "handleViewQuestion");
  
  const handleAddQuestion = useTrackedCallback(() => {
    questionLogger.debug("Add Question button clicked via manual handler");
    // Reset editing state and clear any previous form data
    setEditingQuestion(null);
    
    // Explicitly open the dialog
    setIsAddDialogOpen(true);
    
    // Additional logging to track state changes
    questionLogger.debug("Dialog state set to open");
    
    // Capture any errors that might occur
    try {
      // Check if we're authenticated before proceeding
      fetch('/api/auth/user')
        .then(response => response.json())
        .then(data => {
          if (!data.success) {
            questionLogger.error("Authentication check failed:", data.message);
            toast({
              title: "Authentication Error",
              description: "You must be logged in as an admin to create questions.",
              variant: "destructive"
            });
          } else {
            questionLogger.debug("User authenticated, proceeding with question creation");
          }
        })
        .catch(error => {
          questionLogger.error("Error checking authentication:", error);
        });
    } catch (error) {
      questionLogger.error("Error in handleAddQuestion:", error);
    }
  }, [setEditingQuestion, setIsAddDialogOpen, toast], "handleAddQuestion");
  
  const handleCloneQuestion = useTrackedCallback((question: Question) => {
    // Create a detailed log of the cloning operation
    questionLogger.info("Cloning question:", question.id);
    
    // Create a clone of the question without the ID
    // Use a type that allows optional id
    type CloneableQuestion = Omit<Question, 'id'> & { id?: number };
    const clonedQuestion: CloneableQuestion = { ...question };
    delete clonedQuestion.id; // Remove the id so a new one is assigned
    
    // Process topic field for greater compatibility
    // Log the original topic value for debugging
    questionLogger.debug("Original topic value in question being cloned:", {
      value: question.topic,
      type: typeof question.topic,
      isNumericString: typeof question.topic === 'string' && /^\d+$/.test(String(question.topic)),
      isNumber: typeof question.topic === 'number'
    });
    
    // Enhanced topic handling to ensure consistency
    if (clonedQuestion.topic) {
      // Handle numeric topic IDs - convert to number for consistency with the database
      if (typeof clonedQuestion.topic === 'string' && /^\d+$/.test(clonedQuestion.topic)) {
        clonedQuestion.topic = parseInt(clonedQuestion.topic, 10);
        questionLogger.debug(`Converted string topic ID "${question.topic}" to number: ${clonedQuestion.topic}`);
      } else if (typeof clonedQuestion.topic === 'number') {
        // Keep as number - this is the preferred format for the database
        questionLogger.debug(`Kept topic as number: ${clonedQuestion.topic}`);
      } else {
        // If it's not a numeric string or number, keep as is
        questionLogger.debug(`Keeping topic as is (non-numeric): ${clonedQuestion.topic}`);
      }
    } else {
      // Explicitly set to null if no topic
      clonedQuestion.topic = null;
      questionLogger.debug("No topic in original question, setting to null");
    }
    
    // Add "[Clone]" to the beginning of the content
    try {
      if (Array.isArray(clonedQuestion.content)) {
        // Handle Slate/rich text format
        const firstBlock = clonedQuestion.content[0];
        if (firstBlock && firstBlock.children && Array.isArray(firstBlock.children)) {
          const firstTextNode = firstBlock.children[0];
          if (firstTextNode && typeof firstTextNode.text === 'string') {
            firstTextNode.text = `[Clone] ${firstTextNode.text}`;
          }
        }
      } else if (typeof clonedQuestion.content === 'string') {
        // Handle plain text content
        clonedQuestion.content = `[Clone] ${clonedQuestion.content}`;
      } else if (typeof clonedQuestion.content === 'object' && clonedQuestion.content !== null) {
        // Handle JSON object content - we'll add a note in the data
        try {
          const contentObj = typeof clonedQuestion.content === 'string' 
            ? JSON.parse(clonedQuestion.content) 
            : clonedQuestion.content;
          
          if (contentObj.text) {
            contentObj.text = `[Clone] ${contentObj.text}`;
          } else if (contentObj.content) {
            contentObj.content = `[Clone] ${contentObj.content}`;
          }
          
          clonedQuestion.content = contentObj;
        } catch (e) {
          questionLogger.error("Error modifying content object", e);
        }
      }
    } catch (error) {
      questionLogger.error("Error modifying cloned question content", error);
    }
    
    // Process the data before submission
    questionLogger.debug("Cloning question with data:", clonedQuestion);
    
    // Submit the cloned question
    createQuestionMutation.mutate(clonedQuestion);
    
    toast({
      title: 'Cloning Question',
      description: 'Creating a copy of the selected question...',
      variant: 'default',
    });
  }, [createQuestionMutation, toast], "handleCloneQuestion");
  
  const handleDeleteQuestion = useTrackedCallback((id: number) => {
    questionLogger.debug("Initiating delete for question:", id);
    setQuestionToDeleteId(id);
    setIsDeleteDialogOpen(true);
  }, [setQuestionToDeleteId, setIsDeleteDialogOpen], "handleDeleteQuestion");
  
  const confirmDeleteQuestion = useTrackedCallback(() => {
    if (questionToDeleteId) {
      questionLogger.info("Confirming delete for question:", questionToDeleteId);
      deleteQuestionMutation.mutate(questionToDeleteId);
    }
  }, [questionToDeleteId, deleteQuestionMutation], "confirmDeleteQuestion");
  
  // Filter and paginate questions - memoized to avoid recalculation on every render
  const filteredQuestions = useMemo(() => {
    questionLogger.debug("Filtering questions with criteria:", {
      activeTab,
      searchTermLength: searchTerm.length,
      subtype,
      difficulty,
      topicFilter,
    });
    
    return questions.filter((q: Question) => {
      // Filter by tab (quantitative/verbal)
      if (q.type !== activeTab) return false;
      
      // Filter by search term (using debounced value to prevent excessive filtering)
      if (debouncedSearchTerm && !formatQuestionText(q.content).toLowerCase().includes(debouncedSearchTerm.toLowerCase())) {
        return false;
      }
      
      // Filter by subtype
      if (subtype !== 'all' && q.subtype !== subtype) return false;
      
      // Filter by difficulty
      if (difficulty !== 'all') {
        const difficultyNum = parseInt(difficulty);
        if (q.difficulty !== difficultyNum) return false;
      }
      
      // Enhanced filter by topic - handle potential string/number type mismatches
      if (topicFilter !== 'all') {
        // Convert both to strings for comparison to handle type mismatches
        const topicFilterStr = String(topicFilter);
        const questionTopicStr = q.topic !== null ? String(q.topic) : '';
        
        if (questionTopicStr !== topicFilterStr) {
          // Reduce log noise by only debugging in dev environment
          if (import.meta.env.DEV) {
            questionLogger.debug(`Topic mismatch: Filter=${topicFilterStr}, Question=${questionTopicStr}`);
          }
          return false;
        }
      }
      
      return true;
    });
  }, [questions, activeTab, debouncedSearchTerm, subtype, difficulty, topicFilter]);
  
  // Pagination calculations - also memoized to avoid recalculation
  const totalPages = useMemo(() => 
    Math.ceil(filteredQuestions.length / itemsPerPage),
    [filteredQuestions.length, itemsPerPage]
  );
  
  const paginatedQuestions = useMemo(() => 
    filteredQuestions.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    ),
    [filteredQuestions, currentPage, itemsPerPage]
  );
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CardTitle>Question Management</CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={useTrackedCallback(() => {
                  questionLogger.debug("Manually refreshing questions...");
                  refetchQuestions();
                  toast({
                    title: "Refreshing",
                    description: "Updating questions list...",
                    duration: 2000,
                  });
                }, [refetchQuestions, toast], "handleRefreshQuestions")}
                disabled={isQuestionsLoading}
                className="flex items-center gap-1"
                title="Refresh questions"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isQuestionsLoading ? "animate-spin" : ""}>
                  <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                  <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                  <path d="M16 21h5v-5" />
                </svg>
                <span className="hidden sm:inline-block ml-1">Refresh</span>
              </Button>
            </div>
            <Dialog 
              open={isAddDialogOpen} 
              onOpenChange={(open) => {
                setIsAddDialogOpen(open);
                if (!open) {
                  // Reset form state when dialog closes
                  setEditingQuestion(null);
                }
              }}
            >
              <DialogTrigger asChild>
                <Button onClick={useTrackedCallback(() => {
                  setEditingQuestion(null);
                  setIsAddDialogOpen(true); // Explicitly set dialog state
                }, [setEditingQuestion, setIsAddDialogOpen], "dialogAddQuestion")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto p-0" aria-describedby="question-form-description">
                <div id="question-form-description" className="sr-only">Form for adding a new GRE question</div>
                <EnhancedQuestionForm
                  onSubmit={(data) => {
                    try {
                      questionLogger.debug("Creating new question with data:", data);
                      
                      // The data is already processed in the EnhancedQuestionForm component
                      // No need for additional processing here - pass directly to mutation
                      questionLogger.info("Form submission received, forwarding to mutation");
                      
                      // Validate that we have all required fields before submitting
                      if (!data.type) {
                        questionLogger.error("Missing required field: type");
                        toast({
                          title: "Error",
                          description: "Question type is required",
                          variant: "destructive"
                        });
                        return;
                      }
                      
                      if (!data.subtype) {
                        questionLogger.error("Missing required field: subtype");
                        toast({
                          title: "Error",
                          description: "Question subtype is required",
                          variant: "destructive"
                        });
                        return;
                      }
                      
                      if (!data.content) {
                        questionLogger.error("Missing required field: content");
                        toast({
                          title: "Error",
                          description: "Question content is required",
                          variant: "destructive"
                        });
                        return;
                      }
                      
                      if (!data.answer) {
                        questionLogger.error("Missing required field: answer");
                        toast({
                          title: "Error",
                          description: "Question answer is required",
                          variant: "destructive"
                        });
                        return;
                      }
                      
                      // Submit the data directly to the createQuestionMutation
                      questionLogger.debug("Final data for creating question:", data);
                      
                      // Create the question with the data from the form
                      createQuestionMutation.mutate(data, {
                        onError: (error) => {
                          questionLogger.error("Error creating question:", error);
                          toast({
                            title: "Error",
                            description: error.message || "Failed to create question. Please try again.",
                            variant: "destructive"
                          });
                        }
                      });
                    } catch (error) {
                      questionLogger.error("Exception in question creation:", error);
                      toast({
                        title: "Error",
                        description: "An unexpected error occurred. Please try again.",
                        variant: "destructive"
                      });
                    }
                  }}
                  isSubmitting={createQuestionMutation.isPending}
                  topics={quantTopics}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Tabs for question type */}
          <Tabs
            value={activeTab}
            onValueChange={useTrackedCallback(
              (value) => {
                questionLogger.debug(`Changing question tab to: ${value}`);
                setActiveTab(value as 'quantitative' | 'verbal');
                // Reset page when switching tabs
                setCurrentPage(1);
              }, 
              [setActiveTab, setCurrentPage], 
              "changeQuestionTab"
            )}
            className="w-full"
          >
            <TabsList className="mb-4">
              <TabsTrigger value="quantitative">Quantitative</TabsTrigger>
              <TabsTrigger value="verbal">Verbal</TabsTrigger>
            </TabsList>
            
            <TabsContent value="quantitative" className="space-y-4">
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search questions..."
                    value={searchTerm}
                    onChange={useTrackedCallback((e) => {
                      setSearchTerm(e.target.value);
                    }, [setSearchTerm], "updateSearchInput")}
                    className="pl-8"
                  />
                </div>
                
                <Select
                  value={subtype}
                  onValueChange={(value) => {
                    setSubtype(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                    <SelectItem value="numeric">Numeric Entry</SelectItem>
                    <SelectItem value="quantitative_comparison">Quantitative Comparison</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select
                  value={difficulty}
                  onValueChange={(value) => {
                    setDifficulty(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Difficulties</SelectItem>
                    <SelectItem value="1">Easy (1)</SelectItem>
                    <SelectItem value="2">Moderate (2)</SelectItem>
                    <SelectItem value="3">Medium (3)</SelectItem>
                    <SelectItem value="4">Challenging (4)</SelectItem>
                    <SelectItem value="5">Hard (5)</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select
                  value={topicFilter}
                  onValueChange={(value) => {
                    setTopicFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by topic" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Topics</SelectItem>
                    {!isTopicsLoading && quantTopics.map((topic: QuantTopic) => (
                      <SelectItem key={topic.id} value={topic.id.toString()}>
                        {topic.title || topic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Questions Table */}
              {isQuestionsLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : isQuestionsError ? (
                <div className="flex flex-col justify-center items-center py-8 text-destructive">
                  <AlertCircle className="h-5 w-5 mb-2" />
                  <p>Error loading questions.</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {questionsError?.message === "Not authenticated" ? 
                      "Authentication required. Please log in with an admin account." : 
                      questionsError?.message || "Please try again."}
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/questions'] })}
                  >
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4" />
                      Retry
                    </div>
                  </Button>
                </div>
              ) : filteredQuestions.length === 0 ? (
                <div className="flex flex-col justify-center items-center py-12 text-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No questions found</h3>
                  <p className="text-muted-foreground mt-1">
                    {searchTerm || subtype !== 'all' || difficulty !== 'all' || topicFilter !== 'all' 
                      ? 'Try adjusting your filters' 
                      : 'Create your first question to get started'}
                  </p>
                  {searchTerm || subtype !== 'all' || difficulty !== 'all' || topicFilter !== 'all' ? (
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={useTrackedCallback(() => {
                        // Reset all filters
                        setSearchTermInternal(''); // Use the internal setter directly
                        setSubtype('all');
                        setDifficulty('all');
                        setTopicFilter('all');
                        // Also reset to page 1
                        setCurrentPage(1);
                      }, [setSearchTermInternal, setSubtype, setDifficulty, setTopicFilter, setCurrentPage], "resetFilters")}
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      Reset Filters
                    </Button>
                  ) : (
                    <Button 
                      className="mt-4"
                      onClick={handleAddQuestion}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Question
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Content</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Format</TableHead>
                          <TableHead>Topic</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedQuestions.map((question: Question) => (
                          <MemoizedQuestionRow
                            key={question.id}
                            question={question}
                            onEdit={handleEditQuestion}
                            onDelete={handleDeleteQuestion}
                            onView={handleViewQuestion}
                            onClone={handleCloneQuestion}
                            topicMap={topicMap}
                          />
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <Pagination className="mt-4">
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={useTrackedCallback(() => setCurrentPage(p => Math.max(1, p - 1)), [setCurrentPage], "prevPage")}
                            isActive={currentPage > 1}
                          />
                        </PaginationItem>
                        
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          // Show first page, last page, current page, and pages around current
                          let pageNum;
                          
                          if (totalPages <= 5) {
                            // Show all pages if 5 or fewer
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            // At the beginning
                            if (i < 4) {
                              pageNum = i + 1;
                            } else {
                              pageNum = totalPages;
                            }
                          } else if (currentPage >= totalPages - 2) {
                            // At the end
                            if (i === 0) {
                              pageNum = 1;
                            } else {
                              pageNum = totalPages - (4 - i);
                            }
                          } else {
                            // In the middle
                            if (i === 0) {
                              pageNum = 1;
                            } else if (i === 4) {
                              pageNum = totalPages;
                            } else {
                              pageNum = currentPage + (i - 2);
                            }
                          }
                          
                          // Add ellipses when needed
                          if (
                            (i === 1 && pageNum !== 2) || 
                            (i === 3 && pageNum !== totalPages - 1)
                          ) {
                            return (
                              <PaginationItem key={`ellipsis-${i}`}>
                                <PaginationEllipsis />
                              </PaginationItem>
                            );
                          }
                          
                          return (
                            <PaginationItem key={pageNum}>
                              <PaginationLink
                                isActive={currentPage === pageNum}
                                onClick={useTrackedCallback(() => setCurrentPage(pageNum), [setCurrentPage, pageNum], `setPage_${pageNum}`)}
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}
                        
                        <PaginationItem>
                          <PaginationNext 
                            onClick={useTrackedCallback(() => setCurrentPage(p => Math.min(totalPages, p + 1)), [setCurrentPage, totalPages], "nextPage")}
                            isActive={currentPage < totalPages}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  )}
                </>
              )}
            </TabsContent>
            
            <TabsContent value="verbal" className="space-y-4">
              {/* Similar structure for verbal questions */}
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">Verbal Questions</h3>
                <p className="text-muted-foreground mt-1 max-w-md mx-auto">
                  Manage verbal reasoning questions including reading comprehension, 
                  text completion, and sentence equivalence.
                </p>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="mt-4" onClick={useTrackedCallback(() => {
                      questionLogger.debug("Create Verbal Question button clicked via DialogTrigger");
                      setEditingQuestion(null);
                      // Using DialogTrigger handles the dialog state
                    }, [setEditingQuestion], "createVerbalQuestion")}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Verbal Question
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add New Verbal Question</DialogTitle>
                    </DialogHeader>
                    <QuestionImprovedForm
                      onSubmit={(data) => {
                        try {
                          // Create a modified copy with type set to verbal
                          const updatedData = {
                            ...data,
                            type: "verbal" // Override any existing type
                          };
                          
                          questionLogger.debug("Creating new verbal question with data:", updatedData);
                          
                          // Validate required fields
                          if (!updatedData.type) {
                            questionLogger.error("Missing required field: type");
                            toast({
                              title: "Error",
                              description: "Question type is required",
                              variant: "destructive"
                            });
                            return;
                          }
                          
                          if (!updatedData.subtype) {
                            questionLogger.error("Missing required field: subtype");
                            toast({
                              title: "Error",
                              description: "Question subtype is required",
                              variant: "destructive"
                            });
                            return;
                          }
                          
                          if (!updatedData.content) {
                            questionLogger.error("Missing required field: content");
                            toast({
                              title: "Error",
                              description: "Question content is required",
                              variant: "destructive"
                            });
                            return;
                          }
                          
                          if (!updatedData.answer) {
                            questionLogger.error("Missing required field: answer");
                            toast({
                              title: "Error",
                              description: "Question answer is required",
                              variant: "destructive"
                            });
                            return;
                          }
                          
                          // Submit the updated data to createQuestionMutation
                          questionLogger.debug("Final data for creating verbal question:", updatedData);
                          
                          // Create the question with the data
                          createQuestionMutation.mutate(updatedData, {
                            onError: (error) => {
                              questionLogger.error("Error creating verbal question:", error);
                              toast({
                                title: "Error",
                                description: error.message || "Failed to create question. Please try again.",
                                variant: "destructive"
                              });
                            }
                          });
                        } catch (error) {
                          questionLogger.error("Exception in verbal question creation:", error);
                          toast({
                            title: "Error",
                            description: "An unexpected error occurred. Please try again.",
                            variant: "destructive"
                          });
                        }
                      }}
                      isSubmitting={createQuestionMutation.isPending}
                      topics={quantTopics}
                      defaultType="verbal"
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* We're now using inline Dialog components with DialogTrigger for better reliability */}
      
      {/* Edit Question Dialog */}
      <Dialog 
        open={isEditDialogOpen} 
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
        }}
      >
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto p-0" aria-describedby="edit-question-description">
          <div id="edit-question-description" className="sr-only">Form for editing an existing GRE question</div>
          <EnhancedQuestionForm
            onSubmit={(data) => {
              try {
                questionLogger.debug("Updating question with data:", data);
                
                // Data is already processed in the QuestionImprovedForm component
                // Validate required fields for update
                if (!data.type) {
                  questionLogger.error("Missing required field: type");
                  toast({
                    title: "Error",
                    description: "Question type is required",
                    variant: "destructive"
                  });
                  return;
                }
                
                if (!data.subtype) {
                  questionLogger.error("Missing required field: subtype");
                  toast({
                    title: "Error",
                    description: "Question subtype is required",
                    variant: "destructive"
                  });
                  return;
                }
                
                if (!data.content) {
                  questionLogger.error("Missing required field: content");
                  toast({
                    title: "Error",
                    description: "Question content is required",
                    variant: "destructive"
                  });
                  return;
                }
                
                if (!data.answer) {
                  questionLogger.error("Missing required field: answer");
                  toast({
                    title: "Error",
                    description: "Question answer is required",
                    variant: "destructive"
                  });
                  return;
                }
                
                // Ensure the ID field is present for updates
                let updatedData = {...data};
                if (!updatedData.id && editingQuestion?.id) {
                  updatedData.id = editingQuestion.id;
                  questionLogger.debug("Added ID from editingQuestion:", updatedData.id);
                }
                
                if (!updatedData.id) {
                  questionLogger.error("Missing required field for update: id");
                  toast({
                    title: "Error",
                    description: "Question ID is required for updates",
                    variant: "destructive"
                  });
                  return;
                }
                
                questionLogger.debug("Final data for updating question:", updatedData);
                
                // Update the question with the data
                updateQuestionMutation.mutate(updatedData, {
                  onError: (error) => {
                    questionLogger.error("Error updating question:", error);
                    toast({
                      title: "Error",
                      description: error.message || "Failed to update question. Please try again.",
                      variant: "destructive"
                    });
                  }
                });
              } catch (error) {
                questionLogger.error("Exception in question update:", error);
                toast({
                  title: "Error",
                  description: "An unexpected error occurred during update. Please try again.",
                  variant: "destructive"
                });
              }
            }}
            editingQuestion={editingQuestion}
            isSubmitting={updateQuestionMutation.isPending}
            topics={quantTopics}
          />
        </DialogContent>
      </Dialog>
      
      {/* View Question Dialog */}
      <Dialog 
        open={isViewDialogOpen} 
        onOpenChange={(open) => {
          questionLogger.debug("View dialog open state changing to:", open);
          setIsViewDialogOpen(open);
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="preview-question-description">
          <div id="preview-question-description" className="sr-only">Preview of the GRE question formatting and appearance</div>
          <DialogHeader>
            <DialogTitle>Question Preview</DialogTitle>
          </DialogHeader>
          {viewingQuestion && (
            <div className="space-y-6">
              {/* Top metadata section */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="mr-1" variant="outline">
                    {viewingQuestion.type === 'quantitative' ? 'Quantitative Reasoning' : 'Verbal Reasoning'}
                  </Badge>
                  <Badge variant="secondary">{viewingQuestion.subtype.replace(/_/g, ' ')}</Badge>
                  {viewingQuestion.topic && topicMap[viewingQuestion.topic] && (
                    <Badge variant="outline" className="bg-primary/10">
                      {topicMap[viewingQuestion.topic].title}
                    </Badge>
                  )}
                </div>
                {viewingQuestion.difficulty && (
                  <div className="flex items-center gap-1.5">
                    <div className={`w-3 h-3 rounded-full ${getDifficultyColor(viewingQuestion.difficulty)}`}></div>
                    <span className="text-sm text-muted-foreground">Difficulty {viewingQuestion.difficulty}/5</span>
                  </div>
                )}
              </div>
              
              {/* GRE Question Preview component */}
              <div className="border rounded-md overflow-hidden">
                <GREQuestionPreviewFixed 
                  question={{
                    type: viewingQuestion.type,
                    subtype: viewingQuestion.subtype,
                    content: viewingQuestion.content,
                    options: typeof viewingQuestion.options === 'string' 
                      ? JSON.parse(viewingQuestion.options) 
                      : viewingQuestion.options,
                    explanation: viewingQuestion.explanation,
                    answer: viewingQuestion.answer
                  }}
                  showExplanation={true}
                />
              </div>
              
              {/* Question metadata panel */}
              <div className="border rounded-lg p-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center">
                  <Settings className="h-5 w-5 mr-2 text-muted-foreground" />
                  Question Metadata
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="p-4 bg-muted/30 rounded-md">
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Section</p>
                    <div className="flex items-center">
                      {viewingQuestion.type === 'quantitative' ? (
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                          <p className="text-base font-medium">Quantitative Reasoning</p>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                          <p className="text-base font-medium">Verbal Reasoning</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-4 bg-muted/30 rounded-md">
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Format</p>
                    <div className="flex items-center">
                      <p className="text-base font-medium capitalize">{viewingQuestion.subtype.replace(/_/g, ' ')}</p>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-muted/30 rounded-md">
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Difficulty</p>
                    <div className="flex items-center space-x-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div 
                            key={level}
                            className={`w-5 h-2.5 rounded-sm mx-0.5 ${
                              level <= (viewingQuestion.difficulty || 0)
                                ? getDifficultyColor(level)
                                : 'bg-muted'
                            }`}
                          ></div>
                        ))}
                      </div>
                      <p className="text-base font-medium">{viewingQuestion.difficulty} / 5</p>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-muted/30 rounded-md">
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Topic</p>
                    <div>
                      {viewingQuestion.topic && topicMap[viewingQuestion.topic] ? (
                        <div className="flex items-center">
                          <Tag className="h-4 w-4 mr-2 text-primary" />
                          <p className="text-base font-medium">{topicMap[viewingQuestion.topic].title}</p>
                        </div>
                      ) : (
                        <p className="text-base text-muted-foreground italic">No topic assigned</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-4 bg-muted/30 rounded-md md:col-span-2">
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Tags</p>
                    {viewingQuestion.tags ? (
                      <div className="flex flex-wrap gap-1.5">
                        {viewingQuestion.tags.split(',').map((tag: string, i: number) => (
                          <Badge key={i} variant="secondary" className="px-2 py-0.5">
                            {tag.trim()}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-base text-muted-foreground italic">No tags assigned</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsViewDialogOpen(false)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setIsViewDialogOpen(false);
                    handleEditQuestion(viewingQuestion);
                  }}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Question
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Delete confirmation dialog */}
      <Dialog 
        open={isDeleteDialogOpen} 
        onOpenChange={(open) => {
          questionLogger.debug("Delete dialog open state changing to:", open);
          setIsDeleteDialogOpen(open);
        }}
      >
        <DialogContent className="max-w-md" aria-describedby="delete-question-description">
          <div id="delete-question-description" className="sr-only">Confirmation dialog for deleting a GRE question</div>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Are you sure you want to delete this question? This action cannot be undone.</p>
            
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={deleteQuestionMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteQuestion}
                disabled={deleteQuestionMutation.isPending}
              >
                {deleteQuestionMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash className="h-4 w-4 mr-2" />
                    Delete
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuestionsManager;