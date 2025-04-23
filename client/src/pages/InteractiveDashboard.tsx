import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, LineChart, Line,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { motion } from "framer-motion";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { User, PracticeResult } from "@shared/schema";
import { Activity as ActivityType } from "@shared/schema/subscription";

// Enhanced practice result interface with additional properties we need for display
interface EnhancedPracticeResult extends Partial<PracticeResult> {
  id: number;
  type: 'verbal' | 'quantitative' | 'vocabulary'; // The type of practice
  createdAt: Date | string; // When the practice was completed
  practiceSetTitle?: string; // The title of the practice set
  subtype?: string; // Subcategory of questions
  answers?: Record<string, any>; // The answers submitted during practice
  questionIds?: number[]; // The IDs of the questions in the set
}

// Filter state type
interface FilterState {
  timeRange: string;
  selectedSection: string | null;
}

import { 
  Card, CardContent, CardDescription, 
  CardFooter, CardHeader, CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, TabsContent, TabsList, TabsTrigger 
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  ChevronRight,
  LineChart as LineChartIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  BookOpen,
  Brain,
  Calculator,
  Clock,
  Award,
  TrendingUp,
  BookMarked,
  Target,
  CheckCircle2,
  X,
  Sparkles,
  RotateCcw,
  Activity
} from "lucide-react";

// Utility for grouping data by date
const groupByDate = (data: any[], dateKey: string) => {
  const result: Record<string, any[]> = {};
  
  data.forEach(item => {
    const date = new Date(item[dateKey]);
    const dateStr = date.toISOString().split('T')[0];
    
    if (!result[dateStr]) {
      result[dateStr] = [];
    }
    
    result[dateStr].push(item);
  });
  
  return result;
};

// Format date for display
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
};

// Get color based on score percentage
const getScoreColor = (score: number, max: number) => {
  const percentage = (score / max) * 100;
  if (percentage >= 80) return "#10b981"; // green
  if (percentage >= 60) return "#f59e0b"; // yellow
  return "#ef4444"; // red
};

// Activity sections
const ACTIVITY_SECTIONS = {
  vocabulary: {
    title: "Vocabulary",
    icon: <BookOpen className="h-5 w-5 text-blue-500" />,
    color: "bg-blue-500",
    lightColor: "bg-blue-100"
  },
  verbal: {
    title: "Verbal",
    icon: <Brain className="h-5 w-5 text-purple-500" />,
    color: "bg-purple-500",
    lightColor: "bg-purple-100"
  },
  quantitative: {
    title: "Quantitative",
    icon: <Calculator className="h-5 w-5 text-emerald-500" />,
    color: "bg-emerald-500",
    lightColor: "bg-emerald-100"
  }
};

const PRACTICE_COLORS = [
  "#8884d8", // purple
  "#82ca9d", // green
  "#ffc658", // yellow
  "#ff8042", // orange
  "#0088fe", // blue
];

const InteractiveDashboard = ({ user }: { user: User }) => {
  const [location, setLocation] = useLocation();
  const [timeRange, setTimeRange] = useState<string>("7");
  const [chartType, setChartType] = useState<"line" | "bar" | "pie">("line");
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  
  // Function to navigate to view practice result details
  const navigateToPracticeResult = (resultId: number) => {
    setLocation(`/practice/results/${resultId}`);
  };
  
  // Load user practice results and practice sets for titles
  const { data: rawPracticeResults, isLoading: resultsLoading } = useQuery({
    queryKey: ["/api/practice-results"],
  });
  
  const { data: practiceSets } = useQuery({
    queryKey: ["/api/practice-sets"],
  });
  
  // Transform the raw practice results to our enhanced format
  const practiceResults = React.useMemo<EnhancedPracticeResult[]>(() => {
    if (!rawPracticeResults) return [];
    
    return (rawPracticeResults as any[]).map(result => {
      // Find the practice set to get the title and type
      const practiceSet = practiceSets?.find((set: any) => set.id === result.practiceSetId);
      
      // Determine type based on title or practice set info
      let type: 'verbal' | 'quantitative' | 'vocabulary' = 'quantitative';
      
      if (practiceSet) {
        if (practiceSet.type.includes('verbal')) type = 'verbal';
        else if (practiceSet.type.includes('vocabulary')) type = 'vocabulary';
        else if (practiceSet.type.includes('quant')) type = 'quantitative';
      }
      
      // Transform to enhanced format
      return {
        ...result,
        type,
        createdAt: result.completedAt || new Date(),
        practiceSetTitle: practiceSet?.title || `${type.charAt(0).toUpperCase() + type.slice(1)} Practice`
      };
    });
  }, [rawPracticeResults, practiceSets]);
  
  // Load user activities
  const { data: activities, isLoading: activitiesLoading } = useQuery<ActivityType[]>({
    queryKey: ["/api/activities"],
  });
  
  // Filter data based on time range
  const filteredResults = React.useMemo(() => {
    if (!practiceResults) return [];
    
    const now = new Date();
    const cutoffDate = new Date();
    cutoffDate.setDate(now.getDate() - parseInt(timeRange));
    
    return practiceResults.filter(result => {
      const resultDate = new Date(result.createdAt);
      return resultDate >= cutoffDate;
    });
  }, [practiceResults, timeRange]);
  
  // Filter activities based on time range
  const filteredActivities = React.useMemo(() => {
    if (!activities) return [];
    
    const now = new Date();
    const cutoffDate = new Date();
    cutoffDate.setDate(now.getDate() - parseInt(timeRange));
    
    return activities
      .filter(activity => {
        const activityDate = new Date(activity.createdAt);
        return activityDate >= cutoffDate && 
               (!selectedSection || activity.type.includes(selectedSection));
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [activities, timeRange, selectedSection]);
  
  // Group results by date and section
  const resultsGroupedByDate = React.useMemo(() => {
    const grouped = groupByDate(filteredResults, 'createdAt');
    
    // Convert to array for chart data
    const chartData = Object.keys(grouped)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
      .map(date => {
        const dateResults = grouped[date];
        const verbCount = dateResults.filter(r => r.type === 'verbal').length;
        const quantCount = dateResults.filter(r => r.type === 'quantitative').length;
        const vocabCount = dateResults.filter(r => r.type === 'vocabulary').length;
        
        // Calculate average scores by section
        const verbScore = dateResults
          .filter(r => r.type === 'verbal')
          .reduce((acc, r) => acc + (r.score / r.maxScore) * 100, 0) / (verbCount || 1);
        
        const quantScore = dateResults
          .filter(r => r.type === 'quantitative')
          .reduce((acc, r) => acc + (r.score / r.maxScore) * 100, 0) / (quantCount || 1);
        
        const vocabScore = dateResults
          .filter(r => r.type === 'vocabulary')
          .reduce((acc, r) => acc + (r.score / r.maxScore) * 100, 0) / (vocabCount || 1);
        
        return {
          date: formatDate(date),
          fullDate: date,
          verbal: Math.round(verbScore),
          quantitative: Math.round(quantScore),
          vocabulary: Math.round(vocabScore),
          verbCount,
          quantCount,
          vocabCount,
          totalCount: dateResults.length
        };
      });
    
    return chartData;
  }, [filteredResults]);
  
  // Summary statistics
  const summaryStats = React.useMemo(() => {
    if (!practiceResults) return {
      totalPractices: 0,
      totalScore: 0,
      totalPossible: 0,
      avgPercentage: 0,
      sectionBreakdown: {},
      scoresBySection: {}
    };
    
    const practices = filteredResults.length;
    const score = filteredResults.reduce((acc, r) => acc + r.score, 0);
    const maxScore = filteredResults.reduce((acc, r) => acc + r.maxScore, 0);
    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    
    // Count by section
    const sectionBreakdown = {
      verbal: filteredResults.filter(r => r.type === 'verbal').length,
      quantitative: filteredResults.filter(r => r.type === 'quantitative').length,
      vocabulary: filteredResults.filter(r => r.type === 'vocabulary').length
    };
    
    // Average scores by section
    const scoresBySection = {
      verbal: {
        score: filteredResults
          .filter(r => r.type === 'verbal')
          .reduce((acc, r) => acc + r.score, 0),
        maxScore: filteredResults
          .filter(r => r.type === 'verbal')
          .reduce((acc, r) => acc + r.maxScore, 0)
      },
      quantitative: {
        score: filteredResults
          .filter(r => r.type === 'quantitative')
          .reduce((acc, r) => acc + r.score, 0),
        maxScore: filteredResults
          .filter(r => r.type === 'quantitative')
          .reduce((acc, r) => acc + r.maxScore, 0)
      },
      vocabulary: {
        score: filteredResults
          .filter(r => r.type === 'vocabulary')
          .reduce((acc, r) => acc + r.score, 0),
        maxScore: filteredResults
          .filter(r => r.type === 'vocabulary')
          .reduce((acc, r) => acc + r.maxScore, 0)
      }
    };
    
    return {
      totalPractices: practices,
      totalScore: score,
      totalPossible: maxScore,
      avgPercentage: percentage,
      sectionBreakdown,
      scoresBySection
    };
  }, [filteredResults]);
  
  // Create pie chart data for practice distribution
  const practiceDistributionData = React.useMemo(() => {
    return [
      { name: 'Verbal', value: summaryStats.sectionBreakdown.verbal || 0 },
      { name: 'Quantitative', value: summaryStats.sectionBreakdown.quantitative || 0 },
      { name: 'Vocabulary', value: summaryStats.sectionBreakdown.vocabulary || 0 }
    ].filter(item => item.value > 0);
  }, [summaryStats]);
  
  // Calculate time spent data based on actual practice results
  const timeSpentData = React.useMemo(() => {
    // Extract real time spent from practice results
    const verbalTime = filteredResults
      .filter(r => r.type === 'verbal')
      .reduce((acc, r) => acc + (r.timeSpent || 0), 0);
      
    const quantTime = filteredResults
      .filter(r => r.type === 'quantitative')
      .reduce((acc, r) => acc + (r.timeSpent || 0), 0);
      
    const vocabTime = filteredResults
      .filter(r => r.type === 'vocabulary')
      .reduce((acc, r) => acc + (r.timeSpent || 0), 0);
    
    return [
      { name: 'Verbal', value: Math.round(verbalTime) },
      { name: 'Quantitative', value: Math.round(quantTime) },
      { name: 'Vocabulary', value: Math.round(vocabTime) }
    ];
  }, [filteredResults]);
  
  // Calculate trend indicators (comparing to previous period)
  const trendIndicators = React.useMemo(() => {
    // If no data or not enough data, return neutral
    if (!practiceResults || practiceResults.length < 2) {
      return {
        verbal: 0,
        quantitative: 0,
        vocabulary: 0,
        overall: 0
      };
    }
    
    // Get the current period results
    const currentPeriodResults = filteredResults;
    
    // Get the previous period results
    const now = new Date();
    const currentPeriodStart = new Date();
    currentPeriodStart.setDate(now.getDate() - parseInt(timeRange));
    
    const previousPeriodStart = new Date(currentPeriodStart);
    previousPeriodStart.setDate(currentPeriodStart.getDate() - parseInt(timeRange));
    
    const previousPeriodResults = practiceResults.filter(result => {
      const resultDate = new Date(result.createdAt);
      return resultDate >= previousPeriodStart && resultDate < currentPeriodStart;
    });
    
    // Calculate average scores for both periods by section
    const calculateAvgScore = (results: EnhancedPracticeResult[], type: string) => {
      const typeResults = results.filter(r => r.type === type);
      if (typeResults.length === 0) return 0;
      
      const totalScore = typeResults.reduce((acc, r) => acc + r.score, 0);
      const totalPossible = typeResults.reduce((acc, r) => acc + r.maxScore, 0);
      return totalPossible > 0 ? (totalScore / totalPossible) * 100 : 0;
    };
    
    const currentVerbal = calculateAvgScore(currentPeriodResults, 'verbal');
    const previousVerbal = calculateAvgScore(previousPeriodResults, 'verbal');
    
    const currentQuant = calculateAvgScore(currentPeriodResults, 'quantitative');
    const previousQuant = calculateAvgScore(previousPeriodResults, 'quantitative');
    
    const currentVocab = calculateAvgScore(currentPeriodResults, 'vocabulary');
    const previousVocab = calculateAvgScore(previousPeriodResults, 'vocabulary');
    
    const currentOverall = currentPeriodResults.length > 0 
      ? currentPeriodResults.reduce((acc, r) => acc + r.score, 0) / 
        currentPeriodResults.reduce((acc, r) => acc + r.maxScore, 0) * 100
      : 0;
      
    const previousOverall = previousPeriodResults.length > 0
      ? previousPeriodResults.reduce((acc, r) => acc + r.score, 0) / 
        previousPeriodResults.reduce((acc, r) => acc + r.maxScore, 0) * 100
      : 0;
    
    // Calculate percentage changes
    const calcTrend = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 1 : 0;
      return current - previous;
    };
    
    return {
      verbal: calcTrend(currentVerbal, previousVerbal),
      quantitative: calcTrend(currentQuant, previousQuant),
      vocabulary: calcTrend(currentVocab, previousVocab),
      overall: calcTrend(currentOverall, previousOverall)
    };
  }, [filteredResults, practiceResults, timeRange]);
  
  // Loading state
  const isLoading = resultsLoading || activitiesLoading;
  
  if (isLoading) {
    return (
      <DashboardLayout title="Interactive Learning Dashboard" user={user}>
        <div className="container max-w-7xl mx-auto px-4 py-6">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded-lg mb-6 w-1/3"></div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              <div className="h-40 bg-gray-200 rounded-lg"></div>
              <div className="h-40 bg-gray-200 rounded-lg"></div>
              <div className="h-40 bg-gray-200 rounded-lg"></div>
            </div>
            <div className="h-64 bg-gray-200 rounded-lg mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-80 bg-gray-200 rounded-lg"></div>
              <div className="h-80 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout title="Interactive Learning Dashboard" user={user}>
      <div className="container max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Interactive Learning Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Track your GRE preparation performance and progress
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Select 
              value={timeRange} 
              onValueChange={setTimeRange}
            >
              <SelectTrigger className="w-[140px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="14">Last 14 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 3 months</SelectItem>
              </SelectContent>
            </Select>
            
            <Select 
              value={chartType} 
              onValueChange={(val) => setChartType(val as "line" | "bar" | "pie")}
            >
              <SelectTrigger className="w-[140px]">
                {chartType === "line" && <LineChartIcon className="h-4 w-4 mr-2" />}
                {chartType === "bar" && <BarChartIcon className="h-4 w-4 mr-2" />}
                {chartType === "pie" && <PieChartIcon className="h-4 w-4 mr-2" />}
                <SelectValue placeholder="Chart Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="line">Line Chart</SelectItem>
                <SelectItem value="bar">Bar Chart</SelectItem>
                <SelectItem value="pie">Pie Chart</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Performance Score Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">
                  Overall Performance
                </CardTitle>
                <CardDescription>
                  Average score across all practice
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-bold">
                      {summaryStats.avgPercentage}%
                    </span>
                    <span className="text-sm text-muted-foreground mb-1">
                      score
                    </span>
                  </div>
                  
                  <div className="flex items-center">
                    {trendIndicators.overall > 5 && (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Improving
                      </Badge>
                    )}
                    {trendIndicators.overall < -5 && (
                      <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">
                        <TrendingUp className="h-3 w-3 mr-1 rotate-180" />
                        Declining
                      </Badge>
                    )}
                    {trendIndicators.overall >= -5 && trendIndicators.overall <= 5 && (
                      <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-100">
                        <Target className="h-3 w-3 mr-1" />
                        Steady
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="mt-4">
                  <Progress value={summaryStats.avgPercentage} className="h-2" />
                </div>
                
                <div className="mt-2 text-sm text-muted-foreground">
                  {summaryStats.totalScore} of {summaryStats.totalPossible} questions correct
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">
                  Practice Activity
                </CardTitle>
                <CardDescription>
                  Practice sessions completed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-bold">
                      {summaryStats.totalPractices}
                    </span>
                    <span className="text-sm text-muted-foreground mb-1">
                      sessions
                    </span>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setLocation('/practice')}
                  >
                    Practice
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
                
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center">
                      <span className="h-3 w-3 rounded-full bg-purple-500 mr-2"></span>
                      Verbal
                    </span>
                    <span>{summaryStats.sectionBreakdown.verbal || 0}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center">
                      <span className="h-3 w-3 rounded-full bg-emerald-500 mr-2"></span>
                      Quantitative
                    </span>
                    <span>{summaryStats.sectionBreakdown.quantitative || 0}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center">
                      <span className="h-3 w-3 rounded-full bg-blue-500 mr-2"></span>
                      Vocabulary
                    </span>
                    <span>{summaryStats.sectionBreakdown.vocabulary || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">
                  Time Investment
                </CardTitle>
                <CardDescription>
                  Total time spent on GRE prep
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-1">
                  <span className="text-3xl font-bold">
                    {timeSpentData.reduce((acc, item) => acc + item.value, 0)}
                  </span>
                  <span className="text-sm text-muted-foreground mb-1">
                    minutes
                  </span>
                </div>
                
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center">
                      <span className="h-3 w-3 rounded-full bg-purple-500 mr-2"></span>
                      Verbal
                    </span>
                    <span>{timeSpentData[0].value} min</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center">
                      <span className="h-3 w-3 rounded-full bg-emerald-500 mr-2"></span>
                      Quantitative
                    </span>
                    <span>{timeSpentData[1].value} min</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center">
                      <span className="h-3 w-3 rounded-full bg-blue-500 mr-2"></span>
                      Vocabulary
                    </span>
                    <span>{timeSpentData[2].value} min</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
        
        {/* Performance Trend Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-8"
        >
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>
                Your score progression over time across all sections
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-80">
                {resultsGroupedByDate.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="text-muted-foreground">
                      No practice data available for this period
                    </div>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setLocation('/practice')}
                    >
                      Start Practicing
                    </Button>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    {chartType === "line" && (
                      <LineChart data={resultsGroupedByDate}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                        <Tooltip formatter={(value) => [`${value}%`, ""]} />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="verbal" 
                          name="Verbal" 
                          stroke="#9333ea" 
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="quantitative" 
                          name="Quantitative" 
                          stroke="#10b981" 
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="vocabulary" 
                          name="Vocabulary" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    )}
                    
                    {chartType === "bar" && (
                      <BarChart data={resultsGroupedByDate}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                        <Tooltip formatter={(value) => [`${value}%`, ""]} />
                        <Legend />
                        <Bar 
                          dataKey="verbal" 
                          name="Verbal" 
                          fill="#9333ea" 
                          radius={[4, 4, 0, 0]} 
                        />
                        <Bar 
                          dataKey="quantitative" 
                          name="Quantitative" 
                          fill="#10b981" 
                          radius={[4, 4, 0, 0]} 
                        />
                        <Bar 
                          dataKey="vocabulary" 
                          name="Vocabulary" 
                          fill="#3b82f6" 
                          radius={[4, 4, 0, 0]} 
                        />
                      </BarChart>
                    )}
                    
                    {chartType === "pie" && (
                      <PieChart>
                        <Pie
                          data={practiceDistributionData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {practiceDistributionData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={
                                entry.name === 'Verbal' ? '#9333ea' : 
                                entry.name === 'Quantitative' ? '#10b981' : '#3b82f6'
                              }
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [value, "Practices"]} />
                        <Legend />
                      </PieChart>
                    )}
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Practice Results Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-8"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Practice Results</span>
                <Badge variant="outline" className="font-normal">
                  {summaryStats.totalPractices} total practices
                </Badge>
              </CardTitle>
              <CardDescription>
                Track your recent practice performance across all sections
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!practiceResults || practiceResults.length === 0 ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                    <Calendar className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-1">No practice results yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Complete a practice set to see your results here
                  </p>
                  <Button onClick={() => setLocation('/practice')}>
                    Start Practicing
                  </Button>
                </div>
              ) : (
                <div className="space-y-5">
                  <Tabs defaultValue="all">
                    <TabsList className="mb-4">
                      <TabsTrigger value="all">All Results</TabsTrigger>
                      <TabsTrigger value="verbal">Verbal</TabsTrigger>
                      <TabsTrigger value="quantitative">Quantitative</TabsTrigger>
                      <TabsTrigger value="vocabulary">Vocabulary</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="all">
                      <div className="space-y-3">
                        {filteredResults.length === 0 ? (
                          <div className="text-center py-4 text-muted-foreground">
                            No practice results in the selected time range
                          </div>
                        ) : (
                          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                            {filteredResults
                              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                              .map((result, idx) => {
                                const scorePercentage = result.score && result.maxScore 
                                  ? (result.score / result.maxScore) * 100 
                                  : 0;
                                
                                // Determine badge color based on score
                                let badgeClass = 'bg-red-100 text-red-800';
                                if (scorePercentage >= 80) {
                                  badgeClass = 'bg-green-100 text-green-800';
                                } else if (scorePercentage >= 60) {
                                  badgeClass = 'bg-yellow-100 text-yellow-800';
                                } else if (scorePercentage >= 40) {
                                  badgeClass = 'bg-orange-100 text-orange-800';
                                }
                                
                                return (
                                  <div 
                                    key={result.id || idx} 
                                    className="flex items-center justify-between p-3 rounded-md border bg-card hover:bg-accent/5 transition-colors cursor-pointer" onClick={() => navigateToPracticeResult(result.id)}
                                  >
                                    <div className="flex items-center gap-4">
                                      <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium ${badgeClass}`}>
                                        {Math.round(scorePercentage)}%
                                      </div>
                                      <div>
                                        <div className="text-sm font-medium flex items-center gap-2">
                                          {result.practiceSetTitle || `${result.type.charAt(0).toUpperCase() + result.type.slice(1)} Practice`}
                                          <Badge variant="outline" className="text-xs capitalize font-normal">
                                            {result.type}
                                          </Badge>
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                          {new Date(result.createdAt).toLocaleString()} • {result.score}/{result.maxScore} correct
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <div className="text-sm">
                                        {result.timeSpent 
                                          ? `${Math.floor(result.timeSpent / 60)}:${(result.timeSpent % 60).toString().padStart(2, '0')}`
                                          : "N/A"}
                                      </div>
                                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); navigateToPracticeResult(result.id); }}>
                                        <ChevronRight className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="verbal">
                      <div className="space-y-3">
                        {filteredResults.filter(r => r.type === 'verbal').length === 0 ? (
                          <div className="text-center py-4 text-muted-foreground">
                            No verbal practice results in the selected time range
                          </div>
                        ) : (
                          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                            {filteredResults
                              .filter(r => r.type === 'verbal')
                              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                              .map((result, idx) => {
                                const scorePercentage = result.score && result.maxScore 
                                  ? (result.score / result.maxScore) * 100 
                                  : 0;
                                
                                // Determine badge color based on score
                                let badgeClass = 'bg-red-100 text-red-800';
                                if (scorePercentage >= 80) {
                                  badgeClass = 'bg-green-100 text-green-800';
                                } else if (scorePercentage >= 60) {
                                  badgeClass = 'bg-yellow-100 text-yellow-800';
                                } else if (scorePercentage >= 40) {
                                  badgeClass = 'bg-orange-100 text-orange-800';
                                }
                                
                                return (
                                  <div 
                                    key={result.id || idx} 
                                    className="flex items-center justify-between p-3 rounded-md border bg-card hover:bg-accent/5 transition-colors cursor-pointer" onClick={() => navigateToPracticeResult(result.id)}
                                  >
                                    <div className="flex items-center gap-4">
                                      <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium ${badgeClass}`}>
                                        {Math.round(scorePercentage)}%
                                      </div>
                                      <div>
                                        <div className="text-sm font-medium">
                                          {result.practiceSetTitle || "Verbal Practice"}
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                          {new Date(result.createdAt).toLocaleString()} • {result.score}/{result.maxScore} correct
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <div className="text-sm">
                                        {result.timeSpent 
                                          ? `${Math.floor(result.timeSpent / 60)}:${(result.timeSpent % 60).toString().padStart(2, '0')}`
                                          : "N/A"}
                                      </div>
                                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); navigateToPracticeResult(result.id); }}>
                                        <ChevronRight className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="quantitative">
                      <div className="space-y-3">
                        {filteredResults.filter(r => r.type === 'quantitative').length === 0 ? (
                          <div className="text-center py-4 text-muted-foreground">
                            No quantitative practice results in the selected time range
                          </div>
                        ) : (
                          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                            {filteredResults
                              .filter(r => r.type === 'quantitative')
                              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                              .map((result, idx) => {
                                const scorePercentage = result.score && result.maxScore 
                                  ? (result.score / result.maxScore) * 100 
                                  : 0;
                                
                                // Determine badge color based on score
                                let badgeClass = 'bg-red-100 text-red-800';
                                if (scorePercentage >= 80) {
                                  badgeClass = 'bg-green-100 text-green-800';
                                } else if (scorePercentage >= 60) {
                                  badgeClass = 'bg-yellow-100 text-yellow-800';
                                } else if (scorePercentage >= 40) {
                                  badgeClass = 'bg-orange-100 text-orange-800';
                                }
                                
                                return (
                                  <div 
                                    key={result.id || idx} 
                                    className="flex items-center justify-between p-3 rounded-md border bg-card hover:bg-accent/5 transition-colors cursor-pointer" onClick={() => navigateToPracticeResult(result.id)}
                                  >
                                    <div className="flex items-center gap-4">
                                      <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium ${badgeClass}`}>
                                        {Math.round(scorePercentage)}%
                                      </div>
                                      <div>
                                        <div className="text-sm font-medium">
                                          {result.practiceSetTitle || "Quantitative Practice"}
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                          {new Date(result.createdAt).toLocaleString()} • {result.score}/{result.maxScore} correct
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <div className="text-sm">
                                        {result.timeSpent 
                                          ? `${Math.floor(result.timeSpent / 60)}:${(result.timeSpent % 60).toString().padStart(2, '0')}`
                                          : "N/A"}
                                      </div>
                                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); navigateToPracticeResult(result.id); }}>
                                        <ChevronRight className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="vocabulary">
                      <div className="space-y-3">
                        {filteredResults.filter(r => r.type === 'vocabulary').length === 0 ? (
                          <div className="text-center py-4 text-muted-foreground">
                            No vocabulary practice results in the selected time range
                          </div>
                        ) : (
                          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                            {filteredResults
                              .filter(r => r.type === 'vocabulary')
                              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                              .map((result, idx) => {
                                const scorePercentage = result.score && result.maxScore 
                                  ? (result.score / result.maxScore) * 100 
                                  : 0;
                                
                                // Determine badge color based on score
                                let badgeClass = 'bg-red-100 text-red-800';
                                if (scorePercentage >= 80) {
                                  badgeClass = 'bg-green-100 text-green-800';
                                } else if (scorePercentage >= 60) {
                                  badgeClass = 'bg-yellow-100 text-yellow-800';
                                } else if (scorePercentage >= 40) {
                                  badgeClass = 'bg-orange-100 text-orange-800';
                                }
                                
                                return (
                                  <div 
                                    key={result.id || idx} 
                                    className="flex items-center justify-between p-3 rounded-md border bg-card hover:bg-accent/5 transition-colors cursor-pointer" onClick={() => navigateToPracticeResult(result.id)}
                                  >
                                    <div className="flex items-center gap-4">
                                      <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium ${badgeClass}`}>
                                        {Math.round(scorePercentage)}%
                                      </div>
                                      <div>
                                        <div className="text-sm font-medium">
                                          {result.practiceSetTitle || "Vocabulary Practice"}
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                          {new Date(result.createdAt).toLocaleString()} • {result.score}/{result.maxScore} correct
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <div className="text-sm">
                                        {result.timeSpent 
                                          ? `${Math.floor(result.timeSpent / 60)}:${(result.timeSpent % 60).toString().padStart(2, '0')}`
                                          : "N/A"}
                                      </div>
                                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); navigateToPracticeResult(result.id); }}>
                                        <ChevronRight className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Section details and activity feed */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Section performance */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <Tabs defaultValue="verbal" className="w-full">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="verbal" className="flex items-center gap-1.5">
                  <Brain className="h-4 w-4" />
                  <span>Verbal</span>
                </TabsTrigger>
                <TabsTrigger value="quantitative" className="flex items-center gap-1.5">
                  <Calculator className="h-4 w-4" />
                  <span>Quant</span>
                </TabsTrigger>
                <TabsTrigger value="vocabulary" className="flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4" />
                  <span>Vocab</span>
                </TabsTrigger>
              </TabsList>
              
              {/* Verbal Section */}
              <TabsContent value="verbal">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between">
                      <div>
                        <CardTitle>Verbal Section</CardTitle>
                        <CardDescription>
                          Reading comprehension, text completion, sentence equivalence
                        </CardDescription>
                      </div>
                      <div className="p-2 rounded-full bg-purple-100">
                        <Brain className="h-5 w-5 text-purple-700" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Overall Score</span>
                        <span className="text-sm font-bold">
                          {summaryStats.scoresBySection.verbal.maxScore > 0 
                            ? Math.round((summaryStats.scoresBySection.verbal.score / summaryStats.scoresBySection.verbal.maxScore) * 100)
                            : 0}%
                        </span>
                      </div>
                      <Progress 
                        value={summaryStats.scoresBySection.verbal.maxScore > 0 
                          ? (summaryStats.scoresBySection.verbal.score / summaryStats.scoresBySection.verbal.maxScore) * 100
                          : 0
                        } 
                        className="h-2" 
                      />
                      <div className="text-xs text-muted-foreground">
                        {summaryStats.scoresBySection.verbal.score} correct out of {summaryStats.scoresBySection.verbal.maxScore} questions
                      </div>
                    </div>
                    
                    <div className="space-y-4 pt-2">
                      <h4 className="text-sm font-semibold">Skill Breakdown</h4>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs">Reading Comprehension</span>
                            <span className="text-xs font-medium">72%</span>
                          </div>
                          <Progress value={72} className="h-1.5" />
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs">Text Completion</span>
                            <span className="text-xs font-medium">85%</span>
                          </div>
                          <Progress value={85} className="h-1.5" />
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs">Sentence Equivalence</span>
                            <span className="text-xs font-medium">63%</span>
                          </div>
                          <Progress value={63} className="h-1.5" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-2">
                      <h4 className="text-sm font-semibold mb-3">Recent Practice Results</h4>
                      {filteredResults.filter(r => r.type === 'verbal').length === 0 ? (
                        <div className="text-center py-4 text-sm text-muted-foreground">
                          No verbal practice results yet
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
                          {filteredResults
                            .filter(r => r.type === 'verbal')
                            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                            .slice(0, 5)
                            .map((result, idx) => (
                              <div 
                                key={result.id || idx} 
                                className="flex items-center justify-between p-2 rounded-md border bg-card"
                              >
                                <div className="flex items-center gap-3">
                                  <div 
                                    className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-xs
                                      ${result.score / result.maxScore >= 0.7 
                                        ? 'bg-green-500' 
                                        : result.score / result.maxScore >= 0.5 
                                          ? 'bg-yellow-500' 
                                          : 'bg-red-500'}`}
                                  >
                                    {Math.round((result.score / result.maxScore) * 100)}%
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium">
                                      {result.subtype?.replace(/_/g, ' ') || 'Verbal Practice'}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {new Date(result.createdAt).toLocaleDateString()} • {result.score}/{result.maxScore} correct
                                    </div>
                                  </div>
                                </div>
                                
                                <Badge variant="outline">
                                  {Math.floor(result.timeSpent / 60)}:{(result.timeSpent % 60).toString().padStart(2, '0')}
                                </Badge>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setLocation('/practice?type=verbal')}
                      className="w-full"
                    >
                      Practice Verbal Section
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              {/* Quantitative Section */}
              <TabsContent value="quantitative">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between">
                      <div>
                        <CardTitle>Quantitative Section</CardTitle>
                        <CardDescription>
                          Arithmetic, algebra, geometry, data analysis
                        </CardDescription>
                      </div>
                      <div className="p-2 rounded-full bg-emerald-100">
                        <Calculator className="h-5 w-5 text-emerald-700" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Overall Score</span>
                        <span className="text-sm font-bold">
                          {summaryStats.scoresBySection.quantitative.maxScore > 0 
                            ? Math.round((summaryStats.scoresBySection.quantitative.score / summaryStats.scoresBySection.quantitative.maxScore) * 100)
                            : 0}%
                        </span>
                      </div>
                      <Progress 
                        value={summaryStats.scoresBySection.quantitative.maxScore > 0 
                          ? (summaryStats.scoresBySection.quantitative.score / summaryStats.scoresBySection.quantitative.maxScore) * 100
                          : 0
                        } 
                        className="h-2" 
                      />
                      <div className="text-xs text-muted-foreground">
                        {summaryStats.scoresBySection.quantitative.score} correct out of {summaryStats.scoresBySection.quantitative.maxScore} questions
                      </div>
                    </div>
                    
                    <div className="space-y-4 pt-2">
                      <h4 className="text-sm font-semibold">Topic Breakdown</h4>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs">Arithmetic</span>
                            <span className="text-xs font-medium">78%</span>
                          </div>
                          <Progress value={78} className="h-1.5" />
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs">Algebra</span>
                            <span className="text-xs font-medium">65%</span>
                          </div>
                          <Progress value={65} className="h-1.5" />
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs">Geometry</span>
                            <span className="text-xs font-medium">57%</span>
                          </div>
                          <Progress value={57} className="h-1.5" />
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs">Data Analysis</span>
                            <span className="text-xs font-medium">82%</span>
                          </div>
                          <Progress value={82} className="h-1.5" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-2">
                      <h4 className="text-sm font-semibold mb-3">Recent Practice Results</h4>
                      {filteredResults.filter(r => r.type === 'quantitative').length === 0 ? (
                        <div className="text-center py-4 text-sm text-muted-foreground">
                          No quantitative practice results yet
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
                          {filteredResults
                            .filter(r => r.type === 'quantitative')
                            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                            .slice(0, 5)
                            .map((result, idx) => (
                              <div 
                                key={result.id || idx} 
                                className="flex items-center justify-between p-2 rounded-md border bg-card"
                              >
                                <div className="flex items-center gap-3">
                                  <div 
                                    className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-xs
                                      ${result.score / result.maxScore >= 0.7 
                                        ? 'bg-green-500' 
                                        : result.score / result.maxScore >= 0.5 
                                          ? 'bg-yellow-500' 
                                          : 'bg-red-500'}`}
                                  >
                                    {Math.round((result.score / result.maxScore) * 100)}%
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium">
                                      {result.subtype?.replace(/_/g, ' ') || 'Quantitative Practice'}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {new Date(result.createdAt).toLocaleDateString()} • {result.score}/{result.maxScore} correct
                                    </div>
                                  </div>
                                </div>
                                
                                <Badge variant="outline">
                                  {Math.floor(result.timeSpent / 60)}:{(result.timeSpent % 60).toString().padStart(2, '0')}
                                </Badge>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setLocation('/practice?type=quantitative')}
                      className="w-full"
                    >
                      Practice Quantitative Section
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              {/* Vocabulary Section */}
              <TabsContent value="vocabulary">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between">
                      <div>
                        <CardTitle>Vocabulary Section</CardTitle>
                        <CardDescription>
                          Word meaning, usage, and recognition
                        </CardDescription>
                      </div>
                      <div className="p-2 rounded-full bg-blue-100">
                        <BookOpen className="h-5 w-5 text-blue-700" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Overall Score</span>
                        <span className="text-sm font-bold">
                          {summaryStats.scoresBySection.vocabulary.maxScore > 0 
                            ? Math.round((summaryStats.scoresBySection.vocabulary.score / summaryStats.scoresBySection.vocabulary.maxScore) * 100)
                            : 0}%
                        </span>
                      </div>
                      <Progress 
                        value={summaryStats.scoresBySection.vocabulary.maxScore > 0 
                          ? (summaryStats.scoresBySection.vocabulary.score / summaryStats.scoresBySection.vocabulary.maxScore) * 100
                          : 0
                        } 
                        className="h-2" 
                      />
                      <div className="text-xs text-muted-foreground">
                        {summaryStats.scoresBySection.vocabulary.score} correct out of {summaryStats.scoresBySection.vocabulary.maxScore} questions
                      </div>
                    </div>
                    
                    <div className="space-y-4 pt-2">
                      <h4 className="text-sm font-semibold">Vocabulary Progress</h4>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs">Words Learned</span>
                            <span className="text-xs font-medium">325 / 1000</span>
                          </div>
                          <Progress value={32.5} className="h-1.5" />
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs">Words Mastered</span>
                            <span className="text-xs font-medium">215 / 1000</span>
                          </div>
                          <Progress value={21.5} className="h-1.5" />
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs">Bookmarked Words</span>
                            <span className="text-xs font-medium">48 words</span>
                          </div>
                          <Progress value={48} max={200} className="h-1.5" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-2">
                      <h4 className="text-sm font-semibold mb-3">Recent Practice Results</h4>
                      {filteredResults.filter(r => r.type === 'vocabulary').length === 0 ? (
                        <div className="text-center py-4 text-sm text-muted-foreground">
                          No vocabulary practice results yet
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
                          {filteredResults
                            .filter(r => r.type === 'vocabulary')
                            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                            .slice(0, 5)
                            .map((result, idx) => (
                              <div 
                                key={result.id || idx} 
                                className="flex items-center justify-between p-2 rounded-md border bg-card"
                              >
                                <div className="flex items-center gap-3">
                                  <div 
                                    className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-xs
                                      ${result.score / result.maxScore >= 0.7 
                                        ? 'bg-green-500' 
                                        : result.score / result.maxScore >= 0.5 
                                          ? 'bg-yellow-500' 
                                          : 'bg-red-500'}`}
                                  >
                                    {Math.round((result.score / result.maxScore) * 100)}%
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium">
                                      {result.subtype?.replace(/_/g, ' ') || 'Vocabulary Quiz'}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {new Date(result.createdAt).toLocaleDateString()} • {result.score}/{result.maxScore} correct
                                    </div>
                                  </div>
                                </div>
                                
                                <Badge variant="outline">
                                  {Math.floor(result.timeSpent / 60)}:{(result.timeSpent % 60).toString().padStart(2, '0')}
                                </Badge>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setLocation('/vocabulary')}
                      className="flex-1"
                    >
                      <BookMarked className="h-4 w-4 mr-1" />
                      Study Vocabulary
                    </Button>
                    <Button 
                      onClick={() => setLocation('/practice?type=vocabulary')}
                      className="flex-1"
                    >
                      Practice
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
          
          {/* Practice Results Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="mb-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Practice Results History</span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => setLocation('/practice')}
                  >
                    <Target size={14} className="mr-1" />
                    Practice More
                  </Button>
                </CardTitle>
                <CardDescription>
                  Review your recent practice attempts and track your improvement
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredResults.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                      <BookMarked size={20} className="text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-1">No practice results yet</h3>
                    <p className="text-muted-foreground text-sm mb-4">Start practicing to track your progress</p>
                    <Button 
                      variant="outline"
                      onClick={() => setLocation('/practice')}
                      className="gap-2"
                    >
                      <Target size={16} />
                      Start Practice
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Results by section tabs */}
                    <Tabs defaultValue="all" className="w-full">
                      <TabsList className="mb-4">
                        <TabsTrigger value="all">All Results</TabsTrigger>
                        <TabsTrigger value="verbal">Verbal</TabsTrigger>
                        <TabsTrigger value="quantitative">Quantitative</TabsTrigger>
                        <TabsTrigger value="vocabulary">Vocabulary</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="all" className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                        {filteredResults
                          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                          .map((result, idx) => (
                            <div 
                              key={result.id || idx} 
                              className="flex items-center justify-between p-3 rounded-md border bg-card hover:bg-accent/5 transition-colors cursor-pointer" onClick={() => navigateToPracticeResult(result.id)}
                            >
                              <div className="flex items-center gap-3">
                                <div 
                                  className={`h-10 w-10 rounded-full flex items-center justify-center text-white text-xs font-medium
                                    ${result.score / result.maxScore >= 0.7 
                                      ? 'bg-green-500' 
                                      : result.score / result.maxScore >= 0.5 
                                        ? 'bg-yellow-500' 
                                        : 'bg-red-500'}`}
                                >
                                  {Math.round((result.score / result.maxScore) * 100)}%
                                </div>
                                <div>
                                  <div className="text-sm font-medium flex items-center">
                                    {result.type === 'verbal' && <BookOpen size={14} className="text-emerald-500 mr-1" />}
                                    {result.type === 'quantitative' && <Calculator size={14} className="text-purple-500 mr-1" />}
                                    {result.type === 'vocabulary' && <BookMarked size={14} className="text-blue-500 mr-1" />}
                                    {result.practiceSetTitle || `${result.type.charAt(0).toUpperCase() + result.type.slice(1)} Practice`}
                                  </div>
                                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                                    <span>{new Date(result.createdAt).toLocaleDateString()}</span>
                                    <span className="text-xs">•</span>
                                    <span>{result.score}/{result.maxScore} correct</span>
                                    <span className="text-xs">•</span>
                                    <span>{Math.floor(result.timeSpent / 60)}:{(result.timeSpent % 60).toString().padStart(2, '0')}</span>
                                  </div>
                                </div>
                              </div>
                              <Badge variant={result.score / result.maxScore >= 0.7 ? 'secondary' : result.score / result.maxScore >= 0.5 ? 'outline' : 'destructive'}>
                                {result.score / result.maxScore >= 0.7 
                                  ? 'Great' 
                                  : result.score / result.maxScore >= 0.5 
                                    ? 'Good' 
                                    : 'Needs Work'}
                              </Badge>
                            </div>
                          ))}
                      </TabsContent>
                      
                      <TabsContent value="verbal" className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                        {filteredResults.filter(r => r.type === 'verbal').length === 0 ? (
                          <div className="text-center py-4 text-sm text-muted-foreground">
                            No verbal practice results yet
                          </div>
                        ) : (
                          filteredResults
                            .filter(r => r.type === 'verbal')
                            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                            .map((result, idx) => (
                              <div 
                                key={result.id || idx} 
                                className="flex items-center justify-between p-3 rounded-md border bg-card hover:bg-accent/5 transition-colors cursor-pointer" onClick={() => navigateToPracticeResult(result.id)}
                              >
                                <div className="flex items-center gap-3">
                                  <div 
                                    className={`h-10 w-10 rounded-full flex items-center justify-center text-white text-xs font-medium
                                      ${result.score / result.maxScore >= 0.7 
                                        ? 'bg-green-500' 
                                        : result.score / result.maxScore >= 0.5 
                                          ? 'bg-yellow-500' 
                                          : 'bg-red-500'}`}
                                  >
                                    {Math.round((result.score / result.maxScore) * 100)}%
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium">
                                      {result.practiceSetTitle || 'Verbal Practice'}
                                    </div>
                                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                                      <span>{new Date(result.createdAt).toLocaleDateString()}</span>
                                      <span className="text-xs">•</span>
                                      <span>{result.score}/{result.maxScore} correct</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-xs">
                                  {Math.floor(result.timeSpent / 60)}:{(result.timeSpent % 60).toString().padStart(2, '0')}
                                </div>
                              </div>
                            ))
                        )}
                      </TabsContent>
                      
                      <TabsContent value="quantitative" className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                        {filteredResults.filter(r => r.type === 'quantitative').length === 0 ? (
                          <div className="text-center py-4 text-sm text-muted-foreground">
                            No quantitative practice results yet
                          </div>
                        ) : (
                          filteredResults
                            .filter(r => r.type === 'quantitative')
                            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                            .map((result, idx) => (
                              <div 
                                key={result.id || idx} 
                                className="flex items-center justify-between p-3 rounded-md border bg-card hover:bg-accent/5 transition-colors cursor-pointer" onClick={() => navigateToPracticeResult(result.id)}
                              >
                                <div className="flex items-center gap-3">
                                  <div 
                                    className={`h-10 w-10 rounded-full flex items-center justify-center text-white text-xs font-medium
                                      ${result.score / result.maxScore >= 0.7 
                                        ? 'bg-green-500' 
                                        : result.score / result.maxScore >= 0.5 
                                          ? 'bg-yellow-500' 
                                          : 'bg-red-500'}`}
                                  >
                                    {Math.round((result.score / result.maxScore) * 100)}%
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium">
                                      {result.practiceSetTitle || 'Quantitative Practice'}
                                    </div>
                                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                                      <span>{new Date(result.createdAt).toLocaleDateString()}</span>
                                      <span className="text-xs">•</span>
                                      <span>{result.score}/{result.maxScore} correct</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-xs">
                                  {Math.floor(result.timeSpent / 60)}:{(result.timeSpent % 60).toString().padStart(2, '0')}
                                </div>
                              </div>
                            ))
                        )}
                      </TabsContent>
                      
                      <TabsContent value="vocabulary" className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                        {filteredResults.filter(r => r.type === 'vocabulary').length === 0 ? (
                          <div className="text-center py-4 text-sm text-muted-foreground">
                            No vocabulary practice results yet
                          </div>
                        ) : (
                          filteredResults
                            .filter(r => r.type === 'vocabulary')
                            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                            .map((result, idx) => (
                              <div 
                                key={result.id || idx} 
                                className="flex items-center justify-between p-3 rounded-md border bg-card hover:bg-accent/5 transition-colors cursor-pointer" onClick={() => navigateToPracticeResult(result.id)}
                              >
                                <div className="flex items-center gap-3">
                                  <div 
                                    className={`h-10 w-10 rounded-full flex items-center justify-center text-white text-xs font-medium
                                      ${result.score / result.maxScore >= 0.7 
                                        ? 'bg-green-500' 
                                        : result.score / result.maxScore >= 0.5 
                                          ? 'bg-yellow-500' 
                                          : 'bg-red-500'}`}
                                  >
                                    {Math.round((result.score / result.maxScore) * 100)}%
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium">
                                      {result.practiceSetTitle || 'Vocabulary Practice'}
                                    </div>
                                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                                      <span>{new Date(result.createdAt).toLocaleDateString()}</span>
                                      <span className="text-xs">•</span>
                                      <span>{result.score}/{result.maxScore} correct</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-xs">
                                  {Math.floor(result.timeSpent / 60)}:{(result.timeSpent % 60).toString().padStart(2, '0')}
                                </div>
                              </div>
                            ))
                        )}
                      </TabsContent>
                    </Tabs>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
          
          {/* Activity Feed */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Activity Monitor</span>
                  <div className="flex gap-1">
                    <Button 
                      variant={selectedSection === null ? "default" : "outline"} 
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => setSelectedSection(null)}
                    >
                      All
                    </Button>
                    <Button 
                      variant={selectedSection === "vocabulary" ? "default" : "outline"}
                      size="sm"
                      className={`h-8 text-xs ${selectedSection === "vocabulary" ? "" : "text-blue-600"}`}
                      onClick={() => setSelectedSection(selectedSection === "vocabulary" ? null : "vocabulary")}
                    >
                      <BookOpen className="h-3.5 w-3.5 mr-1" />
                      Vocab
                    </Button>
                    <Button 
                      variant={selectedSection === "verbal" ? "default" : "outline"}
                      size="sm"
                      className={`h-8 text-xs ${selectedSection === "verbal" ? "" : "text-purple-600"}`}
                      onClick={() => setSelectedSection(selectedSection === "verbal" ? null : "verbal")}
                    >
                      <Brain className="h-3.5 w-3.5 mr-1" />
                      Verbal
                    </Button>
                    <Button 
                      variant={selectedSection === "quant" ? "default" : "outline"}
                      size="sm"
                      className={`h-8 text-xs ${selectedSection === "quant" ? "" : "text-emerald-600"}`}
                      onClick={() => setSelectedSection(selectedSection === "quant" ? null : "quant")}
                    >
                      <Calculator className="h-3.5 w-3.5 mr-1" />
                      Quant
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>
                  Track all your learning activities and monitor progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {filteredActivities.length === 0 && (
                    <div className="text-center py-8">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                        <Activity className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold mb-1">No activities found</h3>
                      <p className="text-muted-foreground mb-4">
                        Try selecting a different time range or filter
                      </p>
                      <Button 
                        variant="outline" 
                        onClick={() => setTimeRange("30")}
                        className="mx-auto"
                      >
                        View Last 30 Days
                      </Button>
                    </div>
                  )}
                  
                  {/* Group activities by date */}
                  {Object.entries(groupByDate(filteredActivities, 'createdAt'))
                    .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
                    .map(([date, dateActivities]) => (
                      <div key={date}>
                        <div className="flex items-center mb-2">
                          <div className="bg-muted h-px flex-grow mr-3"></div>
                          <span className="text-sm font-medium">
                            {new Date(date).toLocaleDateString('en-US', { 
                              weekday: 'short',
                              month: 'short', 
                              day: 'numeric'
                            })}
                          </span>
                          <div className="bg-muted h-px flex-grow ml-3"></div>
                        </div>
                        
                        <div className="space-y-3">
                          {dateActivities.map((activity, idx) => {
                            // Determine the section
                            let section = "vocabulary";
                            if (activity.type.includes("verbal")) section = "verbal";
                            if (activity.type.includes("quant")) section = "quantitative";
                            
                            // Get section config
                            const sectionConfig = ACTIVITY_SECTIONS[section as keyof typeof ACTIVITY_SECTIONS];
                            
                            // Format the time
                            const time = new Date(activity.createdAt).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            });
                            
                            // Format activity details
                            let details = "";
                            let icon;
                            
                            if (activity.type === "practice_completed") {
                              const practiceDetails = activity.details as any;
                              details = `Completed ${practiceDetails?.type || 'practice'} with score ${practiceDetails?.score || 0}/${practiceDetails?.maxScore || 0}`;
                              
                              const scorePercentage = practiceDetails?.maxScore 
                                ? (practiceDetails.score / practiceDetails.maxScore) * 100 
                                : 0;
                                
                              if (scorePercentage >= 80) {
                                icon = <Award className="h-5 w-5 text-yellow-500" />;
                              } else if (scorePercentage >= 60) {
                                icon = <CheckCircle2 className="h-5 w-5 text-green-500" />;
                              } else {
                                icon = <X className="h-5 w-5 text-red-500" />;
                              }
                            } else if (activity.type === "bookmark_add") {
                              details = "Bookmarked a vocabulary word";
                              icon = <BookMarked className="h-5 w-5 text-blue-500" />;
                            } else if (activity.type === "bookmark_remove") {
                              details = "Removed bookmark from vocabulary word";
                              icon = <BookMarked className="h-5 w-5 text-gray-400" />;
                            } else if (activity.type === "word_learned") {
                              details = "Learned a new vocabulary word";
                              icon = <Sparkles className="h-5 w-5 text-blue-500" />;
                            } else if (activity.type === "topic_completed") {
                              details = `Completed a ${section} topic`;
                              icon = <CheckCircle2 className="h-5 w-5 text-green-500" />;
                            } else {
                              details = activity.type.replace(/_/g, ' ');
                              icon = sectionConfig.icon;
                            }
                            
                            return (
                              <div key={`${activity.id}-${idx}`} className="flex items-start">
                                <div className="relative mr-4">
                                  <div className={`h-9 w-9 rounded-full flex items-center justify-center ${sectionConfig.lightColor}`}>
                                    {icon || sectionConfig.icon}
                                  </div>
                                  {idx < dateActivities.length - 1 && (
                                    <div className="absolute top-9 bottom-0 left-1/2 w-px -ml-px bg-gray-200 h-7"></div>
                                  )}
                                </div>
                                
                                <div className="flex-1 pt-1">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="text-sm font-medium">{details}</p>
                                      <p className="text-xs text-muted-foreground">{time}</p>
                                    </div>
                                    
                                    <Badge variant="outline" className="text-xs">
                                      {sectionConfig.title}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
              <CardFooter className="border-t bg-muted/50 rounded-b-lg justify-between">
                <div className="text-xs text-muted-foreground">
                  Showing {filteredActivities.length} activities
                </div>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setTimeRange(
                    timeRange === "7" ? "14" : 
                    timeRange === "14" ? "30" : 
                    timeRange === "30" ? "90" : "7"
                  )}
                  className="text-xs"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                  {timeRange === "7" ? "View 14 days" :
                   timeRange === "14" ? "View 30 days" :
                   timeRange === "30" ? "View 90 days" : "View 7 days"}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default InteractiveDashboard;