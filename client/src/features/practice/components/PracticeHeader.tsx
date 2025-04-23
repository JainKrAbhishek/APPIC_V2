import React from 'react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BookOpen, Calculator, BookmarkIcon, ChevronLeft, ChevronRight, Clock, AlignJustify, List, Menu, Timer } from "lucide-react";

interface PracticeHeaderProps {
  activeTab: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  currentSection: number;
  totalSections: number;
  timeSpent: number;
  reviewMode: boolean;
  myAnswerTab: boolean;
  setMyAnswerTab: (value: boolean) => void;
  onPreviousClick: () => void;
  onNextClick: () => void;
  onExitClick: () => void;
  onReviewClick: () => void;
  isNextDisabled?: boolean;
  isPrevDisabled?: boolean;
  showTimer?: boolean;
  onToggleTimer?: () => void;
  onOpenCalculator?: () => void;
  onToggleNavigator?: () => void;
  navigatorCollapsed?: boolean;
  onTogglePomodoro?: () => void;
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const PracticeHeader: React.FC<PracticeHeaderProps> = ({
  activeTab,
  currentQuestionIndex,
  totalQuestions,
  currentSection,
  totalSections,
  timeSpent,
  reviewMode,
  myAnswerTab,
  setMyAnswerTab,
  onPreviousClick,
  onNextClick,
  onExitClick,
  onReviewClick,
  isNextDisabled = false,
  isPrevDisabled = false,
  showTimer = true,
  onToggleTimer,
  onOpenCalculator,
  onToggleNavigator,
  navigatorCollapsed = false,
  onTogglePomodoro
}) => {
  return (
    <div className="bg-[#404040] text-white border-b border-[#585858] shadow-md">
      {/* Top section with logo and answer tabs */}
      <div className="flex justify-between items-center px-4 py-2 border-b border-[#585858]">
        <div className="flex items-center gap-2">
          {/* Navigator toggle button */}
          {onToggleNavigator && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleNavigator}
              className="p-1 bg-gray-600 rounded hover:bg-gray-500"
              title={navigatorCollapsed ? "Expand Navigator" : "Collapse Navigator"}
            >
              <List size={18} />
            </Button>
          )}
          
          <div className="flex items-center text-[#D0D0D0]">
            {activeTab === "verbal" && <BookOpen className="mr-1" size={16} />}
            {activeTab === "vocabulary" && <BookmarkIcon className="mr-1" size={16} />}
            {activeTab === "quantitative" && <Calculator className="mr-1" size={16} />}
            <span className="text-sm font-semibold uppercase tracking-wider">
              GRE® Test
            </span>
          </div>
        </div>
        
        {reviewMode && (
          <div className="flex">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "rounded-none border-b-2 text-xs h-8 px-3 py-0 font-normal",
                myAnswerTab 
                  ? "border-blue-500 text-blue-400" 
                  : "border-transparent text-gray-300 hover:border-gray-600"
              )}
              onClick={() => setMyAnswerTab(true)}
            >
              My Answer
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "rounded-none border-b-2 text-xs h-8 px-3 py-0 font-normal",
                !myAnswerTab 
                  ? "border-blue-500 text-blue-400" 
                  : "border-transparent text-gray-300 hover:border-gray-600"
              )}
              onClick={() => setMyAnswerTab(false)}
            >
              Correct Answer
            </Button>
          </div>
        )}
      </div>
      
      {/* Navigation section */}
      <div className="flex justify-between items-center px-2 sm:px-4 py-2 bg-[#333333] border-b border-[#585858]">
        <Button
          variant="ghost"
          size="sm"
          className="text-[#B8B8B8] hover:bg-[#444444] hover:text-white text-xs px-1 sm:px-2 py-1 h-8"
          onClick={onExitClick}
        >
          <span className="hidden xs:inline">Exit</span> 
          <span className="xs:hidden">×</span>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="text-[#B8B8B8] hover:bg-[#444444] hover:text-white text-xs px-1 sm:px-2 py-1 h-8"
          onClick={onReviewClick}
        >
          <span className="hidden xs:inline">Review</span>
          <span className="xs:hidden">☰</span>
        </Button>
        
        <div className="flex space-x-1">
          <Button
            variant="ghost"
            size="sm"
            className="text-[#B8B8B8] hover:bg-[#444444] hover:text-white text-xs px-1 sm:px-2 py-1 h-8 disabled:opacity-40"
            onClick={onPreviousClick}
            disabled={isPrevDisabled}
          >
            <ChevronLeft size={16} />
            <span className="hidden sm:inline ml-1">Back</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="text-[#B8B8B8] hover:bg-[#444444] hover:text-white text-xs px-1 sm:px-2 py-1 h-8 disabled:opacity-40"
            onClick={onNextClick}
            disabled={isNextDisabled}
          >
            <span className="hidden sm:inline mr-1">Next</span>
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>
      
      {/* Info bar with question number and timer */}
      <div className="flex items-center justify-between px-4 py-1 text-xs text-[#B8B8B8] bg-[#2A2A2A]">
        <span>
          Section {currentSection} of {totalSections} | 
          {reviewMode ? " Review Mode: " : " "} 
          Question {currentQuestionIndex + 1} of {totalQuestions}
        </span>
        
        <div className="flex items-center space-x-3">
          {/* Pomodoro Timer Button */}
          {!reviewMode && onTogglePomodoro && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-1.5 py-0 text-[10px] bg-[#3A3A3A] hover:bg-[#444444] text-[#D0D0D0] flex items-center"
              onClick={onTogglePomodoro}
              title="Toggle Pomodoro Timer"
            >
              <Timer size={10} className="mr-1" />
              <span>Pomodoro</span>
            </Button>
          )}
          
          {/* Calculator Button for Quantitative section */}
          {activeTab === "quantitative" && !reviewMode && onOpenCalculator && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-1.5 py-0 text-[10px] bg-[#3A3A3A] hover:bg-[#444444] text-[#D0D0D0] flex items-center"
              onClick={onOpenCalculator}
            >
              <Calculator size={10} className="mr-1" />
              <span>Calculator</span>
            </Button>
          )}
          
          {/* Timer */}
          <div className="flex items-center">
            {showTimer && (
              <>
                <Clock size={12} className="mr-1" />
                <span>{formatTime(timeSpent)}</span>
              </>
            )}
            
            {/* Hide/Show Timer Button */}
            {onToggleTimer && (
              <Button
                variant="ghost"
                size="sm"
                className="ml-1 h-5 w-5 p-0 rounded-full hover:bg-[#444444]"
                onClick={onToggleTimer}
                title={showTimer ? "Hide Timer" : "Show Timer"}
              >
                <span className="sr-only">{showTimer ? "Hide Timer" : "Show Timer"}</span>
                {showTimer ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PracticeHeader;