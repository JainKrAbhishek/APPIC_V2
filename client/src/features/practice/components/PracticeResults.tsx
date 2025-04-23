import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { 
  Trophy, 
  RefreshCw, 
  ArrowLeft, 
  Clock, 
  BarChart, 
  Check, 
  X, 
  ChevronRight, 
  Share2,
  Target,
  Brain,
  Award,
  Zap
} from "lucide-react";
import { CompletionConfetti } from "@/components/CompletionConfetti";
import { formatTime } from '../practice-utils';
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PracticeResultsProps {
  score: number;
  totalQuestions: number;
  timeSpent: number;
  onReviewAnswers: () => void;
  onRestart: () => void;
  onExit: () => void;
  practiceName: string;
  practiceType: string;
}

/**
 * Component for displaying practice session results
 */
export const PracticeResults: React.FC<PracticeResultsProps> = ({
  score,
  totalQuestions,
  timeSpent,
  onReviewAnswers,
  onRestart,
  onExit,
  practiceName,
  practiceType
}) => {
  const percentage = Math.round((score / totalQuestions) * 100);
  const isHighScore = percentage >= 80;
  const isMediumScore = percentage >= 60 && percentage < 80;
  
  // Get type-specific styling
  const getTypeColor = () => {
    switch (practiceType) {
      case 'verbal':
        return 'blue';
      case 'quantitative':
        return 'purple';
      case 'vocabulary':
        return 'green';
      default:
        return 'gray';
    }
  };
  
  // Get score evaluation
  const getScoreEvaluation = () => {
    if (isHighScore) {
      return {
        icon: <Award className="h-5 w-5 text-yellow-500" />,
        title: "Excellent!",
        description: "You've mastered this content. Consider challenging yourself with more advanced practice sets.",
        color: "text-green-600"
      };
    } else if (isMediumScore) {
      return {
        icon: <Check className="h-5 w-5 text-blue-500" />,
        title: "Good Progress",
        description: "You're making good progress. A few more practice sessions will help reinforce your knowledge.",
        color: "text-blue-600"
      };
    } else {
      return {
        icon: <Target className="h-5 w-5 text-orange-500" />,
        title: "Keep Practicing",
        description: "Don't worry! Review the questions you missed and try again to improve your understanding.",
        color: "text-orange-600"
      };
    }
  };
  
  const scoreEval = getScoreEvaluation();
  const typeColor = getTypeColor();
  const avgTimePerQuestion = Math.round(timeSpent / totalQuestions);
  
  // Mock data for performance chart (in real app, would come from user's history)
  const mockPerformanceData = [
    { date: '1 week ago', score: Math.max(0, percentage - Math.floor(Math.random() * 15)) },
    { date: '3 days ago', score: Math.max(0, percentage - Math.floor(Math.random() * 10)) },
    { date: 'Yesterday', score: Math.max(0, percentage - Math.floor(Math.random() * 5)) },
    { date: 'Today', score: percentage },
  ];
  
  // Get color for circular progress
  const getProgressColor = () => {
    if (isHighScore) return '#22c55e';
    if (isMediumScore) return '#3b82f6';
    return '#f97316';
  };
  
  return (
    <div className="flex flex-col items-center justify-center p-4 md:p-6 max-w-5xl mx-auto">
      <CompletionConfetti show={isHighScore} />
      
      <div className="w-full mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Practice Results</h1>
          <p className="text-gray-500 dark:text-gray-400">
            {practiceName} • {practiceType.charAt(0).toUpperCase() + practiceType.slice(1)} Practice
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onExit}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to Practice
          </Button>
          <Button variant="outline" size="sm" className="w-10 px-0">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        {/* Main score card */}
        <Card className={`shadow-md overflow-hidden border-t-4 border-${typeColor}-500 lg:col-span-2`}>
          <CardHeader className="pb-0">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Trophy className={`text-${typeColor}-500`} size={20} />
                  Your Score
                </CardTitle>
                <CardDescription>
                  Completed on {new Date().toLocaleDateString()}
                </CardDescription>
              </div>
              <Badge 
                variant="outline" 
                className={`
                  ${isHighScore 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                    : isMediumScore 
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                      : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
                  }
                `}
              >
                {isHighScore ? 'Excellent' : isMediumScore ? 'Good' : 'Needs Practice'}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="pt-4">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-40 h-40 md:w-48 md:h-48">
                <CircularProgressbar
                  value={percentage}
                  text={`${percentage}%`}
                  styles={buildStyles({
                    textSize: '16px',
                    pathTransitionDuration: 1,
                    pathColor: getProgressColor(),
                    textColor: getProgressColor(),
                    trailColor: '#e5e7eb',
                  })}
                />
              </div>
              
              <div className="flex-1 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Correct Answers</p>
                    <div className="flex items-center justify-center gap-1">
                      <Check className="h-4 w-4 text-green-500" />
                      <p className="text-2xl font-bold">
                        {score}/{totalQuestions}
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Time Spent</p>
                    <div className="flex items-center justify-center gap-1">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <p className="text-2xl font-bold">{formatTime(timeSpent)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="flex items-start gap-2">
                    {scoreEval.icon}
                    <div>
                      <h3 className={`font-medium ${scoreEval.color}`}>
                        {scoreEval.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {scoreEval.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="border-t flex flex-col sm:flex-row gap-3 justify-end pt-4">
            <Button
              variant="outline"
              onClick={onRestart}
              className="w-full sm:w-auto"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Practice Again
            </Button>
            
            <Button
              variant="default"
              onClick={onReviewAnswers}
              className={`w-full sm:w-auto bg-${typeColor}-600 hover:bg-${typeColor}-700`}
            >
              Review Answers
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
        
        {/* Stats and insights */}
        <Card className="shadow-md lg:row-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-500" />
              Performance Insights
            </CardTitle>
            <CardDescription>
              Stats and improvement suggestions
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <Tabs defaultValue="stats">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="stats">Statistics</TabsTrigger>
                <TabsTrigger value="tips">Tips</TabsTrigger>
              </TabsList>
              
              <TabsContent value="stats" className="space-y-4">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Key Statistics</h4>
                  
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg flex justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-amber-500" />
                      <span className="text-sm">Avg. time per question</span>
                    </div>
                    <span className="text-sm font-medium">{avgTimePerQuestion} sec</span>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg flex justify-between">
                    <div className="flex items-center gap-2">
                      <BarChart className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Completion percentile</span>
                    </div>
                    <span className="text-sm font-medium">Top {100 - Math.floor(percentage / 4)}%</span>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg flex justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Achievement level</span>
                    </div>
                    <span className="text-sm font-medium">
                      {isHighScore ? 'Advanced' : isMediumScore ? 'Intermediate' : 'Beginner'}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-3 pt-2">
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Your Progress</h4>
                  
                  <div className="space-y-3">
                    {mockPerformanceData.map((data, index) => (
                      <div key={index} className="flex flex-col">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-gray-500">{data.date}</span>
                          <span className="text-xs font-medium">{data.score}%</span>
                        </div>
                        <Progress value={data.score} className="h-1.5" />
                      </div>
                    ))}
                  </div>
                  
                  <div className="text-center pt-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-300">
                      +{percentage - mockPerformanceData[0].score}% improvement
                    </Badge>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="tips" className="space-y-4">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Improvement Tips</h4>
                
                <div className="space-y-3">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <div className="flex gap-2">
                      <div className="mt-0.5">
                        <div className="bg-blue-100 dark:bg-blue-800 rounded-full h-5 w-5 flex items-center justify-center">
                          <span className="text-xs font-bold text-blue-700 dark:text-blue-300">1</span>
                        </div>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-blue-800 dark:text-blue-300">Review missed questions</h5>
                        <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                          Focus on understanding why you missed certain questions and review those concepts.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                    <div className="flex gap-2">
                      <div className="mt-0.5">
                        <div className="bg-purple-100 dark:bg-purple-800 rounded-full h-5 w-5 flex items-center justify-center">
                          <span className="text-xs font-bold text-purple-700 dark:text-purple-300">2</span>
                        </div>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-purple-800 dark:text-purple-300">Practice regularly</h5>
                        <p className="text-xs text-purple-700 dark:text-purple-400 mt-1">
                          Set aside 20-30 minutes daily for consistent practice to reinforce learning.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                    <div className="flex gap-2">
                      <div className="mt-0.5">
                        <div className="bg-green-100 dark:bg-green-800 rounded-full h-5 w-5 flex items-center justify-center">
                          <span className="text-xs font-bold text-green-700 dark:text-green-300">3</span>
                        </div>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-green-800 dark:text-green-300">Try different practice sets</h5>
                        <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                          Challenge yourself with varied content to broaden your knowledge and skills.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={onRestart}
                  >
                    Practice Again
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PracticeResults;