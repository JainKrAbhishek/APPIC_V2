import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { cn } from "@/lib/utils";
import { Check, X, Award, BarChart3, Brain, ArrowRight, Bookmark, Shuffle, SlidersHorizontal, Braces, BookType, Edit3, Pencil } from "lucide-react";
import { PracticeMode } from './types';
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface ModeStats {
  mode: PracticeMode;
  correct: number;
  total: number;
  percentage: number;
}

interface VocabPracticeResultsProps {
  score: number;
  total: number;
  day: number;
  mode: PracticeMode | PracticeMode[];
  onTryAgain: () => void;
  onBackToModes: () => void;
  useBookmarked?: boolean;
  selectedDays?: number[];
  mixedPractice?: boolean;
  modeStats?: ModeStats[]; // Optional stats per mode for mixed practice
}

const VocabPracticeResults: React.FC<VocabPracticeResultsProps> = ({ 
  score, 
  total, 
  day,
  mode,
  onTryAgain, 
  onBackToModes,
  useBookmarked = false,
  selectedDays = [],
  mixedPractice = false,
  modeStats = []
}) => {
  const percentCorrect = Math.round((score / total) * 100);
  
  // Get messages and colors based on score
  const getResultContent = () => {
    if (percentCorrect >= 90) {
      return {
        title: "Excellent!",
        message: "You have an outstanding grasp of these vocabulary words!",
        color: "#10b981", // emerald-500
        textColor: "text-emerald-700 dark:text-emerald-300",
        bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
        icon: <Award size={24} className="text-emerald-500" />
      };
    } else if (percentCorrect >= 70) {
      return {
        title: "Good Job!",
        message: "You're doing well with these vocabulary words. Keep practicing!",
        color: "#3b82f6", // blue-500
        textColor: "text-blue-700 dark:text-blue-300",
        bgColor: "bg-blue-50 dark:bg-blue-900/20",
        icon: <Check size={24} className="text-blue-500" />
      };
    } else if (percentCorrect >= 50) {
      return {
        title: "Nice Effort!",
        message: "You're on the right track. More practice will help you improve.",
        color: "#f59e0b", // amber-500
        textColor: "text-amber-700 dark:text-amber-300",
        bgColor: "bg-amber-50 dark:bg-amber-900/20",
        icon: <Brain size={24} className="text-amber-500" />
      };
    } else {
      return {
        title: "Keep Practicing!",
        message: "These words need more review. Don't worry, vocabulary takes time!",
        color: "#ef4444", // red-500
        textColor: "text-red-700 dark:text-red-300",
        bgColor: "bg-red-50 dark:bg-red-900/20",
        icon: <BarChart3 size={24} className="text-red-500" />
      };
    }
  };
  
  const getModeLabel = (mode: PracticeMode) => {
    switch(mode) {
      case 'synonym-matching': return 'Synonym Matching';
      case 'definition-matching': return 'Definition Matching';
      case 'fill-blanks': return 'Fill in the Blanks';
      case 'spelling': return 'Spelling Practice';
      default: return 'Vocabulary Practice';
    }
  };
  
  const resultContent = getResultContent();
  
  return (
    <div className="flex flex-col items-center max-w-3xl mx-auto py-8">
      <div className="flex items-center mb-8">
        <div className={cn("p-3 rounded-full mr-3", resultContent.bgColor)}>
          {resultContent.icon}
        </div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Practice Results</h2>
      </div>
      
      <Card className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex flex-col items-center mb-6 md:mb-0">
              <div className="w-40 h-40 mb-4">
                <CircularProgressbar
                  value={percentCorrect}
                  text={`${percentCorrect}%`}
                  styles={buildStyles({
                    pathColor: resultContent.color,
                    textColor: resultContent.color,
                    trailColor: '#e5e7eb',
                    textSize: '18px'
                  })}
                />
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{score} / {total}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {useBookmarked ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-medium hover:bg-amber-200 dark:hover:bg-amber-900/40 active:bg-amber-300 dark:active:bg-amber-900/50 cursor-pointer transition-colors touch-manipulation">
                      <Bookmark size={14} className="mr-1 text-amber-500 fill-amber-500" />
                      {selectedDays.length > 0 ? (
                        selectedDays.length === 1 ? 
                          `Bookmarked (Day ${selectedDays[0]})` : 
                          `Bookmarked (${selectedDays.length} days)`
                      ) : (
                        "All Bookmarked Words"
                      )}
                    </span>
                  ) : (
                    <>Day {day}</>
                  )} • {Array.isArray(mode) ? (
                    <span className="inline-flex items-center gap-1">
                      <span>Mixed Practice</span>
                      <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 px-1.5 py-0.5 rounded ml-1 whitespace-nowrap hover:bg-purple-200 dark:hover:bg-purple-900/40 active:bg-purple-300 dark:active:bg-purple-900/50 cursor-pointer transition-colors touch-manipulation">
                        {mode.length} modes
                      </span>
                    </span>
                  ) : getModeLabel(mode)}
                </p>
              </div>
            </div>
            
            <div className="flex-1 max-w-md">
              <h3 className={cn("text-xl font-semibold mb-2", resultContent.textColor)}>{resultContent.title}</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">{resultContent.message}</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <div className="flex items-center mb-1">
                    <Check size={16} className="text-green-500 mr-1" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Correct</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{score}</p>
                </div>
                
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                  <div className="flex items-center mb-1">
                    <X size={16} className="text-red-500 mr-1" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Incorrect</span>
                  </div>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{total - score}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className={cn("mt-6 p-4 rounded-lg", resultContent.bgColor)}>
            <h4 className={cn("font-medium mb-1", resultContent.textColor)}>Next Steps</h4>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              {useBookmarked 
                ? (percentCorrect >= 80 
                  ? selectedDays.length > 0 
                    ? `Excellent work with your bookmarked words from ${selectedDays.length === 1 ? `Day ${selectedDays[0]}` : `your selected days`}! Consider removing them from bookmarks if you've mastered them.`
                    : "Excellent work with your bookmarked words! Consider removing them from your bookmarks if you've mastered them."
                  : selectedDays.length > 0
                    ? `Keep practicing your bookmarked words from ${selectedDays.length === 1 ? `Day ${selectedDays[0]}` : `your selected days`}. These words need more review.`
                    : "Keep practicing your bookmarked words. These are words you specifically marked for review.")
                : (percentCorrect >= 80 
                  ? Array.isArray(mode)
                    ? "Great job on the mixed practice! You're doing well across different types of exercises."
                    : "Great job! You can move on to more challenging vocabulary or try another practice mode."
                  : Array.isArray(mode)
                    ? "Mixed practice is challenging! Keep practicing these words with different approaches."
                    : "Consider reviewing the words again before moving on. Regular practice is key to mastery.")}
            </p>
          </div>
          
          {/* Mode Breakdown for Mixed Practice */}
          {Array.isArray(mode) && mode.length > 1 && (
            <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="flex items-center mb-3">
                <Shuffle size={16} className="text-purple-500 mr-2" />
                <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200">
                  Mixed Practice Breakdown
                </h4>
              </div>
              
              {/* If mode stats are provided, show detailed breakdown */}
              {modeStats.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  {modeStats.map((stat) => (
                    <div 
                      key={stat.mode} 
                      className="bg-white dark:bg-gray-850 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all rounded-lg p-3 touch-manipulation"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          {stat.mode === 'synonym-matching' ? <Braces size={16} className="text-blue-500 mr-2" /> :
                           stat.mode === 'definition-matching' ? <BookType size={16} className="text-green-500 mr-2" /> :
                           stat.mode === 'fill-blanks' ? <Edit3 size={16} className="text-amber-500 mr-2" /> :
                           <Pencil size={16} className="text-purple-500 mr-2" />}
                          <span className="font-medium text-sm">
                            {getModeLabel(stat.mode)}
                          </span>
                        </div>
                        <Badge className={
                          stat.percentage >= 70 
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" 
                            : (stat.percentage >= 50 
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" 
                              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300")
                        }>
                          {stat.percentage}%
                        </Badge>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>{stat.correct} correct</span>
                        <span>{stat.total - stat.correct} incorrect</span>
                        <span>{stat.total} questions</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // If no mode stats, show a general message about mixed practice
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg mb-3">
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                    <span className="font-medium text-purple-700 dark:text-purple-300">Mixed practice</span> combines different question types to enhance your learning through varied exercises.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {mode.map((practiceModeType) => (
                      <span 
                        key={practiceModeType}
                        className="inline-flex items-center px-2 py-1 rounded text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 hover:border-gray-300 dark:hover:bg-gray-700 dark:hover:border-gray-600 transition-colors cursor-pointer touch-manipulation"
                      >
                        {practiceModeType === 'synonym-matching' ? <Braces size={12} className="text-blue-500 mr-1" /> :
                         practiceModeType === 'definition-matching' ? <BookType size={12} className="text-green-500 mr-1" /> :
                         practiceModeType === 'fill-blanks' ? <Edit3 size={12} className="text-amber-500 mr-1" /> :
                         <Pencil size={12} className="text-purple-500 mr-1" />}
                        {getModeLabel(practiceModeType)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  <strong>Pro Tip:</strong> Mixed mode practice provides greater learning benefits by requiring different types of recall and application, strengthening your vocabulary mastery.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mt-4">
        <Button 
          onClick={onTryAgain}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium h-11 sm:h-10 active:scale-[0.98] transition-transform touch-manipulation"
        >
          <span>Practice Again</span>
        </Button>
        
        <Button 
          variant="outline" 
          onClick={onBackToModes}
          className="w-full sm:w-auto h-11 sm:h-10 px-4 bg-white hover:bg-gray-50 active:bg-gray-100 border-gray-200 shadow-sm flex items-center gap-2 active:scale-[0.98] transition-transform touch-manipulation"
        >
          <ArrowRight className="h-4 w-4 rotate-180" />
          <span>Choose Another Mode</span>
        </Button>
      </div>
    </div>
  );
};

export default VocabPracticeResults;