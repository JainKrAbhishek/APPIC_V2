import { useTheme } from '@/hooks/use-theme';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * ThemeSwitcher Component - A simple toggle button to switch between light and dark themes
 */
const ThemeSwitcher = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        className="rounded-full w-8 h-8 hover:bg-gray-100 dark:hover:bg-gray-800"
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? (
          <Moon className="h-[1.2rem] w-[1.2rem] text-blue-400" />
        ) : (
          <Sun className="h-[1.2rem] w-[1.2rem] text-amber-500" />
        )}
      </Button>
    </div>
  );
};

export default ThemeSwitcher;