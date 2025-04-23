import React from "react";
import { Question } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import QuestionPreview from "./QuestionPreview";

interface QuestionViewDialogProps {
  question: Question | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const QuestionViewDialog: React.FC<QuestionViewDialogProps> = ({
  question,
  open,
  onOpenChange,
}) => {
  if (!question) return null;

  // Process content for preview
  let content;
  try {
    if (typeof question.content === 'string') {
      content = [{ type: 'paragraph', children: [{ text: question.content }] }];
    } else if (question.content && typeof question.content === 'object' && 'text' in question.content) {
      content = [{ type: 'paragraph', children: [{ text: question.content.text as string }] }];
    } else if (Array.isArray(question.content)) {
      content = question.content;
    } else {
      content = [{ type: 'paragraph', children: [{ text: '' }] }];
    }
  } catch (error) {
    console.error("Error formatting content:", error);
    content = [{ type: 'paragraph', children: [{ text: '' }] }];
  }

  // Define a type for the rich text format
  type RichTextNode = { type: string, children: Array<{ text: string }> };
  
  // Process options for preview
  let options: Array<Array<RichTextNode>> = [];
  try {
    if (Array.isArray(question.options)) {
      options = question.options.map((opt: any) => {
        if (typeof opt === 'string') {
          return [{ type: 'paragraph', children: [{ text: opt }] }];
        } else if (opt && typeof opt === 'object') {
          if (opt.text) {
            return [{ type: 'paragraph', children: [{ text: opt.text }] }];
          } else if (Array.isArray(opt)) {
            return opt;
          }
        }
        return [{ type: 'paragraph', children: [{ text: '' }] }];
      });
    }
  } catch (error) {
    console.error("Error processing options:", error);
    options = [];
  }

  // Process explanation for preview
  let explanation;
  try {
    if (typeof question.explanation === 'string') {
      explanation = [{ type: 'paragraph', children: [{ text: question.explanation }] }];
    } else if (question.explanation && typeof question.explanation === 'object' && 'text' in question.explanation) {
      explanation = [{ type: 'paragraph', children: [{ text: question.explanation.text as string }] }];
    } else if (Array.isArray(question.explanation)) {
      explanation = question.explanation;
    } else {
      explanation = [{ type: 'paragraph', children: [{ text: '' }] }];
    }
  } catch (error) {
    console.error("Error formatting explanation:", error);
    explanation = [{ type: 'paragraph', children: [{ text: '' }] }];
  }

  // Get difficulty label
  const getDifficultyLabel = (difficulty: number): string => {
    switch (difficulty) {
      case 1: return "Easy";
      case 2: return "Medium Easy";
      case 3: return "Medium";
      case 4: return "Medium Hard";
      case 5: return "Hard";
      default: return "Unknown";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="question-view-description">
        <div id="question-view-description" className="sr-only">Detailed view of the selected GRE question</div>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Question Details</span>
            <div className="flex space-x-2">
              <Badge variant="outline">ID: {question.id}</Badge>
              <Badge variant="outline" className="capitalize">{question.type}</Badge>
              <Badge variant="outline" className="capitalize">{question.subtype}</Badge>
              <Badge variant="outline">
                Difficulty: {getDifficultyLabel(question.difficulty as number)}
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          <QuestionPreview
            question={{
              content,
              options,
              explanation,
            }}
          />
        </div>
        
        <div className="mt-6 space-y-2">
          <h3 className="font-medium">Metadata:</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><strong>Category:</strong> {question.category}</div>
            <div><strong>Topic:</strong> {question.topic || "N/A"}</div>
            <div><strong>Tags:</strong> {question.tags || "N/A"}</div>
            <div><strong>Correct Answer:</strong> {question.answer}</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuestionViewDialog;