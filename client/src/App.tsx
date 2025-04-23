import { useState, useEffect } from "react";
import { Switch, Route, useLocation, Link } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

import Dashboard from "@/pages/Dashboard";
import Vocabulary from "@/pages/Vocabulary";
import VocabularySpacedRepetition from "@/pages/VocabularySpacedRepetition";
import VocabularyBookmarks from "@/pages/VocabularyBookmarks";
import QuantitativeContent from "@/pages/QuantitativeContent";
import VerbalContent from "@/pages/VerbalContent";
import LearnCategories from "@/pages/LearnCategories";
import Practice from "@/features/practice";
import Progress from "@/pages/Progress";
import InteractiveDashboard from "@/pages/InteractiveDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import SubscriptionPlans from "@/pages/SubscriptionPlans";
import Profile from "@/pages/Profile";
import LandingPage from "@/pages/LandingPage.enhanced";
import NotFound from "@/pages/not-found";
// Essay Components
import EssayPrompts from "@/pages/EssayPrompts";
import EssayWriting from "@/pages/EssayWriting";
import EssayHistory from "@/pages/EssayHistory";
import EssayView from "@/pages/EssayView";
// Blog Components
import Blog from "@/pages/Blog";
import BlogPost from "@/pages/BlogPost";
import BlogCategory from "@/pages/BlogCategory";
import BlogSearch from "@/pages/BlogSearch";
// Header component removed
import Footer from "@/components/common/Footer";
import MobileNavbar from "@/components/common/MobileNavbar";
import { User } from "@shared/schema";
import { MainNav, ProfileMenu } from "@/components/navigation";
import Logo from "@/components/common/Logo";
import ThemeSwitcher from "@/components/common/ThemeSwitcher";
import { Button } from "@/components/ui/button";
import { Menu, X, Timer, Home, ChevronRight } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import PomodoroTimer from "@/components/tools/PomodoroTimer";

// Global AppLayout component that contains the navigation bar
const AppLayout = ({ 
  children, 
  user, 
  title = "",
  onLogout
}: { 
  children: React.ReactNode, 
  user: User | null, 
  title?: string,
  onLogout?: () => void 
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const isMobile = useIsMobile();
  const [location] = useLocation();
  const [pomodoroOpen, setPomodoroOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // User initials avatar component
  const UserAvatar = () => (
    <div className="h-8 w-8 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary font-medium text-sm">
      {user?.firstName?.[0]}{user?.lastName?.[0]}
    </div>
  );

  // LogoWithControls component with proper styling
  const LogoWithControls = () => (
    <div className="flex items-center">
      <Link href="/dashboard" className="flex items-center gap-2 group">
        <Logo 
          size={36} 
          color="text-primary" 
          hoverEffect="glow" 
          showText 
          className="transition-all duration-200"
        />
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-background relative">
      {/* Mobile menu overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity ${
          mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Mobile navigation drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-[280px] bg-white dark:bg-gray-900 shadow-xl dark:shadow-emerald-900/20 z-50 transform transition-transform duration-300 ease-out md:hidden ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-5 border-b dark:border-gray-800 flex justify-between items-center">
          <LogoWithControls />
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)} className="text-gray-700 dark:text-gray-300">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {user && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800 flex items-center gap-3 border-b dark:border-gray-700">
            <UserAvatar />
            <div>
              <div className="font-medium dark:text-white">{user.firstName} {user.lastName}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{user.email}</div>
            </div>
          </div>
        )}
        <nav className="p-4">
          <div className="text-xs font-semibold text-gray-400 dark:text-gray-300 uppercase tracking-wider px-2 mb-3">Menu</div>
          <ul className="space-y-1">
            {[
              { href: "/dashboard", icon: <Home className="h-5 w-5" />, label: "Dashboard" },
              { href: "/quantitative", icon: <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="12 2 19 8 19 21 5 21 5 8 12 2" />
                    <line x1="9" y1="21" x2="9" y2="8" />
                    <line x1="15" y1="21" x2="15" y2="8" />
                    <line x1="5" y1="8" x2="19" y2="8" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <line x1="5" y1="16" x2="19" y2="16" />
                  </svg>,
                label: "Quantitative"
              },
              { href: "/verbal", icon: <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 19V5a2 2 0 0 1 2-2h13.4a.6.6 0 0 1 .6.6v13.8a.6.6 0 0 1-.6.6H6a2 2 0 0 1-2 2" />
                    <path d="M10 10H8" />
                    <path d="M15 10h-3" />
                    <path d="M10 14H8" />
                    <path d="M15 14h-3" />
                  </svg>,
                label: "Verbal"
              },
              { href: "/practice", icon: <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5l6.74-6.76z" />
                    <line x1="16" y1="8" x2="2" y2="22" />
                    <line x1="17.5" y1="15" x2="9" y2="15" />
                  </svg>,
                label: "Practice"
              },
              { href: "/progress", icon: <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 20V10" />
                    <path d="M18 20V4" />
                    <path d="M6 20v-6" />
                  </svg>,
                label: "Progress"
              },
            ].map((item, index) => (
              <li key={index}>
                <Link href={item.href}>
                  <div className={`flex items-center rounded-lg px-3 py-2.5 ${
                    location === item.href
                      ? 'bg-primary/10 text-primary font-medium dark:bg-primary/20'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-primary transition-colors'
                  }`}>
                    <span className="mr-3">{item.icon}</span>
                    {item.label}
                  </div>
                </Link>
              </li>
            ))}

            {user?.isAdmin && (
              <li>
                <Link href="/admin">
                  <div className={`flex items-center rounded-lg px-3 py-2.5 ${
                    location === '/admin'
                      ? 'bg-primary/10 text-primary font-medium dark:bg-primary/20'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-primary transition-colors'
                  }`}>
                    <span className="mr-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z" />
                        <path d="M12 9v3l1.5 1.5" />
                        <path d="M18.2 5a8 8 0 0 0-11.8 0" />
                      </svg>
                    </span>
                    {"Admin"}
                  </div>
                </Link>
              </li>
            )}
          </ul>

          <div className="mt-8 pt-4 border-t dark:border-gray-700">
            <div className="text-xs font-semibold text-gray-400 dark:text-gray-300 uppercase tracking-wider px-2 mb-3">Preferences</div>
            <div className="px-3 py-2">
              <ThemeSwitcher />
            </div>
          </div>
        </nav>
      </div>

      {/* Simplified header - only mezuniyet şapkası and theme/language toggle */}
      <div 
        className={`sticky top-0 z-30 w-full transition-all duration-300 ${
          isScrolled
            ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-sm'
            : 'bg-white/70 dark:bg-gray-900/80 backdrop-blur-md'
        }`}
      >
        <div className="container mx-auto">
          <div className="flex items-center justify-between py-3 px-3">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setMobileMenuOpen(true)} 
                className="md:hidden rounded-full h-9 w-9 text-gray-600 dark:text-gray-300 hover:bg-primary/5 hover:text-primary"
              >
                <Menu className="h-5 w-5" />
              </Button>
              
              <div className="flex items-center">
                <Link href="/dashboard" className="flex items-center gap-2 group mr-4">
                  <Logo 
                    size={36} 
                    color="text-primary" 
                    hoverEffect="glow" 
                    showText={!isMobile}
                    className="transition-all duration-200"
                  />
                </Link>
              </div>
              
              {/* Main Navigation - desktop only */}
              <div className="hidden md:block">
                <MainNav user={user} />
              </div>
              
              {/* Page title - mobile only */}
              {!isMobile && location !== '/dashboard' && title && (
                <h1 className="ml-4 text-lg font-medium text-gray-800 dark:text-gray-200 md:hidden">{title}</h1>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {/* Pomodoro button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPomodoroOpen(prev => !prev)}
                className={`rounded-full w-8 h-8 hover:bg-gray-100 dark:hover:bg-gray-800 ${
                  pomodoroOpen ? 'text-primary' : 'text-gray-500'
                }`}
                title="Pomodoro Timer"
                aria-label="Toggle Pomodoro Timer"
              >
                <Timer size={18} />
              </Button>
              
              {/* Theme switcher */}
              <div className="hidden md:flex">
                <ThemeSwitcher />
              </div>
              
              {user && (
                <div className="flex items-center gap-3 ml-1">
                  {/* Visible on mobile only */}
                  {isMobile && <UserAvatar />}
                  
                  {/* Desktop profile menu with dropdown */}
                  <ProfileMenu user={user} onLogout={onLogout} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-2 pb-4 md:py-8">
        {/* Main content */}
        <div className="space-y-4 md:space-y-6">
          {children}
        </div>
      </div>

      {/* Pomodoro Timer */}
      <PomodoroTimer isOpen={pomodoroOpen} onOpenChange={setPomodoroOpen} standalone={true} />
    </div>
  );
};

function Router() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Use React Query for authenticated user data with error handling and caching
  const { 
    data: userData,
    isLoading: loading,
    error: authError
  } = useQuery<{success: boolean; user: User | null}>({ 
    queryKey: ['/api/auth/user'],
    staleTime: 1000 * 60 * 15, // 15 minutes
    retry: false, // Don't retry on 401 Unauthorized
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true
  });
  
  // Extract user from query response or set to null
  const user = userData?.success && userData.user ? userData.user : null;
  
  // Log authentication status when it changes (for debugging)
  useEffect(() => {
    if (user) {
      console.log("User authenticated successfully:", {
        id: user.id,
        username: user.username,
        firstName: user.firstName || null,
        lastName: user.lastName || null,
        isAdmin: user.isAdmin || false,
        userType: user.userType || 'free'
      });
    } else if (!loading) {
      console.log("User not authenticated");
    }
  }, [user, loading]);

  const isAuthenticated = !!user;
  const isAdmin = user?.isAdmin || user?.userType === 'admin' || false;

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include"
      });
      
      // Invalidate auth queries
      await queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      
      // Hard redirect to landing page to ensure clean state
      window.location.replace("/");
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout.",
        variant: "destructive"
      });
    }
  };

  // Show loading state only on initial page load
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground text-sm">Loading application...</p>
        </div>
      </div>
    );
  }

  // Protected route component with smoother loading transition
  const ProtectedRoute = ({ component: Component, adminOnly = false, title = "", ...rest }: any) => {
    const [isRedirecting, setIsRedirecting] = useState(false);
    
    useEffect(() => {
      // If not authenticated, redirect to home/login page
      if (!isAuthenticated) {
        setIsRedirecting(true);
        // Add a small delay for a smoother transition
        const redirectTimer = setTimeout(() => {
          if (location !== "/login" && location !== "/register" && location !== "/") {
            setLocation("/");
          }
        }, 50);
        
        return () => clearTimeout(redirectTimer);
      } 
      // If user is not admin but tries to access admin page
      else if (adminOnly && !isAdmin) {
        setIsRedirecting(true);
        // Add a small delay for a smoother transition
        const redirectTimer = setTimeout(() => {
          setLocation("/dashboard");
        }, 50);
        
        return () => clearTimeout(redirectTimer);
      }
    }, [isAuthenticated, isAdmin, location]);

    // During redirect or if unauthorized, show a minimal loading state
    // This prevents flickering between pages
    if (isRedirecting || !isAuthenticated || (adminOnly && !isAdmin)) {
      return (
        <div className="opacity-0 transition-opacity duration-300">
          {/* Invisible placeholder */}
        </div>
      );
    }

    // Wrap all protected routes with the AppLayout
    return (
      <AppLayout user={user} title={title || ""} onLogout={handleLogout}>
        <Component {...rest} user={user} />
      </AppLayout>
    );
  };

  const showHeader = !(
    (!isAuthenticated && location === "/") || 
    location === "/login" || 
    location === "/register" || 
    location === "/forgot-password" || 
    location === "/reset-password"
  );

  // Check if we're on a page that uses DashboardLayout
  const isAppLayoutPage = isAuthenticated && (
    location === "/dashboard" ||
    location.startsWith("/vocabulary") ||
    location === "/quantitative" ||
    location === "/verbal" ||
    location === "/learn" ||
    location === "/practice" ||
    location === "/progress" ||
    location === "/dashboard/interactive" ||
    location === "/subscription-plans" ||
    location === "/admin" ||
    location === "/admin/tools" ||
    location.startsWith("/essays")
  );

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow">
        <Switch>
          <Route path="/login">
            {isAuthenticated ? (
              <ProtectedRoute component={Dashboard} title="Dashboard" />
            ) : (
              <Login 
                onLoginSuccess={async () => {
                  await queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
                }} 
              />
            )}
          </Route>
          <Route path="/register">
            {isAuthenticated ? (
              <ProtectedRoute component={Dashboard} title="Dashboard" />
            ) : (
              <Register 
                onRegisterSuccess={async () => {
                  await queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
                }}
              />
            )}
          </Route>
          <Route path="/forgot-password">
            {isAuthenticated ? <ProtectedRoute component={Dashboard} title="Dashboard" /> : <ForgotPassword />}
          </Route>
          <Route path="/reset-password">
            {isAuthenticated ? <ProtectedRoute component={Dashboard} title="Dashboard" /> : <ResetPassword />}
          </Route>
          <Route path="/dashboard">
            <ProtectedRoute component={Dashboard} title="Dashboard" />
          </Route>
          <Route path="/vocabulary">
            <ProtectedRoute component={Vocabulary} title="Vocabulary" />
          </Route>
          <Route path="/vocabulary-spaced-repetition">
            <ProtectedRoute component={VocabularySpacedRepetition} title="Spaced Repetition" />
          </Route>
          <Route path="/vocabulary-bookmarks">
            <ProtectedRoute component={VocabularyBookmarks} title="Bookmarked Words" />
          </Route>
          
          <Route path="/vocabulary-practice">
            <ProtectedRoute 
              component={(props: { userData?: User }) => <Practice {...props} showVocabPractice={true} />} 
              title="Vocabulary Practice" 
            />
          </Route>
          
          <Route path="/quantitative">
            <ProtectedRoute component={QuantitativeContent} title="Quantitative" />
          </Route>
          <Route path="/verbal">
            <ProtectedRoute component={VerbalContent} title="Verbal" />
          </Route>
          <Route path="/learn">
            <ProtectedRoute component={LearnCategories} title="Learn" />
          </Route>
          <Route path="/practice/results/:id">
            <ProtectedRoute component={Practice} title="Practice Results" />
          </Route>
          <Route path="/practice">
            <ProtectedRoute component={Practice} title="Practice" />
          </Route>
          <Route path="/progress">
            <ProtectedRoute component={Progress} title="Progress" />
          </Route>
          <Route path="/dashboard/interactive">
            <ProtectedRoute component={InteractiveDashboard} title="Interactive Dashboard" />
          </Route>

          <Route path="/subscription-plans">
            <ProtectedRoute component={SubscriptionPlans} title="Subscription Plans" />
          </Route>
          <Route path="/admin">
            <ProtectedRoute component={AdminDashboard} adminOnly={true} title="Admin Dashboard" />
          </Route>
          
          <Route path="/profile">
            <ProtectedRoute component={Profile} title="Profile" />
          </Route>

          {/* Blog Routes */}
          <Route path="/blog">
            <AppLayout user={user} onLogout={handleLogout}>
              <Blog />
            </AppLayout>
          </Route>
          
          <Route path="/blog/category/:slug">
            <AppLayout user={user} onLogout={handleLogout}>
              <BlogCategory />
            </AppLayout>
          </Route>
          
          <Route path="/blog/search">
            <AppLayout user={user} onLogout={handleLogout}>
              <BlogSearch />
            </AppLayout>
          </Route>
          
          <Route path="/blog/:slug">
            <AppLayout user={user} onLogout={handleLogout}>
              <BlogPost />
            </AppLayout>
          </Route>
          <Route path="/admin/tools">
            <ProtectedRoute component={AdminDashboard} adminOnly={true} title="Admin Tools" />
          </Route>
          {/* Essay Routes */}
          <Route path="/essays">
            <ProtectedRoute component={EssayPrompts} title="Essay Prompts" />
          </Route>
          <Route path="/essays/prompts">
            <ProtectedRoute component={EssayPrompts} title="Essay Prompts" />
          </Route>
          <Route path="/essays/write/:id">
            <ProtectedRoute component={EssayWriting} title="Write Essay" />
          </Route>
          <Route path="/essays/history">
            <ProtectedRoute component={EssayHistory} title="Essay History" />
          </Route>
          <Route path="/essays/view/:id">
            <ProtectedRoute component={EssayView} title="View Essay" />
          </Route>
          <Route path="/">
            {isAuthenticated ? <ProtectedRoute component={Dashboard} title="Dashboard" /> : <LandingPage />}
          </Route>
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div>
        <Router />
        <Toaster />
      </div>
    </QueryClientProvider>
  );
}

export default App;