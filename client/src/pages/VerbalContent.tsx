import { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import { useThemeLanguage } from "@/hooks/use-theme-language";
import { User } from "@shared/schema";
import { apiRequest, queryClient, queryKeys } from "@/lib/queryClient";
import { useIsMobile } from "@/hooks/use-mobile";
import { TopicListSkeleton, ContentViewerSkeleton } from "@/components/ui/skeleton";

// Import our custom components
import CategorySelector from "@/components/navigation/CategorySelector";
import TopicList from "@/components/navigation/TopicList";
import ContentViewer from "@/components/navigation/ContentViewer";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  BookText,
  FilePenLine,
  FileCheck,
  BrainCircuit,
  ArrowLeft,
  Home,
  MapIcon,
  CheckCircle2,
  CircleDot
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Define types for verbal learning content
interface VerbalTopic {
  id: number;
  title: string;
  description: string;
  type: string;
  order: number;
}

interface VerbalContent {
  id: number;
  topicId: number;
  title: string;
  content: string;
  order: number;
}

interface VerbalProgress {
  id: number;
  userId: number;
  topicId: number;
  completed: boolean;
  lastAccessed: string;
}

interface VerbalContentProps {
  user: User;
}

const VerbalContent = ({ user }: VerbalContentProps) => {
  const { t } = useThemeLanguage();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedTopic, setSelectedTopic] = useState<number | null>(null);
  const [userProgress, setUserProgress] = useState<Record<number, boolean>>({});
  const isMobile = useIsMobile();

  // Fetch all verbal topic types
  const { data: types, isLoading: isLoadingTypes } = useQuery({
    queryKey: queryKeys.verbal.types(),
    queryFn: async () => {
      try {
        console.log("Fetching verbal topic types...");
        return await apiRequest<string[]>("/api/verbal/types");
      } catch (error) {
        console.error("Error fetching verbal types:", error);
        toast({
          title: "Error",
          description: "Failed to load verbal types. Please try again later.",
          variant: "destructive",
        });
        return [];
      }
    },
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
    refetchOnWindowFocus: false,
  });

  // Fetch topics for the selected type
  const { data: topics = [], isLoading: isLoadingTopics } = useQuery({
    queryKey: queryKeys.verbal.topics(selectedType),
    queryFn: async () => {
      if (!selectedType) return [];

      try {
        console.log("Fetching verbal topics for type:", selectedType);
        return await apiRequest<VerbalTopic[]>(`/api/verbal/topics/${selectedType}`);
      } catch (error) {
        console.error("Error fetching verbal topics:", error);
        toast({
          title: "Error",
          description: "Failed to load topics. Please try again later.",
          variant: "destructive",
        });
        return [];
      }
    },
    enabled: !!selectedType,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
    refetchOnWindowFocus: false
  });

  // Fetch content for the selected topic
  const { data: content = [], isLoading: isLoadingContent } = useQuery({
    queryKey: queryKeys.verbal.content(selectedTopic || 0),
    queryFn: async () => {
      if (!selectedTopic) return [];

      try {
        console.log("Fetching verbal content for topic:", selectedTopic);
        return await apiRequest<VerbalContent[]>(`/api/verbal/content/${selectedTopic}`);
      } catch (error) {
        console.error("Error fetching verbal content:", error);
        toast({
          title: "Error",
          description: "Failed to load content. Please try again later.",
          variant: "destructive",
        });
        return [];
      }
    },
    enabled: !!selectedTopic,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
    refetchOnWindowFocus: false
  });

  // Fetch user's progress
  const { data: progress = [], isLoading: isLoadingProgress } = useQuery({
    queryKey: queryKeys.verbal.progress(user.id),
    queryFn: async () => {
      try {
        console.log("Fetching verbal user progress for user:", user.id);
        return await apiRequest<VerbalProgress[]>(`/api/verbal/progress/${user.id}`);
      } catch (error) {
        console.error("Error fetching user progress:", error);
        toast({
          title: "Error",
          description: "Failed to load progress. Please try again later.",
          variant: "destructive",
        });
        return [];
      }
    },
    staleTime: 1000 * 60 * 15, // Cache for 15 minutes (shorter than other data)
    refetchOnWindowFocus: false
  });

  // Update progress state
  useEffect(() => {
    if (progress && progress.length > 0) {
      const progressMap: Record<number, boolean> = {};
      progress.forEach((p: VerbalProgress) => {
        progressMap[p.topicId] = p.completed;
      });
      setUserProgress(progressMap);
    }
  }, [progress]);

  // Select the first topic when topics are loaded
  useEffect(() => {
    if (topics && topics.length > 0 && selectedType) {
      // Filter topics by selectedType
      const filteredTopics = topics.filter((topic: VerbalTopic) => topic.type === selectedType);
      if (filteredTopics.length > 0 && (!selectedTopic || !topics.find((t: VerbalTopic) => t.id === selectedTopic))) {
        setSelectedTopic(filteredTopics[0].id);
      }
    }
  }, [topics, selectedType, selectedTopic]);

  // Mark topic as completed
  const markTopicCompleted = async (topicId: number) => {
    try {
      const existingProgress = progress?.find((p: VerbalProgress) => p.topicId === topicId);
      console.log("Marking topic as completed:", topicId);

      if (existingProgress) {
        console.log("Updating existing progress:", existingProgress.id);
        // Update existing progress
        const progressData = { completed: true };

        const response = await fetch(`/api/verbal/progress/${existingProgress.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(progressData),
          credentials: "include"
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Failed to update progress:", errorText);
          throw new Error(`Server returned ${response.status} ${response.statusText}`);
        }

        console.log("Progress updated successfully");
      } else {
        console.log("Creating new progress for topic:", topicId);
        // Create new progress
        const progressData = {
          userId: user.id,
          topicId: topicId,
          completed: true,
          lastAccessed: new Date().toISOString(),
        };

        const response = await fetch(`/api/verbal/progress`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(progressData),
          credentials: "include"
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Failed to create progress:", errorText);
          throw new Error(`Server returned ${response.status} ${response.statusText}`);
        }

        console.log("Progress created successfully");
      }

      // Update local state
      setUserProgress((prev) => ({ ...prev, [topicId]: true }));

      // Invalidate the related queries to refresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.verbal.progress(user.id) });

      toast({
        title: "Progress updated",
        description: "This topic has been marked as completed",
      });
    } catch (error) {
      console.error("Error in markTopicCompleted:", error);
      toast({
        title: "Error",
        description: "Failed to update progress. Please try again later.",
        variant: "destructive",
      });
    }
  };

  // Handle type change
  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    setSelectedTopic(null);
  };

  // Handle topic change
  const handleTopicChange = (topicId: number) => {
    setSelectedTopic(topicId);
  };

  // Format type name for display
  const formatTypeName = (type: string) => {
    // Replace underscores with spaces and capitalize each word
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // Define type display names, descriptions and icons
  const typeDisplayNames: Record<string, string> = {
    reading: "Reading Comprehension",
    sentence_equivalence: "Sentence Equivalence",
    text_completion: "Text Completion",
    critical_reasoning: "Critical Reasoning"
  };

  const typeDescriptions: Record<string, string> = {
    reading: "Analyze and understand complex passages from various academic disciplines with effective strategies for handling different question types.",
    sentence_equivalence: "Master techniques for selecting two words that complete a sentence with the same meaning, developing a strong sense for context and synonyms.",
    text_completion: "Learn efficient approaches to filling in the blanks in passages, recognizing structural and semantic clues within text.",
    critical_reasoning: "Build skills for evaluating and constructing arguments, identifying assumptions, and recognizing logical fallacies."
  };

  // Define icons with animated variants for improved visual experience
  const typeIcons: Record<string, JSX.Element> = {
    reading: <BookText className="h-5 w-5 text-emerald-500 transition-transform group-hover:scale-110" />,
    sentence_equivalence: <FilePenLine className="h-5 w-5 text-blue-500 transition-transform group-hover:scale-110" />,
    text_completion: <FileCheck className="h-5 w-5 text-amber-500 transition-transform group-hover:scale-110" />,
    critical_reasoning: <BrainCircuit className="h-5 w-5 text-rose-500 transition-transform group-hover:scale-110" />
  };
  
  // Function to get icon with fallback
  const getTypeIcon = (type: string): JSX.Element => {
    return typeIcons[type] || <BookOpen className="h-5 w-5 text-gray-500 transition-transform group-hover:scale-110" />;
  };

  // Define animated category cards for a better user experience  
  const typeColor: Record<string, string> = {
    reading: "#10b981", // emerald-500
    sentence_equivalence: "#3b82f6", // blue-500
    text_completion: "#f59e0b", // amber-500
    critical_reasoning: "#f43f5e", // rose-500
  };
  
  const typeBgGradient: Record<string, string> = {
    reading: "bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30",
    sentence_equivalence: "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30",
    text_completion: "bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30",
    critical_reasoning: "bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30",
  };

  // Prepare topic stats for CategorySelector
  const topicStats = useMemo(() => {
    if (!types || !topics || !progress) return {};
    
    const stats: Record<string, { total: number; completed: number }> = {};
    
    types.forEach(type => {
      const topicsOfType = topics.filter(t => t.type === type);
      const completedTopics = topicsOfType.filter(t => userProgress[t.id]);
      
      stats[type] = {
        total: topicsOfType.length,
        completed: completedTopics.length
      };
    });
    
    return stats;
  }, [types, topics, progress, userProgress]);
  
  // Navigate back to dashboard
  const handleBackToDashboard = () => {
    setLocation('/dashboard');
  };
  
  // Get page title
  const pageTitle = useMemo(() => {
    if (!selectedTopic) return "Verbal Learning";
    const currentTopic = topics.find(t => t.id === selectedTopic);
    return currentTopic ? currentTopic.title : "Verbal Learning";
  }, [selectedTopic, topics]);

  // Loading state with skeleton interface
  if (isLoadingTypes) {
    return (
      <DashboardLayout title="Verbal Learning" user={user}>
        <div className="container mx-auto px-4 py-6">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h1 className="text-2xl font-bold">Verbal Learning</h1>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleBackToDashboard}
                  className="hidden lg:flex" 
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Dashboard
                </Button>
              </div>
            </div>
            <p className="text-muted-foreground">
              Master GRE verbal reasoning skills with our comprehensive content
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-32 bg-muted rounded-lg mb-2"></div>
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // View selection - showing category selector when no topic selected
  if (!selectedType) {
    return (
      <DashboardLayout title="Verbal Learning" user={user}>
        <div className="container mx-auto px-4 py-6">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h1 className="text-2xl font-bold">Verbal Learning</h1>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleBackToDashboard}
                  className="hidden lg:flex" 
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Dashboard
                </Button>
              </div>
            </div>
            <p className="text-muted-foreground">
              Master GRE verbal reasoning skills with our comprehensive content
            </p>
          </div>
          
          <CategorySelector
            categories={types || []}
            selectedCategory={selectedType}
            onCategorySelect={handleTypeChange}
            topicStats={topicStats}
            onBackToDashboard={handleBackToDashboard}
          />
        </div>
      </DashboardLayout>
    );
  }

  // Main content view
  return (
    <DashboardLayout title={pageTitle} user={user}>
      <div className="container mx-auto px-4 py-4">
        {/* Top navigation bar */}
        <div className="w-full flex items-center justify-between gap-4 mb-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setSelectedType("")}
            className="flex items-center"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Types
          </Button>
          
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className="bg-white/50 dark:bg-black/20 text-sm py-1.5 px-3 border"
            >
              {typeDisplayNames[selectedType] || formatTypeName(selectedType)}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              asChild
            >
              <Link href="/dashboard">
                <Home className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
        
        {/* Progress tracker */}
        <div 
          className="mb-4 hidden lg:flex items-center gap-1.5" 
          style={{color: typeColor[selectedType]}}
        >
          <BookOpen className="h-4 w-4" />
          <div className="text-sm font-medium">
            {topicStats[selectedType]?.completed || 0} of {topicStats[selectedType]?.total || 0} topics completed
          </div>
        </div>

        {/* Main content layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Topic list */}
          <div className="lg:col-span-3">
            {isLoadingTopics ? (
              <TopicListSkeleton count={7} />
            ) : (
              <TopicList
                topics={topics.filter(topic => topic.type === selectedType).map(topic => ({
                  id: topic.id,
                  name: topic.title,
                  description: topic.description,
                  // Add required fields for TopicItem interface
                  category: selectedType,
                  order: topic.order,
                  groupNumber: 1,
                  icon: null,
                  prerequisites: null
                }))}
                selectedTopicId={selectedTopic}
                onTopicSelect={handleTopicChange}
                isLoading={false}
                title={typeDisplayNames[selectedType] || formatTypeName(selectedType)}
                description={typeDescriptions[selectedType] || ""}
                userProgress={userProgress}
              />
            )}
          </div>
          
          {/* Content viewer with skeleton loading */}
          <div className="lg:col-span-9">
            {isLoadingContent ? (
              <ContentViewerSkeleton />
            ) : (
              <ContentViewer
                topic={topics.find(t => t.id === selectedTopic) as any}
                content={content.map(item => ({
                  id: item.id,
                  title: item.title,
                  content: item.content,
                  order: item.order,
                  // Add required fields
                  createdAt: null,
                  updatedAt: null,
                  topicId: item.topicId,
                  examples: null,
                  formulas: null,
                  imageUrls: null
                }))}
                isLoading={false}
                isCompleted={!!userProgress[selectedTopic || 0]}
                onMarkComplete={() => selectedTopic && markTopicCompleted(selectedTopic)}
                categoryColor={typeColor[selectedType] || "#3b82f6"}
                onGoBack={() => setSelectedType("")}
              />
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default VerbalContent;