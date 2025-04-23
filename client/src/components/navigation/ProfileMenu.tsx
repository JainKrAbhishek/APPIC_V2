import { useState } from "react";
import { Link } from "wouter";
import { User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useThemeLanguage } from "@/hooks/use-theme-language";
import { LogOut, BarChart2, User as UserIcon, CreditCard } from "lucide-react";

interface ProfileMenuProps {
  user: User | null;
  onLogout?: () => void;
}

/**
 * ProfileMenu component displays a dropdown menu when hovering over the user avatar
 * Contains links to user profile, progress, subscription, and logout button
 */
const ProfileMenu = ({ user, onLogout }: ProfileMenuProps) => {
  const { t } = useThemeLanguage();
  
  if (!user) return null;

  return (
    <div className="relative group hidden md:block">
      <div className="h-10 w-10 rounded-full flex items-center justify-center bg-gradient-to-br from-primary to-primary-dark text-white font-medium shadow-md cursor-pointer">
        {user.firstName && user.lastName 
          ? user.firstName.charAt(0) + user.lastName.charAt(0)
          : user.username 
            ? user.username.charAt(0).toUpperCase() 
            : 'U'}
      </div>
      
      <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right z-50">
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
              <CreditCard size={16} className="mr-2" />
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
  );
};

export default ProfileMenu;