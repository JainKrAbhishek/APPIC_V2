import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useThemeLanguage } from "@/hooks/use-theme-language";
import ThemeLanguageSwitcher from "@/components/common/ThemeLanguageSwitcher";
import { LogOut, BarChart2, User as UserIcon, Timer } from "lucide-react";
import Logo from "@/components/common/Logo";
import PomodoroTimer from "@/components/tools/PomodoroTimer";

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
}

const Header = ({ user, onLogout }: HeaderProps) => {
  const [location] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [pomodoroOpen, setPomodoroOpen] = useState(false);
  const { t } = useThemeLanguage();

  // Handle scroll event for header styling
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-md' : 'bg-transparent'
    }`}>
      <div className="container mx-auto px-4 flex justify-between items-center h-20">
        <div className="flex items-center">
          <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-1.5 group">
            {user ? (
              <>
                <Logo 
                  size={40}
                  color="text-primary"
                  hoverEffect="glow" 
                  showText={false}
                />
                <div className="hidden md:flex flex-col">
                  <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white">PrepJet</span>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 -mt-1">{t('app.title')}</span>
                </div>
              </>
            ) : (
              <>
                <Logo 
                  size={40}
                  color="text-primary"
                  hoverEffect="glow" 
                  showText={false}
                />
                <div className="flex flex-col">
                  <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white">PrepJet</span>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 -mt-1">{t('app.title')}</span>
                </div>
              </>
            )}
          </Link>
        </div>
        
        {/* Navigation bar removed */}
        
        <div className="flex items-center gap-4">
          {user ? (
            <>
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
              
              <ThemeLanguageSwitcher />
              
              <div className="hidden md:flex items-center gap-1 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-full">
                <div className="text-gray-500 dark:text-gray-400 text-sm ml-1">Day</div>
                <div className="bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full text-sm">
                  {user.currentDay || 1}
                </div>
              </div>
            
              <div className="relative group hidden md:block">
                <div className="h-10 w-10 rounded-full flex items-center justify-center bg-gradient-to-br from-primary to-primary-dark text-white font-medium shadow-md cursor-pointer">
                  {user.firstName && user.lastName 
                    ? user.firstName.charAt(0) + user.lastName.charAt(0)
                    : user.username 
                      ? user.username.charAt(0).toUpperCase() 
                      : 'U'}
                </div>
                
                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right">
                  <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                    <div className="font-medium text-gray-800 dark:text-white">
                      {user.firstName && user.lastName 
                        ? `${user.firstName} ${user.lastName}`
                        : user.username || 'User'}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{user.email || ''}</div>
                    <div className="text-xs mt-1 text-gray-400 dark:text-gray-500">
                      {user.id ? `User ID: ${user.id}` : ''}
                    </div>
                  </div>
                  <div className="p-2 space-y-1">
                    <Link href="/profile">
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <UserIcon size={16} className="mr-2" />
                        Profile
                      </Button>
                    </Link>
                    
                    <Link href="/progress">
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <BarChart2 size={16} className="mr-2" />
                        {t('nav.progress')}
                      </Button>
                    </Link>
                    
                    <Link href="/subscription-plans">
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          width="16" 
                          height="16" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                          className="mr-2"
                        >
                          <rect width="20" height="14" x="2" y="5" rx="2" />
                          <line x1="2" x2="22" y1="10" y2="10" />
                        </svg>
                        Subscription
                      </Button>
                    </Link>
                    
                    <div className="h-px w-full bg-gray-100 dark:bg-gray-700 my-1"></div>
                    
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
                      onClick={onLogout}
                    >
                      <LogOut size={16} className="mr-2" />
                      {t('action.logout')}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
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
              
              <ThemeLanguageSwitcher />
              
              <Link href="/subscription-plans" className="md:flex items-center hidden">
                <div className="px-4 py-2 rounded-lg font-medium transition-all duration-200 relative text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary">
                  Subscription
                </div>
              </Link>
              
              <Link href="/login">
                <Button 
                  variant="outline" 
                  className="font-medium border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary hover:border-primary/30 dark:hover:border-primary/30 shadow-sm"
                >
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button className="btn-gradient shadow-md">Sign Up</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
      
      {/* Pomodoro Timer */}
      <PomodoroTimer isOpen={pomodoroOpen} onOpenChange={setPomodoroOpen} standalone={true} />
    </header>
  );
};

export default Header;
