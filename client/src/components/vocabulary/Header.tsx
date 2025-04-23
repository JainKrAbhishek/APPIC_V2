import React from 'react';
import { Progress } from '@/components/ui/progress';

interface VocabularyHeaderProps {
  totalWords: number;
  wordCount: number;
  day: number;
}

const Header = ({ totalWords, wordCount, day }: VocabularyHeaderProps) => {
  // Calculate progress percentage
  const progressPercentage = Math.round((day / 34) * 100);
  
  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row justify-between mb-4">
        <div>
          <div className="flex items-center">
            <h3 className="text-lg font-medium text-gray-800">Your vocabulary progress</h3>
            <span className="ml-2 bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded-full">
              Day {day}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Learning {wordCount} words today out of {totalWords} total GRE words
          </p>
        </div>
        <div className="mt-3 sm:mt-0 flex items-end">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-600">
              {progressPercentage}% complete
            </p>
          </div>
        </div>
      </div>
      
      <Progress value={progressPercentage} className="h-2 bg-gray-100" />
    </div>
  );
};

export default Header;