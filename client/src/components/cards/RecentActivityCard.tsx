import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { format, isToday, isYesterday } from "date-fns";
import { Activity } from "@shared/schema";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  BookOpen, 
  Calculator, 
  FileText, 
  Clock, 
  BarChart2, 
  ScrollText,
  Trophy,
  History
} from "lucide-react";
import { Link } from "wouter";

const RecentActivityCard = () => {
  const { data: activities, isLoading } = useQuery<Activity[]>({
    queryKey: ["/api/activities?limit=5"],
  });
  const isMobile = useIsMobile();

  const formatDate = (dateStr: string | Date) => {
    const date = new Date(dateStr);
    if (isToday(date)) {
      return isMobile ? 
        `Today, ${format(date, "h:mm a")}` : 
        `Today at ${format(date, "h:mm a")}`;
    } else if (isYesterday(date)) {
      return isMobile ? 
        `Yesterday, ${format(date, "h:mm a")}` : 
        `Yesterday at ${format(date, "h:mm a")}`;
    } else {
      return isMobile ? 
        `${format(date, "d MMM")}` : 
        `${format(date, "d MMM")} at ${format(date, "h:mm a")}`;
    }
  };

  // Helper to capitalize first letter of words in a string
  const capitalizeWords = (str: string): string => {
    return str.replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  const getActivityIcon = (activity: Activity) => {
    const details = activity.details as any;
    
    switch (activity.type) {
      case "vocabulary_completion":
        return (
          <div className="bg-primary/15 p-2 rounded-full mr-3 flex-shrink-0">
            <BookOpen size={isMobile ? 16 : 20} className="text-primary" />
          </div>
        );
      case "practice_completion":
        if (details?.type === "quantitative") {
          return (
            <div className="bg-[#FF9800]/15 p-2 rounded-full mr-3 flex-shrink-0">
              <Calculator size={isMobile ? 16 : 20} className="text-[#FF9800]" />
            </div>
          );
        } else if (details?.type === "verbal") {
          return (
            <div className="bg-[#4CAF50]/15 p-2 rounded-full mr-3 flex-shrink-0">
              <ScrollText size={isMobile ? 16 : 20} className="text-[#4CAF50]" />
            </div>
          );
        } else {
          return (
            <div className="bg-primary/15 p-2 rounded-full mr-3 flex-shrink-0">
              <FileText size={isMobile ? 16 : 20} className="text-primary" />
            </div>
          );
        }
      default:
        return (
          <div className="bg-primary/15 p-2 rounded-full mr-3 flex-shrink-0">
            <Clock size={isMobile ? 16 : 20} className="text-primary" />
          </div>
        );
    }
  };

  const getActivityTitle = (activity: Activity) => {
    const details = activity.details as any;
    switch (activity.type) {
      case "vocabulary_completion":
        return `Completed Vocabulary Day ${details?.day || '1'}`;
      case "practice_completion":
        if (details?.type === "verbal") {
          const subtype = details?.subtype || '';
          return `Verbal: ${capitalizeWords(subtype.replace('_', ' '))}`;
        } else if (details?.type === "quantitative") {
          const subtype = details?.subtype || '';
          return `Quantitative: ${capitalizeWords(subtype.replace('_', ' '))}`;
        } else {
          return `Vocabulary Practice`;
        }
      default:
        return "Activity completed";
    }
  };

  const getActivityDetails = (activity: Activity) => {
    const details = activity.details as any;
    const date = formatDate(activity.createdAt);
    
    switch (activity.type) {
      case "vocabulary_completion":
        return (
          <div className="flex items-center gap-1">
            <span>{date}</span>
            <span className="bg-primary/10 text-primary text-xs px-1.5 py-0.5 rounded-full font-medium">
              {details?.wordsCompleted || '30'} words
            </span>
          </div>
        );
      case "practice_completion":
        const score = details?.score || 0;
        const maxScore = details?.maxScore || 10;
        const percentage = Math.round((score / maxScore) * 100);
        const scoreColor = 
          percentage >= 80 ? 'text-[#4CAF50]' : 
          percentage >= 60 ? 'text-[#FF9800]' : 
          'text-red-500';
          
        return (
          <div className="flex items-center gap-1">
            <span>{date}</span>
            <span className={`bg-gray-100 ${scoreColor} text-xs px-1.5 py-0.5 rounded-full font-medium`}>
              {score}/{maxScore}
            </span>
          </div>
        );
      default:
        return date;
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-sm border-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center">
            <History size={18} className="mr-2 text-primary" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="h-10 w-10 bg-gray-100 animate-pulse rounded-full flex-shrink-0"></div>
                <div className="space-y-2 flex-grow">
                  <div className="h-4 bg-gray-100 animate-pulse rounded w-3/4"></div>
                  <div className="h-3 bg-gray-100 animate-pulse rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center">
          <History size={18} className="mr-2 text-primary" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities && activities.length > 0 ? (
            activities.slice(0, isMobile ? 3 : 4).map((activity, index) => (
              <div key={index} className="flex items-start py-1 border-b border-gray-100 last:border-0">
                {getActivityIcon(activity)}
                <div className="min-w-0">
                  <p className="font-medium text-sm line-clamp-1">{getActivityTitle(activity)}</p>
                  <div className="text-sm text-gray-500">{getActivityDetails(activity)}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6">
              <div className="inline-flex p-3 bg-gray-50 rounded-full mb-3">
                <Trophy className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">Complete activities to see your progress here!</p>
            </div>
          )}
        </div>
        
        <Link href="/progress">
          <Button 
            variant="outline"
            className="w-full mt-4 text-primary hover:bg-primary/5 border-primary/20"
          >
            <BarChart2 size={16} className="mr-2" />
            View All Activity
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};

export default RecentActivityCard;
