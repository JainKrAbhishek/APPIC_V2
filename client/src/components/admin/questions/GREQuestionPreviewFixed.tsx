import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Check, X } from 'lucide-react';
// Import enhanced rich text editor components
import { RichTextContent } from "@/lib/rich-text-editor";

interface Question {
  id?: number;
  type: string;
  subtype: string;
  content: any; // This can be a string, object, or rich text nodes
  options: any; // This can be an array of strings, objects, or rich text nodes
  answer: string | string[];
  explanation?: any; // This can be a string, object, or rich text nodes
  difficulty?: number;
  topic?: number | null;
  tags?: string[] | string;
}

interface GREQuestionPreviewFixedProps {
  question: Question | null;
  isOpen?: boolean;
  onClose?: () => void;
  topics?: any[];
  showExplanation?: boolean;
  inlinePreview?: boolean;
}

const GREQuestionPreviewFixed: React.FC<GREQuestionPreviewFixedProps> = ({
  question,
  isOpen = false,
  onClose = () => {},
  topics = [],
  showExplanation: initialShowExplanation = false,
  inlinePreview = false
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | string[]>('');
  const [showExplanation, setShowExplanation] = useState(initialShowExplanation);
  const [activeTab, setActiveTab] = useState('question');

  if (!question) return null;

  // Helper to convert content to string safely
  const getContentAsString = (content: any): string => {
    if (!content) return '';
    if (typeof content === 'string') return content;
    if (typeof content === 'object') {
      try {
        if (content.text) return content.text;
        return JSON.stringify(content);
      } catch (e) {
        return '';
      }
    }
    return String(content);
  };

  // Helper to handle different option formats
  const getOptions = (): Array<{ id: string; text: string }> => {
    if (!question.options) return [];
    
    // Debug the options structure
    console.log("Processing question options in GREQuestionPreviewFixed:", question.options);
    
    try {
      // Handle string options that need to be parsed
      if (typeof question.options === 'string') {
        try {
          const parsedOptions = JSON.parse(question.options);
          return parsedOptions.map((opt: any, i: number) => {
            if (typeof opt === 'string') {
              return { id: String.fromCharCode(65 + i), text: opt };
            }
            
            // Extract text from option with Slate.js format
            if (typeof opt === 'object' && opt !== null) {
              const optionText = extractTextFromOption(opt);
              return { 
                id: opt.id || String.fromCharCode(65 + i), 
                text: optionText
              };
            }
            
            return { id: String.fromCharCode(65 + i), text: String(opt) };
          });
        } catch (e) {
          console.error("Error parsing string options:", e);
          return [{ id: 'A', text: question.options }];
        }
      } 
      // Handle array of options
      else if (Array.isArray(question.options)) {
        return question.options.map((opt, i) => {
          // Handle plain string options
          if (typeof opt === 'string') {
            return { id: String.fromCharCode(65 + i), text: opt };
          }
          
          // Handle object options with complex structure
          if (typeof opt === 'object' && opt !== null) {
            const optionText = extractTextFromOption(opt);
            const optionId = opt.id || String.fromCharCode(65 + i);
            
            return { 
              id: optionId,
              text: optionText
            };
          }
          
          // Fallback for any other type
          return { id: String.fromCharCode(65 + i), text: String(opt) };
        });
      }
    } catch (e) {
      console.error("Error processing options:", e);
    }
    
    return [];
  };
  
  // Helper function to extract text from complex option objects
  const extractTextFromOption = (option: any): string => {
    // Handle plain strings directly
    if (typeof option === 'string') {
      return option;
    }
    
    // Handle direct text property (common in GRE options)
    if (option.text !== undefined) {
      // Handle text as array of Slate.js nodes
      if (Array.isArray(option.text)) {
        let extractedText = '';
        
        for (const node of option.text) {
          if (typeof node === 'string') {
            extractedText += node;
          } else if (node.type === 'paragraph' && Array.isArray(node.children)) {
            // Handle paragraph structure
            extractedText += node.children.map((child: any) => 
              typeof child === 'string' ? child : (child.text || '')
            ).join('');
          } else if (node.children) {
            // For nodes with children
            extractedText += node.children.map((child: any) => 
              typeof child === 'string' ? child : (child.text || '')
            ).join('');
          } else if (node.text) {
            // Direct text node
            extractedText += node.text;
          }
        }
        
        if (extractedText) {
          return extractedText.trim();
        }
      }
      
      // Handle text as direct string
      if (typeof option.text === 'string') {
        return option.text;
      }
      
      // Handle text as Slate.js object with children
      if (typeof option.text === 'object' && option.text !== null) {
        if (option.text.children) {
          return option.text.children.map((child: any) => 
            typeof child === 'string' ? child : (child.text || '')
          ).join('').trim();
        }
      }
    }
    
    // Try other common properties
    
    // Try value property
    if (option.value !== undefined) {
      return String(option.value);
    }
    
    // Try label property
    if (option.label) {
      return String(option.label);
    }
    
    // Handle Slate.js nodes with children
    if (option.type && option.children) {
      return option.children.map((child: any) => 
        typeof child === 'string' ? child : (child.text || '')
      ).join('').trim();
    }
    
    // For any object with children array
    if (option.children && Array.isArray(option.children)) {
      return option.children.map((child: any) => 
        typeof child === 'string' ? child : (child.text || '')
      ).join('').trim();
    }
    
    // Try to stringify as last resort
    try {
      if (typeof option === 'object') {
        // Create a cleaner version for display
        const displayObj = { ...option };
        delete displayObj.explanation;
        delete displayObj.isCorrect;
        delete displayObj.__typename;
        
        return JSON.stringify(displayObj);
      }
      
      return String(option);
    } catch (e) {
      console.error("Error stringifying option:", e);
      return "[Complex Option]";
    }
  };

  // Get correct answer(s) as array
  const getCorrectAnswers = (): string[] => {
    if (!question.answer) return [];
    
    if (typeof question.answer === 'string') {
      // Handle comma-separated answers
      if (question.answer.includes(',')) {
        return question.answer.split(',').map(a => a.trim());
      }
      // Handle single answer
      return [question.answer];
    } else if (Array.isArray(question.answer)) {
      return question.answer.map(a => 
        typeof a === 'string' ? a : String(a)
      );
    }
    
    return [String(question.answer)];
  };

  // Check if selected answer is correct
  const isAnswerCorrect = (option: string): boolean => {
    const correctAnswers = getCorrectAnswers();
    
    if (Array.isArray(selectedAnswer)) {
      return selectedAnswer.includes(option) && correctAnswers.includes(option);
    }
    
    return selectedAnswer === option && correctAnswers.includes(option);
  };

  // Check if selected answer is incorrect
  const isAnswerIncorrect = (option: string): boolean => {
    const correctAnswers = getCorrectAnswers();
    
    if (Array.isArray(selectedAnswer)) {
      return selectedAnswer.includes(option) && !correctAnswers.includes(option);
    }
    
    return selectedAnswer === option && !correctAnswers.includes(option);
  };

  // Handle answer selection
  const handleAnswerSelect = (option: string) => {
    if (question.subtype === 'multiple_select') {
      // For multiple select, toggle the selected answer
      if (Array.isArray(selectedAnswer)) {
        if (selectedAnswer.includes(option)) {
          setSelectedAnswer(selectedAnswer.filter(a => a !== option));
        } else {
          setSelectedAnswer([...selectedAnswer, option]);
        }
      } else {
        setSelectedAnswer([option]);
      }
    } else {
      // For single select, just set the selected answer
      setSelectedAnswer(option);
    }
  };

  // Get topic name from topic ID
  const getTopicName = (): string => {
    if (!question.topic || !topics.length) return 'Unknown Topic';
    
    const topicObj = topics.find(t => t.id === question.topic);
    return topicObj ? topicObj.title : 'Unknown Topic';
  };

  // Get tags as array
  const getTags = (): string[] => {
    if (!question.tags) return [];
    
    if (typeof question.tags === 'string') {
      return question.tags.split(',').map(tag => tag.trim());
    }
    
    return Array.isArray(question.tags) ? question.tags : [];
  };

  // Submit answer and show explanation
  const handleSubmit = () => {
    setShowExplanation(true);
  };

  // Reset state for next question
  const handleReset = () => {
    setSelectedAnswer('');
    setShowExplanation(false);
  };

  // Handle dialog close
  const handleClose = () => {
    handleReset();
    onClose();
  };

  const options = getOptions();
  const contentString = getContentAsString(question.content);
  const correctAnswers = getCorrectAnswers();
  const questionTags = getTags();
  
  // Create the question preview content component
  const QuestionPreviewContent = () => (
    <>
      {/* Question Content */}
      <div className="prose dark:prose-invert max-w-none">
        {typeof question.content === 'string' ? (
          <RichTextContent 
            content={question.content}
            className="prose dark:prose-invert max-w-none"
          />
        ) : (
          <RichTextContent 
            content={JSON.stringify(question.content)}
            className="prose dark:prose-invert max-w-none"
          />
        )}
      </div>
      
      {/* Options */}
      <div className="space-y-2 mt-4">
        {options.map((option) => (
          <div
            key={option.id}
            className={`flex items-start p-3 rounded-md cursor-pointer transition-colors ${
              showExplanation && correctAnswers.includes(option.id)
                ? 'bg-green-100 dark:bg-green-900/20 border border-green-500'
                : showExplanation && isAnswerIncorrect(option.id)
                ? 'bg-red-100 dark:bg-red-900/20 border border-red-500'
                : selectedAnswer === option.id || (Array.isArray(selectedAnswer) && selectedAnswer.includes(option.id))
                ? 'bg-primary/10 border border-primary'
                : 'bg-muted/40 hover:bg-muted border border-transparent'
            }`}
            onClick={() => !showExplanation && handleAnswerSelect(option.id)}
          >
            <div className="flex-shrink-0 mr-3">
              <div className={`flex items-center justify-center w-6 h-6 rounded-full border ${
                showExplanation && correctAnswers.includes(option.id)
                  ? 'border-green-500 text-green-500'
                  : showExplanation && isAnswerIncorrect(option.id)
                  ? 'border-red-500 text-red-500'
                  : selectedAnswer === option.id || (Array.isArray(selectedAnswer) && selectedAnswer.includes(option.id))
                  ? 'border-primary text-primary'
                  : 'border-muted-foreground text-muted-foreground'
              }`}>
                {showExplanation && correctAnswers.includes(option.id) ? (
                  <Check className="w-4 h-4" />
                ) : showExplanation && isAnswerIncorrect(option.id) ? (
                  <X className="w-4 h-4" />
                ) : (
                  option.id
                )}
              </div>
            </div>
            <div className="flex-1">
              <RichTextContent 
                content={option.text} 
                className="prose dark:prose-invert max-w-none text-sm"
              />
            </div>
          </div>
        ))}
      </div>
      
      {/* Explanation */}
      {showExplanation && question.explanation && (
        <div className="mt-6 p-4 bg-muted rounded-md">
          <h4 className="font-semibold mb-2">Explanation</h4>
          {typeof question.explanation === 'string' ? (
            <RichTextContent 
              content={question.explanation} 
              className="prose dark:prose-invert max-w-none"
            />
          ) : (
            <RichTextContent 
              content={JSON.stringify(question.explanation)} 
              className="prose dark:prose-invert max-w-none"
            />
          )}
          <div className="mt-2">
            <span className="font-semibold">Correct Answer: </span>
            {correctAnswers.join(', ')}
          </div>
        </div>
      )}
    </>
  );
  
  // For inline preview
  if (inlinePreview) {
    return (
      <div className="space-y-6 py-4">
        <div className="border border-primary/10 rounded-lg overflow-hidden">
          <div className="bg-primary/5 px-4 py-3 border-b border-primary/10">
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-base flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8L22 12L18 16"></path><path d="M2 12H22"></path></svg>
                GRE Question Preview
              </h3>
              <div className="flex items-center gap-2">
                {question.difficulty && (
                  <div className="flex items-center text-xs text-muted-foreground">
                    <span className="mr-1">Difficulty:</span>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span 
                        key={i} 
                        className={`w-1.5 h-1.5 rounded-full mx-px ${
                          question.difficulty && i < question.difficulty ? 'bg-primary' : 'bg-muted'
                        }`}
                      />
                    ))}
                  </div>
                )}
                <Badge variant="outline" className="ml-2">
                  {question.subtype.replace(/_/g, ' ')}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-card">
            <QuestionPreviewContent />
            
            {!showExplanation && (
              <Button 
                onClick={handleSubmit} 
                className="w-full mt-4"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
                Show Explanation
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  // For dialog preview
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="question-preview-description">
        <div id="question-preview-description" className="sr-only">Preview of the GRE question as it will appear to students</div>
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              {question.id && <span>Question #{question.id}</span>}
              <Badge variant="outline">{question.subtype.replace(/_/g, ' ')}</Badge>
              {question.difficulty && (
                <div className="flex items-center text-xs text-muted-foreground">
                  <span className="mr-1">Difficulty:</span>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span 
                      key={i} 
                      className={`w-1.5 h-1.5 rounded-full mx-px ${
                        question.difficulty && i < question.difficulty ? 'bg-primary' : 'bg-muted'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="question">Question</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>
          
          <TabsContent value="question" className="py-4 space-y-6">
            <QuestionPreviewContent />
          </TabsContent>
          
          <TabsContent value="details" className="py-4 space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Question Type</h4>
              <p>{question.type} / {question.subtype.replace(/_/g, ' ')}</p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Topic</h4>
              <p>{getTopicName()}</p>
            </div>
            
            {question.difficulty && (
              <div>
                <h4 className="font-semibold mb-2">Difficulty</h4>
                <div className="flex items-center">
                  <span className="mr-2">Level {question.difficulty}</span>
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span 
                        key={i} 
                        className={`w-2 h-2 rounded-full mx-px ${
                          question.difficulty && i < question.difficulty ? 'bg-primary' : 'bg-muted'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {questionTags.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Tags</h4>
                <div className="flex flex-wrap gap-1">
                  {questionTags.map(tag => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            <div>
              <h4 className="font-semibold mb-2">Answer Format</h4>
              <p>
                {question.subtype === 'multiple_select' 
                  ? 'Multiple Select (Choose all that apply)' 
                  : question.subtype === 'numeric' 
                    ? 'Numeric Answer'
                    : 'Single Select (Choose one)'}
              </p>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          {!showExplanation ? (
            <Button onClick={handleSubmit} className="w-full sm:w-auto">
              Submit Answer
            </Button>
          ) : (
            <Button onClick={handleReset} variant="outline" className="w-full sm:w-auto">
              Reset
            </Button>
          )}
          <Button variant="outline" onClick={handleClose} className="w-full sm:w-auto">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GREQuestionPreviewFixed;