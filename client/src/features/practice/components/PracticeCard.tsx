import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sparkles, Brain, Sigma, BookOpen, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const PracticeCard = () => {
  const [, setLocation] = useLocation();
  const isMobile = useIsMobile();
  
  const handleStartPractice = () => {
    setLocation("/practice");
  };

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: (custom: number) => ({
      opacity: 1,
      x: 0,
      transition: { 
        delay: 0.2 + (custom * 0.1),
        duration: 0.3
      }
    })
  };

  const buttonVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        delay: 0.5,
        duration: 0.3,
        type: "spring",
        stiffness: 200
      }
    },
    hover: { 
      scale: 1.03,
      boxShadow: "0 10px 25px -5px rgba(76, 175, 80, 0.4)",
      transition: { duration: 0.2 }
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={cardVariants}
    >
      <Card className="shadow-md overflow-hidden border-none h-full bg-white dark:bg-gray-800 relative">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-white to-green-50/30 dark:from-green-900/20 dark:via-gray-800 dark:to-green-900/10 z-0"></div>
        
        {/* Card header with title */}
        <CardHeader className="pb-2 z-10 relative">
          <div className="flex justify-between items-start">
            <motion.div variants={itemVariants} custom={0}>
              <CardTitle className="text-base md:text-lg font-semibold text-gray-800 dark:text-gray-100">
                Recommended Practice
              </CardTitle>
            </motion.div>
            <motion.div 
              variants={itemVariants}
              custom={1}
              className="bg-green-500/10 dark:bg-green-500/20 p-1.5 rounded-full"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-green-500 dark:text-green-400"
              >
                <path d="M6 12a6 6 0 0 0 12 0 6 6 0 0 0-12 0Z" />
                <path d="m6 20 .7-.7A4 4 0 0 1 9.5 18h5a4 4 0 0 1 2.8 1.3l.7.7" />
                <path d="m2 16 .6-.6a2 2 0 0 1 2.8 0L6 16" />
                <path d="m18 16 .6-.6a2 2 0 0 1 2.8 0l.6.6" />
                <path d="M12 16v-2" />
                <path d="m10 9 2 2 2-2" />
              </svg>
            </motion.div>
          </div>
        </CardHeader>
        
        <CardContent className="relative z-10 flex flex-col h-[calc(100%-60px)]">
          <motion.div 
            variants={itemVariants}
            custom={2}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-3 md:p-4 mb-4 border border-green-500/20 dark:border-green-500/10 shadow-sm"
          >
            <p className="text-green-500 dark:text-green-400 font-semibold text-xs md:text-sm mb-2">
              {isMobile ? "Recommended for you:" : "Practice sections for you:"}
            </p>
            
            {isMobile ? (
              <div className="flex flex-wrap gap-2">
                <motion.div 
                  variants={itemVariants}
                  custom={3}
                  className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-medium"
                >
                  <Brain className="w-3 h-3 mr-1.5" />
                  Reading Comprehension
                </motion.div>
                <motion.div 
                  variants={itemVariants}
                  custom={4}
                  className="inline-flex items-center px-2.5 py-1 rounded-full bg-green-500/10 dark:bg-green-500/20 text-green-600 dark:text-green-400 text-xs font-medium"
                >
                  <BookOpen className="w-3 h-3 mr-1.5" />
                  Synonyms & Antonyms
                </motion.div>
                <motion.div 
                  variants={itemVariants}
                  custom={5}
                  className="inline-flex items-center px-2.5 py-1 rounded-full bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 text-xs font-medium"
                >
                  <Sigma className="w-3 h-3 mr-1.5" />
                  Data Interpretation
                </motion.div>
              </div>
            ) : (
              <div className="space-y-3">
                <motion.div variants={itemVariants} custom={3} className="flex items-center">
                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 mr-2">
                    <Brain className="w-3 h-3" />
                  </div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Verbal: Reading Comprehension</p>
                </motion.div>
                <motion.div variants={itemVariants} custom={4} className="flex items-center">
                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 mr-2">
                    <BookOpen className="w-3 h-3" />
                  </div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Vocabulary: Synonyms & Antonyms</p>
                </motion.div>
                <motion.div variants={itemVariants} custom={5} className="flex items-center">
                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 mr-2">
                    <Sigma className="w-3 h-3" />
                  </div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Quantitative: Data Interpretation</p>
                </motion.div>
              </div>
            )}
          </motion.div>
          
          <div className="mt-auto">
            <motion.div
              variants={buttonVariants}
              whileHover="hover"
              whileTap={{ scale: 0.97 }}
            >
              <Button 
                onClick={handleStartPractice}
                className="w-full h-10 md:h-11 text-white shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-green-500 to-green-400 dark:from-green-600 dark:to-green-500"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Start Practice
              </Button>
            </motion.div>
          </div>
          
          {/* Enhanced decorative elements */}
          <div className="absolute top-6 right-8 w-12 h-12 rounded-full bg-green-500/5 dark:bg-green-500/10 -z-10 animate-pulse-slow"></div>
          <div className="absolute bottom-8 left-4 w-14 h-14 rounded-full bg-green-500/5 dark:bg-green-500/10 -z-10"></div>
          <div className="absolute top-1/3 right-4 w-5 h-5 rounded-full bg-green-500/10 dark:bg-green-500/20 -z-10 animate-ping-slow"></div>
          
          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 opacity-[0.015] bg-grid-pattern -z-5"></div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PracticeCard;
