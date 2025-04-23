import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProgressCard from "@/components/cards/ProgressCard";
import TodaysChallengeCard from "@/components/cards/TodaysChallengeCard";
import { PracticeCard, PracticeSectionCard } from "@/features/practice/components";
import ProgressChart from "@/components/cards/ProgressChart";
import SectionPerformanceCard from "@/components/cards/SectionPerformanceCard";
import RecentActivityCard from "@/components/cards/RecentActivityCard";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { BarChart3, ChevronRight, LineChart, FileText, Book, PenLine } from "lucide-react";
import { Link, useLocation } from "wouter";

interface DashboardProps {
  user: User;
}

const Dashboard = ({ user }: DashboardProps) => {
  const isMobile = useIsMobile();
  const [, setLocation] = useLocation();

  const progressData = {
    wordsLearned: user.wordsLearned || 0,
    practiceQuestions: (user.practiceCompleted || 0) * 10,
    timeSpent: Math.floor((user.timeSpent || 0) / 60)
  };

  const performanceData = {
    verbal: 82,
    vocabulary: 76,
    quantitative: 68
  };

  const practiceSections = [
    {
      title: "Verbal Reasoning",
      description: "Practice reading comprehension, text completion, and sentence equivalence questions.",
      practiceSets: 42,
      type: "verbal",
      imageUrl: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
      link: "/verbal"
    },
    {
      title: "Vocabulary Practice",
      description: "Test your knowledge of synonyms, antonyms, and contextual word usage.",
      practiceSets: 68,
      type: "vocabulary",
      imageUrl: "https://images.unsplash.com/photo-1519682577862-22b62b24e493?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
      link: "/vocabulary"
    },
    {
      title: "Quantitative Reasoning",
      description: "Practice arithmetic, algebra, geometry, and data analysis questions.",
      practiceSets: 56,
      type: "quantitative",
      imageUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
      link: "/quantitative"
    },
    {
      title: "Analytical Writing",
      description: "Practice your essay writing with issue and argument tasks. Get AI-powered feedback on your writing.",
      practiceSets: 18,
      type: "essay",
      imageUrl: "https://images.unsplash.com/photo-1455390582262-044cdead277a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
      link: "/essays"
    }
  ];

  return (
    <DashboardLayout title={`Welcome back, ${user.firstName}`} user={user}>
      {/* Interactive Dashboard Button */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h2 className="text-xl md:text-2xl font-bold">Overview</h2>
        <Button 
          variant="outline"
          className="mt-2 md:mt-0" 
          onClick={() => setLocation('/dashboard/interactive')}
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          Interactive Dashboard
        </Button>
      </div>

      {/* Top Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
        <div className="md:col-span-1 h-full">
          <div className="h-full">
            <ProgressCard user={user} />
          </div>
        </div>
        <div className="md:col-span-1 h-full">
          <div className="h-full">
            <TodaysChallengeCard user={user} />
          </div>
        </div>
        <div className="md:col-span-1 h-full">
          <div className="h-full">
            <PracticeCard />
          </div>
        </div>
      </div>

      {/* Mobile-optimized Practice Sections - Horizontal Scroll on Mobile */}
      <section className="mt-8 md:mt-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl md:text-2xl font-bold">Practice Sections</h2>
          {isMobile && (
            <Link href="/practice">
              <div className="flex items-center text-primary text-sm font-medium">
                <span>View all</span>
                <ChevronRight size={16} />
              </div>
            </Link>
          )}
        </div>

        {isMobile ? (
          <ScrollArea className="w-full pb-4">
            <div className="flex space-x-4 pb-4 px-0.5">
              {practiceSections.map((section, index) => (
                <div key={index} className="min-w-[270px] flex-shrink-0">
                  <PracticeSectionCard 
                    title={section.title} 
                    description={section.description}
                    practiceSets={section.practiceSets}
                    type={section.type as "verbal" | "vocabulary" | "quantitative" | "essay"}
                    imageUrl={section.imageUrl}
                  />
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {practiceSections.map((section, index) => (
              <div key={index} className="h-full">
                <PracticeSectionCard 
                  title={section.title} 
                  description={section.description}
                  practiceSets={section.practiceSets}
                  type={section.type as "verbal" | "vocabulary" | "quantitative" | "essay"}
                  imageUrl={section.imageUrl}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Statistics Section */}
      <section className="mt-8 md:mt-12 bg-[#F5F7FA] -mx-4 px-4 py-6 md:py-8 rounded-t-xl md:rounded-xl">
        <h2 className="text-xl md:text-2xl font-bold mb-5 md:mb-6">Your Progress</h2>
        <ProgressChart data={progressData} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-6">
          <SectionPerformanceCard performance={performanceData} />
          <RecentActivityCard />
        </div>
      </section>

      {/* Bottom Spacing for Mobile Navigation */}
      <div className="h-16 md:h-0 mt-4"></div>
    </DashboardLayout>
  );
};

export default Dashboard;