import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { User } from "@shared/schema";
import { useEffect, useRef } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { PieChart, Book, Trophy, Calendar } from "lucide-react";

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
    <Card className="shadow-lg overflow-hidden border-0 transition-all hover:shadow-xl relative h-full">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br opacity-10 from-purple-600/30 to-indigo-500/5" />
      
      <CardHeader className="pb-2 relative">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-100">Your Progress</CardTitle>
            <CardDescription className="text-sm sm:text-base">GRE Vocabulary Course</CardDescription>
          </div>
          <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
            <PieChart className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="relative z-10 flex flex-col h-[calc(100%-70px)]">
        <div className="flex justify-center my-2">
          <div className="relative h-32 w-32 sm:h-40 sm:w-40 drop-shadow-sm">
            {/* Outer glow effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 blur-xl transform scale-110"></div>
            
            {/* Inner circle with backdrop blur */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[calc(100%-16px)] h-[calc(100%-16px)] rounded-full bg-white/60 dark:bg-gray-900/40 flex items-center justify-center backdrop-blur-sm shadow-inner">
                <div className="w-[calc(100%-12px)] h-[calc(100%-12px)] rounded-full bg-white dark:bg-gray-800 flex items-center justify-center"></div>
              </div>
            </div>
            
            {/* SVG Circle */}
            <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
              <circle 
                className="text-gray-100 dark:text-gray-800" 
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
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#A78BFA" />
                </linearGradient>
              </defs>
            </svg>
            
            {/* Percentage display */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="flex items-center justify-center">
                  <span className="text-2xl sm:text-3xl font-bold text-primary dark:text-purple-400">{percentage}%</span>
                  {percentage >= 50 && (
                    <Trophy className="h-5 w-5 text-amber-500 ml-1 animate-pulse" />
                  )}
                </div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">Complete</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-center space-y-3 mt-auto">
          {isMobile ? (
            <div className="flex justify-between items-center gap-2">
              <div className="bg-white/80 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-100 dark:border-gray-700 p-2 rounded-lg flex-1 flex-col items-center shadow-sm">
                <div className="text-xs text-gray-500 dark:text-gray-400">Current Day</div>
                <div className="text-xl font-bold text-primary dark:text-primary/90">{currentDay}</div>
              </div>
              <div className="bg-white/80 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-100 dark:border-gray-700 p-2 rounded-lg flex-1 flex-col items-center shadow-sm">
                <div className="text-xs text-gray-500 dark:text-gray-400">Total Days</div>
                <div className="text-xl font-bold text-gray-700 dark:text-gray-300">{totalDays}</div>
              </div>
            </div>
          ) : (
            <div className="bg-white/80 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-100 dark:border-gray-700 px-4 py-3 rounded-lg shadow-sm">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Calendar className="h-4 w-4 text-purple-500" />
                <p className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300">Course Progress</p>
              </div>
              <div className="flex justify-center items-center gap-2">
                <span className="text-sm sm:text-base font-semibold text-primary dark:text-primary/90">Day {currentDay}</span>
                <span className="text-xs sm:text-sm text-gray-400 dark:text-gray-500">of</span>
                <span className="text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">{totalDays}</span>
              </div>
            </div>
          )}
          
          <div className="flex justify-center">
            <div className="flex items-center gap-2 bg-white/80 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-100 dark:border-gray-700 px-4 py-2 rounded-full shadow-sm">
              <Book className="h-4 w-4 text-primary" />
              <span className="text-sm sm:text-base font-medium text-primary dark:text-primary/90">
                {user.wordsLearned || 0} <span className="font-normal text-gray-600 dark:text-gray-400 text-sm sm:text-sm">words learned</span>
              </span>
            </div>
          </div>
        </div>
        
        {/* Enhanced decorative elements */}
        <div className="absolute top-1/4 right-6 w-20 h-20 rounded-full bg-gradient-to-r from-purple-400/5 to-indigo-600/5 blur-2xl -z-10"></div>
        <div className="absolute bottom-1/4 left-8 w-32 h-32 rounded-full bg-gradient-to-r from-purple-400/5 to-indigo-300/5 blur-2xl -z-10"></div>
        <div className="absolute top-1/3 right-1/3 w-16 h-16 rounded-full bg-purple-400/5 blur-xl -z-10"></div>
      </CardContent>
    </Card>
  );
};

export default ProgressCard;
