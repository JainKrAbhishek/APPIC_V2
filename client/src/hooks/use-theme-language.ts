import { useState, useEffect } from 'react';

export type Theme = 'light' | 'dark';

// Basit bir çeviri fonksiyonu
type TranslationKeys = Record<string, string>;

// Basit çeviri anahtar-değer çifti
const translations: TranslationKeys = {
  'app.title': 'GRE Prep Platform',
  'nav.dashboard': 'Dashboard',
  'nav.vocabulary': 'Vocabulary',
  'nav.practice': 'Practice',
  'nav.progress': 'Progress',
  'nav.admin': 'Admin',
  'action.logout': 'Logout',
  'preferences.theme': 'Theme',
  'preferences.light': 'Light',
  'preferences.dark': 'Dark',
  'preferences.language': 'Language',
  // Diğer gerekli çeviriler buraya eklenebilir
};

export function useThemeLanguage() {
  const getSystemThemePreference = (): Theme => {
    if (typeof window !== 'undefined') {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches 
        ? 'dark' 
        : 'light';
    }
    return 'light';
  };

  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (!savedTheme) {
        return getSystemThemePreference();
      }
      return savedTheme as Theme;
    }
    return 'light';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(theme);
      localStorage.setItem('theme', theme);
    }
  }, [theme]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

      const handleChange = (e: MediaQueryListEvent) => {
        if (!localStorage.getItem('theme')) {
          setTheme(e.matches ? 'dark' : 'light');
        }
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  // Basit bir çeviri fonksiyonu
  const t = (key: string): string => {
    return translations[key] || key;
  };

  return {
    theme,
    toggleTheme,
    t // Çeviri fonksiyonunu döndür
  };
}