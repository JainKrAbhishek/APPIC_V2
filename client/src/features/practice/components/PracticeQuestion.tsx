import React from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import "../practice.css";

interface PracticeQuestionProps {
  content: string | { text: string } | any;
  options: any[] | Record<string, any>; // Using flexible typing to accommodate different formats
  type: 'single' | 'multiple' | 'numeric';
  currentAnswer: string | string[];
  onAnswerChange: (answer: string | string[]) => void;
  isDisabled?: boolean;
  correctAnswer?: string | string[];
  showCorrectAnswer?: boolean;
  explanation?: string | any; // Adding explanation field
  showExplanation?: boolean; // Adding showExplanation field
}

const PracticeQuestion: React.FC<PracticeQuestionProps> = ({
  content,
  options,
  type,
  currentAnswer,
  onAnswerChange,
  isDisabled = false,
  correctAnswer,
  showCorrectAnswer = false,
  explanation,
  showExplanation = false
}) => {
  // Format option for display
  const formatOption = (option: any): string => {
    if (option === null || option === undefined) return '';
    
    // For debugging - log the full structure
    console.log("Processing option:", option);
    
    // Handle plain strings directly
    if (typeof option === 'string') {
      return option;
    }
    
    // Handle special format for GRE questions with Slate.js structure
    if (typeof option === 'object') {
      try {
        // First check for complex GRE option format with text as Slate.js content
        if (option.text) {
          // If text is an array of nodes (the most common Slate.js format)
          if (Array.isArray(option.text)) {
            let extractedText = '';
            
            for (const node of option.text) {
              if (typeof node === 'string') {
                extractedText += node;
              } else if (node.type === 'paragraph' && Array.isArray(node.children)) {
                // Handle common paragraph structure
                extractedText += node.children.map((child: any) => 
                  typeof child === 'string' ? child : (child.text || '')
                ).join('');
              } else if (node.children) {
                // For any node with children, extract text
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
            
            // If specialized extraction failed, fall back to general method
            return getContentFromParsed(option.text);
          }
          
          // If text is a direct string
          if (typeof option.text === 'string') {
            return option.text;
          }
          
          // If text is a complex object with nested structure
          if (typeof option.text === 'object' && option.text !== null) {
            return getContentFromParsed(option.text);
          }
        }
        
        // Try direct value property
        if (option.value !== undefined) {
          return String(option.value);
        }
        
        // Try label property
        if (option.label) {
          return String(option.label);
        }
        
        // Check for LaTeX content
        if (option.formula || option.latex || option.math) {
          return `$${option.formula || option.latex || option.math}$`;
        }
        
        // For Slate node with type and children
        if (option.type && option.children) {
          if (option.type === 'paragraph') {
            return option.children.map((child: any) => 
              typeof child === 'string' ? child : (child.text || '')
            ).join('').trim();
          }
          return getContentFromParsed(option.children);
        }
        
        // For any object with children array
        if (option.children && Array.isArray(option.children)) {
          return getContentFromParsed(option.children);
        }
        
        // For objects with content property
        if (option.content) {
          return typeof option.content === 'string' 
            ? option.content 
            : getContentFromParsed(option.content);
        }
        
        // Special case for objects with just 'text' property as a child object
        if (Object.keys(option).length === 1 && typeof option.text === 'object') {
          return getContentFromParsed(option.text);
        }
      } catch (err) {
        console.error("Error processing option:", err);
      }
    }
    
    // Arrays (possibly paragraph content)
    if (Array.isArray(option)) {
      return getContentFromParsed(option);
    }
    
    // Last resort: Try to stringify the entire object
    try {
      // If it's just a number, return as string
      if (typeof option === 'number') {
        return String(option);
      }
      
      // For objects, pretty format
      if (typeof option === 'object') {
        // Create a cleaner version for display by removing explanation and other metadata
        const displayObj = { ...option };
        delete displayObj.explanation;
        delete displayObj.isCorrect;
        delete displayObj.__typename;
        
        return JSON.stringify(displayObj);
      }
      
      return String(option);
    } catch (e) {
      console.error("Error stringifying option:", e);
      return "[Complex Object]";
    }
  };

  // Get string representation of option for comparisons
  const getOptionValue = (option: any): string => {
    if (option === null || option === undefined) return '';
    
    // Debug the exact value extraction process
    console.log("Getting option value for:", option);
    
    // Handle objects by extracting a meaningful identifier
    if (typeof option === 'object') {
      // For GRE questions with the specialized option format, use the id property
      if (option.id !== undefined) {
        console.log("Using id for option value:", option.id);
        return String(option.id);
      }
      
      // For other formats with a value property
      if (option.value !== undefined) {
        console.log("Using value property for option value:", option.value);
        return String(option.value);
      }
      
      // For objects with a key property
      if (option.key !== undefined) {
        console.log("Using key property for option value:", option.key);
        return String(option.key);
      }
      
      // Try to use the isCorrect property as a fallback for specialized GRE options
      if (option.isCorrect !== undefined) {
        // Combine with some other property for uniqueness
        const valueBase = option.text ? 
          (typeof option.text === 'string' ? option.text : 'option-with-complex-text') : 
          'option';
        
        console.log("Using isCorrect-based ID for option value");
        return `${valueBase}-${option.isCorrect ? 'correct' : 'incorrect'}-${Math.random().toString(36).substring(2, 5)}`;
      }
      
      // Otherwise, create a unique hash from the stringified object
      try {
        const hash = JSON.stringify(option);
        console.log("Using JSON hash for option value");
        return hash;
      } catch (e) {
        console.error("Error creating option value:", e);
        return `option-${Math.random().toString(36).substring(2, 9)}`;
      }
    }
    
    return String(option);
  };

  // Check if option is selected
  const isOptionSelected = (option: any): boolean => {
    const value = getOptionValue(option);
    if (Array.isArray(currentAnswer)) {
      return currentAnswer.includes(value);
    }
    return currentAnswer === value;
  };

  // Check if option is correct (for review mode)
  const isOptionCorrect = (option: any): boolean => {
    if (!showCorrectAnswer || !correctAnswer) return false;
    
    const value = getOptionValue(option);
    if (Array.isArray(correctAnswer)) {
      return correctAnswer.includes(value);
    }
    return correctAnswer === value;
  };

  // Get option style based on selection state
  const getOptionStyle = (option: any): string => {
    const baseClassName = "mb-2 px-3 py-3 rounded border transition-colors";
    
    if (!showCorrectAnswer) {
      return cn(
        baseClassName,
        isOptionSelected(option) 
          ? "bg-[#E9F4FD] border-[#4A89DC]" 
          : "bg-white border-[#D0D0D0] hover:bg-[#F5F5F5]"
      );
    }
    
    if (isOptionCorrect(option)) {
      return cn(baseClassName, "bg-[#E7F9E9] border-[#4CAF50]");
    }
    
    if (isOptionSelected(option) && !isOptionCorrect(option)) {
      return cn(baseClassName, "bg-[#FEE7E7] border-[#F44336]");
    }
    
    return cn(baseClassName, "bg-white border-[#D0D0D0]");
  };

  // Get option label (A, B, C, etc.)
  const getOptionLabel = (index: number): string => {
    return String.fromCharCode(65 + index); // A, B, C, D, etc.
  };

  // Handle single-choice selection
  const handleSingleSelection = (optionValue: string): void => {
    if (!isDisabled) {
      onAnswerChange(optionValue);
    }
  };

  // Handle multiple-choice selection
  const handleMultipleSelection = (option: any): void => {
    if (isDisabled) return;
    
    const optionValue = getOptionValue(option);
    
    if (Array.isArray(currentAnswer)) {
      if (currentAnswer.includes(optionValue)) {
        onAnswerChange(currentAnswer.filter(item => item !== optionValue));
      } else {
        onAnswerChange([...currentAnswer, optionValue]);
      }
    } else {
      onAnswerChange([optionValue]);
    }
  };

  // Handle numeric input
  const handleNumericInput = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (!isDisabled) {
      onAnswerChange(e.target.value);
    }
  };

  // Render single choice question
  const renderSingleChoice = () => (
    <div className="mt-6">
      <div className="p-3 bg-[#F7F7F7] mb-4 text-sm font-medium text-[#505050] rounded">
        Select one answer choice.
      </div>
      
      <RadioGroup 
        value={currentAnswer as string} 
        onValueChange={handleSingleSelection}
        disabled={isDisabled}
        className="space-y-0"
      >
        {options.map((option, index) => {
          const optionValue = getOptionValue(option);
          const displayText = formatOption(option);
          
          return (
            <div key={index} className={getOptionStyle(option)}>
              <div className="flex items-start space-x-3">
                <div className="flex items-center h-5 mt-0.5">
                  <RadioGroupItem 
                    value={optionValue} 
                    id={`option-${index}`} 
                    disabled={isDisabled}
                    className="h-[18px] w-[18px] border-[#808080]"
                  />
                </div>
                <div className="flex-1">
                  <Label 
                    htmlFor={`option-${index}`}
                    className="cursor-pointer block"
                  >
                    <span className="font-medium text-[#505050] inline-block w-[26px]">
                      {getOptionLabel(index)}.
                    </span>
                    <span className="text-[#333333]">{displayText}</span>
                  </Label>
                </div>
              </div>
            </div>
          );
        })}
      </RadioGroup>
    </div>
  );

  // Render multiple choice question
  const renderMultipleChoice = () => (
    <div className="mt-6">
      <div className="p-3 bg-[#F7F7F7] mb-4 text-sm font-medium text-[#505050] rounded">
        Select all that apply.
      </div>
      
      <div className="space-y-0">
        {options.map((option, index) => {
          const displayText = formatOption(option);
          
          return (
            <div key={index} className={getOptionStyle(option)}>
              <div className="flex items-start space-x-3">
                <div className="flex items-center h-5 mt-0.5">
                  <Checkbox 
                    id={`option-${index}`}
                    checked={isOptionSelected(option)}
                    onCheckedChange={() => handleMultipleSelection(option)}
                    disabled={isDisabled}
                    className="h-[18px] w-[18px] border-[#808080] rounded-sm"
                  />
                </div>
                <div className="flex-1">
                  <Label 
                    htmlFor={`option-${index}`}
                    className="cursor-pointer block"
                  >
                    <span className="font-medium text-[#505050] inline-block w-[26px]">
                      {getOptionLabel(index)}.
                    </span>
                    <span className="text-[#333333]">{displayText}</span>
                  </Label>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // Render numeric question
  const renderNumeric = () => {
    // Ensure currentAnswer is always a string for the input
    // Initialize with empty string to avoid uncontrolled to controlled warning
    const inputValue = currentAnswer === undefined || currentAnswer === null 
      ? '' 
      : typeof currentAnswer === 'string' 
        ? currentAnswer 
        : String(currentAnswer);
    
    return (
      <div className="mt-6">
        <div className="p-3 bg-[#F7F7F7] mb-4 text-sm font-medium text-[#505050] rounded">
          Enter your answer as an integer or decimal.
        </div>
        
        <div className="flex flex-col space-y-2">
          <Label 
            htmlFor="numeric-answer" 
            className="text-[#505050]"
          >
            Type your answer below:
          </Label>
          <Input
            id="numeric-answer"
            type="text"
            className="w-40 h-10 text-center border-[#808080] focus:border-[#4A89DC] focus:ring-[#4A89DC]/20"
            value={inputValue}
            onChange={handleNumericInput}
            disabled={isDisabled}
            placeholder="Your answer"
          />
          
          {showCorrectAnswer && (
            <div className="mt-4 p-4 bg-[#F7F7F7] rounded">
              <p className="font-medium text-[#505050]">
                Correct answer: <span className="text-[#4CAF50] font-bold">{correctAnswer}</span>
              </p>
              {inputValue && inputValue !== correctAnswer && (
                <p className="font-medium mt-1 text-[#505050]">
                  Your answer: <span className="text-[#F44336] font-bold">{inputValue}</span>
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Handle content rendering
  const getContentText = () => {
    // If content is null or undefined, return empty string
    if (content === null || content === undefined) {
      return '';
    }
    
    // If content is a string that looks like JSON, try to parse it
    if (typeof content === 'string' && (content.startsWith('{') || content.startsWith('['))) {
      try {
        const parsedContent = JSON.parse(content);
        // Process the parsed object recursively
        return getContentFromParsed(parsedContent);
      } catch (e) {
        // If parsing fails, use it as a normal string
        return content;
      }
    }
    
    // If content is a plain string, simply return it
    if (typeof content === 'string') {
      return content;
    }
    
    // If content is an object, handle it properly
    if (typeof content === 'object' && content !== null) {
      return getContentFromParsed(content);
    }
    
    // Default fallback for any other type
    return String(content);
  };
  
  // Helper function to extract text from parsed content objects
  const getContentFromParsed = (obj: any): string => {
    // Debug the content structure
    console.log("Parsing content structure:", obj);
    
    try {
      // Handle null/undefined/empty cases
      if (obj === null || obj === undefined) {
        return '';
      }
      
      // Handle primitive types
      if (typeof obj === 'string') return obj;
      if (typeof obj === 'number') return String(obj);
      if (typeof obj === 'boolean') return String(obj);
      
      // Handle direct text property (commonly used in GRE question options)
      if (obj.text !== undefined) {
        // If text is already a string, use it directly
        if (typeof obj.text === 'string') {
          return obj.text;
        }
        // If text is an array (common in Slate format), process it recursively
        if (Array.isArray(obj.text)) {
          return getContentFromParsed(obj.text);
        }
        // If text is a Slate structure with children
        if (typeof obj.text === 'object' && obj.text !== null && obj.text.children) {
          return getContentFromParsed(obj.text.children);
        }
        // For any other type, convert to string
        return String(obj.text);
      }
      
      // Handle passage + text combination (common in reading comprehension)
      if (obj.passage && obj.text) {
        const passage = typeof obj.passage === 'string' ? obj.passage : getContentFromParsed(obj.passage);
        const text = typeof obj.text === 'string' ? obj.text : getContentFromParsed(obj.text);
        return `${passage}\n\n${text}`;
      }
      
      // Handle LaTeX formulas in the content (common in quantitative questions)
      if (obj.formula || obj.latex || obj.math) {
        const formula = obj.formula || obj.latex || obj.math;
        return obj.text ? `$$${formula}$$ ${obj.text}` : `$$${formula}$$`;
      }
      
      // If it's an array (possibly from Slate editor), extract text
      if (Array.isArray(obj)) {
        return obj.map(node => {
          // Handle simple values
          if (node === null || node === undefined) return '';
          if (typeof node === 'string') return node;
          if (typeof node === 'number') return String(node);
          
          // Handle objects
          if (typeof node === 'object') {
            // Handle text property directly
            if (node.text !== undefined) {
              return String(node.text);
            }
            
            // Handle Slate paragraphs with children
            if (node.type && node.children) {
              // For paragraphs, get text from children and add spacing
              if (node.type === 'paragraph') {
                return getContentFromParsed(node.children) + ' ';
              }
              // For other node types with children, process children
              return getContentFromParsed(node.children);
            }
            
            // Try children if present
            if (node.children) {
              return getContentFromParsed(node.children);
            }
          }
          
          return '';
        }).join('').trim();
      }
      
      // Handle objects with children property (common in rich text editors)
      if (obj.children && Array.isArray(obj.children)) {
        return getContentFromParsed(obj.children);
      }
      
      // Try standard properties that might contain the content
      if (obj.content !== undefined) {
        return typeof obj.content === 'string' ? obj.content : getContentFromParsed(obj.content);
      }
      
      if (obj.value !== undefined) {
        return String(obj.value);
      }
      
      if (obj.label !== undefined) {
        return String(obj.label);
      }
      
      // For complex structures, try to stringify the JSON (with error handling)
      return JSON.stringify(obj, null, 2);
      
    } catch (error) {
      console.error("Error in getContentFromParsed:", error);
      return "[Content Error]"; // Fallback for any errors
    }
  };

  // Handle rendering passage and question text separately if available
  const renderQuestionContent = () => {
    // If content is a string but looks like a JSON object, try to parse it
    if (typeof content === 'string' && (content.startsWith('{') || content.startsWith('['))) {
      try {
        const parsedContent = JSON.parse(content);
        
        // If we successfully parsed to an object with text property
        if (parsedContent && parsedContent.text) {
          return (
            <div 
              className="mb-6 text-[15px] leading-relaxed text-[#333333]" 
              dangerouslySetInnerHTML={{ __html: String(parsedContent.text) }}
            />
          );
        }
        
        // Special handling for Slate.js format
        if (Array.isArray(parsedContent) && 
            parsedContent.length > 0 && 
            parsedContent[0].type === 'paragraph') {
          // Extract text from Slate.js format
          const textContent = getContentFromParsed(parsedContent);
          return (
            <div 
              className="mb-6 text-[15px] leading-relaxed text-[#333333]"
            >
              {textContent}
            </div>
          );
        }
      } catch (e) {
        // Continue with standard rendering if parsing fails
        console.error("Error parsing content string:", e);
      }
    }
    
    // Handle Slate.js format directly as object
    if (Array.isArray(content) && 
        content.length > 0 && 
        typeof content[0] === 'object' && 
        content[0].type === 'paragraph') {
      const textContent = getContentFromParsed(content);
      return (
        <div 
          className="mb-6 text-[15px] leading-relaxed text-[#333333]"
        >
          {textContent}
        </div>
      );
    }
    
    // Handle passage + text combination
    if (typeof content === 'object' && content !== null && content.passage && content.text) {
      return (
        <>
          <div 
            className="mb-4 p-4 bg-gray-50 rounded text-[15px] leading-relaxed text-[#333333] border border-gray-200" 
            dangerouslySetInnerHTML={{ __html: String(content.passage) }}
          />
          <div 
            className="mb-6 text-[15px] font-medium leading-relaxed text-[#333333]" 
            dangerouslySetInnerHTML={{ __html: String(content.text) }}
          />
        </>
      );
    }
    
    // Special handling for LaTeX formulas
    if (typeof content === 'object' && 
        content !== null && 
        (content.formula || content.latex || content.math)) {
      const formula = content.formula || content.latex || content.math;
      return (
        <div className="mb-6 text-[15px] leading-relaxed text-[#333333] text-center">
          <div dangerouslySetInnerHTML={{ __html: `$$${formula}$$` }} />
          {content.text && (
            <div className="mt-3" dangerouslySetInnerHTML={{ __html: String(content.text) }} />
          )}
        </div>
      );
    }
    
    // Standard content rendering
    return (
      <div 
        className="mb-6 text-[15px] leading-relaxed text-[#333333]" 
      >
        {getContentText()}
      </div>
    );
  };

  return (
    <div className="p-6 bg-white rounded shadow-sm">
      {renderQuestionContent()}
      
      {type === 'single' && renderSingleChoice()}
      {type === 'multiple' && renderMultipleChoice()}
      {type === 'numeric' && renderNumeric()}
    </div>
  );
};

export default PracticeQuestion;