import React, { useState, useEffect } from 'react';
import { Link, useLocation } from "wouter";
import { User } from "@shared/schema";
import { useThemeLanguage } from "@/hooks/use-theme-language";
import { 
  Home, 
  BookOpen, 
  Menu as MenuIcon,
  Map, 
  PenTool, 
  BarChart2, 
  LightbulbIcon, 
  UserIcon,
  LogOut,
  Settings,
  Calculator,
  BookMarked,
  CreditCard,
  ChevronRight,
  X,
  Bell,
  Award,
  FileText,
  LayoutDashboard,
  GraduationCap,
  Dumbbell
} from "lucide-react";
import ThemeLanguageSwitcher from "@/components/common/ThemeLanguageSwitcher";
import { Button } from "@/components/ui/button";
import Logo from "@/components/common/Logo";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";

interface MobileNavbarProps {
  user: User | null;
  onLogout?: () => void;
}

const MobileNavbar = ({ user, onLogout }: MobileNavbarProps) => {
  const [location] = useLocation();
  const { t } = useThemeLanguage();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY <= 20) {
        setIsNavbarVisible(true);
        setScrollDirection(null);
        setLastScrollY(currentScrollY);
        return;
      }
      
      if (currentScrollY > lastScrollY && scrollDirection !== 'down') {
        // Scrolling down, hide navbar after a threshold
        if (currentScrollY > 70) {
          setScrollDirection('down');
          setIsNavbarVisible(false);
        }
      } else if (currentScrollY < lastScrollY && scrollDirection !== 'up') {
        // Scrolling up, show navbar
        setScrollDirection('up');
        setIsNavbarVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, scrollDirection]);

  // Close menus when location changes
  useEffect(() => {
    setProfileMenuOpen(false);
    setSidebarOpen(false);
  }, [location]);

  if (!user) return null;

  // Determine if a nav item is active
  const isActive = (path: string) => {
    if (path === '/learn') {
      return location.includes('/quantitative') || location.includes('/verbal') || location === '/learn';
    }
    if (path === '/essays') {
      return location.startsWith('/essays');
    }
    if (path === '/dashboard') {
      return location.startsWith('/dashboard');
    }
    if (path === '/practice') {
      return location.startsWith('/practice');
    }
    if (path === '/blog') {
      return location.startsWith('/blog');
    }
    if (path === '/admin') {
      return location.startsWith('/admin');
    }
    return location === path;
  };

  // Handle special cases for the Learn section
  const getLearnPath = () => {
    if (location.includes('/quantitative') || location.includes('/verbal')) {
      return location;
    }
    return '/learn';
  };

  const toggleProfileMenu = () => {
    setProfileMenuOpen(!profileMenuOpen);
    if (sidebarOpen) setSidebarOpen(false);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
    if (profileMenuOpen) setProfileMenuOpen(false);
  };

  // Define navigation items for mobile
  const navigationItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/dashboard' },
    { icon: <GraduationCap size={20} />, label: 'Learn', path: '/learn' },
    { icon: <Dumbbell size={20} />, label: 'Practice', path: '/practice' },
    { icon: <FileText size={20} />, label: 'Blog', path: '/blog' },
  ];

  // Admin-only navigation items
  const adminItems = [
    { icon: <Settings size={20} />, label: 'Admin Dashboard', path: '/admin' },
  ];

  return (
    <>
      {/* Fixed Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 md:hidden z-40 py-2 px-2 shadow-lg dark:shadow-gray-950/20">
        <div className="flex items-center justify-between mx-2">
          {/* Menu Button */}
          <Button 
            variant={sidebarOpen ? "default" : "ghost"}
            size="icon"
            onClick={toggleSidebar}
            className={`rounded-full w-12 h-12 ${
              sidebarOpen
                ? 'bg-primary/15 text-primary shadow-inner' 
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <MenuIcon size={22} />
          </Button>
          
          {/* Main Navigation Items */}
          <div className="flex items-center justify-center space-x-3">
            {navigationItems.slice(0, 3).map((item, index) => (
              <Link key={index} href={item.path}>
                <Button
                  variant={isActive(item.path) ? "default" : "ghost"}
                  size="icon"
                  className={`rounded-full w-12 h-12 ${
                    isActive(item.path) 
                      ? 'bg-primary/15 text-primary shadow-inner' 
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {item.icon}
                  {isActive(item.path) && (
                    <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary"></span>
                  )}
                </Button>
              </Link>
            ))}
          </div>
          
          {/* Profile Button */}
          <Button
            variant={profileMenuOpen ? "default" : "ghost"}
            size="icon"
            onClick={toggleProfileMenu}
            className={`rounded-full w-12 h-12 relative ${
              profileMenuOpen 
                ? 'bg-primary/15 text-primary shadow-inner' 
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <UserIcon size={22} />
            {user.subscriptionStatus === 'active' && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-yellow-500 rounded-full"></span>
            )}
            {profileMenuOpen && (
              <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary"></span>
            )}
          </Button>
        </div>
      </div>

      {/* Sidebar Drawer - Backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm md:hidden z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>
      
      {/* Sidebar Drawer - Content */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            className="fixed left-0 top-0 bottom-0 w-[300px] max-w-[80%] bg-white dark:bg-gray-900 shadow-xl md:hidden z-50 overflow-hidden flex flex-col"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
          >
            {/* Header with gradient and logo */}
            <div className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-transparent dark:from-primary/30 dark:via-primary/15 dark:to-transparent">
              <div className="absolute top-4 right-4">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full bg-white/80 dark:bg-gray-800/80 border-0 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 shadow-sm"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X size={16} />
                </Button>
              </div>
              
              <div className="px-6 pt-8 pb-6">
                <Link href="/dashboard" className="flex items-center gap-3">
                  <div className="p-2.5 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                    <GraduationCap className="h-7 w-7 text-primary" />
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white text-xl">PrepJet</span>
                </Link>
              </div>
              
              {user && (
                <div className="px-6 pb-5 flex items-center gap-3">
                  <div className="h-11 w-11 rounded-full flex items-center justify-center bg-white dark:bg-gray-800 shadow-sm">
                    <span className="font-semibold text-primary text-sm">
                      {user.firstName?.[0] || ''}{user.lastName?.[0] || ''}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{user.firstName} {user.lastName}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{user.email}</div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Navigation Menu */}
            <div className="flex-1 overflow-y-auto px-5 pt-5 pb-4">
              <div className="mb-3 px-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Menu
              </div>
              <div className="space-y-2">
                {navigationItems.map((item, index) => (
                  <Link key={index} href={item.path}>
                    <motion.div 
                      className={`flex items-center px-3 py-3.5 rounded-xl ${
                        isActive(item.path) 
                          ? "bg-primary/10 text-primary font-medium" 
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      }`}
                      whileHover={{ x: 3 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className={`w-9 h-9 flex items-center justify-center rounded-lg mr-3.5 ${
                        isActive(item.path) 
                          ? "text-primary bg-primary/15" 
                          : "text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800/50"
                      }`}>
                        {item.icon}
                      </div>
                      <span className={`flex-1 ${isActive(item.path) ? "text-primary font-medium" : "font-medium"}`}>{item.label}</span>
                    </motion.div>
                  </Link>
                ))}
                
                {/* Admin-only items */}
                {user.isAdmin && (
                  <>
                    <div className="pt-4 pb-2 px-2 mt-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                        <Badge variant="outline" className="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800 px-1.5 py-0 h-4">Admin</Badge>
                        <span>Controls</span>
                      </div>
                    </div>
                    {adminItems.map((item, index) => (
                      <Link key={index} href={item.path}>
                        <motion.div 
                          className={`flex items-center px-3 py-3.5 rounded-xl ${
                            isActive(item.path) 
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium" 
                              : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                          }`}
                          whileHover={{ x: 3 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <div className={`w-9 h-9 flex items-center justify-center rounded-lg mr-3.5 ${
                            isActive(item.path) 
                              ? "text-amber-600 dark:text-amber-400 bg-amber-500/15" 
                              : "text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800/50"
                          }`}>
                            {item.icon}
                          </div>
                          <span className={`flex-1 ${isActive(item.path) ? "text-amber-600 dark:text-amber-400 font-medium" : "font-medium"}`}>{item.label}</span>
                        </motion.div>
                      </Link>
                    ))}
                  </>
                )}
              </div>
              
              {/* User Info */}
              <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3 px-4 mb-4">
                  <div className="h-10 w-10 rounded-full overflow-hidden bg-primary text-white flex items-center justify-center">
                    <span className="font-medium">
                      {user?.firstName && user?.lastName 
                        ? `${user.firstName[0]}${user.lastName[0]}`
                        : user?.username ? user.username[0].toUpperCase() : 'U'}
                    </span>
                  </div>
                  
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {user.firstName && user.lastName 
                        ? `${user.firstName} ${user.lastName}`
                        : user.username || 'User'}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{user.email || ''}</div>
                  </div>
                </div>
                
                {/* Theme Switcher */}
                <div className="px-4 mb-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Appearance</div>
                  <ThemeLanguageSwitcher />
                </div>
                
                {/* Logout Button */}
                <div className="px-4 pt-2">
                  <Button 
                    variant="secondary" 
                    className="w-full justify-start text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40"
                    onClick={onLogout}
                  >
                    <LogOut size={18} className="mr-2" />
                    {t('action.logout')}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Menu Drawer - Backdrop */}
      <AnimatePresence>
        {profileMenuOpen && (
          <motion.div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm md:hidden z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setProfileMenuOpen(false)}
          />
        )}
      </AnimatePresence>
      
      {/* Profile Menu Drawer - Content */}
      <AnimatePresence>
        {profileMenuOpen && (
          <motion.div 
            className="fixed left-0 right-0 bottom-20 bg-white dark:bg-gray-900 rounded-t-2xl shadow-xl dark:shadow-gray-900/30 md:hidden z-50 overflow-hidden max-h-[80vh]"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
          >
            {/* Drag handle */}
            <div className="w-12 h-1 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto my-3"></div>
            
            {/* User profile header */}
            <div className="relative px-5 py-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-primary/20 bg-primary/10">
                    <div className="h-full w-full flex items-center justify-center">
                      <span className="font-bold text-lg text-primary">
                        {user?.firstName && user?.lastName 
                          ? `${user.firstName[0]}${user.lastName[0]}`
                          : user?.username ? user.username[0].toUpperCase() : 'U'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Premium badge */}
                  {user.subscriptionStatus === 'active' && (
                    <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-white rounded-full h-5 w-5 flex items-center justify-center shadow-md">
                      <Award size={12} />
                    </div>
                  )}
                </div>
                
                <div>
                  <div className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                    {user.firstName && user.lastName 
                      ? `${user.firstName} ${user.lastName}`
                      : user.username || 'User'}
                    
                    {user.isAdmin && (
                      <Badge variant="secondary" className="text-xs font-normal ml-1 px-1.5 py-0">Admin</Badge>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{user.email || ''}</div>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="icon-sm"
                className="absolute right-3 top-3 text-gray-500"
                onClick={() => setProfileMenuOpen(false)}
              >
                <X size={16} />
              </Button>
            </div>
            
            {/* Profile menu options */}
            <div className="p-4 space-y-3 overflow-y-auto">
              {/* Day progress */}
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 px-4 py-3 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Current Progress</div>
                  <div className="bg-primary/15 text-primary font-semibold px-3 py-1 rounded-full text-sm">
                    Day {user.currentDay || 1}
                  </div>
                </div>
                
                <div className="mt-2 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-primary h-full rounded-full" 
                    style={{ width: `${Math.min(100, (user.currentDay || 1) * 3.33)}%` }}
                  ></div>
                </div>
                
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex justify-between">
                  <span>Starting</span>
                  <span>{Math.min(100, Math.round((user.currentDay || 1) * 3.33))}% completed</span>
                </div>
              </div>
              
              {/* Profile options */}
              <div className="space-y-1.5">
                <Link href="/profile">
                  <motion.div 
                    className={`flex items-center px-3 py-3.5 rounded-xl ${
                      location === "/profile" 
                        ? "bg-primary/10 text-primary font-medium" 
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    }`}
                    whileHover={{ x: 3 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className={`w-9 h-9 flex items-center justify-center rounded-lg mr-3.5 ${
                      location === "/profile" 
                        ? "text-primary bg-primary/15" 
                        : "text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800/50"
                    }`}>
                      <UserIcon size={18} />
                    </div>
                    <span className={`flex-1 ${location === "/profile" ? "text-primary font-medium" : "font-medium"}`}>Profile</span>
                  </motion.div>
                </Link>
                
                <Link href="/progress">
                  <motion.div 
                    className={`flex items-center px-3 py-3.5 rounded-xl ${
                      location === "/progress" 
                        ? "bg-primary/10 text-primary font-medium" 
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    }`}
                    whileHover={{ x: 3 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className={`w-9 h-9 flex items-center justify-center rounded-lg mr-3.5 ${
                      location === "/progress" 
                        ? "text-primary bg-primary/15" 
                        : "text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800/50"
                    }`}>
                      <BarChart2 size={18} />
                    </div>
                    <span className={`flex-1 ${location === "/progress" ? "text-primary font-medium" : "font-medium"}`}>{t('nav.progress')}</span>
                  </motion.div>
                </Link>
                
                <Link href="/subscription-plans">
                  <motion.div 
                    className={`flex items-center px-3 py-3.5 rounded-xl ${
                      location === "/subscription-plans" 
                        ? "bg-primary/10 text-primary font-medium" 
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    }`}
                    whileHover={{ x: 3 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className={`w-9 h-9 flex items-center justify-center rounded-lg mr-3.5 ${
                      location === "/subscription-plans" 
                        ? "text-primary bg-primary/15" 
                        : "text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800/50"
                    }`}>
                      <CreditCard size={18} />
                    </div>
                    <span className={`flex-1 ${location === "/subscription-plans" ? "text-primary font-medium" : "font-medium"}`}>Subscription</span>
                  </motion.div>
                </Link>
                
                <Link href="/calculator">
                  <motion.div 
                    className={`flex items-center px-3 py-3.5 rounded-xl ${
                      location === "/calculator" 
                        ? "bg-primary/10 text-primary font-medium" 
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    }`}
                    whileHover={{ x: 3 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className={`w-9 h-9 flex items-center justify-center rounded-lg mr-3.5 ${
                      location === "/calculator" 
                        ? "text-primary bg-primary/15" 
                        : "text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800/50"
                    }`}>
                      <Calculator size={18} />
                    </div>
                    <span className={`flex-1 ${location === "/calculator" ? "text-primary font-medium" : "font-medium"}`}>GRE Calculator</span>
                  </motion.div>
                </Link>
                
                <Link href="/vocabulary-bookmarks">
                  <motion.div 
                    className={`flex items-center px-3 py-3.5 rounded-xl ${
                      location === "/vocabulary-bookmarks" 
                        ? "bg-primary/10 text-primary font-medium" 
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    }`}
                    whileHover={{ x: 3 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className={`w-9 h-9 flex items-center justify-center rounded-lg mr-3.5 ${
                      location === "/vocabulary-bookmarks" 
                        ? "text-primary bg-primary/15" 
                        : "text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800/50"
                    }`}>
                      <BookMarked size={18} />
                    </div>
                    <span className={`flex-1 ${location === "/vocabulary-bookmarks" ? "text-primary font-medium" : "font-medium"}`}>Bookmarks</span>
                  </motion.div>
                </Link>
              </div>
              
              {/* Logout button */}
              <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-800">
                <Button 
                  variant="secondary" 
                  className="w-full justify-start text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40"
                  onClick={onLogout}
                >
                  <LogOut size={18} className="mr-2" />
                  {t('action.logout')}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileNavbar;