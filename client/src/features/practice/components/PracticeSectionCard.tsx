import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Layers, Calculator, BookMarked } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";

interface PracticeSectionCardProps {
  title: string;
  description: string;
  practiceSets: number;
  type: "verbal" | "vocabulary" | "quantitative";
  imageUrl: string;
}

const PracticeSectionCard = ({ title, description, practiceSets, type, imageUrl }: PracticeSectionCardProps) => {
  const [, setLocation] = useLocation();
  
  const handlePractice = () => {
    setLocation(`/practice?type=${type}`);
  };
  
  const handleLearn = () => {
    switch (type) {
      case "verbal":
        setLocation("/verbal");
        break;
      case "vocabulary":
        setLocation("/vocabulary");
        break;
      case "quantitative":
        setLocation("/quantitative");
        break;
    }
  };
  
  // Get section-specific colors
  const getColors = () => {
    switch (type) {
      case "verbal":
        return {
          background: "bg-blue-50 dark:bg-blue-900/20",
          border: "border-blue-200 dark:border-blue-700",
          button: "bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700",
          outlineButton: "text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30",
          iconBg: "bg-blue-500/10 dark:bg-blue-500/20",
          iconText: "text-blue-500 dark:text-blue-400",
          badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/70 dark:text-blue-300",
          hoverAccent: "group-hover:border-blue-300 dark:group-hover:border-blue-600",
          gradient: "from-blue-500/80 to-blue-600/80"
        };
      case "vocabulary":
        return {
          background: "bg-green-50 dark:bg-green-900/20",
          border: "border-green-200 dark:border-green-700",
          button: "bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700",
          outlineButton: "text-green-700 dark:text-green-400 border-green-200 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/30",
          iconBg: "bg-green-500/10 dark:bg-green-500/20",
          iconText: "text-green-500 dark:text-green-400",
          badge: "bg-green-100 text-green-800 dark:bg-green-900/70 dark:text-green-300",
          hoverAccent: "group-hover:border-green-300 dark:group-hover:border-green-600",
          gradient: "from-green-500/80 to-green-600/80"
        };
      case "quantitative":
        return {
          background: "bg-orange-50 dark:bg-orange-900/20",
          border: "border-orange-200 dark:border-orange-700",
          button: "bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700",
          outlineButton: "text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/30",
          iconBg: "bg-orange-500/10 dark:bg-orange-500/20",
          iconText: "text-orange-500 dark:text-orange-400", 
          badge: "bg-orange-100 text-orange-800 dark:bg-orange-900/70 dark:text-orange-300",
          hoverAccent: "group-hover:border-orange-300 dark:group-hover:border-orange-600",
          gradient: "from-orange-500/80 to-orange-600/80"
        };
      default:
        return {
          background: "bg-gray-50 dark:bg-gray-800/50",
          border: "border-gray-200 dark:border-gray-700",
          button: "bg-gray-700 hover:bg-gray-800 dark:bg-gray-600 dark:hover:bg-gray-700",
          outlineButton: "text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800",
          iconBg: "bg-gray-500/10 dark:bg-gray-400/10",
          iconText: "text-gray-500 dark:text-gray-400",
          badge: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
          hoverAccent: "group-hover:border-gray-300 dark:group-hover:border-gray-600",
          gradient: "from-gray-600/80 to-gray-700/80"
        };
    }
  };
  
  // Get high-quality section images based on type
  const getHighQualityImages = () => {
    switch (type) {
      case "verbal":
        return [
          "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1507842217343-583bb7270b66?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1491841573634-28140fc7ced7?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
        ];
      case "vocabulary":
        return [
          "https://images.unsplash.com/photo-1519682577862-22b62b24e493?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
        ];
      case "quantitative":
        return [
          "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80", 
          "https://images.unsplash.com/photo-1596495577886-d920f1fb7238?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1509228468518-180dd4864904?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
        ];
      default:
        return [imageUrl];
    }
  };

  // Get the icon for different section types
  const getSectionIcon = () => {
    const colors = getColors();
    const className = `h-4 w-4 ${colors.iconText}`;
    
    switch (type) {
      case "verbal":
        return <BookOpen className={className} />;
      case "vocabulary":
        return <BookMarked className={className} />;
      case "quantitative":
        return <Calculator className={className} />;
      default:
        return <Layers className={className} />;
    }
  };
  
  // State for image loading error handling
  const [imageError, setImageError] = useState(false);
  const [optimizedImageUrl, setOptimizedImageUrl] = useState(imageUrl);
  
  // Use high-quality images if the original fails to load
  useEffect(() => {
    if (imageError) {
      const alternativeImages = getHighQualityImages();
      // Use a random image from our high-quality alternatives
      const randomIndex = Math.floor(Math.random() * alternativeImages.length);
      setOptimizedImageUrl(alternativeImages[randomIndex]);
    } else {
      setOptimizedImageUrl(imageUrl);
    }
  }, [imageError, imageUrl, type]);
  
  const colors = getColors();

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    hover: { 
      y: -5, 
      transition: { 
        duration: 0.2, 
        ease: "easeOut" 
      } 
    }
  };

  const imageVariants = {
    hover: { 
      scale: 1.05,
      transition: { duration: 0.3 }
    }
  };

  const buttonVariants = {
    hover: { 
      scale: 1.05,
      transition: { duration: 0.2 }
    },
    tap: { 
      scale: 0.98,
      transition: { duration: 0.1 }
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      whileHover="hover"
      variants={cardVariants}
      className="h-full"
    >
      <Card className={`shadow-md hover:shadow-xl overflow-hidden border group transition-all duration-300 h-full ${colors.border} ${colors.hoverAccent}`}>
        <div className="relative h-40 sm:h-52 md:h-56 lg:h-60 overflow-hidden">
          {/* Gradient overlay for better text contrast */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/30 z-10"></div>
          
          {/* Badge showing section type */}
          <div className="absolute top-3 left-3 z-20">
            <Badge className={`${colors.badge} px-2 py-1 text-xs font-medium`}>
              <div className="flex items-center gap-1.5">
                {getSectionIcon()}
                <span className="capitalize">{type}</span>
              </div>
            </Badge>
          </div>
          
          {/* Section title overlay on image for larger devices */}
          <div className="hidden sm:block absolute bottom-0 left-0 right-0 p-3 z-20 bg-gradient-to-t from-black/70 to-transparent">
            <h3 className="text-lg md:text-xl font-semibold text-white">{title}</h3>
          </div>
          
          {/* Image with hover animation and error handling */}
          <motion.img 
            variants={imageVariants}
            src={optimizedImageUrl} 
            alt={title} 
            className="h-full w-full object-cover"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        </div>
        
        <CardContent className="p-4 sm:p-5 md:p-6">
          {/* Only show title in card content on mobile */}
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100 sm:hidden">{title}</h3>
          
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2 md:mb-5">{description}</p>
          
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div className={`inline-flex items-center ${colors.iconBg} rounded-full px-3 py-1.5`}>
              <Layers className={`h-3.5 w-3.5 mr-1.5 ${colors.iconText}`} />
              <span className={`text-xs font-medium ${colors.iconText}`}>
                {practiceSets} {practiceSets === 1 ? 'practice set' : 'practice sets'}
              </span>
            </div>
            
            <div className="flex gap-2 mt-1 sm:mt-0">
              <motion.div variants={buttonVariants} whileTap="tap">
                <Button 
                  onClick={handleLearn}
                  variant="outline"
                  size="sm"
                  className={`text-xs md:text-sm px-3 py-1 h-8 md:h-9 border ${colors.outlineButton}`}
                >
                  Learn
                </Button>
              </motion.div>
              
              <motion.div variants={buttonVariants} whileTap="tap">
                <Button 
                  onClick={handlePractice}
                  size="sm"
                  className={`${colors.button} text-white px-3 py-1 h-8 md:h-9 text-xs md:text-sm flex items-center gap-1.5`}
                >
                  Practice
                  <ArrowRight className="h-3 w-3 md:h-3.5 md:w-3.5 ml-0.5" />
                </Button>
              </motion.div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PracticeSectionCard;
