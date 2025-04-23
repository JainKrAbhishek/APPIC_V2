import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal, Award, Clock } from "lucide-react";

interface ProgressTrackerProps {
  total: number;
  completed: number;
  categoryTitle: string;
  categoryColor: string;
}

const ProgressTracker = ({ total, completed, categoryTitle, categoryColor }: ProgressTrackerProps) => {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  // Determine the icon and message based on percentage
  let icon = <Clock className="h-4 w-4" />;
  let statusMessage = "Just getting started";
  
  if (percentage >= 100) {
    icon = <Trophy className="h-4 w-4" />;
    statusMessage = "Completed! Great job!";
  } else if (percentage >= 75) {
    icon = <Award className="h-4 w-4" />;
    statusMessage = "Almost there!";
  } else if (percentage >= 50) {
    icon = <Medal className="h-4 w-4" />;
    statusMessage = "Halfway there!";
  } else if (percentage >= 25) {
    icon = <Medal className="h-4 w-4" />;
    statusMessage = "Good progress!";
  }

  return (
    <Card className="shadow-md border-0">
      <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 rounded-t-lg">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
              <path d="M12 20v-6"></path>
              <path d="M12 14l-2-2 2-2 2 2-2 2Z"></path>
              <path d="M12 14l-2-2 2-2 2 2-2 2Z" transform="rotate(45 12 12)"></path>
              <path d="M12 14l-2-2 2-2 2 2-2 2Z" transform="rotate(90 12 12)"></path>
              <path d="M12 14l-2-2 2-2 2 2-2 2Z" transform="rotate(135 12 12)"></path>
            </svg>
            <CardTitle className="text-base sm:text-lg">Your Progress</CardTitle>
          </div>
          <Badge 
            className="px-2.5 text-xs font-medium py-1 rounded-md shadow-sm" 
            style={{ 
              backgroundColor: `${categoryColor}22`, // Using hex alpha for transparency
              color: categoryColor,
              border: `1px solid ${categoryColor}44`
            }}
          >
            {categoryTitle}
          </Badge>
        </div>
        <CardDescription className="text-xs sm:text-sm font-medium opacity-90">Track your learning progress</CardDescription>
      </CardHeader>
      <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6 pt-4">
        <div className="space-y-3 sm:space-y-4">
          <div className="flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{percentage}%</span>
              <div className="flex items-center text-xs">
                <span className="text-muted-foreground mr-1">
                  {completed} of {total} topics
                </span>
                <div className="bg-primary/10 text-primary rounded-md py-0.5 px-1.5 font-medium ml-2 flex items-center">
                  {icon}
                  <span className="ml-1">{statusMessage}</span>
                </div>
              </div>
            </div>
            <div className="relative h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full rounded-full transition-all duration-500 ease-out"
                style={{ 
                  width: `${percentage}%`, 
                  backgroundColor: categoryColor,
                  backgroundImage: `linear-gradient(90deg, ${categoryColor}bb, ${categoryColor})`,
                  boxShadow: `0 0 8px ${categoryColor}88`
                }}
              />
              <div className="absolute top-0 left-0 h-full w-full flex justify-end items-center pr-2">
                {percentage > 0 && percentage < 10 && (
                  <span className="h-2 w-2 bg-white rounded-full shadow-sm"></span>
                )}
              </div>
            </div>
          </div>
          
          {/* Achievement milestones */}
          {total > 0 && (
            <>
              {/* Mobile version - simplified for small screens */}
              <div className="grid grid-cols-4 gap-1 pt-1 sm:hidden">
                <div className={`text-center ${percentage >= 25 ? 'text-primary' : 'text-muted-foreground'}`}>
                  <div className={`mx-auto w-5 h-5 rounded-full flex items-center justify-center text-2xs ${percentage >= 25 ? 'bg-primary/10 border border-primary/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
                    25
                  </div>
                </div>
                <div className={`text-center ${percentage >= 50 ? 'text-primary' : 'text-muted-foreground'}`}>
                  <div className={`mx-auto w-5 h-5 rounded-full flex items-center justify-center text-2xs ${percentage >= 50 ? 'bg-primary/10 border border-primary/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
                    50
                  </div>
                </div>
                <div className={`text-center ${percentage >= 75 ? 'text-primary' : 'text-muted-foreground'}`}>
                  <div className={`mx-auto w-5 h-5 rounded-full flex items-center justify-center text-2xs ${percentage >= 75 ? 'bg-primary/10 border border-primary/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
                    75
                  </div>
                </div>
                <div className={`text-center ${percentage >= 100 ? 'text-primary' : 'text-muted-foreground'}`}>
                  <div className={`mx-auto w-5 h-5 rounded-full flex items-center justify-center text-2xs ${percentage >= 100 ? 'bg-primary/10 border border-primary/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
                    100
                  </div>
                </div>
              </div>
              
              {/* Desktop version - more detailed for larger screens */}
              <div className="hidden sm:grid grid-cols-4 gap-1 pt-1">
                <div className={`text-center ${percentage >= 25 ? 'text-primary' : 'text-muted-foreground'}`}>
                  <div className={`mx-auto w-6 h-6 rounded-full flex items-center justify-center text-xs ${percentage >= 25 ? 'bg-primary/10 border border-primary/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
                    25%
                  </div>
                </div>
                <div className={`text-center ${percentage >= 50 ? 'text-primary' : 'text-muted-foreground'}`}>
                  <div className={`mx-auto w-6 h-6 rounded-full flex items-center justify-center text-xs ${percentage >= 50 ? 'bg-primary/10 border border-primary/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
                    50%
                  </div>
                </div>
                <div className={`text-center ${percentage >= 75 ? 'text-primary' : 'text-muted-foreground'}`}>
                  <div className={`mx-auto w-6 h-6 rounded-full flex items-center justify-center text-xs ${percentage >= 75 ? 'bg-primary/10 border border-primary/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
                    75%
                  </div>
                </div>
                <div className={`text-center ${percentage >= 100 ? 'text-primary' : 'text-muted-foreground'}`}>
                  <div className={`mx-auto w-6 h-6 rounded-full flex items-center justify-center text-xs ${percentage >= 100 ? 'bg-primary/10 border border-primary/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
                    100%
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgressTracker;