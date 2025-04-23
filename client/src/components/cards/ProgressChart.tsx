import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";
import { Calendar, BarChart3, Activity } from "lucide-react";

interface ProgressChartProps {
  data: {
    wordsLearned: number;
    practiceQuestions: number;
    timeSpent: number; // in hours
  };
}

const ProgressChart = ({ data }: ProgressChartProps) => {
  const [timeRange, setTimeRange] = useState("7");
  const isMobile = useIsMobile();
  
  // Mock data for the chart
  const chartData = [
    { day: "Mon", percentage: 80 },
    { day: "Tue", percentage: 95 },
    { day: "Wed", percentage: 60 },
    { day: "Thu", percentage: 75 },
    { day: "Fri", percentage: 85 },
    { day: "Sat", percentage: 50 },
    { day: "Sun", percentage: 70 },
  ];

  return (
    <Card className="shadow-sm border-0">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <CardTitle className="text-lg font-semibold">Your Learning Progress</CardTitle>
          <Select defaultValue={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-white rounded-lg p-4 md:p-6 mb-4 shadow-sm">
          <h3 className="text-base md:text-lg font-medium mb-3 md:mb-4 flex items-center">
            <Activity size={18} className="text-primary mr-2" />
            Vocabulary Acquisition
          </h3>
          
          <div className="h-52 md:h-64 bg-gray-50 rounded flex items-center justify-center mb-4">
            <div className="w-full px-2 md:px-6">
              <div className="flex items-end justify-between h-36 md:h-40 space-x-1 md:space-x-2">
                {chartData.map((day, index) => (
                  <div key={index} className="flex flex-col items-center w-full">
                    <div 
                      className="bg-gradient-to-t from-primary to-primary/80 rounded-t w-full transition-all duration-500 ease-in-out shadow-sm" 
                      style={{ height: `${day.percentage}%` }}
                    ></div>
                    <span className="text-xs mt-2 text-gray-500">{isMobile && index % 2 !== 0 ? "" : day.day}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 md:gap-4 text-center">
            <div className="bg-primary/10 rounded-lg p-2 md:p-3 flex flex-col items-center justify-center">
              <p className="text-xs md:text-sm text-gray-600 mb-1">Words Learned</p>
              <p className="text-xl md:text-2xl font-bold text-primary">{data.wordsLearned}</p>
            </div>
            <div className="bg-[#4CAF50]/10 rounded-lg p-2 md:p-3 flex flex-col items-center justify-center">
              <p className="text-xs md:text-sm text-gray-600 mb-1">Practice Questions</p>
              <p className="text-xl md:text-2xl font-bold text-[#4CAF50]">{data.practiceQuestions}</p>
            </div>
            <div className="bg-[#FF9800]/10 rounded-lg p-2 md:p-3 flex flex-col items-center justify-center">
              <p className="text-xs md:text-sm text-gray-600 mb-1">Time Spent</p>
              <p className="text-xl md:text-2xl font-bold text-[#FF9800]">{data.timeSpent}h</p>
            </div>
          </div>
        </div>
        
        {/* Mobile motivational tip */}
        {isMobile && (
          <div className="bg-primary/5 rounded-lg p-3 border border-primary/20 text-sm text-gray-700 flex items-start gap-3">
            <div className="bg-primary/20 rounded-full p-1.5 text-primary flex-shrink-0 mt-0.5">
              <BarChart3 size={16} />
            </div>
            <div>
              <div className="font-medium text-gray-800 mb-1">Keep going!</div>
              <p className="text-xs leading-relaxed">
                Your learning consistency puts you ahead of 78% of GRE students. 
                Try to complete at least 20 practice questions today.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProgressChart;
