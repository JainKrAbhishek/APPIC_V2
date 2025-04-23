import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "@shared/schema";
import { useEffect, useRef } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { PieChart, Book } from "lucide-react";

interface ProgressCardProps {
  user: User;
}

const ProgressCard = ({ user }: ProgressCardProps) => {
  const progressRef = useRef<SVGCircleElement>(null);
  const isMobile = useIsMobile();
  
  // Calculate progress percentage
  const totalDays = 34;
  const currentDay = user.currentDay || 1;
  const percentage = Math.floor(((currentDay - 1) / totalDays) * 100);
  
  useEffect(() => {
    if (progressRef.current) {
      const circle = progressRef.current;
      const radius = circle.r.baseVal.value;
      const circumference = radius * 2 * Math.PI;
      
      circle.style.strokeDasharray = `${circumference} ${circumference}`;
      const offset = circumference - (percentage / 100 * circumference);
      circle.style.strokeDashoffset = offset.toString();
    }
  }, [percentage]);

  return (
    <Card className="shadow-md overflow-hidden border-none card-hover purple-card h-full">
      <CardHeader className="pb-2 z-10">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold text-gray-800">Your Progress</CardTitle>
          <div className="bg-primary/10 p-1.5 rounded-full">
            <PieChart size={18} className="text-primary" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative z-10 flex flex-col h-[calc(100%-60px)]">
        <div className="flex justify-center my-2">
          <div className="relative h-32 w-32 sm:h-40 sm:w-40">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[calc(100%-16px)] h-[calc(100%-16px)] rounded-full bg-white/80 flex items-center justify-center backdrop-blur-sm shadow-inner">
                <div className="w-[calc(100%-12px)] h-[calc(100%-12px)] rounded-full bg-white flex items-center justify-center"></div>
              </div>
            </div>
            <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
              <circle 
                className="text-gray-100" 
                strokeWidth="12" 
                stroke="currentColor" 
                fill="transparent" 
                r="70" 
                cx="80" 
                cy="80"
              />
              <circle 
                ref={progressRef}
                className="transition-all duration-1000 ease-in-out" 
                strokeWidth="12" 
                strokeLinecap="round"
                stroke="url(#progressGradient)" 
                fill="transparent" 
                r="70" 
                cx="80" 
                cy="80" 
                style={{ 
                  transformOrigin: '50% 50%',
                  strokeDasharray: '440',
                  strokeDashoffset: '440'
                }}
              />
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#8A4FFF" />
                  <stop offset="100%" stopColor="#B388FF" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <span className="text-2xl sm:text-3xl font-bold text-primary drop-shadow-sm">{percentage}%</span>
                <p className="text-xs font-medium text-gray-500 mt-0.5">Complete</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-center space-y-3 mt-auto">
          {isMobile ? (
            <div className="flex justify-between items-center gap-2">
              <div className="bg-white/80 backdrop-blur-sm border border-gray-100 p-2 rounded-lg flex-1 flex-col items-center shadow-sm">
                <div className="text-xs text-gray-500">Current Day</div>
                <div className="text-xl font-bold text-primary">{currentDay}</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm border border-gray-100 p-2 rounded-lg flex-1 flex-col items-center shadow-sm">
                <div className="text-xs text-gray-500">Total Days</div>
                <div className="text-xl font-bold text-gray-700">{totalDays}</div>
              </div>
            </div>
          ) : (
            <div className="bg-white/80 backdrop-blur-sm border border-gray-100 px-4 py-3 rounded-lg inline-flex items-center shadow-sm">
              <div className="text-center w-full">
                <div className="flex justify-center items-center gap-2">
                  <span className="text-sm font-semibold text-gray-700">Day {currentDay}</span>
                  <span className="text-xs text-gray-400">of</span>
                  <span className="text-sm font-semibold text-gray-700">{totalDays}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">34-Day GRE Vocabulary Course</div>
              </div>
            </div>
          )}
          
          <div className="flex justify-center">
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-gray-100 px-4 py-2 rounded-full shadow-sm">
              <Book size={16} className="text-primary" />
              <span className="text-sm font-medium text-primary">
                {user.wordsLearned || 0} <span className="font-normal">words learned</span>
              </span>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-4 right-4 w-12 h-12 rounded-full bg-primary/5 -z-10"></div>
        <div className="absolute bottom-6 left-6 w-16 h-16 rounded-full bg-primary/5 -z-10"></div>
        <div className="absolute top-1/3 left-4 w-6 h-6 rounded-full bg-primary/10 -z-10"></div>
      </CardContent>
    </Card>
  );
};

export default ProgressCard;
