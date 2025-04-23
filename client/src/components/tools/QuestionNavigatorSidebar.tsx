import React from 'react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  CheckCircle, 
  Circle, 
  Flag, 
  HelpCircle, 
  XCircle, 
  ChevronLeft, 
  ChevronRight,
  AlertCircle
} from "lucide-react";
import { Question } from "@shared/schema";

interface QuestionNavigatorSidebarProps {
  questions: Question[];
  currentIndex: number;
  userAnswers: Record<number, {
    value: string | string[];
    flagged: boolean;
    visited: boolean;
  }>;
  reviewMode: boolean;
  onQuestionSelect: (index: number) => void;
  onToggleCollapse?: () => void;
  isCollapsed?: boolean;
}

interface QuestionStatus {
  status: "unseen" | "answered" | "unanswered" | "flagged" | "correct" | "incorrect";
  label: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  icon: React.ReactNode;
}

const QuestionNavigatorSidebar: React.FC<QuestionNavigatorSidebarProps> = ({
  questions,
  currentIndex,
  userAnswers,
  reviewMode,
  onQuestionSelect,
  onToggleCollapse,
  isCollapsed = false
}) => {
  // Function to determine question status
  const getQuestionStatus = (question: Question, index: number): QuestionStatus => {
    const questionId = question.id;
    const answerState = userAnswers[questionId];

    if (!answerState || !answerState.visited) {
      return {
        status: "unseen",
        label: "Unseen",
        bgColor: "bg-gray-100",
        textColor: "text-gray-500",
        borderColor: "border-gray-200",
        icon: <Circle size={16} className="text-gray-400" />
      };
    }

    if (answerState.flagged) {
      return {
        status: "flagged",
        label: "Flagged",
        bgColor: "bg-yellow-50",
        textColor: "text-yellow-600",
        borderColor: "border-yellow-300",
        icon: <Flag size={16} className="text-yellow-500" />
      };
    }

    if (!answerState.value || (Array.isArray(answerState.value) && answerState.value.length === 0)) {
      return {
        status: "unanswered",
        label: "Skipped",
        bgColor: "bg-gray-100",
        textColor: "text-gray-600",
        borderColor: "border-gray-300",
        icon: <HelpCircle size={16} className="text-gray-500" />
      };
    }

    if (reviewMode) {
      // In review mode, check if answer is correct
      const isCorrect = Array.isArray(question.answer) && Array.isArray(answerState.value)
        ? JSON.stringify(question.answer.sort()) === JSON.stringify([...answerState.value].sort())
        : question.answer === answerState.value;

      if (isCorrect) {
        return {
          status: "correct",
          label: "Correct",
          bgColor: "bg-green-50",
          textColor: "text-green-600",
          borderColor: "border-green-300",
          icon: <CheckCircle size={16} className="text-green-500" />
        };
      } else {
        return {
          status: "incorrect",
          label: "Incorrect",
          bgColor: "bg-red-50",
          textColor: "text-red-600",
          borderColor: "border-red-300",
          icon: <XCircle size={16} className="text-red-500" />
        };
      }
    }

    return {
      status: "answered",
      label: "Answered",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
      borderColor: "border-blue-300",
      icon: <CheckCircle size={16} className="text-blue-500" />
    };
  };

  if (isCollapsed) {
    return (
      <div className="flex flex-col bg-gray-100 border-r border-gray-200 h-full shadow-md w-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="p-1 my-1 self-center"
          title="Expand Navigator"
        >
          <ChevronRight size={18} />
        </Button>
        
        <div className="flex flex-col items-center overflow-y-auto py-2 gap-2">
          {questions.map((_, idx) => (
            <Button
              key={idx}
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 w-7 p-0 rounded-full",
                idx === currentIndex ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
              )}
              onClick={() => onQuestionSelect(idx)}
            >
              {idx + 1}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-white border-r border-gray-200 h-full shadow-md w-64 transition-all duration-300">
      <div className="flex justify-between items-center p-3 border-b border-gray-200">
        <h3 className="font-medium text-gray-700">Question Navigator</h3>
        {onToggleCollapse && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="p-1"
            title="Collapse Navigator"
          >
            <ChevronLeft size={18} />
          </Button>
        )}
      </div>
      
      <div className="p-3 border-b border-gray-200 bg-gray-50">
        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* Status indicators */}
          <div className="flex items-center gap-1">
            <Circle size={12} className="text-gray-400" />
            <span>Unseen</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle size={12} className="text-blue-500" />
            <span>Answered</span>
          </div>
          <div className="flex items-center gap-1">
            <Flag size={12} className="text-yellow-500" />
            <span>Flagged</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertCircle size={12} className="text-gray-500" />
            <span>Skipped</span>
          </div>
          {reviewMode && (
            <>
              <div className="flex items-center gap-1">
                <CheckCircle size={12} className="text-green-500" />
                <span>Correct</span>
              </div>
              <div className="flex items-center gap-1">
                <XCircle size={12} className="text-red-500" />
                <span>Incorrect</span>
              </div>
            </>
          )}
        </div>
      </div>
      
      <div className="flex-grow overflow-y-auto p-3">
        <div className="grid grid-cols-4 gap-2">
          {questions.map((question, idx) => {
            const status = getQuestionStatus(question, idx);
            return (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                className={cn(
                  "flex flex-col items-center p-1 h-12 w-12 border-2",
                  idx === currentIndex ? "ring-2 ring-blue-500" : "",
                  status.bgColor,
                  status.textColor,
                  status.borderColor
                )}
                onClick={() => onQuestionSelect(idx)}
                title={`Question ${idx + 1}: ${status.label}`}
              >
                <span className="text-sm font-medium">{idx + 1}</span>
                <span className="mt-1">{status.icon}</span>
              </Button>
            );
          })}
        </div>
      </div>
      
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onQuestionSelect(currentIndex - 1)}
            disabled={currentIndex === 0}
            className="px-2 py-1 h-8"
          >
            <ChevronLeft size={16} />
            <span className="ml-1">Prev</span>
          </Button>
          
          <span className="text-sm text-gray-500">
            {currentIndex + 1} of {questions.length}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onQuestionSelect(currentIndex + 1)}
            disabled={currentIndex === questions.length - 1}
            className="px-2 py-1 h-8"
          >
            <span className="mr-1">Next</span>
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuestionNavigatorSidebar;