import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PracticeSet, PracticeProgress } from '../types';

export interface AccordionTopicViewProps {
  topics: {
    category: string;
    subtopics: {
      name: string;
      practiceSets: PracticeSet[];
    }[];
  }[];
  progressData?: Map<number, PracticeProgress>;
  isLoading?: boolean;
  onStartTest: (setId: number) => void;
}

interface SubtopicGroupProps {
  subtopicName: string;
  practiceSets: PracticeSet[];
  progressData?: Map<number, PracticeProgress>;
  completedCount?: number;
  onStartTest: (setId: number) => void;
}

interface PracticeSetItemProps {
  practiceSet: PracticeSet;
  lastAttemptDate?: string | Date;
  bestScore?: number;
  attemptCount?: number;
  isComplete?: boolean;
  onStartTest: (setId: number) => void;
}

// Helper to format date
const formatDate = (date: Date | string | undefined) => {
  if (!date) return 'Never';
  
  if (typeof date === 'string') {
    date = new Date(date);
  }
  
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

// Component to render a single practice set item
const PracticeSetItem: React.FC<PracticeSetItemProps> = ({
  practiceSet,
  lastAttemptDate,
  bestScore,
  attemptCount,
  isComplete,
  onStartTest
}) => {
  // Difficulty level colors
  const difficultyColors = {
    1: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    2: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    3: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    4: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    5: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };
  
  return (
    <div 
      className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
        isComplete ? 'bg-green-50/50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30' : 
        'border-gray-200 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-800'
      }`}
      onClick={() => onStartTest(practiceSet.id)}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 flex items-center">
            {isComplete && (
              <CheckCircle className="h-4 w-4 text-green-500 mr-1.5 flex-shrink-0" />
            )}
            {practiceSet.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
            {practiceSet.description}
          </p>
        </div>
        
        <Badge 
          variant="outline" 
          className={difficultyColors[practiceSet.difficulty as keyof typeof difficultyColors] || ''}
        >
          Level {practiceSet.difficulty || 1}
        </Badge>
      </div>
      
      <div className="flex justify-between items-center mt-3 text-xs text-gray-500 dark:text-gray-400">
        <span>
          {practiceSet.questionIds.length} questions
          {practiceSet.timeLimit ? ` • ${Math.ceil(practiceSet.timeLimit / 60)} min` : ''}
        </span>
        
        {attemptCount && attemptCount > 0 && (
          <div className="flex items-center">
            <span className="mr-2">
              Best: {bestScore}%
            </span>
            <span>
              Last: {formatDate(lastAttemptDate)}
            </span>
          </div>
        )}
      </div>
      
      {bestScore !== undefined && (
        <div className="mt-2">
          <Progress value={bestScore} className="h-1.5" />
        </div>
      )}
    </div>
  );
};

// Component to render a group of practice sets for a subtopic
const SubtopicGroup: React.FC<SubtopicGroupProps> = ({
  subtopicName,
  practiceSets,
  progressData,
  onStartTest
}) => {
  // Calculate completion stats
  const totalSets = practiceSets.length;
  let completedCount = 0;
  
  practiceSets.forEach(set => {
    const progress = progressData?.get(set.id);
    if (progress?.isComplete) {
      completedCount++;
    }
  });
  
  const completionPercentage = totalSets > 0 ? Math.round((completedCount / totalSets) * 100) : 0;
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h3 className="font-medium">{subtopicName}</h3>
          <Badge variant="secondary">
            {totalSets} {totalSets === 1 ? 'set' : 'sets'}
          </Badge>
          {completedCount > 0 && (
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
              {completedCount}/{totalSets} completed
            </Badge>
          )}
        </div>
      </div>
      
      <Progress value={completionPercentage} className="h-2 mb-4" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {practiceSets.map(set => {
          const progress = progressData?.get(set.id);
          
          return (
            <PracticeSetItem
              key={set.id}
              practiceSet={set}
              lastAttemptDate={progress?.lastAttempt}
              bestScore={progress?.bestScore}
              attemptCount={progress?.attemptCount}
              isComplete={progress?.isComplete}
              onStartTest={onStartTest}
            />
          );
        })}
      </div>
    </div>
  );
};

// Main AccordionTopicView component
const AccordionTopicView: React.FC<AccordionTopicViewProps> = ({
  topics,
  progressData,
  isLoading,
  onStartTest
}) => {
  const [expandedValues, setExpandedValues] = useState<string[]>([]);
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {topics.map((topic, index) => (
        <Card key={`topic-${topic.category}-${index}`} className="shadow-sm overflow-hidden">
          <div className="bg-primary/5 px-6 py-4 border-b">
            <h2 className="text-xl font-semibold">{topic.category}</h2>
          </div>
          
          <CardContent className="p-0">
            <Accordion 
              type="multiple" 
              value={expandedValues}
              onValueChange={setExpandedValues}
              className="w-full"
            >
              {topic.subtopics.map((subtopic, subIndex) => {
                const valueKey = `${topic.category}-${subtopic.name}-${subIndex}`;
                
                return (
                  <AccordionItem 
                    key={valueKey} 
                    value={valueKey}
                    className="border-b last:border-b-0"
                  >
                    <AccordionTrigger className="px-6 py-4 hover:bg-muted/50">
                      <div className="flex flex-col items-start text-left">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{subtopic.name}</span>
                          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                            {subtopic.practiceSets.length} sets
                          </Badge>
                        </div>
                      </div>
                    </AccordionTrigger>
                    
                    <AccordionContent className="px-6 pb-4 pt-0">
                      <SubtopicGroup
                        subtopicName={subtopic.name}
                        practiceSets={subtopic.practiceSets}
                        progressData={progressData}
                        onStartTest={onStartTest}
                      />
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </CardContent>
        </Card>
      ))}
      
      {topics.length === 0 && (
        <div className="text-center py-12 bg-muted/50 rounded-lg">
          <p className="text-muted-foreground">
            No practice sets found for this category.
          </p>
        </div>
      )}
    </div>
  );
};

export default AccordionTopicView;