import React from "react";
// Import enhanced rich text editor components
import { RichTextEditorIntegration, RichTextContent } from "@/lib/rich-text-editor";
// Keep legacy import for backward compatibility
import RichTextEditor from "@/lib/RichTextEditor";
import GREQuestionPreviewFixed from "./GREQuestionPreviewFixed";
import GREExamPreview from "./GREExamPreview";

// Define a common rich text node type
type RichTextNode = { type: string, children: Array<{ text: string }> };

interface QuestionPreviewProps {
  question: {
    type?: string;
    subtype?: string;
    content: string | Array<RichTextNode>;
    options: Array<string | Array<RichTextNode>>;
    explanation: string | Array<RichTextNode>;
    answer?: string;
    sectionNumber?: number;
    questionNumber?: number;
  };
  showGREFormat?: boolean;
  useOfficialFormat?: boolean;
}

// Component to preview question content
const QuestionPreview = ({ 
  question, 
  showGREFormat = true,
  useOfficialFormat = true 
}: QuestionPreviewProps) => {
  // Use the official GRE format if enabled (with section header, timer, etc.)
  if (showGREFormat && useOfficialFormat && question.type && question.subtype) {
    return <GREExamPreview 
      question={{
        id: 0, // Placeholder ID since it's required by the interface
        type: question.type as string,
        subtype: question.subtype as string,
        content: question.content,
        options: question.options,
        explanation: question.explanation,
        answer: question.answer || "",
        sectionNumber: question.sectionNumber || 2,
        questionNumber: question.questionNumber || 5
      }}
      showExplanation={false}
      showHeader={true}
      showTimer={true}
    />;
  }
  
  // If official format not requested, use the simplified GRE preview
  if (showGREFormat && question.type && question.subtype) {
    return <GREQuestionPreviewFixed 
      question={{
        id: 0, // Placeholder ID since it's required by the interface
        type: question.type as string, // Type assertion to ensure it's a string
        subtype: question.subtype as string, // Type assertion to ensure it's a string
        content: question.content, // Pass as is to preserve rich structure
        options: question.options, // Pass as is to preserve rich structure
        explanation: question.explanation, // Pass as is to preserve rich structure
        answer: question.answer || ""
      }}
      inlinePreview={true}
      showExplanation={true}
    />;
  }
  
  // Fallback to standard preview
  return (
    <div className="p-6 border rounded-md bg-gray-50">
      <h3 className="text-xl font-medium mb-4">Question Preview</h3>
      
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <strong className="text-lg">Content:</strong>
        </div>
        <div className="p-4 bg-white border rounded shadow-sm">
          <div className="w-full max-w-[900px] mx-auto">
            {typeof question.content === 'string' ? (
              <div>{question.content}</div>
            ) : (
              <div className="prose dark:prose-invert max-w-none">
                <RichTextContent
                  content={Array.isArray(question.content) 
                    ? JSON.stringify(question.content) 
                    : question.content}
                  className="prose dark:prose-invert max-w-none"
                />
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <strong className="text-lg">Options:</strong>
        </div>
        <div className="mt-1 space-y-3">
          {question.options.map((option: any, index: number) => (
            <div key={index} className="p-3 bg-white border rounded shadow-sm flex">
              <div className="mr-3 font-bold text-lg text-primary">{String.fromCharCode(65 + index)}.</div>
              {typeof option === 'string' ? (
                <div>{option}</div>
              ) : (
                <div className="flex-1 prose dark:prose-invert max-w-none">
                  <RichTextContent
                    content={Array.isArray(option) 
                      ? JSON.stringify(option) 
                      : option}
                    className="prose dark:prose-invert max-w-none"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <div className="flex items-center mb-2">
          <strong className="text-lg">Explanation:</strong>
        </div>
        <div className="p-4 bg-white border rounded shadow-sm">
          <div className="w-full max-w-[900px] mx-auto">
            {typeof question.explanation === 'string' ? (
              <div>{question.explanation}</div>
            ) : (
              <div className="prose dark:prose-invert max-w-none">
                <RichTextContent
                  content={Array.isArray(question.explanation) 
                    ? JSON.stringify(question.explanation) 
                    : question.explanation}
                  className="prose dark:prose-invert max-w-none"
                />
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Display answer if available */}
      {question.answer && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded">
          <strong className="text-blue-700">Correct Answer:</strong> {question.answer}
        </div>
      )}
    </div>
  );
};

export default QuestionPreview;