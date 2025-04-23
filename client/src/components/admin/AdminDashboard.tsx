import React, { useState, useMemo, Suspense, lazy, useEffect } from "react";
import type { UserRecord as User } from "@shared/types";
import {
  Users, FileQuestion, ListChecks, Calculator,
  BookText, ShieldCheck, Search, BookOpen, Gauge,
  BarChart3, ArrowUpRight, Clock, ArrowDown,
  CheckCircle2, Layers, Settings, Database, RefreshCw,
  Menu, X, LogOut, ChevronRight, Key, FileText
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ErrorBoundary } from "react-error-boundary";

// Import components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import ContentSkeleton from "./ContentSkeleton";

// Import admin module components (lazy loaded)
const VocabularyManager = lazy(() => import("./vocabulary-manager/VocabularyManager"));
const VerbalContentManager = lazy(() => import("./verbal-content/VerbalContentManager"));
const QuantitativeContentManager = lazy(() => import("./quantitative-content/QuantitativeContentManager"));
const QuestionsManager = lazy(() => import("./questions/QuestionsManager"));
const PracticeSetsManager = lazy(() => import("./practice-sets/PracticeSetsManager"));
const UsersManager = lazy(() => import("./users/UsersManager"));
const ContentAccessManager = lazy(() => import("./content-access/ContentAccessManager"));
const ApiKeyManager = lazy(() => import("./api-keys/ApiKeyManager"));
const BlogManager = lazy(() => import("./AdminBlogManager"));

interface AdminDashboardProps {
  user: User;
}

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

// Error fallback component for ErrorBoundary
const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetErrorBoundary }) => (
  <Alert variant="destructive" className="m-4">
    <AlertTitle>Error in admin component</AlertTitle>
    <AlertDescription>
      <p className="mb-2">{error.message}</p>
      <Button onClick={resetErrorBoundary} variant="secondary">Try again</Button>
    </AlertDescription>
  </Alert>
);

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  // Access control - return access denied message if not admin
  if (!user.isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] text-center">
        <h1 className="text-2xl font-bold text-red-500 mb-4">Access Denied</h1>
        <p className="text-gray-500">
          You don't have permission to access the admin dashboard.
        </p>
      </div>
    );
  }

  // Define tabs
  const tabs = [
    { value: "overview", icon: <Gauge />, label: "Overview" },
    { value: "vocabulary", icon: <BookOpen />, label: "Vocabulary" },
    { value: "verbal", icon: <BookText />, label: "Verbal" },
    { value: "quantitative", icon: <Calculator />, label: "Quantitative" },
    { value: "questions", icon: <FileQuestion />, label: "Questions" },
    { value: "practice_sets", icon: <ListChecks />, label: "Practice Sets" },
    { value: "users", icon: <Users />, label: "Users" },
    { value: "access", icon: <ShieldCheck />, label: "Access" },
    { value: "api_keys", icon: <Key />, label: "API Keys" },
    { value: "blog", icon: <FileText />, label: "Blog" },
  ];

  // Fetch admin statistics
  const { data: adminStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/admin/stats'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/admin/stats');
        if (!response.ok) throw new Error('Failed to fetch admin statistics');
        return await response.json();
      } catch (error) {
        console.error('Error fetching admin statistics:', error);
        toast({
          title: "Error",
          description: "Failed to load admin statistics",
          variant: "destructive"
        });
        return {
          usersCount: 0,
          activeUsers: 0,
          wordsCount: 0,
          totalWords: 0,
          questionsCount: 0,
          totalQuestions: 0,
          practiceSetsCount: 0,
          wordsTrend: 0,
          questionsTrend: 0,
          usersTrend: 0,
          practiceTrend: 0
        };
      }
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Memoized helper to get active tab label
  const getActiveTabLabel = useMemo(() => {
    return tabs.find(tab => tab.value === activeTab)?.label || "Dashboard";
  }, [activeTab, tabs]);

  // Search handler
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Render stat card
  const renderStatCard = (
    title: string, 
    value: number | undefined, 
    trend: number | undefined, 
    icon: React.ReactNode, 
    iconBgColor: string,
    iconTextColor: string,
    progressValue: number
  ) => (
    <Card className="bg-white dark:bg-gray-800 border-0 shadow-md hover:shadow-lg transition-shadow">
      <CardContent className="p-0">
        <div className="flex flex-col p-6">
          <div className="flex items-center justify-between mb-4">
            <div className={cn(
              "h-12 w-12 rounded-full flex items-center justify-center",
              iconBgColor
            )}>
              {React.cloneElement(icon as React.ReactElement, { className: `h-6 w-6 ${iconTextColor}` })}
            </div>
            <Badge 
              variant={(trend || 0) >= 0 ? "default" : "destructive"} 
              className={cn(
                "flex items-center gap-1",
                (trend || 0) >= 0 
                  ? "bg-green-100 text-green-800 hover:bg-green-100 border-green-200" 
                  : "bg-red-100 text-red-800 hover:bg-red-100 border-red-200"
              )}
            >
              {(trend || 0) >= 0 ? 
                <ArrowUpRight className="h-3 w-3" /> : 
                <ArrowDown className="h-3 w-3" />
              }
              <span>{Math.abs(trend || 0)}%</span>
            </Badge>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">{value?.toLocaleString() || "0"}</h3>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-500 dark:text-gray-400">Progress</span>
              <span className="font-medium">{progressValue}%</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
              <div 
                className={cn("h-2 rounded-full", iconBgColor)}
                style={{ width: `${progressValue}%` }} 
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Dashboard overview content
  const renderOverviewContent = () => (
    <div className="space-y-8">
      {/* Stats grid - 4 main stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Vocabulary Stats */}
        {renderStatCard(
          "Total Words", 
          adminStats?.totalWords,
          adminStats?.wordsTrend,
          <BookOpen />,
          "bg-primary/10",
          "text-primary",
          Math.min(100, Math.round((adminStats?.totalWords || 0) / 10))
        )}
        
        {/* Questions Stats */}
        {renderStatCard(
          "Total Questions", 
          adminStats?.totalQuestions,
          adminStats?.questionsTrend,
          <FileQuestion />,
          "bg-orange-500/10",
          "text-orange-500",
          Math.min(100, Math.round((adminStats?.totalQuestions || 0) / 5))
        )}
        
        {/* Users Stats */}
        {renderStatCard(
          "Active Users", 
          adminStats?.activeUsers,
          adminStats?.usersTrend,
          <Users />,
          "bg-purple-500/10",
          "text-purple-500",
          Math.min(100, Math.round((adminStats?.activeUsers || 0) / 2))
        )}
        
        {/* Practice Sets Stats */}
        {renderStatCard(
          "Practice Sets", 
          adminStats?.practiceSetsCount,
          adminStats?.practiceTrend,
          <ListChecks />,
          "bg-green-500/10",
          "text-green-500",
          Math.min(100, Math.round((adminStats?.practiceSetsCount || 0) / 1))
        )}
      </div>
      
      {/* Activity and Recent Updates Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-white dark:bg-gray-800 border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Activity Overview
            </CardTitle>
            <CardDescription>
              Recent activity across all platform modules
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {/* Activity items - sample data that would come from adminStats */}
              {[1, 2, 3, 4, 5].map((i) => (
                <li key={i} className="flex items-start gap-3 pb-4 border-b border-gray-100 dark:border-gray-700 last:border-0 last:pb-0">
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1",
                    i % 4 === 0 ? "bg-orange-100 text-orange-600" :
                    i % 4 === 1 ? "bg-green-100 text-green-600" :
                    i % 4 === 2 ? "bg-blue-100 text-blue-600" :
                    "bg-purple-100 text-purple-600"
                  )}>
                    {i % 4 === 0 ? <FileQuestion className="h-4 w-4" /> :
                     i % 4 === 1 ? <BookOpen className="h-4 w-4" /> :
                     i % 4 === 2 ? <Calculator className="h-4 w-4" /> :
                     <Users className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {i % 4 === 0 ? "New question added" :
                       i % 4 === 1 ? "10 new vocabulary words imported" :
                       i % 4 === 2 ? "Quantitative topic updated" :
                       "New user registered"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {i % 4 === 0 ? "Added by Admin" :
                       i % 4 === 1 ? "Bulk import by Admin" :
                       i % 4 === 2 ? "Updated by Admin" :
                       "New student account"}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {i % 3 === 0 ? "Just now" :
                       i % 3 === 1 ? "2 hours ago" :
                       "Yesterday"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Common administrative tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-1 divide-y divide-gray-100 dark:divide-gray-700">
              <Button 
                variant="ghost" 
                className="flex items-center justify-start gap-3 p-4 h-auto rounded-none text-left hover:bg-gray-50 dark:hover:bg-gray-800/70"
                onClick={() => setActiveTab("vocabulary")}
              >
                <div className="h-8 w-8 bg-primary/10 text-primary rounded-md flex items-center justify-center">
                  <BookOpen className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium">Add Vocabulary</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Add new words to the vocabulary database</p>
                </div>
              </Button>
              <Button 
                variant="ghost" 
                className="flex items-center justify-start gap-3 p-4 h-auto rounded-none text-left hover:bg-gray-50 dark:hover:bg-gray-800/70"
                onClick={() => setActiveTab("questions")}
              >
                <div className="h-8 w-8 bg-orange-500/10 text-orange-500 rounded-md flex items-center justify-center">
                  <FileQuestion className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium">Create Question</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Add new practice questions</p>
                </div>
              </Button>
              <Button 
                variant="ghost" 
                className="flex items-center justify-start gap-3 p-4 h-auto rounded-none text-left hover:bg-gray-50 dark:hover:bg-gray-800/70"
                onClick={() => setActiveTab("practice_sets")}
              >
                <div className="h-8 w-8 bg-green-500/10 text-green-500 rounded-md flex items-center justify-center">
                  <ListChecks className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium">Create Practice Set</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Build new practice sets for students</p>
                </div>
              </Button>
              <Button 
                variant="ghost" 
                className="flex items-center justify-start gap-3 p-4 h-auto rounded-none text-left hover:bg-gray-50 dark:hover:bg-gray-800/70"
                onClick={() => setActiveTab("users")}
              >
                <div className="h-8 w-8 bg-purple-500/10 text-purple-500 rounded-md flex items-center justify-center">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium">Manage Users</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">View and manage user accounts</p>
                </div>
              </Button>
              <Button 
                variant="ghost" 
                className="flex items-center justify-start gap-3 p-4 h-auto rounded-none text-left hover:bg-gray-50 dark:hover:bg-gray-800/70"
                onClick={() => setActiveTab("api_keys")}
              >
                <div className="h-8 w-8 bg-blue-500/10 text-blue-500 rounded-md flex items-center justify-center">
                  <Key className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium">Manage API Keys</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Configure external service integrations</p>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* System Status Section */}
      <Card className="bg-white dark:bg-gray-800 border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            System Status
          </CardTitle>
          <CardDescription>
            Overview of platform health and performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Database</p>
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Healthy</Badge>
              </div>
              <Progress value={92} className="h-1.5" />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">92% capacity available</p>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Server Load</p>
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Normal</Badge>
              </div>
              <Progress value={45} className="h-1.5" />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">45% of resources in use</p>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">API Health</p>
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Operational</Badge>
              </div>
              <Progress value={100} className="h-1.5" />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">All endpoints responding normally</p>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">API Keys</p>
                <Badge 
                  variant="outline" 
                  className="bg-blue-100 text-blue-800 hover:bg-blue-100"
                  onClick={() => setActiveTab("api_keys")}
                >
                  <Key className="h-3 w-3 mr-1" />
                  Configure
                </Badge>
              </div>
              <Progress value={60} className="h-1.5" />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                <button 
                  className="text-blue-500 hover:underline focus:outline-none"
                  onClick={() => setActiveTab("api_keys")}
                >
                  Manage API integrations
                </button>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Sidebar Navigation */}
      <div className={cn(
        "flex-shrink-0 bg-gray-50 dark:bg-gray-900 border-r dark:border-gray-800 w-64 transition-all duration-300 ease-in-out overflow-y-auto",
        "hidden md:block" // Hide on mobile, show on desktop
      )}>
        <div className="p-4">
          <div className="mb-6">
            <div className="flex items-center justify-center mb-4">
              <Gauge className="h-8 w-8 text-primary" />
              <h2 className="ml-2 text-xl font-bold">Admin Panel</h2>
            </div>
            <p className="text-sm text-center text-gray-500 dark:text-gray-400">
              Welcome back, {user.firstName || 'Admin'}
            </p>
          </div>
          
          <div className="my-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search..." 
                className="pl-9"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
          </div>
          
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  "w-full flex items-center px-3 py-3 gap-3 rounded-lg font-medium text-sm transition-all",
                  activeTab === tab.value 
                    ? "bg-primary/10 text-primary border-l-4 border-primary" 
                    : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                )}
              >
                <div className={cn(
                  "flex-shrink-0 h-9 w-9 rounded-lg flex items-center justify-center",
                  activeTab === tab.value 
                    ? "bg-primary/20" 
                    : "bg-gray-100 dark:bg-gray-800"
                )}>
                  {tab.icon}
                </div>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
          
          <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-800">
            <Button
              variant="outline"
              className="w-full justify-center"
              onClick={() => {
                // Refresh statistics
                void fetch('/api/admin/stats').then(res => {
                  if (res.ok) toast({ title: "Statistics refreshed" });
                });
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mobile Sidebar Toggle */}
      <div className="md:hidden fixed bottom-4 right-4 z-20">
        <Button
          size="icon"
          variant="default"
          className="h-12 w-12 rounded-full shadow-lg"
          onClick={() => {
            const sidebar = document.getElementById('mobile-sidebar');
            if (sidebar) sidebar.classList.toggle('translate-x-full');
          }}
        >
          <Menu className="h-6 w-6" />
        </Button>
      </div>
      
      {/* Mobile Sidebar */}
      <div
        id="mobile-sidebar"
        className="fixed inset-y-0 right-0 z-10 w-3/4 bg-white dark:bg-gray-900 shadow-xl transform translate-x-full transition-transform duration-300 ease-in-out md:hidden"
      >
        <div className="p-4 h-full overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center">
              <Gauge className="h-6 w-6 text-primary mr-2" />
              Admin Panel
            </h2>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                const sidebar = document.getElementById('mobile-sidebar');
                if (sidebar) sidebar.classList.add('translate-x-full');
              }}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search..." 
                className="pl-9"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
          </div>
          
          <nav className="space-y-1 mt-4">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => {
                  setActiveTab(tab.value);
                  const sidebar = document.getElementById('mobile-sidebar');
                  if (sidebar) sidebar.classList.add('translate-x-full');
                }}
                className={cn(
                  "w-full flex items-center px-3 py-3 gap-3 rounded-lg font-medium text-sm transition-all",
                  activeTab === tab.value 
                    ? "bg-primary/10 text-primary border-l-4 border-primary" 
                    : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                )}
              >
                <div className={cn(
                  "flex-shrink-0 h-9 w-9 rounded-lg flex items-center justify-center",
                  activeTab === tab.value 
                    ? "bg-primary/20" 
                    : "bg-gray-100 dark:bg-gray-800"
                )}>
                  {tab.icon}
                </div>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto">
          <header className="mb-6">
            <h1 className="text-2xl font-bold">{tabs.find(t => t.value === activeTab)?.label || 'Dashboard'}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage your {tabs.find(t => t.value === activeTab)?.label.toLowerCase() || 'dashboard'} settings
            </p>
          </header>
          
          {/* Content Sections */}
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <Suspense fallback={<ContentSkeleton />}>
              {activeTab === 'overview' && (
                isLoadingStats ? <ContentSkeleton /> : renderOverviewContent()
              )}
              
              {activeTab === 'vocabulary' && <VocabularyManager searchTerm={searchTerm} />}
              {activeTab === 'verbal' && <VerbalContentManager searchTerm={searchTerm} />}
              {activeTab === 'quantitative' && <QuantitativeContentManager searchTerm={searchTerm} />}
              {activeTab === 'questions' && <QuestionsManager searchTerm={searchTerm} />}
              {activeTab === 'practice_sets' && <PracticeSetsManager searchTerm={searchTerm} />}
              {activeTab === 'users' && <UsersManager searchTerm={searchTerm} />}
              {activeTab === 'access' && <ContentAccessManager searchTerm={searchTerm} />}
              {activeTab === 'api_keys' && <ApiKeyManager searchTerm={searchTerm} />}
              {activeTab === 'blog' && <BlogManager />}
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;