import React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Question } from '@shared/schema';
import { cn } from "@/lib/utils";

interface PracticeReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questions: Question[];
  currentIndex: number;
  userAnswers: Record<number, any>;
  reviewMode: boolean;
  onQuestionSelect: (index: number) => void;
}

interface QuestionStatus {
  status: "unseen" | "answered" | "unanswered" | "flagged" | "correct" | "incorrect";
  label: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
}

const PracticeReviewDialog: React.FC<PracticeReviewDialogProps> = ({
  open,
  onOpenChange,
  questions,
  currentIndex,
  userAnswers,
  reviewMode,
  onQuestionSelect
}) => {
  // Determine question status
  const getQuestionStatus = (question: Question, index: number): QuestionStatus => {
    const answerState = userAnswers[question.id];
    
    if (!answerState?.visited) {
      return {
        status: "unseen",
        label: "Unseen",
        bgColor: "bg-[#F5F5F5]",
        textColor: "text-[#707070]",
        borderColor: "border-[#D0D0D0]"
      };
    }
    
    if (reviewMode) {
      const correctAnswer = question.answer;
      const userAnswer = answerState.value;
      let isCorrect = false;
      
      if (Array.isArray(userAnswer) && Array.isArray(correctAnswer)) {
        isCorrect = userAnswer.length === correctAnswer.length &&
          userAnswer.every(a => correctAnswer.includes(a));
      } else if (Array.isArray(userAnswer) && typeof correctAnswer === 'string') {
        const correctAnswerArray = correctAnswer.split(',');
        isCorrect = userAnswer.length === correctAnswerArray.length &&
          userAnswer.every(a => correctAnswerArray.includes(a));
      } else {
        isCorrect = userAnswer === correctAnswer;
      }
      
      if (!userAnswer || (Array.isArray(userAnswer) && userAnswer.length === 0)) {
        return {
          status: "unanswered",
          label: "Unanswered",
          bgColor: "bg-[#FFF9E6]",
          textColor: "text-[#887512]",
          borderColor: "border-[#F1C40F]"
        };
      }
      
      return isCorrect 
        ? {
            status: "correct",
            label: "Correct",
            bgColor: "bg-[#E7F9E9]",
            textColor: "text-[#2E7D32]",
            borderColor: "border-[#4CAF50]"
          }
        : {
            status: "incorrect",
            label: "Incorrect",
            bgColor: "bg-[#FEE7E7]",
            textColor: "text-[#C62828]",
            borderColor: "border-[#F44336]"
          };
    }
    
    if (answerState.flagged) {
      return {
        status: "flagged",
        label: "Flagged",
        bgColor: "bg-[#FFF9E6]",
        textColor: "text-[#887512]",
        borderColor: "border-[#F1C40F]"
      };
    }
    
    if (!answerState.value || (Array.isArray(answerState.value) && answerState.value.length === 0)) {
      return {
        status: "unanswered",
        label: "Unanswered",
        bgColor: "bg-[#F0F0F0]",
        textColor: "text-[#606060]",
        borderColor: "border-[#C0C0C0]"
      };
    }
    
    return {
      status: "answered",
      label: "Answered",
      bgColor: "bg-[#E9F4FD]",
      textColor: "text-[#1565C0]",
      borderColor: "border-[#4A89DC]"
    };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-white p-0 overflow-hidden">
        <DialogHeader className="bg-[#404040] text-white p-4 relative">
          <DialogTitle className="text-base font-medium">
            Question Review
          </DialogTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-4 top-3 text-white hover:bg-gray-700" 
            onClick={() => onOpenChange(false)}
          >
            <X size={18} />
          </Button>
        </DialogHeader>
        
        <div className="max-h-[65vh] overflow-y-auto">
          <div className="p-4 bg-[#F5F5F5]">
            <p className="text-sm text-[#505050] mb-2">
              Click on a question number to go to that question.
            </p>
            
            <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
              {questions.map((question, index) => {
                const status = getQuestionStatus(question, index);
                
                return (
                  <button
                    key={index}
                    className={cn(
                      "h-9 w-9 flex items-center justify-center rounded font-medium text-sm transition-all",
                      status.bgColor,
                      status.textColor,
                      status.borderColor,
                      "border",
                      currentIndex === index 
                        ? "ring-2 ring-offset-2 ring-[#4A89DC]" 
                        : "hover:brightness-95"
                    )}
                    onClick={() => onQuestionSelect(index)}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="p-4 border-t border-[#E0E0E0]">
            <div className="text-sm font-medium mb-2 text-[#505050]">Legend:</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              {reviewMode ? (
                <>
                  <div className="flex items-center">
                    <div className="h-4 w-4 bg-[#E7F9E9] border border-[#4CAF50] rounded mr-2"></div>
                    <span className="text-[#505050]">Correct</span>
                  </div>
                  <div className="flex items-center">
                    <div className="h-4 w-4 bg-[#FEE7E7] border border-[#F44336] rounded mr-2"></div>
                    <span className="text-[#505050]">Incorrect</span>
                  </div>
                  <div className="flex items-center">
                    <div className="h-4 w-4 bg-[#FFF9E6] border border-[#F1C40F] rounded mr-2"></div>
                    <span className="text-[#505050]">Unanswered</span>
                  </div>
                  <div className="flex items-center">
                    <div className="h-4 w-4 bg-[#F5F5F5] border border-[#D0D0D0] rounded mr-2"></div>
                    <span className="text-[#505050]">Current Question</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center">
                    <div className="h-4 w-4 bg-[#F5F5F5] border border-[#D0D0D0] rounded mr-2"></div>
                    <span className="text-[#505050]">Unseen</span>
                  </div>
                  <div className="flex items-center">
                    <div className="h-4 w-4 bg-[#E9F4FD] border border-[#4A89DC] rounded mr-2"></div>
                    <span className="text-[#505050]">Answered</span>
                  </div>
                  <div className="flex items-center">
                    <div className="h-4 w-4 bg-[#FFF9E6] border border-[#F1C40F] rounded mr-2"></div>
                    <span className="text-[#505050]">Flagged</span>
                  </div>
                  <div className="flex items-center">
                    <div className="h-4 w-4 bg-[#F0F0F0] border border-[#C0C0C0] rounded mr-2"></div>
                    <span className="text-[#505050]">Unanswered</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        
        <DialogFooter className="px-4 py-3 bg-[#F5F5F5] border-t border-[#E0E0E0] flex justify-center sm:justify-center">
          <Button 
            onClick={() => onOpenChange(false)}
            className="bg-[#4A89DC] hover:bg-[#3B7DD3] text-white"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PracticeReviewDialog;