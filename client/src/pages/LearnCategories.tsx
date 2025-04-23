import React from 'react';
import { Link, useLocation } from 'wouter';
import { User } from '@shared/schema';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, BookText, Calculator, Sparkles, ChevronRight, Brain, Trophy, BarChart4 } from 'lucide-react';
import { useThemeLanguage } from '@/hooks/use-theme-language';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface LearnCategoriesProps {
  user: User;
}

const LearnCategories = ({ user }: LearnCategoriesProps) => {
  const { t } = useThemeLanguage();
  const [, setLocation] = useLocation();
  const isMobile = useIsMobile();

  // Learning categories with enhanced styling and details
  const categories = [
    {
      id: 'quantitative',
      title: 'Quantitative Reasoning',
      description: 'Master mathematical concepts, algebra, geometry, and data analysis to excel in the GRE quantitative section.',
      icon: <Calculator className="h-6 w-6 text-blue-500" />,
      bgIcon: <Brain className="absolute right-6 bottom-6 w-24 h-24 text-blue-100/30 -z-10" />,
      gradient: 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40',
      border: 'border-blue-100 dark:border-blue-900/50',
      shadow: 'shadow-blue-200/30 dark:shadow-blue-900/20',
      buttonGradient: 'bg-gradient-to-r from-blue-500 to-indigo-500',
      textColor: 'text-blue-700 dark:text-blue-400',
      highlightColor: 'text-blue-600 dark:text-blue-300',
      path: '/quantitative',
      topics: 25,
      progress: 48,
      badge: 'Essential',
    },
    {
      id: 'verbal',
      title: 'Verbal Reasoning',
      description: 'Develop critical reading comprehension, text analysis, and argument evaluation skills necessary for verbal success.',
      icon: <BookText className="h-6 w-6 text-emerald-500" />,
      bgIcon: <BarChart4 className="absolute right-6 bottom-6 w-24 h-24 text-emerald-100/30 -z-10" />,
      gradient: 'bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/40 dark:to-green-950/40',
      border: 'border-emerald-100 dark:border-emerald-900/50',
      shadow: 'shadow-emerald-200/30 dark:shadow-emerald-900/20',
      buttonGradient: 'bg-gradient-to-r from-emerald-500 to-green-500',
      textColor: 'text-emerald-700 dark:text-emerald-400',
      highlightColor: 'text-emerald-600 dark:text-emerald-300',
      path: '/verbal',
      topics: 18,
      progress: 32,
      badge: 'Recommended',
    },
    {
      id: 'vocabulary',
      title: 'Vocabulary Building',
      description: 'Expand your vocabulary with essential GRE words through our expertly designed flashcards and spaced repetition system.',
      icon: <Sparkles className="h-6 w-6 text-amber-500" />,
      bgIcon: <Trophy className="absolute right-6 bottom-6 w-24 h-24 text-amber-100/30 -z-10" />,
      gradient: 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40',
      border: 'border-amber-100 dark:border-amber-900/50',
      shadow: 'shadow-amber-200/30 dark:shadow-amber-900/20',
      buttonGradient: 'bg-gradient-to-r from-amber-500 to-orange-500',
      textColor: 'text-amber-700 dark:text-amber-400',
      highlightColor: 'text-amber-600 dark:text-amber-300',
      path: '/vocabulary',
      topics: 30,
      progress: 65,
      badge: 'Popular',
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 90,
        damping: 12
      }
    }
  };

  const headerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  return (
    <DashboardLayout title={t('Learning Categories')} user={user}>
      <div className="container mx-auto max-w-6xl pb-16">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={headerVariants}
          className="bg-gradient-to-r from-primary/5 to-primary/10 backdrop-blur-sm p-4 md:p-6 rounded-2xl shadow-lg border border-primary/20 mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-primary/10 p-2 rounded-xl">
              <GraduationCap className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              GRE Learning Paths
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300 md:text-lg max-w-3xl mt-3">
            Choose a specialized learning path tailored to boost your GRE performance. 
            Our comprehensive curriculum is designed to help you master each section with 
            confidence and achieve your target score.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-primary/10 flex items-center gap-3">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                <Brain className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">Interactive Learning</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Engage with dynamic content</p>
              </div>
            </div>
            
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-primary/10 flex items-center gap-3">
              <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg">
                <BarChart4 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">Progress Tracking</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Monitor your improvements</p>
              </div>
            </div>
            
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-primary/10 flex items-center gap-3">
              <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-lg">
                <Trophy className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">Achieve Mastery</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Reach your target score</p>
              </div>
            </div>
          </div>
        </motion.div>

        {isMobile ? (
          <ScrollArea className="pb-16">
            <div className="grid grid-cols-1 gap-6 mb-16 px-0.5">
              {categories.map((category) => (
                <Card
                  key={category.id}
                  className={`relative overflow-hidden shadow-lg hover:shadow-xl transition-all border ${category.border} cursor-pointer ${category.gradient} hover:scale-[1.01]`}
                  onClick={() => setLocation(category.path)}
                >
                  <CardHeader className="pb-2 relative z-10">
                    <div className="flex justify-between items-start">
                      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-2.5 rounded-full shadow-md">
                        {category.icon}
                      </div>
                      <Badge variant="secondary" className={`${category.highlightColor} bg-white/80 dark:bg-gray-800/80 shadow-sm`}>
                        {category.badge}
                      </Badge>
                    </div>
                    <CardTitle className={`text-xl mt-3 font-bold ${category.textColor}`}>
                      {category.title}
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-700 dark:text-gray-300 mt-1.5 line-clamp-2">
                      {category.description}
                    </CardDescription>
                    
                    <div className="flex items-center justify-between mt-4 mb-2">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        {category.topics} topics
                      </span>
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        {category.progress}% complete
                      </span>
                    </div>
                    <Progress value={category.progress} className="h-1.5" />
                  </CardHeader>
                  <CardContent className="pt-2 pb-4 relative z-10">
                    <div className="flex justify-end mt-2">
                      <div className={`${category.buttonGradient} px-4 py-2 rounded-lg text-white text-sm font-medium shadow-sm hover:shadow-md transition-all flex items-center gap-1.5`}>
                        Start Learning
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>
                  </CardContent>
                  {category.bgIcon}
                </Card>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {categories.map((category) => (
              <motion.div key={category.id} variants={itemVariants}>
                <Card
                  className={`relative overflow-hidden ${category.shadow} hover:shadow-xl transition-all border ${category.border} cursor-pointer ${category.gradient} hover:scale-[1.02] h-full`}
                  onClick={() => setLocation(category.path)}
                >
                  <CardHeader className="pb-2 relative z-10">
                    <div className="flex justify-between items-start">
                      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-3 rounded-full shadow-md">
                        {category.icon}
                      </div>
                      <Badge variant="secondary" className={`${category.highlightColor} bg-white/80 dark:bg-gray-800/80 shadow-sm`}>
                        {category.badge}
                      </Badge>
                    </div>
                    <CardTitle className={`text-xl mt-4 font-bold ${category.textColor}`}>
                      {category.title}
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                      {category.description}
                    </CardDescription>
                    
                    <div className="flex items-center justify-between mt-5 mb-2">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        {category.topics} topics
                      </span>
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        {category.progress}% complete
                      </span>
                    </div>
                    <Progress value={category.progress} className="h-1.5" />
                  </CardHeader>
                  <CardContent className="pt-3 pb-5 relative z-10">
                    <div className="flex justify-end mt-3">
                      <div className={`${category.buttonGradient} px-4 py-2.5 rounded-lg text-white text-sm font-medium shadow-sm hover:shadow-md transition-all flex items-center gap-1.5`}>
                        Start Learning
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>
                  </CardContent>
                  {category.bgIcon}
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default LearnCategories;