import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Calculator, Brain, CheckCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PracticeSet, PracticeProgress } from '../types';

interface QuantitativePracticeViewProps {
  practiceSets?: PracticeSet[];
  quantTopics: any[];
  onStartPracticeSet: (set: PracticeSet) => void;
  onBackToCategories: () => void;
}

// Function to format date in a readable way
const formatDate = (date: Date | string | undefined) => {
  if (!date) return 'Never';
  
  if (typeof date === 'string') {
    date = new Date(date);
  }
  
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  return date.toLocaleDateString('en-US', options);
};

const QuantitativePracticeView: React.FC<QuantitativePracticeViewProps> = ({
  practiceSets,
  quantTopics,
  onStartPracticeSet,
  onBackToCategories
}) => {
  // State to track expanded accordion items
  const [expandedTopics, setExpandedTopics] = useState<string[]>([]);

  // Fetch the user's progress data
  const { data: progressData = [], isLoading: progressLoading } = useQuery<any[]>({
    queryKey: ['/api/quant/progress'],
  });

  // Transform progress data into a useful format for our components
  const practiceProgressMap = React.useMemo(() => {
    const progressMap = new Map<number, PracticeProgress>();
    
    if (progressData && progressData.length > 0 && practiceSets) {
      // For each practice result related to a practice set
      practiceSets.forEach(set => {
        // Find all results for this set
        const setResults = progressData.filter((p: any) => p.practiceSetId === set.id);
        
        if (setResults.length > 0) {
          // Find the best score
          const bestScore = Math.max(...setResults.map((r: any) => {
            const scorePercentage = (r.score / r.maxScore) * 100;
            return Math.round(scorePercentage);
          }));
          
          // Find the latest attempt
          const latestAttempt = new Date(Math.max(
            ...setResults.map((r: any) => new Date(r.completedAt).getTime())
          ));
          
          // Calculate if the set is considered complete (passed with >= 70%)
          const isComplete = bestScore >= (set.passingScore || 70);
          
          // Store the progress info
          progressMap.set(set.id, {
            practiceSetId: set.id,
            bestScore,
            lastAttempt: latestAttempt,
            attemptCount: setResults.length,
            isComplete
          });
        }
      });
    }
    
    return progressMap;
  }, [progressData, practiceSets]);

  // Prepare data by grouping practice sets by topic category and subtopic
  const topicData = React.useMemo(() => {
    if (!practiceSets || !quantTopics.length) {
      return [];
    }

    // Group by category first (Arithmetic, Algebra, etc.)
    const categoryMap: Record<string, any> = {};
    
    // Process all topics
    quantTopics.forEach(topic => {
      // Find practice sets related to this topic
      const topicSets = practiceSets.filter(set => 
        set.type === 'quantitative' && 
        (
          // Direct relationship
          (set.relatedTopicId === topic.id && set.relatedTopicType === 'quant') ||
          // Category and topic filter match
          (set.categoryFilter === topic.category && set.topicFilter === topic.name) ||
          // Title match as a fallback
          set.title.toLowerCase().includes(topic.name.toLowerCase())
        )
      );
      
      // Add this topic if it has practice sets
      if (topicSets.length > 0) {
        const category = topic.category || 'General';
        
        // Create category entry if it doesn't exist
        if (!categoryMap[category]) {
          categoryMap[category] = {
            category,
            subtopics: []
          };
        }
        
        // Add subtopic with its practice sets
        categoryMap[category].subtopics.push({
          name: topic.name,
          description: topic.description || 'Practice questions for this topic',
          practiceSets: topicSets
        });
      }
    });
    
    // Add "General" category for unclassified sets
    const generalSets = practiceSets.filter(set => 
      set.type === 'quantitative' && 
      !set.relatedTopicId &&
      !set.categoryFilter &&
      !set.topicFilter &&
      !quantTopics.some(t => set.title.toLowerCase().includes(t.name.toLowerCase()))
    );
    
    if (generalSets.length > 0) {
      if (!categoryMap['General']) {
        categoryMap['General'] = {
          category: 'General',
          subtopics: []
        };
      }
      
      categoryMap['General'].subtopics.push({
        name: "General Practice",
        description: "Mixed practice questions from various topics",
        practiceSets: generalSets
      });
    }
    
    // Convert to array and sort categories
    return Object.values(categoryMap).sort((a: any, b: any) => {
      // Put "General" at the end
      if (a.category === 'General') return 1;
      if (b.category === 'General') return -1;
      return a.category.localeCompare(b.category);
    });
  }, [practiceSets, quantTopics]);

  // Calculate completion stats for a subtopic
  const getSubtopicStats = (practiceSets: PracticeSet[]) => {
    let totalSets = practiceSets.length;
    let completedSets = 0;
    
    practiceSets.forEach(set => {
      const progress = practiceProgressMap.get(set.id);
      if (progress?.isComplete) {
        completedSets++;
      }
    });
    
    return {
      totalSets,
      completedSets,
      completionPercentage: totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0
    };
  };

  // Handle expanding/collapsing a topic
  const toggleTopic = (topicId: string) => {
    if (expandedTopics.includes(topicId)) {
      setExpandedTopics(expandedTopics.filter(id => id !== topicId));
    } else {
      setExpandedTopics([...expandedTopics, topicId]);
    }
  };

  // Difficulty color mappings
  const difficultyColors = {
    1: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    2: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    3: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    4: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    5: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };

  return (
    <div className="container mx-auto max-w-6xl pb-16">
      {/* Header with back button */}
      <div className="flex items-center mb-6">
        <button 
          onClick={onBackToCategories}
          className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium">Back to Categories</span>
        </button>
      </div>
      
      {/* Page title */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 p-6 rounded-2xl shadow-lg border border-blue-100 dark:border-blue-900/50 mb-8"
      >
        <div className="relative">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center">
              <Calculator className="h-6 w-6 text-blue-500 mr-2" />
              Quantitative Practice
            </h1>
            <p className="text-gray-600 dark:text-gray-300 max-w-3xl">
              Master quantitative reasoning with topic-focused practice. Each set helps you build skills in specific areas like arithmetic, algebra, and data analysis.
            </p>
          </div>
          <Brain className="absolute right-6 bottom-0 w-20 h-20 text-blue-100/30 dark:text-blue-700/20 -z-10" />
        </div>
      </motion.div>
      
      {/* Loading state */}
      {progressLoading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}
      
      {/* Main content with topics */}
      {!progressLoading && (
        <div className="space-y-6">
          {topicData.map((topic, index) => (
            <Card key={`category-${topic.category}-${index}`} className="shadow-sm overflow-hidden">
              <div className="bg-blue-50/50 dark:bg-blue-950/30 px-6 py-4 border-b border-blue-100 dark:border-blue-900/30">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                  {topic.category}
                </h2>
              </div>
              
              <CardContent className="p-0">
                <Accordion 
                  type="multiple" 
                  value={expandedTopics}
                  onValueChange={setExpandedTopics}
                  className="w-full"
                >
                  {topic.subtopics.map((subtopic: any, subIndex: number) => {
                    const { totalSets, completedSets, completionPercentage } = getSubtopicStats(subtopic.practiceSets);
                    const subtopicId = `${topic.category}-${subtopic.name}-${subIndex}`;
                    
                    return (
                      <AccordionItem 
                        key={subtopicId} 
                        value={subtopicId}
                        className="border-b last:border-b-0"
                      >
                        <AccordionTrigger className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                          <div className="flex flex-col items-start text-left">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {subtopic.name}
                              </span>
                              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                                {totalSets} {totalSets === 1 ? 'set' : 'sets'}
                              </Badge>
                              {completedSets > 0 && (
                                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">
                                  {completedSets}/{totalSets} complete
                                </Badge>
                              )}
                            </div>
                            <div className="w-full mt-2">
                              <Progress value={completionPercentage} className="h-2" />
                            </div>
                          </div>
                        </AccordionTrigger>
                        
                        <AccordionContent className="px-6 pb-4 pt-0">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            {subtopic.description}
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {subtopic.practiceSets.length > 0 ? (
                              subtopic.practiceSets.map((practiceSet: PracticeSet) => {
                                const progress = practiceProgressMap.get(practiceSet.id);
                                const isComplete = progress?.isComplete || false;
                                const difficulty = practiceSet.difficulty || 1;
                                
                                return (
                                  <div 
                                    key={practiceSet.id}
                                    className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                                      isComplete ? 'bg-green-50/50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30' : 
                                      'border-gray-200 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-800'
                                    }`}
                                    onClick={() => onStartPracticeSet(practiceSet)}
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
                                        className={difficultyColors[difficulty as keyof typeof difficultyColors] || ''}
                                      >
                                        Level {difficulty}
                                      </Badge>
                                    </div>
                                    
                                    <div className="flex justify-between items-center mt-3 text-xs text-gray-500 dark:text-gray-400">
                                      <span>
                                        {practiceSet.questionIds.length} questions
                                        {practiceSet.timeLimit ? ` • ${Math.ceil(practiceSet.timeLimit / 60)} min` : ''}
                                      </span>
                                      
                                      {progress && (
                                        <div className="flex items-center">
                                          <span className="mr-2">
                                            Best: {progress.bestScore}%
                                          </span>
                                          <span>
                                            Last: {formatDate(progress.lastAttempt).split(',')[0]}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                    
                                    {progress && (
                                      <div className="mt-2">
                                        <Progress value={progress.bestScore} className="h-1.5" />
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                            ) : (
                              <div className="col-span-2 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800/30 rounded-lg p-6 border border-dashed border-gray-300 dark:border-gray-700">
                                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">
                                  No practice sets available for this topic yet.
                                </p>
                                <p className="text-blue-600 dark:text-blue-400 text-xs">
                                  New practice sets are regularly added. Check back soon!
                                </p>
                              </div>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </CardContent>
            </Card>
          ))}
          
          {topicData.length === 0 && (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/30 rounded-lg">
              <p className="text-gray-500 dark:text-gray-400">
                No practice sets available. Check back later!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuantitativePracticeView;