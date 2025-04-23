import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader,
  CardTitle,
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PracticeSet } from '../types';
import { 
  Lock, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  BarChart2, 
  Info, 
  BookOpen,
  Tag
} from 'lucide-react';
import { motion } from 'framer-motion';

interface AccuracyIndicatorProps {
  accuracy: number;
  target: number;
}

const AccuracyIndicator: React.FC<AccuracyIndicatorProps> = ({ accuracy, target }) => {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={`${accuracy >= target ? 'text-green-600' : 'text-amber-600'}`}>
        Avg. Accuracy: {accuracy}%
      </span>
      <span className="text-gray-500">Target: {target}%</span>
      <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center text-xs cursor-help" title="Target accuracy to advance to the next level">
        <Info className="h-3 w-3 text-gray-500" />
      </div>
    </div>
  );
};

interface TestHistoryItemProps {
  date: string;
  accuracy: number;
  isCompleted?: boolean;
  questions: number;
  onClick?: () => void;
}

const TestHistoryItem: React.FC<TestHistoryItemProps> = ({ 
  date, 
  accuracy, 
  isCompleted = false, 
  questions,
  onClick 
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-center justify-between py-3 px-3 border-b border-gray-100 hover:bg-gray-50 rounded-md"
    >
      <div className="flex items-center gap-2">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs ${isCompleted ? 'bg-green-500' : 'bg-amber-500'}`}>
          {isCompleted ? <CheckCircle2 className="h-3.5 w-3.5" /> : '!'}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-800">{date}</span>
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            {questions} questions
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="w-24 h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={`h-full ${
              accuracy >= 70 ? 'bg-green-500' : 
              accuracy >= 50 ? 'bg-amber-500' : 
              'bg-red-500'
            }`}
            style={{ width: `${accuracy}%` }}
          />
        </div>
        <span className="text-sm font-medium">{accuracy}%</span>
        
        <button className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded" onClick={onClick}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
          </svg>
        </button>
      </div>
    </motion.div>
  );
};

export interface TopicTest {
  id: number;
  date: string;
  accuracy: number;
  isCompleted: boolean;
  questions: number;
}

interface DifficultyLevel {
  title: string;
  tests: TopicTest[];
  avgAccuracy: number;
  targetAccuracy: number;
  availableSets?: PracticeSet[];
}

export interface TopicDifficultyViewProps {
  topicId: number;
  topicName: string;
  topicDescription?: string;
  levels: DifficultyLevel[];
  onStartTest: (setId: number) => void;
  icon?: React.ReactNode;
}

const TopicDifficultyView: React.FC<TopicDifficultyViewProps> = ({
  topicId,
  topicName,
  topicDescription,
  levels,
  onStartTest,
  icon
}) => {
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  
  // Filter levels based on selected difficulty
  const filteredLevels = selectedDifficulty === 'all' 
    ? levels 
    : levels.filter(level => level.title.toLowerCase() === selectedDifficulty.toLowerCase());
    
  return (
    <div className="container mx-auto max-w-6xl pb-16">
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border-blue-100 dark:border-blue-900/50 mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-100 dark:bg-blue-900/60 p-2.5 rounded-full">
              {icon || (
                <div className="w-6 h-6 flex items-center justify-center bg-blue-500 text-white rounded-full">
                  {topicId}
                </div>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-blue-800 dark:text-blue-300">{topicName}</h2>
              {topicDescription && (
                <p className="text-blue-600/80 dark:text-blue-400/80 mt-1">{topicDescription}</p>
              )}
            </div>
          </div>
          
          {/* Topic stats overview */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-white/60 dark:bg-blue-900/30 rounded-lg p-4 flex items-center gap-3">
              <div className="bg-blue-100 dark:bg-blue-800/50 p-2 rounded-full">
                <BarChart2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-blue-600/80 dark:text-blue-400/80">Average Score</p>
                <h4 className="text-lg font-bold text-blue-800 dark:text-blue-300">
                  {Math.round(levels.reduce((acc, level) => acc + level.avgAccuracy, 0) / levels.length)}%
                </h4>
              </div>
            </div>
            
            <div className="bg-white/60 dark:bg-blue-900/30 rounded-lg p-4 flex items-center gap-3">
              <div className="bg-blue-100 dark:bg-blue-800/50 p-2 rounded-full">
                <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-blue-600/80 dark:text-blue-400/80">Completed Tests</p>
                <h4 className="text-lg font-bold text-blue-800 dark:text-blue-300">
                  {levels.reduce((acc, level) => acc + level.tests.filter(t => t.isCompleted).length, 0)}
                </h4>
              </div>
            </div>
            
            <div className="bg-white/60 dark:bg-blue-900/30 rounded-lg p-4 flex items-center gap-3">
              <div className="bg-blue-100 dark:bg-blue-800/50 p-2 rounded-full">
                <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-blue-600/80 dark:text-blue-400/80">Available Tests</p>
                <h4 className="text-lg font-bold text-blue-800 dark:text-blue-300">
                  {levels.reduce((acc, level) => acc + (level.availableSets?.length || 0), 0)}
                </h4>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Tag className="h-5 w-5 text-blue-500" />
          <span>Practice Tests</span>
        </h3>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <Tabs defaultValue="all" value={selectedDifficulty} onValueChange={setSelectedDifficulty} className="w-full">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="easy">Easy</TabsTrigger>
              <TabsTrigger value="medium">Medium</TabsTrigger>
              <TabsTrigger value="hard">Hard</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredLevels.map((level, index) => (
          <Card key={index} className="overflow-hidden border-gray-200 hover:border-blue-200 transition-colors">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 pb-3">
              <div className="flex justify-between items-center">
                <Badge className="bg-white/20 hover:bg-white/25 text-white" variant="secondary">
                  Level {index + 1}
                </Badge>
                <AccuracyIndicator 
                  accuracy={level.avgAccuracy} 
                  target={level.targetAccuracy} 
                />
              </div>
              <CardTitle className="text-white text-xl">{level.title} Tests</CardTitle>
              <CardDescription className="text-blue-100">
                Master {topicName.toLowerCase()} concepts with {level.title.toLowerCase()}-level problems
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-4">
              <div className="space-y-2">
                {level.tests.length > 0 ? (
                  level.tests.map((test, i) => (
                    <TestHistoryItem 
                      key={i} 
                      date={test.date}
                      accuracy={test.accuracy}
                      isCompleted={test.isCompleted}
                      questions={test.questions}
                    />
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No test history available
                  </div>
                )}
                
                {/* New test button */}
                {level.availableSets && level.availableSets.length > 0 ? (
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="mt-4"
                  >
                    <Button 
                      className="w-full mt-2 bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center gap-2 py-5 rounded-md"
                      onClick={() => onStartTest(level.availableSets![0].id)}
                    >
                      <Badge className="bg-blue-600 text-white" variant="secondary">NEW</Badge>
                      <span>Start Test ({level.availableSets[0].questionIds.length} Questions)</span>
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </motion.div>
                ) : (
                  <div className="w-full mt-4 bg-gray-100 text-gray-500 rounded-md p-3 flex items-center justify-center gap-2">
                    <Lock className="h-4 w-4" />
                    <span>Finish previous test to unlock</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TopicDifficultyView;