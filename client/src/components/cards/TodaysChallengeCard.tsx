import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Word } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { useIsMobile } from "@/hooks/use-mobile";
import { CalendarDays, Zap, ChevronRight, Flame, Play } from "lucide-react";

interface TodaysChallengeCardProps {
  user: User;
}

const TodaysChallengeCard = ({ user }: TodaysChallengeCardProps) => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const { data: words, isLoading } = useQuery<Word[]>({
    queryKey: [`/api/words?day=${user.currentDay}`],
  });
  
  const handleStartLearning = () => {
    setLocation("/learn");
  };

  return (
    <Card className="shadow-lg overflow-hidden border-0 transition-all hover:shadow-xl relative h-full">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br opacity-10 from-amber-500/30 to-orange-500/5" />
      
      <CardHeader className="pb-2 relative">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100">Today's Challenge</CardTitle>
            <CardDescription>Daily vocabulary building</CardDescription>
          </div>
          <div className="h-10 w-10 bg-amber-500/10 rounded-full flex items-center justify-center">
            <Flame className="h-5 w-5 text-amber-600" />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="relative z-10 flex flex-col h-[calc(100%-70px)]">
        <div className="bg-white/90 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg shadow-sm p-4 mb-4 border border-amber-500/20">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-amber-500/20 p-1.5 rounded-full">
              <Zap className="h-4 w-4 text-amber-600" />
            </div>
            <div className="text-amber-600 dark:text-amber-400 font-semibold text-sm sm:text-base">
              Day {user.currentDay} Challenge
            </div>
          </div>
          <div className="text-gray-800 dark:text-gray-200 font-bold flex items-center">
            <span className="relative sm:text-base md:text-lg">
              30 new words to master
              {words && words.length > 0 && (
                <span className="absolute -top-1 -right-6 bg-amber-500 text-white text-xs font-medium px-1.5 py-0.5 rounded-full">
                  {words.length}
                </span>
              )}
            </span>
          </div>
        </div>
        
        <div className="mb-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base font-medium">Today's vocabulary:</p>
            </div>
            {isMobile && words && words.length > 0 && (
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">{words.length} words</span>
            )}
            {!isMobile && words && words.length > 0 && (
              <span className="text-sm text-amber-600 dark:text-amber-400 font-medium">{words.length} words</span>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {isLoading ? (
              <div className="w-full flex items-center justify-center py-3">
                <div className="animate-pulse flex space-x-2">
                  <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </div>
            ) : words && words.length > 0 ? (
              <>
                {words.slice(0, isMobile ? 3 : 4).map((word) => (
                  <span key={word.id} 
                    className="inline-block px-3 py-1.5 bg-white/90 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm 
                      border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs sm:text-sm font-medium rounded-full
                      transition-all hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:shadow"
                  >
                    {word.word}
                  </span>
                ))}
                {words.length > (isMobile ? 3 : 4) && (
                  <span className="inline-flex items-center px-3 py-1.5 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400
                    text-xs sm:text-sm font-medium rounded-full shadow-sm border border-gray-100 dark:border-gray-700
                    transition-all hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    +{words.length - (isMobile ? 3 : 4)} more
                  </span>
                )}
              </>
            ) : (
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">No words available for today</p>
            )}
          </div>
        </div>
        
        <div className="mt-4">
          <Button 
            onClick={handleStartLearning}
            className="w-full h-12 text-white shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-amber-600 to-amber-500 rounded-lg"
          >
            <Play className="h-4 w-4 fill-current mr-2" />
            Start Learning
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
        
        {/* Enhanced decorative elements */}
        <div className="absolute top-1/4 right-6 w-20 h-20 rounded-full bg-gradient-to-r from-amber-400/5 to-orange-600/5 blur-2xl -z-10"></div>
        <div className="absolute bottom-1/4 left-8 w-32 h-32 rounded-full bg-gradient-to-r from-amber-400/5 to-orange-300/5 blur-2xl -z-10"></div>
        <div className="absolute top-1/3 right-1/3 w-16 h-16 rounded-full bg-amber-400/5 blur-xl -z-10"></div>
      </CardContent>
    </Card>
  );
};

export default TodaysChallengeCard;
