import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import { User, Activity, PracticeResult } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, subDays, isAfter } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";

const Progress = () => {
  const [timeRange, setTimeRange] = useState("7"); // days

  // Fetch user data
  const { data: userData, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

  // Fetch activities
  const { data: activities, isLoading: activitiesLoading } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
  });

  // Fetch practice results
  const { data: practiceResults, isLoading: resultsLoading } = useQuery<PracticeResult[]>({
    queryKey: ["/api/practice-results"],
  });

  // Generate chart data based on activities and timerange
  const generateChartData = () => {
    if (!activities) return [];
    
    const days = parseInt(timeRange);
    const cutoffDate = subDays(new Date(), days);
    
    // Filter activities within time range
    const filteredActivities = activities.filter(activity => 
      isAfter(new Date(activity.createdAt), cutoffDate)
    );
    
    // Group by day
    const groupedByDay = filteredActivities.reduce<Record<string, { words: number, practice: number, date: Date }>>((acc, activity) => {
      const day = format(new Date(activity.createdAt), 'yyyy-MM-dd');
      
      if (!acc[day]) {
        acc[day] = {
          words: 0,
          practice: 0,
          date: new Date(activity.createdAt)
        };
      }
      
      const details = activity.details as any;
      
      if (activity.type === 'vocabulary_completion') {
        acc[day].words += details.wordsCompleted || 0;
      } else if (activity.type === 'practice_completion') {
        acc[day].practice += 1;
      }
      
      return acc;
    }, {});
    
    // Convert to array and sort by date
    return Object.entries(groupedByDay)
      .map(([day, data]) => ({
        day: format(data.date, 'EEE'),
        words: data.words,
        practice: data.practice,
        date: day
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // Get performance metrics
  const getPerformanceMetrics = () => {
    if (!practiceResults) return { verbal: 0, vocabulary: 0, quantitative: 0 };
    
    const byType: Record<string, { score: number, total: number }> = {
      verbal: { score: 0, total: 0 },
      vocabulary: { score: 0, total: 0 },
      quantitative: { score: 0, total: 0 }
    };
    
    // Group results by practice set type
    // In a real app, we'd join with practice sets to get their type
    // For the demo, we'll simulate this
    practiceResults.forEach(result => {
      // Determine type from the result ID for demo purposes
      let type = "verbal";
      if (result.id % 3 === 1) type = "vocabulary";
      if (result.id % 3 === 2) type = "quantitative";
      
      byType[type].score += result.score;
      byType[type].total += result.maxScore;
    });
    
    // Calculate percentages
    const percentages = Object.entries(byType).reduce<Record<string, number>>((acc, [type, data]) => {
      acc[type] = data.total > 0 ? Math.round((data.score / data.total) * 100) : 0;
      return acc;
    }, {});
    
    return {
      verbal: percentages.verbal || 0,
      vocabulary: percentages.vocabulary || 0,
      quantitative: percentages.quantitative || 0
    };
  };

  // Get recent activities
  const getRecentActivities = () => {
    if (!activities) return [];
    
    return activities
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  };

  const chartData = generateChartData();
  const performanceMetrics = getPerformanceMetrics();
  const recentActivities = getRecentActivities();
  
  const isLoading = userLoading || activitiesLoading || resultsLoading;

  if (isLoading) {
    return (
      <DashboardLayout title="Your Learning Progress">
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 rounded-lg mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-48 bg-gray-200 rounded-lg"></div>
            <div className="h-48 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Your Learning Progress">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Progress Overview</h2>
        <Select defaultValue={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 3 months</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <Card className="shadow-sm bg-white mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Vocabulary Acquisition</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="words" 
                  name="Words Learned" 
                  stroke="#2196F3" 
                  activeDot={{ r: 8 }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="practice" 
                  name="Practice Sessions" 
                  stroke="#4CAF50" 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="bg-primary/10 rounded p-3">
              <p className="text-sm text-gray-600">Words Learned</p>
              <p className="text-2xl font-bold text-primary">{userData?.wordsLearned || 0}</p>
            </div>
            <div className="bg-[#4CAF50]/10 rounded p-3">
              <p className="text-sm text-gray-600">Practice Questions</p>
              <p className="text-2xl font-bold text-[#4CAF50]">{userData?.practiceCompleted * 10 || 0}</p>
            </div>
            <div className="bg-[#FF9800]/10 rounded p-3">
              <p className="text-sm text-gray-600">Time Spent</p>
              <p className="text-2xl font-bold text-[#FF9800]">{Math.floor((userData?.timeSpent || 0) / 60)}h</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Section Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    {
                      name: 'Performance',
                      verbal: performanceMetrics.verbal,
                      vocabulary: performanceMetrics.vocabulary,
                      quantitative: performanceMetrics.quantitative
                    }
                  ]}
                  margin={{ top: 20, right: 30, left: 20, bottom: -10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => [`${value}%`]} />
                  <Legend />
                  <Bar dataKey="verbal" name="Verbal Reasoning" fill="#2196F3" />
                  <Bar dataKey="vocabulary" name="Vocabulary" fill="#4CAF50" />
                  <Bar dataKey="quantitative" name="Quantitative" fill="#FF9800" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Verbal Reasoning</span>
                  <span className="font-medium">{performanceMetrics.verbal}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary rounded-full h-2 transition-all duration-500 ease-in-out" 
                    style={{ width: `${performanceMetrics.verbal}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Vocabulary</span>
                  <span className="font-medium">{performanceMetrics.vocabulary}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-[#4CAF50] rounded-full h-2 transition-all duration-500 ease-in-out" 
                    style={{ width: `${performanceMetrics.vocabulary}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Quantitative Reasoning</span>
                  <span className="font-medium">{performanceMetrics.quantitative}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-[#FF9800] rounded-full h-2 transition-all duration-500 ease-in-out" 
                    style={{ width: `${performanceMetrics.quantitative}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity, index) => {
                  const details = activity.details as any;
                  let icon, title, subtitle;
                  
                  if (activity.type === 'vocabulary_completion') {
                    icon = (
                      <div className="bg-primary/10 p-2 rounded-full mr-3">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-primary"
                        >
                          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5z" />
                          <path d="M8 7h6" />
                          <path d="M8 11h8" />
                          <path d="M8 15h6" />
                        </svg>
                      </div>
                    );
                    title = `Completed Vocabulary Day ${details.day}`;
                    subtitle = `${format(new Date(activity.createdAt), 'PPp')} • ${details.wordsCompleted} words`;
                  } else if (activity.type === 'practice_completion') {
                    if (details.type === 'quantitative') {
                      icon = (
                        <div className="bg-[#FF9800]/10 p-2 rounded-full mr-3">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-[#FF9800]"
                          >
                            <rect width="18" height="18" x="3" y="3" rx="2" />
                            <path d="M9 9h.01" />
                            <path d="M9 12h.01" />
                            <path d="M9 15h.01" />
                            <path d="M12 9h.01" />
                            <path d="M12 12h.01" />
                            <path d="M12 15h.01" />
                            <path d="M15 9h.01" />
                            <path d="M15 12h.01" />
                            <path d="M15 15h.01" />
                          </svg>
                        </div>
                      );
                      title = `Quantitative Practice: ${details.subtype?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Data Analysis'}`;
                    } else {
                      icon = (
                        <div className="bg-[#4CAF50]/10 p-2 rounded-full mr-3">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-[#4CAF50]"
                          >
                            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                        </div>
                      );
                      title = `Verbal Practice: ${details.subtype?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Reading Comprehension'}`;
                    }
                    subtitle = `${format(new Date(activity.createdAt), 'PPp')} • Score: ${details.score}/${details.maxScore}`;
                  } else {
                    icon = (
                      <div className="bg-primary/10 p-2 rounded-full mr-3">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-primary"
                        >
                          <path d="M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9Z" />
                          <path d="M7 21h10" />
                          <path d="M12 3V9" />
                          <path d="M3 9h18" />
                        </svg>
                      </div>
                    );
                    title = "Activity completed";
                    subtitle = format(new Date(activity.createdAt), 'PPp');
                  }
                  
                  return (
                    <div key={index} className="flex items-start">
                      {icon}
                      <div>
                        <p className="font-medium">{title}</p>
                        <p className="text-sm text-gray-500">{subtitle}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-gray-500">No recent activities found</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="shadow-sm bg-white mt-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Learning Journey</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative pt-4">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            
            <div className="space-y-6">
              {userData && Array.from({ length: Math.min(userData.currentDay, 5) }, (_, i) => userData.currentDay - i).map((day, index) => (
                <div key={index} className="relative pl-10">
                  <div className="absolute left-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white">
                    {day}
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-1">Day {day}</h4>
                    <p className="text-sm text-gray-600">
                      {index === 0 ? 'Current day' : index === 1 ? 'Completed yesterday' : `Completed ${index} days ago`}
                    </p>
                    <div className="mt-2 flex space-x-2">
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                        30 words
                      </span>
                      <span className="text-xs bg-[#4CAF50]/10 text-[#4CAF50] px-2 py-1 rounded-full">
                        {Math.floor(Math.random() * 3) + 1} practice sets
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              
              {userData && userData.currentDay < 34 && (
                <div className="relative pl-10">
                  <div className="absolute left-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                    {userData.currentDay + 1}
                  </div>
                  <div className="border border-dashed border-gray-300 p-4 rounded-lg">
                    <h4 className="font-medium mb-1">Day {userData.currentDay + 1}</h4>
                    <p className="text-sm text-gray-500">Upcoming - Complete current day to unlock</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default Progress;
