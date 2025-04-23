import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Eye, EyeOff } from 'lucide-react';
import { RichTextContent } from '@/lib/rich-text-editor';
import 'katex/dist/katex.min.css';

// Helper component for rendering content with math expressions
const MathContentRenderer: React.FC<{ content: string }> = ({ content }) => {
  // Process the content to properly display KaTeX expressions
  const formattedContent = useMemo(() => {
    return content.replace(/\$(.*?)\$/g, (match, tex) => {
      // For inline math expressions
      return `<span class="math inline">${tex}</span>`;
    });
  }, [content]);
  
  return (
    <div 
      className="prose dark:prose-invert max-w-none" 
      dangerouslySetInnerHTML={{ __html: formattedContent }}
    />
  );
};

interface Question {
  id?: number;
  type: string;
  subtype: string;
  content: any;
  options: any;
  answer: string | string[];
  explanation?: any;
  difficulty?: number;
  sectionNumber?: number;
  questionNumber?: number;
}

interface GREExamPreviewProps {
  question: Question;
  showExplanation?: boolean;
  showHeader?: boolean;
  showTimer?: boolean;
  inlinePreview?: boolean;
}

/**
 * A component that renders a GRE question in the exact format of the official exam
 * This closely follows the design in the provided screenshot
 */
const GREExamPreview: React.FC<GREExamPreviewProps> = ({
  question,
  showExplanation = false,
  showHeader = true,
  showTimer = true,
  inlinePreview = false
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isExplanationVisible, setIsExplanationVisible] = useState<boolean>(showExplanation);
  
  // Get section and question number with defaults
  const sectionNum = question.sectionNumber || 2;
  const questionNum = question.questionNumber || 5;
  const totalSections = 3;
  const totalQuestions = 7;
  
  // Helper to parse content
  const getContentAsString = (content: any): string => {
    if (!content) return '';
    if (typeof content === 'string') return content;
    if (typeof content === 'object') {
      try {
        if (content.text) return content.text;
        if (Array.isArray(content)) {
          return content.map(node => {
            if (typeof node === 'string') return node;
            if (node.text) return node.text;
            return '';
          }).join(' ');
        }
        return JSON.stringify(content);
      } catch (e) {
        return '';
      }
    }
    return String(content);
  };
  
  // Helper to get options
  const getOptions = (): Array<{label: string, value: string}> => {
    if (!question.options) return [];
    
    try {
      let parsedOptions = question.options;
      
      if (typeof question.options === 'string') {
        try {
          parsedOptions = JSON.parse(question.options);
        } catch (e) {
          // If parsing fails, treat it as a string array
          parsedOptions = [question.options];
        }
      }
      
      if (Array.isArray(parsedOptions)) {
        return parsedOptions.map((opt, index) => {
          if (typeof opt === 'string') {
            return {
              label: String.fromCharCode(65 + index), // A, B, C, etc.
              value: opt
            };
          } else if (typeof opt === 'object') {
            let optionText = '';
            if (opt.text) {
              if (typeof opt.text === 'string') {
                optionText = opt.text;
              } else if (Array.isArray(opt.text)) {
                optionText = opt.text.map((t: any) => typeof t === 'string' ? t : '').join(' ');
              }
            } else {
              optionText = JSON.stringify(opt);
            }
            
            return {
              label: String.fromCharCode(65 + index),
              value: optionText
            };
          }
          return {
            label: String.fromCharCode(65 + index),
            value: String(opt)
          };
        });
      }
    } catch (e) {
      console.error("Error parsing options:", e);
    }
    
    return [];
  };
  
  // Get correct answers
  const getCorrectAnswers = (): string[] => {
    if (!question.answer) return [];
    
    if (typeof question.answer === 'string') {
      if (question.answer.includes(',')) {
        return question.answer.split(',').map(a => a.trim());
      }
      return [question.answer];
    } 
    
    if (Array.isArray(question.answer)) {
      return question.answer.map(a => typeof a === 'string' ? a : String(a));
    }
    
    return [String(question.answer)];
  };
  
  const options = getOptions();
  // Process different content formats properly
  let contentString = '';
  
  if (question.content) {
    if (typeof question.content === 'string') {
      contentString = question.content;
    } else if (Array.isArray(question.content)) {
      try {
        // Handle slate editor json format
        contentString = question.content
          .map(node => {
            if (typeof node === 'string') return node;
            if (!node.children) return '';
            
            return node.children
              .map((child: any) => {
                if (typeof child === 'string') return child;
                return child.text || '';
              })
              .join('');
          })
          .join('\n');
      } catch (e) {
        contentString = JSON.stringify(question.content);
      }
    } else if (typeof question.content === 'object') {
      try {
        // Try to get text property
        contentString = question.content.text || JSON.stringify(question.content);
      } catch (e) {
        contentString = 'Error displaying content';
      }
    } else {
      contentString = String(question.content);
    }
  }
  const correctAnswers = getCorrectAnswers();
  
  // Check if an option is correct
  const isCorrectOption = (label: string): boolean => {
    return correctAnswers.includes(label);
  };
  
  // Get instructions based on question subtype - exact match to official GRE exam
  const getInstructions = (): string => {
    switch (question.subtype) {
      case 'multiple_choice':
        return 'For the following question, select one answer choice.';
      case 'multiple_select':
        return 'For the following question, indicate all answer choices that apply.';
      case 'quantitative_comparison':
        return 'Compare Quantity A and Quantity B, using additional information centered above the two quantities if such information is given. Select one of the following four answer choices:';
      case 'numeric':
        return 'Enter your answer as an integer or a decimal in the answer box.';
      case 'text_completion':
        if (contentString.split('_______').length > 2) {
          return 'For each blank, select one entry from the corresponding column of choices. Fill all blanks in the way that best completes the text.';
        } else {
          return 'For the following blank, select one entry from the corresponding column of choices that best completes the text.';
        }
      case 'sentence_equivalence':
        return 'Select exactly two answer choices that, when used to complete the sentence, fit the meaning of the sentence as a whole and produce completed sentences that are alike in meaning.';
      case 'reading_comprehension':
        return 'Questions are based on the passage below. Select the best answer to each question.';
      case 'critical_reasoning':
        return 'Consider the argument carefully and select the option that best responds to the question.';
      case 'data_interpretation':
        return 'Questions are based on the following data. For each question, select the best answer from the choices given.';
      case 'argument_analysis':
        return 'Write a response in which you discuss what specific evidence is needed to evaluate the argument and explain how the evidence would help to strengthen or weaken the argument.';
      default:
        return 'Select one answer choice.';
    }
  };
  
  // Function to handle blank text in content - matches official GRE format
  const formatContentWithBlanks = (content: string): React.ReactNode => {
    if (!content.includes('_______')) {
      return content.includes('$') ? (
        <MathContentRenderer content={content} />
      ) : (
        <RichTextContent 
          content={JSON.stringify([{ type: "paragraph", children: [{ text: content }] }])} 
          className="prose dark:prose-invert max-w-none" 
        />
      );
    }
    
    // Split by blank pattern and create elements with blanks
    const parts = content.split('_______');
    
    return (
      <div className="text-base leading-relaxed">
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            {part.includes('$') ? (
              <MathContentRenderer content={part} />
            ) : (
              <RichTextContent 
                content={JSON.stringify([{ type: "paragraph", children: [{ text: part }] }])} 
                className="prose dark:prose-invert max-w-none" 
              />
            )}
            {index < parts.length - 1 && (
              <span className="inline-block mx-1 border-b-2 border-gray-600" style={{ width: '120px', minWidth: '70px', maxWidth: '150px' }}>&nbsp;</span>
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };
  
  // Enhanced support for handling multi-blank text completion - matches official GRE format exactly
  const formatMultiBlankCompletion = (content: string): React.ReactNode => {
    if (!content.includes('_______')) {
      return content.includes('$') ? (
        <MathContentRenderer content={content} />
      ) : (
        <RichTextContent 
          content={JSON.stringify([{ type: "paragraph", children: [{ text: content }] }])} 
          className="prose dark:prose-invert max-w-none" 
        />
      );
    }
    
    // Split by blank pattern and create elements with numbered blanks
    const parts = content.split('_______');
    
    return (
      <div className="text-base leading-relaxed">
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            {part.includes('$') ? (
              <MathContentRenderer content={part} />
            ) : (
              <RichTextContent 
                content={JSON.stringify([{ type: "paragraph", children: [{ text: part }] }])} 
                className="prose dark:prose-invert max-w-none inline" 
              />
            )}
            {index < parts.length - 1 && (
              <span className="inline-flex items-center justify-center">
                <span className="inline-block mx-1 border-b-2 border-gray-600 relative" style={{ width: '120px', minWidth: '70px', maxWidth: '150px' }}>
                  {/* Numbered blank */}
                  <span className="absolute -top-4 left-1/2 transform -translate-x-1/2 text-xs font-medium bg-white px-1 text-gray-700">
                    Blank ({index + 1})
                  </span>
                  &nbsp;
                </span>
              </span>
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };
  
  // Render a quantitative comparison question
  const renderQuantitativeComparison = () => {
    const quantityA = contentString.includes('|') ? contentString.split('|')[0] : contentString;
    const quantityB = contentString.includes('|') ? contentString.split('|')[1] : '';
    
    return (
      <div className="grid grid-cols-2 gap-10 mb-8">
        <div className="border border-gray-300 p-4 rounded bg-gray-50">
          <div className="text-center font-medium mb-2">Quantity A</div>
          <div className="text-center">
            {quantityA.includes('$') ? (
              <MathContentRenderer content={quantityA} />
            ) : (
              <RichTextContent 
                content={JSON.stringify([{ type: "paragraph", children: [{ text: quantityA }] }])} 
                className="prose dark:prose-invert max-w-none" 
              />
            )}
          </div>
        </div>
        <div className="border border-gray-300 p-4 rounded bg-gray-50">
          <div className="text-center font-medium mb-2">Quantity B</div>
          <div className="text-center">
            {quantityB.includes('$') ? (
              <MathContentRenderer content={quantityB} />
            ) : (
              <RichTextContent 
                content={JSON.stringify([{ type: "paragraph", children: [{ text: quantityB }] }])} 
                className="prose dark:prose-invert max-w-none" 
              />
            )}
          </div>
        </div>
      </div>
    );
  };
  
  // Render a numeric entry question
  const renderNumericEntry = () => {
    return (
      <div className="mb-8">
        <div className="prose max-w-none leading-relaxed text-base">
          {contentString.includes('$') ? (
            <MathContentRenderer content={contentString} />
          ) : (
            <RichTextContent 
              content={JSON.stringify([{ type: "paragraph", children: [{ text: contentString }] }])} 
              className="prose dark:prose-invert max-w-none" 
            />
          )}
        </div>
        <div className="mt-6 flex justify-center">
          <div className="relative w-48">
            <input 
              type="text" 
              className="w-full p-2 border border-gray-300 rounded text-center" 
              placeholder="Enter a number" 
              readOnly={true}
            />
          </div>
        </div>
      </div>
    );
  };
  
  // Render a reading comprehension question
  const renderReadingComprehension = () => {
    // Split the content into passage and question if it contains a delimiter
    const parts = contentString.split('===QUESTION===');
    const passage = parts[0] || contentString;
    const questionText = parts.length > 1 ? parts[1] : '';
    
    return (
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="border-r border-gray-300 pr-4">
          <div className="font-medium mb-2">Passage</div>
          <div className="prose max-w-none leading-relaxed text-sm overflow-auto max-h-[400px]">
            {passage.includes('$') ? (
              <MathContentRenderer content={passage} />
            ) : (
              <RichTextContent 
                content={JSON.stringify([{ type: "paragraph", children: [{ text: passage }] }])} 
                className="prose dark:prose-invert max-w-none" 
              />
            )}
          </div>
        </div>
        <div className="pl-4">
          <div className="font-medium mb-2">Question</div>
          <div className="prose max-w-none leading-relaxed text-base">
            {questionText.includes('$') ? (
              <MathContentRenderer content={questionText} />
            ) : (
              <RichTextContent 
                content={JSON.stringify([{ type: "paragraph", children: [{ text: questionText }] }])} 
                className="prose dark:prose-invert max-w-none" 
              />
            )}
          </div>
        </div>
      </div>
    );
  };
  
  // Render a data interpretation question with chart/table and questions
  const renderDataInterpretation = () => {
    // Split the content into data presentation and question if it contains a delimiter
    const parts = contentString.split('===QUESTION===');
    const dataSection = parts[0] || contentString;
    const questionText = parts.length > 1 ? parts[1] : '';
    
    return (
      <div className="mb-8">
        <div className="mb-6 border border-gray-300 rounded p-4 bg-white">
          <div className="font-medium mb-2">Data Interpretation Set</div>
          <div className="prose max-w-none leading-relaxed">
            {dataSection.includes('$') ? (
              <MathContentRenderer content={dataSection} />
            ) : (
              <RichTextContent 
                content={JSON.stringify([{ type: "paragraph", children: [{ text: dataSection }] }])} 
                className="prose dark:prose-invert max-w-none" 
              />
            )}
          </div>
        </div>
        <div className="border-t border-gray-300 pt-4">
          <div className="font-medium mb-2">Question</div>
          <div className="prose max-w-none leading-relaxed text-base">
            {questionText.includes('$') ? (
              <MathContentRenderer content={questionText} />
            ) : (
              <RichTextContent 
                content={JSON.stringify([{ type: "paragraph", children: [{ text: questionText }] }])} 
                className="prose dark:prose-invert max-w-none" 
              />
            )}
          </div>
        </div>
      </div>
    );
  };
  
  // Render a text completion with multiple blanks - matches official GRE format
  const renderTextCompletionMultipleBlanks = () => {
    // For text completion with multiple blanks, we need special formatting
    // Each blank is typically numbered to correspond to a specific option set
    const blankCount = contentString.split('_______').length - 1;
    
    return (
      <div className="mb-8">
        <div className="prose max-w-none leading-relaxed text-base">
          {formatMultiBlankCompletion(contentString)}
        </div>
        
        {/* For multi-blank text completion, show column options as in official GRE */}
        <div className="mt-8 grid grid-cols-1 gap-6">
          {Array.from({ length: blankCount }).map((_, blankIndex) => (
            <div key={blankIndex} className="border border-gray-300 rounded">
              <div className="bg-gray-100 px-3 py-2 font-medium border-b border-gray-300">
                Blank ({blankIndex + 1})
              </div>
              <div className="divide-y divide-gray-300">
                {['A', 'B', 'C'].map((label, optIndex) => (
                  <div 
                    key={`blank-${blankIndex}-opt-${optIndex}`}
                    className="flex items-center py-2 px-3 cursor-pointer hover:bg-gray-50"
                  >
                    <div className="w-8 font-medium">{label}.</div>
                    <div className="flex-1">
                      {options[blankIndex * 3 + optIndex]?.value || `Option ${label} for blank ${blankIndex + 1}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <div className="border border-gray-300 rounded-none bg-white shadow-none overflow-hidden max-w-4xl mx-auto">
      {/* Exam header - exact match to the screenshot */}
      {showHeader && (
        <div className="flex justify-between items-center bg-gray-100 px-3 py-1 border-b border-gray-300">
          <div className="text-sm font-medium text-gray-800">
            Section {sectionNum} of {totalSections} | Question {questionNum} of {totalQuestions}
          </div>
          {showTimer && (
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium">00:16:37</div>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-sm">
                <Eye className="h-3 w-3 mr-1" />
                Hide Time
              </Button>
            </div>
          )}
        </div>
      )}
      
      {/* Question instructions - gray bar with centered text */}
      <div className="bg-gray-200 px-6 py-2 text-center border-b border-gray-300">
        <p className="text-sm font-medium">{getInstructions()}</p>
      </div>
      
      {/* Question content area with generous padding */}
      <div className="p-8 bg-white">
        {/* Render different question types based on subtype */}
        {(() => {
          switch (question.subtype) {
            case 'quantitative_comparison':
              return renderQuantitativeComparison();
              
            case 'numeric':
              return renderNumericEntry();
              
            case 'reading_comprehension':
            case 'critical_reasoning':
              return renderReadingComprehension();
              
            case 'data_interpretation':
              return renderDataInterpretation();
              
            case 'text_completion':
              // Check if it's a multi-blank text completion
              return contentString.split('_______').length > 2 
                ? renderTextCompletionMultipleBlanks() 
                : (
                  <div className="prose max-w-none leading-relaxed text-base mb-10">
                    {formatContentWithBlanks(contentString)}
                  </div>
                );
                
            case 'sentence_equivalence':
              return (
                <div className="space-y-6 mb-10">
                  <div className="prose max-w-none leading-relaxed text-base">
                    {formatContentWithBlanks(contentString)}
                  </div>
                  
                  {/* Special instruction for sentence equivalence */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm">
                    <p className="font-medium text-yellow-800 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                      Important Note:
                    </p>
                    <p className="mt-1 text-yellow-700">
                      Select exactly two answer choices that, when used to complete the sentence, fit the meaning of the sentence as a whole and produce completed sentences that are alike in meaning.
                    </p>
                  </div>
                </div>
              );
              
            default:
              // Standard multiple choice format
              return (
                <div className="prose max-w-none leading-relaxed text-base mb-10">
                  {formatContentWithBlanks(contentString)}
                </div>
              );
          }
        })()}
        
        {/* Don't show options for numeric entry */}
        {question.subtype !== 'numeric' && (
          <div className="space-y-1 max-w-xl mx-auto">
            {question.subtype === 'text_completion' ? (
              // Table-style options for text completion (exactly like screenshot)
              <div className="border border-gray-300">
                {options.map((option, index) => (
                  <div 
                    key={index}
                    className={`flex items-center border-b border-gray-300 last:border-b-0 cursor-pointer transition-colors
                      ${selectedOption === option.label ? 'bg-blue-50' : ''}
                      ${isExplanationVisible && isCorrectOption(option.label) ? 'bg-green-50' : ''}
                    `}
                    onClick={() => !isExplanationVisible && setSelectedOption(option.label)}
                  >
                    <div className="px-4 py-2 text-center border-r border-gray-300 w-16 font-medium">
                      {option.label}
                    </div>
                    <div className="px-4 py-2 flex-1">
                      {option.value}
                    </div>
                  </div>
                ))}
              </div>
            ) : question.subtype === 'sentence_equivalence' ? (
              // Grid style options for sentence equivalence (as in official GRE)
              <div className="grid grid-cols-2 gap-3">
                {options.map((option, index) => (
                  <div 
                    key={index}
                    className={`flex items-center border rounded p-3 cursor-pointer transition-colors
                      ${selectedOption === option.label ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
                      ${isExplanationVisible && isCorrectOption(option.label) ? 'border-green-500 bg-green-50' : ''}
                    `}
                    onClick={() => !isExplanationVisible && setSelectedOption(option.label)}
                  >
                    <div className="w-8 font-medium">{option.label}.</div>
                    <div className="flex-1">
                      {option.value}
                    </div>
                  </div>
                ))}
              </div>
            ) : question.subtype === 'quantitative_comparison' ? (
              // Standard options for quantitative comparison
              <div className="border border-gray-300">
                <div className="text-center font-medium py-2 border-b border-gray-300 bg-gray-50">
                  Common Information
                </div>
                <div className="p-3 text-center mb-4">
                  The following information applies to both quantities:
                </div>
                <div className="grid grid-cols-1 divide-y divide-gray-300">
                  {[
                    { label: 'A', text: 'Quantity A is greater.' },
                    { label: 'B', text: 'Quantity B is greater.' },
                    { label: 'C', text: 'The two quantities are equal.' },
                    { label: 'D', text: 'The relationship cannot be determined from the information given.' }
                  ].map((opt, idx) => (
                    <div 
                      key={idx}
                      className={`flex items-center py-3 px-4 cursor-pointer transition-colors
                        ${selectedOption === opt.label ? 'bg-blue-50' : ''}
                        ${isExplanationVisible && isCorrectOption(opt.label) ? 'bg-green-50' : ''}
                      `}
                      onClick={() => !isExplanationVisible && setSelectedOption(opt.label)}
                    >
                      <div className="flex-shrink-0 w-8 font-medium">{opt.label}.</div>
                      <div className="flex-1">{opt.text}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // Standard option list for multiple choice
              options.map((option, index) => (
                <div 
                  key={index}
                  className={`flex items-start p-3 border rounded cursor-pointer transition-colors
                    ${selectedOption === option.label ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
                    ${isExplanationVisible && isCorrectOption(option.label) ? 'border-green-500 bg-green-50' : ''}
                  `}
                  onClick={() => !isExplanationVisible && setSelectedOption(option.label)}
                >
                  <div className="flex-shrink-0 w-8 font-medium">{option.label}.</div>
                  <div className="flex-1">{option.value}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      
      {/* Bottom bar with action button - customized by question type */}
      <div className="bg-gray-100 px-3 py-2 flex justify-center border-t border-gray-300">
        {question.subtype === 'numeric' ? (
          <div className="flex space-x-4">
            <Button variant="outline" size="sm" className="px-6">
              Transfer Display
            </Button>
            <Button variant="default" size="sm" className="px-6">
              Next
            </Button>
          </div>
        ) : question.subtype === 'quantitative_comparison' ? (
          <div className="text-center bg-gray-200 text-gray-700 py-2 px-6 rounded text-sm">
            Select one answer choice.
          </div>
        ) : question.subtype === 'text_completion' || question.subtype === 'sentence_equivalence' ? (
          <div className="text-center bg-gray-200 text-gray-700 py-2 px-6 rounded text-sm">
            {question.subtype === 'sentence_equivalence' ? 'Select exactly two answer choices.' : 'Select one entry for the blank.'}
          </div>
        ) : (
          <div className="text-center bg-gray-200 text-gray-700 py-2 px-6 rounded text-sm">
            Select one answer choice.
          </div>
        )}
      </div>
      
      {/* Only show this when in explanation mode */}
      {isExplanationVisible && (
        <div className="p-4 bg-white border-t border-gray-300">
          <div className="bg-white border border-gray-300 rounded p-4">
            <h3 className="font-medium text-lg mb-2">Explanation</h3>
            {typeof question.explanation === 'string' && question.explanation.includes('$') ? (
              <MathContentRenderer content={question.explanation} />
            ) : (
              <RichTextContent 
                content={JSON.stringify([{ 
                  type: "paragraph", 
                  children: [{ text: getContentAsString(question.explanation) }] 
                }])} 
                className="prose dark:prose-invert max-w-none" 
              />
            )}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <span className="font-medium">Correct Answer: </span>
              {correctAnswers.join(', ')}
            </div>
          </div>
          
          <div className="flex justify-center mt-3">
            <Button
              variant="outline"
              onClick={() => setIsExplanationVisible(false)}
              className="w-40"
            >
              Hide Explanation
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GREExamPreview;