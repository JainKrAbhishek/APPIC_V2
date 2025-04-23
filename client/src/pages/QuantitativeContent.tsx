import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, QueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import { useThemeLanguage } from "@/hooks/use-theme-language";
import { QuantTopic, QuantContent, User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Import our custom components
import CategorySelector from "@/components/navigation/CategorySelector";
import TopicList from "@/components/navigation/TopicList";
import ContentViewer from "@/components/navigation/ContentViewer";
import ProgressTracker from "@/components/cards/ProgressTracker";
import KnowledgeMap from "@/components/navigation/KnowledgeMap";
import { Button } from "@/components/ui/button";
import { MapIcon } from "lucide-react";

interface QuantitativeContentProps {
  user: User;
}

// Helper function to get category color
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

const QuantitativeContent = ({ user }: QuantitativeContentProps) => {
  const { t } = useThemeLanguage();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // State for the UI navigation
  const [view, setView] = useState<"categories" | "topics">("categories");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<number | null>(null);
  const [userProgress, setUserProgress] = useState<Record<number, boolean>>({});
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  // Fetch all quant categories
  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ["/api/quant/categories"],
    queryFn: async () => {
      try {
        console.log("Fetching categories...");
        const defaultCategories = ["Algebra", "Arithmetic", "Data Analysis", "Geometry"];
        
        // Use the standard query function that already has error handling
        return await apiRequest<{categories: string[]}>("/api/quant/categories")
          .then(data => {
            // Check if we have the expected structure
            if (data && data.categories && Array.isArray(data.categories)) {
              console.log("Successfully loaded categories:", data.categories);
              return data.categories;
            } else {
              console.warn("Unexpected categories response format:", data);
              
              // If we get a malformed response, try to handle it gracefully
              if (Array.isArray(data)) {
                return data as string[];
              } else {
                // Server is responding but with unexpected format
                console.log("Using default categories as fallback");
                return defaultCategories;
              }
            }
          })
          .catch(error => {
            console.error("Error in categories query function:", error);
            // Return a default set of categories as fallback for any error
            return defaultCategories;
          });
      } catch (error) {
        console.error("Error in categories query function:", error);
        // Return a default set of categories as fallback for any error
        return ["Algebra", "Arithmetic", "Data Analysis", "Geometry"];
      }
    },
    retry: 2,
    refetchOnWindowFocus: false,
  });

  // Fetch topics for the selected category
  const { data: topics, isLoading: isLoadingTopics } = useQuery({
    queryKey: ["/api/quant/topics", selectedCategory],
    queryFn: async () => {
      if (!selectedCategory) return [];
      try {
        console.log("Fetching topics for category:", selectedCategory);
        
        // Use the standard query function directly
        return await apiRequest<QuantTopic[]>("/api/quant/topics", {
          params: { category: selectedCategory }
        })
        .then(data => {
          if (Array.isArray(data)) {
            console.log(`Topics loaded successfully for ${selectedCategory}: ${data.length} topics`);
            return data;
          } else {
            console.warn("Unexpected topics response format:", data);
            return [];
          }
        })
        .catch(error => {
          console.error("Error in topics query function:", error);
          return [];
        });
      } catch (error) {
        console.error("Error in topics query function:", error);
        // Return empty array as fallback for any error
        return [];
      }
    },
    enabled: !!selectedCategory,
    retry: 2,
    refetchOnWindowFocus: false,
  });

  // Fetch content for the selected topic
  const { data: content, isLoading: isLoadingContent } = useQuery({
    queryKey: ["/api/quant/content", selectedTopic],
    queryFn: async () => {
      if (!selectedTopic) return [];
      try {
        console.log("Fetching content for topic:", selectedTopic);
        
        // Use the standard query function directly
        return await apiRequest<QuantContent[]>("/api/quant/content", {
          params: { topicId: selectedTopic }
        })
        .then(data => {
          if (Array.isArray(data)) {
            console.log(`Content loaded successfully: ${data.length} items for topic ${selectedTopic}`);
            
            return data.map(item => {
              // Only log content processing for debugging purposes
              console.log(`Processing content item ${item.id}: content type is ${typeof item.content}`);
              
              // If content is a string and looks like JSON, try to parse it
              if (typeof item.content === 'string' && 
                  (item.content.startsWith('[') || item.content.startsWith('{'))) {
                try {
                  // Only log the first 50 chars to avoid console flooding
                  const previewContent = item.content.length > 50 
                    ? item.content.substring(0, 50) + "..." 
                    : item.content;
                  console.log("Attempting to parse content JSON:", previewContent);
                  
                  item.content = JSON.parse(item.content);
                  console.log("Successfully parsed content JSON for item:", item.id);
                } catch (parseError) {
                  console.error("Failed to parse content JSON for item:", item.id, parseError);
                  // Keep it as a string if parsing fails
                }
              } else if (typeof item.content === 'object') {
                console.log("Content is already an object, no parsing needed for item:", item.id);
              }
              
              return item;
            });
          } else {
            console.warn("Unexpected content response format:", data);
            return [];
          }
        })
        .catch(error => {
          console.error("Error in content query function:", error);
          return [];
        });
      } catch (error) {
        console.error("Error in content query function:", error);
        // Return empty array as fallback for any error
        return [];
      }
    },
    enabled: !!selectedTopic,
    retry: 2,
    refetchOnWindowFocus: false,
  });

  // Fetch user's progress
  const { data: progress, isLoading: isLoadingProgress } = useQuery({
    queryKey: ["/api/quant/progress", user?.id],
    queryFn: async () => {
      try {
        // Make sure we have a valid user ID
        if (!user || !user.id) {
          console.warn("No valid user ID available for progress fetch");
          return [];
        }
        
        console.log("Fetching user progress for user ID:", user.id);
        
        // Use the standard query function directly
        return await apiRequest<any[]>("/api/quant/progress", {
          params: { userId: user.id }
        })
        .then(data => {
          console.log("User progress loaded:", data?.length || 0, "progress records");
          return Array.isArray(data) ? data : [];
        })
        .catch(error => {
          console.error("Error in progress query function:", error);
          return [];
        });
      } catch (error) {
        console.error("Error in progress query function:", error);
        // Return an empty array as fallback for any error
        return [];
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
    enabled: !!user?.id, // Only run this query if we have a valid user ID
  });

  // Update progress state
  useEffect(() => {
    if (progress && progress.length > 0) {
      const progressMap: Record<number, boolean> = {};
      progress.forEach((p: any) => {
        progressMap[p.topicId] = p.completed;
      });
      setUserProgress(progressMap);
    }
  }, [progress]);

  // Select the first topic when topics are loaded
  useEffect(() => {
    if (view === "topics" && topics && topics.length > 0 && !selectedTopic) {
      setSelectedTopic(topics[0].id);
    }
  }, [topics, selectedTopic, view]);

  // Calculate topic stats for each category
  const topicStats = Array.isArray(categories) 
    ? categories.reduce((acc, category) => {
        const categoryTopics = topics?.filter((topic: QuantTopic) => topic.category === category) || [];
        const completedCount = categoryTopics.filter((topic: QuantTopic) => userProgress[topic.id]).length;
        
        return {
          ...acc,
          [category]: {
            total: categoryTopics.length,
            completed: completedCount
          }
        };
      }, {} as Record<string, { total: number; completed: number }>) 
    : {};

  // Mark topic as completed
  const markTopicCompleted = async () => {
    if (!selectedTopic) return;
    
    try {
      const topicId = selectedTopic;
      console.log("Marking topic as completed:", topicId);
      const existingProgress = progress?.find((p: any) => p.topicId === topicId);
      
      const progressData = existingProgress 
        ? { 
            topicId: topicId, 
            completed: true,
            lastAccessed: new Date().toISOString() 
          }
        : {
            userId: user.id,
            topicId: topicId,
            completed: true,
            lastAccessed: new Date().toISOString(),
          };
      
      // Create or update the progress
      await apiRequest("/api/quant/progress", {
        method: "POST",
        data: progressData
      })
      .then(response => {
        console.log("Progress updated successfully:", response);
        
        // Update local state
        setUserProgress((prev) => ({ ...prev, [topicId]: true }));
        
        // Invalidate progress query to refresh data
        if (queryClient) {
          queryClient.invalidateQueries({ queryKey: ["/api/quant/progress", user.id] });
        }
        
        toast({
          title: "Progress updated",
          description: "This topic has been marked as completed",
        });
      })
      .catch(error => {
        console.error("Error updating progress:", error);
        toast({
          title: "Error",
          description: "Failed to update progress. Please try again.",
          variant: "destructive",
        });
      });
    } catch (error) {
      console.error("Error in update progress function:", error);
      toast({
        title: "Error",
        description: "Failed to update progress: " + (error instanceof Error ? error.message : "Unknown error"),
        variant: "destructive",
      });
    }
  };

  // Handle category selection
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setSelectedTopic(null);
    setView("topics");
  };

  // Handle topic selection
  const handleTopicSelect = (topicId: number) => {
    setSelectedTopic(topicId);
  };

  // Handle back to categories
  const handleBackToCategories = () => {
    setView("categories");
    setSelectedCategory(null);
    setSelectedTopic(null);
  };
  
  // Handle start practice for a specific topic
  const handleStartPractice = (topicId: number) => {
    // Navigate to the practice page with the topic ID as a parameter
    setLocation(`/practice?type=quantitative&topicId=${topicId}`);
  };

  // Get current topic
  const getCurrentTopic = (): QuantTopic | undefined => {
    if (!topics || !selectedTopic) return undefined;
    return topics.find((t: QuantTopic) => t.id === selectedTopic);
  };

  // Function to navigate to a specific topic
  const handleNavigateToTopic = (topicId: number) => {
    setSelectedTopic(topicId);
    // If on mobile and navigating to a topic, make sure we're in topic view
    setView("topics");
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentTopic = getCurrentTopic();
  const pageTitle = currentTopic?.name || selectedCategory || "Quantitative Learning";
  const categoryColor = getCategoryColor(selectedCategory || "");

  if (isLoadingCategories) {
    return (
      <DashboardLayout title="Quantitative Learning" user={user}>
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={pageTitle} user={user}>
      {view === "categories" ? (
        <CategorySelector
          categories={categories || []}
          selectedCategory={selectedCategory}
          onCategorySelect={handleCategorySelect}
          topicStats={topicStats}
          onBackToDashboard={() => setLocation("/dashboard")}
        />
      ) : (
        <div className="space-y-4 sm:space-y-6 container mx-auto max-w-full">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
            {/* Topics sidebar - hidden on mobile when topic is selected or when collapsed */}
            <div className={`lg:col-span-1 ${selectedTopic ? 'hidden lg:block' : 'block'} ${sidebarCollapsed ? 'lg:hidden' : ''}`}>
              <div className="space-y-4 sm:space-y-6">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-semibold">{selectedCategory || "Topics"}</h2>
                  <div className="flex items-center gap-2">
                    {/* Narrowing button for sidebar - visible on desktop */}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="hidden lg:flex" 
                      onClick={() => setSidebarCollapsed(true)}
                      title="Collapse sidebar"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 17l-5-5 5-5"></path>
                        <path d="M18 17l-5-5 5-5"></path>
                      </svg>
                    </Button>
                    {/* Back button for sidebar - visible on mobile */}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="lg:hidden" 
                      onClick={() => setSidebarCollapsed(true)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                      </svg>
                    </Button>
                  </div>
                </div>
                
                <TopicList
                  title={selectedCategory || "Topics"}
                  description="Step-by-step learning path"
                  topics={topics}
                  isLoading={isLoadingTopics}
                  selectedTopicId={selectedTopic}
                  userProgress={userProgress}
                  onTopicSelect={handleTopicSelect}
                />
                
                <ProgressTracker
                  total={topics?.length || 0}
                  completed={topics?.filter((t: QuantTopic) => userProgress[t.id])?.length || 0}
                  categoryTitle={selectedCategory || ""}
                  categoryColor={categoryColor}
                />
                
                <div className="mt-4">
                  <Button 
                    variant="outline" 
                    className="w-full flex items-center justify-center gap-2"
                    onClick={() => setLocation("/knowledge-map")}
                  >
                    <MapIcon className="h-4 w-4" />
                    {t('View Knowledge Map')}
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Content area - full width on mobile when topic is selected or sidebar collapsed */}
            <div className={`${selectedTopic ? 'block' : 'hidden lg:block'} ${sidebarCollapsed ? 'lg:col-span-5' : 'lg:col-span-4'}`}>
              {/* Sidebar toggle button - only visible when sidebar is collapsed on lg+ screens */}
              {sidebarCollapsed && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mb-4 hidden lg:flex items-center gap-1.5" 
                  onClick={() => setSidebarCollapsed(false)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                  <span>Show Topics</span>
                </Button>
              )}
              <ContentViewer
                topic={currentTopic}
                content={content}
                isLoading={isLoadingContent}
                onMarkComplete={markTopicCompleted}
                isCompleted={!!selectedTopic && userProgress[selectedTopic]}
                onGoBack={handleBackToCategories}
                categoryColor={categoryColor}
                allTopics={topics}
                onNavigateToTopic={handleNavigateToTopic}
                onStartPractice={handleStartPractice}
              />
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default QuantitativeContent;