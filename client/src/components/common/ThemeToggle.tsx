import React from 'react';
import { Button } from "@/components/ui/button";
import { Moon, Sun } from 'lucide-react';
import { useThemeLanguage } from '@/hooks/use-theme-language';

interface ThemeToggleProps {
  /**
   * The button variant (defaults to "outline")
   */
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  /**
   * Additional classes to apply to the button
   */
  className?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  variant = "outline",
  className = ""
}) => {
  const { theme, toggleTheme } = useThemeLanguage();
  const isDark = theme === "dark";

  return (
    <Button
      variant={variant}
      size="icon"
      onClick={toggleTheme}
      className={className}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <Sun className="h-[1.2rem] w-[1.2rem]" />
      ) : (
        <Moon className="h-[1.2rem] w-[1.2rem]" />
      )}
    </Button>
  );
};

export default ThemeToggle;