import React from 'react';
import { Sun, Moon, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useThemeLanguage } from '@/hooks/use-theme-language';

const ThemeLanguageSwitcher: React.FC = () => {
  const { theme, toggleTheme, t } = useThemeLanguage();

  return (
    <div className="flex items-center gap-3">
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={toggleTheme}
        title={t('preferences.theme')}
      >
        {theme === 'light' ? <Sun size={18} /> : <Moon size={18} />}
      </Button>
      
      <Select defaultValue="en">
        <SelectTrigger className="w-[70px] h-9" title={t('preferences.language')}>
          <SelectValue>
            <div className="flex items-center">
              <Globe size={16} className="mr-1" />
              <span>EN</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en">English</SelectItem>
          <SelectItem value="tr">Türkçe</SelectItem>
          <SelectItem value="es">Español</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default ThemeLanguageSwitcher;