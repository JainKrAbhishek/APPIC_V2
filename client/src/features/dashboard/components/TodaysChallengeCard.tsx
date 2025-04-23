import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Word } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { useIsMobile } from "@/hooks/use-mobile";
import { CalendarDays, Zap } from "lucide-react";

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
    setLocation("/vocabulary");
  };

  return (
    <Card className="shadow-md overflow-hidden border-none card-hover orange-card h-full">
      <CardHeader className="pb-2 z-10">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold text-gray-800">Today's Challenge</CardTitle>
          <div className="bg-[#FF9800]/10 p-1.5 rounded-full">
            <CalendarDays size={18} className="text-[#FF9800]" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative z-10 flex flex-col h-[calc(100%-60px)]">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-sm py-3 px-4 mb-4 border border-[#FF9800]/20">
          <div className="text-[#FF9800] font-semibold text-sm mb-1 flex items-center">
            <Zap size={16} className="mr-1" />
            Day {user.currentDay} Challenge
          </div>
          <div className="text-gray-700 font-bold">30 new words to master</div>
        </div>
        
        <div className="mb-auto">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-700 text-sm font-medium">Today's vocabulary:</p>
            {isMobile && words && words.length > 0 && (
              <span className="text-xs text-primary font-medium">{words.length} words</span>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {isLoading ? (
              <div className="w-full flex items-center justify-center py-3">
                <div className="animate-pulse flex space-x-2">
                  <div className="h-3 w-20 bg-gray-200 rounded"></div>
                  <div className="h-3 w-16 bg-gray-200 rounded"></div>
                  <div className="h-3 w-24 bg-gray-200 rounded"></div>
                </div>
              </div>
            ) : words && words.length > 0 ? (
              <>
                {words.slice(0, isMobile ? 3 : 4).map((word) => (
                  <span key={word.id} 
                    className="inline-block px-3 py-1.5 bg-white/80 backdrop-blur-sm shadow-sm 
                      border border-[#FF9800]/20 text-[#FF9800] text-xs font-medium rounded-full
                      transition-all hover:bg-[#FF9800]/5 hover:border-[#FF9800]/30"
                  >
                    {word.word}
                  </span>
                ))}
                {words.length > (isMobile ? 3 : 4) && (
                  <span className="inline-flex items-center px-3 py-1.5 bg-gray-50 text-gray-600 
                    text-xs font-medium rounded-full shadow-sm border border-gray-100
                    transition-all hover:bg-gray-100"
                  >
                    +{words.length - (isMobile ? 3 : 4)} more
                  </span>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-500">No words available for today</p>
            )}
          </div>
        </div>
        
        <div className="mt-4">
          <Button 
            onClick={handleStartLearning}
            className="w-full h-11 text-white shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-[#FF9800] to-[#FFC107]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2"
            >
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Start Learning
          </Button>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-4 right-6 w-10 h-10 rounded-full bg-[#FF9800]/5 -z-10"></div>
        <div className="absolute bottom-10 left-8 w-14 h-14 rounded-full bg-[#FF9800]/5 -z-10"></div>
        <div className="absolute top-1/2 right-6 w-5 h-5 rounded-full bg-[#FF9800]/10 -z-10"></div>
      </CardContent>
    </Card>
  );
};

export default TodaysChallengeCard;
