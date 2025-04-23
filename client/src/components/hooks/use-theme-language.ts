import { useState, useEffect } from 'react';
import { translations, Language } from '@/components/i18n/translations';

// Types for theme
export type Theme = 'light' | 'dark';

// Re-export translations for backward compatibility
export { translations };
export type { Language };

// Hook
export function useThemeLanguage() {
  // Helper function to get the system preference
  const getSystemThemePreference = (): Theme => {
    if (typeof window !== 'undefined') {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches 
        ? 'dark' 
        : 'light';
    }
    return 'light'; // Default fallback
  };
  
  // State and localStorage check for theme
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      // Check if theme is saved in localStorage
      const savedTheme = localStorage.getItem('theme');
      
      // If no saved theme, use system preference
      if (!savedTheme) {
        return getSystemThemePreference();
      }
      
      return savedTheme as Theme;
    }
    return 'light'; // Server-side rendering fallback
  });
  
  // State and localStorage check for language
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      // Get language from localStorage, or use 'en' as default
      const savedLanguage = localStorage.getItem('language');
      return (savedLanguage as Language) || 'en';
    }
    return 'en'; // Server-side rendering fallback
  });
  
  // Update CSS classes and localStorage when theme changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Remove both classes first to ensure clean state
      document.documentElement.classList.remove('light', 'dark');
      
      // Add the current theme class
      document.documentElement.classList.add(theme);
      
      // Save to localStorage
      localStorage.setItem('theme', theme);
    }
  }, [theme]);
  
  // Listen for system theme preference changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = (e: MediaQueryListEvent) => {
        // Only apply if user hasn't explicitly set a preference
        if (!localStorage.getItem('theme')) {
          setTheme(e.matches ? 'dark' : 'light');
        }
      };
      
      // Add listener for system theme changes
      mediaQuery.addEventListener('change', handleChange);
      
      // Cleanup listener
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);
  
  // Update localStorage when language changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', language);
    }
  }, [language]);
  
  // Function to toggle between light and dark themes
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };
  
  // Function to set the language
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };
  
  // Translation function
  const t = (key: string): string => {
    if (translations[key] && translations[key][language]) {
      return translations[key][language];
    }
    // Return the key if no translation exists
    return key;
  };
  
  return {
    theme,
    language,
    toggleTheme,
    setLanguage,
    t,
  };
}