import { useState } from "react";
import { motion } from "framer-motion";
import { Circle, BrainCircuit, LineChart, Shapes, ArrowLeft, Calculator, Brain, Sigma, ChartBar, PieChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import CategoryCard from "./CategoryCard";
import { useIsMobile } from "@/hooks/use-mobile";

interface CategorySelectorProps {
  categories: string[];
  selectedCategory: string | null;
  onCategorySelect: (category: string) => void;
  topicStats: Record<string, { total: number; completed: number }>;
  onBackToDashboard: () => void;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "Arithmetic":
      return <Calculator className="h-6 w-6 text-rose-500" />;
    case "Algebra":
      return <Sigma className="h-6 w-6 text-blue-500" />;
    case "Geometry":
      return <Shapes className="h-6 w-6 text-amber-500" />;
    case "Data Analysis":
      return <ChartBar className="h-6 w-6 text-emerald-500" />;
    default:
      return <Circle className="h-6 w-6 text-gray-500" />;
  }
};

const getLargeIcon = (category: string) => {
  switch (category) {
    case "Arithmetic":
      return <Calculator className="h-24 w-24 text-rose-500/10 absolute bottom-4 right-4 -z-10" />;
    case "Algebra":
      return <Sigma className="h-24 w-24 text-blue-500/10 absolute bottom-4 right-4 -z-10" />;
    case "Geometry":
      return <Shapes className="h-24 w-24 text-amber-500/10 absolute bottom-4 right-4 -z-10" />;
    case "Data Analysis":
      return <PieChart className="h-24 w-24 text-emerald-500/10 absolute bottom-4 right-4 -z-10" />;
    default:
      return null;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case "Arithmetic":
      return "#f43f5e"; // rose-500
    case "Algebra":
      return "#3b82f6"; // blue-500
    case "Geometry":
      return "#f59e0b"; // amber-500
    case "Data Analysis":
      return "#10b981"; // emerald-500
    default:
      return "#6b7280"; // gray-500
  }
};

const getCategoryBg = (category: string) => {
  switch (category) {
    case "Arithmetic":
      return "bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30";
    case "Algebra":
      return "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30";
    case "Geometry":
      return "bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30";
    case "Data Analysis":
      return "bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30";
    default:
      return "bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-950/30 dark:to-slate-950/30";
  }
};

const getCategoryBorder = (category: string) => {
  switch (category) {
    case "Arithmetic":
      return "border-rose-100 dark:border-rose-900/50";
    case "Algebra":
      return "border-blue-100 dark:border-blue-900/50";
    case "Geometry":
      return "border-amber-100 dark:border-amber-900/50";
    case "Data Analysis":
      return "border-emerald-100 dark:border-emerald-900/50";
    default:
      return "border-gray-100 dark:border-gray-900/50";
  }
};

const getCategoryButtonGradient = (category: string) => {
  switch (category) {
    case "Arithmetic":
      return "bg-gradient-to-r from-rose-500 to-pink-500";
    case "Algebra":
      return "bg-gradient-to-r from-blue-500 to-indigo-500";
    case "Geometry":
      return "bg-gradient-to-r from-amber-500 to-yellow-500";
    case "Data Analysis":
      return "bg-gradient-to-r from-emerald-500 to-green-500";
    default:
      return "bg-gradient-to-r from-gray-500 to-slate-500";
  }
};

const getCategoryDescription = (category: string) => {
  switch (category) {
    case "Arithmetic":
      return "Master number properties, operations, fractions, decimals, and percentages essential for GRE success.";
    case "Algebra":
      return "Learn equations, inequalities, functions, exponents, and polynomials with our structured approach.";
    case "Geometry":
      return "Explore shapes, angles, triangles, circles, and coordinate geometry through interactive content.";
    case "Data Analysis":
      return "Understand statistics, probability, data interpretation, and graphs with real-world applications.";
    default:
      return "Explore mathematical concepts and techniques needed for quantitative reasoning success.";
  }
};

const CategorySelector = ({
  categories,
  selectedCategory,
  onCategorySelect,
  topicStats,
  onBackToDashboard
}: CategorySelectorProps) => {
  const isMobile = useIsMobile();
  
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

  return (
    <div className="space-y-6">
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={headerVariants}
        className="bg-gradient-to-r from-primary/5 to-primary/10 backdrop-blur-sm p-4 md:p-6 rounded-2xl shadow-lg border border-primary/20 mb-8 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 opacity-5 pointer-events-none">
          <svg className="w-64 h-64 text-primary" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path fill="currentColor" d="M44.5,-76.3C59.1,-69.2,73.2,-59.5,79.8,-45.8C86.4,-32.1,85.6,-14.5,82.8,1.6C80.1,17.7,75.3,32.3,66.2,43.9C57.2,55.4,43.8,63.8,29.6,70.2C15.3,76.7,0,81.1,-15.1,79.1C-30.2,77,-45.1,68.4,-56.3,56.9C-67.5,45.3,-75.1,30.8,-79.1,15C-83,-0.8,-83.5,-17.9,-78.6,-32.9C-73.8,-47.9,-63.5,-60.8,-50,-70C-36.5,-79.2,-19.9,-84.7,-2.7,-80.5C14.5,-76.4,29.9,-83.5,44.5,-76.3Z" transform="translate(100 100)" />
          </svg>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-xl shadow-sm">
              <Brain className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Quantitative Learning
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base mt-1">
                Master the quantitative concepts essential for GRE success through our structured learning path.
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={onBackToDashboard} 
            className="gap-2 self-start bg-white/90 dark:bg-gray-800/90 shadow-sm hover:bg-white hover:shadow-md dark:hover:bg-gray-700 transition-all duration-200 border border-gray-200 dark:border-gray-700"
          >
            <motion.div 
              initial={{ x: 0 }}
              whileHover={{ x: -3 }}
              className="flex items-center gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Back</span>
            </motion.div>
          </Button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-6">
          {categories.map((category, idx) => (
            <motion.div 
              key={`stat-${category}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * idx, duration: 0.4 }}
              whileHover={{ scale: 1.03 }}
              className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-primary/10 flex items-center gap-3 transition-all duration-200 hover:shadow-md cursor-pointer"
              onClick={() => onCategorySelect(category)}
            >
              <div className={`p-2.5 rounded-lg shadow-sm ${category === "Arithmetic" ? "bg-rose-100 dark:bg-rose-900/30" : 
                              category === "Algebra" ? "bg-blue-100 dark:bg-blue-900/30" : 
                              category === "Geometry" ? "bg-amber-100 dark:bg-amber-900/30" : 
                              "bg-emerald-100 dark:bg-emerald-900/30"}`}>
                {getCategoryIcon(category)}
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">{category}</h3>
                <div className="flex items-center mt-1">
                  <div className="w-16 bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden mr-2">
                    <div 
                      className="h-full rounded-full transition-all duration-500" 
                      style={{
                        width: `${Math.round(((topicStats[category]?.completed || 0) / (topicStats[category]?.total || 1)) * 100)}%`,
                        backgroundColor: getCategoryColor(category)
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {(topicStats[category]?.completed || 0)}/{(topicStats[category]?.total || 0)}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {isMobile ? (
        <ScrollArea className="pb-16">
          <div className="grid grid-cols-1 gap-6 mb-16 px-0.5">
            {categories.map((category, idx) => (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * idx, duration: 0.5 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  className={`relative overflow-hidden shadow-lg hover:shadow-xl transition-all border ${getCategoryBorder(category)} cursor-pointer ${getCategoryBg(category)}`}
                  onClick={() => onCategorySelect(category)}
                >
                  <CardHeader className="pb-2 relative z-10">
                    <div className="flex justify-between items-start">
                      <motion.div 
                        className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-2.5 rounded-full shadow-md"
                        whileHover={{ 
                          scale: 1.1, 
                          boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)',
                          rotate: 10
                        }}
                      >
                        {getCategoryIcon(category)}
                      </motion.div>
                      <Badge variant="secondary" className={`bg-white/80 dark:bg-gray-800/80 shadow-sm`} style={{color: getCategoryColor(category)}}>
                        {category}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl mt-3 font-bold" style={{color: getCategoryColor(category)}}>
                      {category} Mathematics
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-700 dark:text-gray-300 mt-1.5 line-clamp-2">
                      {getCategoryDescription(category)}
                    </CardDescription>
                    
                    <div className="flex items-center justify-between mt-4 mb-2">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        {topicStats[category]?.total || 0} topics
                      </span>
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        {Math.round(((topicStats[category]?.completed || 0) / (topicStats[category]?.total || 1)) * 100)}% complete
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ 
                          width: `${Math.round(((topicStats[category]?.completed || 0) / (topicStats[category]?.total || 1)) * 100)}%` 
                        }}
                        transition={{ duration: 1, delay: 0.3 + (0.1 * idx) }}
                        className="h-full rounded-full transition-all" 
                        style={{ backgroundColor: getCategoryColor(category) }}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2 pb-4 relative z-10">
                    <div className="flex justify-end mt-2">
                      <motion.div 
                        className={`${getCategoryButtonGradient(category)} px-4 py-2 rounded-lg text-white text-sm font-medium shadow-sm hover:shadow-md transition-all flex items-center gap-1.5`}
                        whileHover={{ x: 3 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Start Learning
                        <motion.div
                          animate={{ x: [0, 3, 0] }}
                          transition={{ 
                            repeat: Infinity, 
                            duration: 1.5,
                            repeatType: "loop",
                            ease: "easeInOut" 
                          }}
                        >
                          <ArrowLeft className="h-4 w-4 rotate-180" />
                        </motion.div>
                      </motion.div>
                    </div>
                  </CardContent>
                  {getLargeIcon(category)}
                </Card>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      ) : (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {categories.map((category) => (
            <motion.div 
              key={category} 
              variants={itemVariants}
              whileHover={{ scale: 1.03, y: -5 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                className={`relative overflow-hidden shadow-lg hover:shadow-xl transition-all border ${getCategoryBorder(category)} cursor-pointer ${getCategoryBg(category)} h-full`}
                onClick={() => onCategorySelect(category)}
              >
                <CardHeader className="pb-2 relative z-10">
                  <div className="flex justify-between items-start">
                    <motion.div 
                      className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-3 rounded-full shadow-md"
                      whileHover={{ 
                        scale: 1.15, 
                        rotate: 15,
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      {getCategoryIcon(category)}
                    </motion.div>
                    <Badge variant="secondary" className={`bg-white/80 dark:bg-gray-800/80 shadow-sm`} style={{color: getCategoryColor(category)}}>
                      {category}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl mt-4 font-bold" style={{color: getCategoryColor(category)}}>
                    {category} Mathematics
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                    {getCategoryDescription(category)}
                  </CardDescription>
                  
                  <div className="flex items-center justify-between mt-5 mb-2">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      {topicStats[category]?.total || 0} topics
                    </span>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      {Math.round(((topicStats[category]?.completed || 0) / (topicStats[category]?.total || 1)) * 100)}% complete
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ 
                        width: `${Math.round(((topicStats[category]?.completed || 0) / (topicStats[category]?.total || 1)) * 100)}%` 
                      }}
                      transition={{ duration: 1, delay: 0.8 }}
                      className="h-full rounded-full" 
                      style={{ backgroundColor: getCategoryColor(category) }}
                    />
                  </div>
                </CardHeader>
                <CardContent className="pt-3 pb-5 relative z-10">
                  <div className="flex justify-end mt-3">
                    <motion.div 
                      className={`${getCategoryButtonGradient(category)} px-4 py-2.5 rounded-lg text-white text-sm font-medium shadow-sm hover:shadow-md transition-all flex items-center gap-1.5`}
                      whileHover={{ x: 5 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Start Learning
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{ 
                          repeat: Infinity, 
                          duration: 1.5,
                          repeatType: "loop",
                          ease: "easeInOut" 
                        }}
                      >
                        <ArrowLeft className="h-4 w-4 rotate-180" />
                      </motion.div>
                    </motion.div>
                  </div>
                </CardContent>
                
                <motion.div 
                  className="absolute -z-10 bottom-4 right-4" 
                  animate={{ 
                    rotate: [0, 10, 0, -10, 0],
                    scale: [1, 1.05, 1, 1.05, 1],
                    opacity: [0.08, 0.12, 0.08]
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 8,
                    repeatType: "mirror",
                    ease: "easeInOut" 
                  }}
                >
                  {getLargeIcon(category)}
                </motion.div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default CategorySelector;