import React from 'react';
import { Link, useLocation } from 'wouter';
import { User } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import Logo from '@/components/common/Logo';

// Define the navigation item types
interface NavItem {
  href: string;
  label: string;
}

interface DropdownNavItem {
  label: string;
  items: NavItem[];
}

interface MainNavProps {
  user: User | null | undefined;
  className?: string;
}

const MainNav = ({ user, className = '' }: MainNavProps) => {
  const [location] = useLocation();
  
  // Navigation items for authenticated users
  const navItems: (NavItem | DropdownNavItem)[] = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/learn', label: 'Learn' },
    { href: '/practice', label: 'Practice' },
    { href: '/blog', label: 'Blog' },
  ];

  // Check if the current location matches a nav item or its children
  const isActive = (href: string) => {
    if (href === location) return true;
    return false;
  };

  // Check if the current location matches any child of a dropdown
  const hasActiveChild = (items?: NavItem[]) => {
    if (!items || !Array.isArray(items)) return false;
    return items.some(item => isActive(item.href));
  };

  return (
    <nav className={`flex items-center space-x-1 ${className}`}>
      {navItems.map((item, index) => (
        'items' in item ? (
          // Dropdown menu for items with children
          <DropdownMenu key={index}>
            <DropdownMenuTrigger asChild>
              <Button 
                variant={hasActiveChild(item.items) ? "default" : "ghost"} 
                size="sm" 
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1.5 ${
                  hasActiveChild(item.items) 
                    ? 'bg-primary/10 text-primary dark:bg-primary/20' 
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {item.label}
                <ChevronDown className="h-4 w-4 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-48">
              {item.items && Array.isArray(item.items) && item.items.map((subItem: NavItem, subIndex: number) => (
                <Link key={subIndex} href={subItem.href}>
                  <DropdownMenuItem className={isActive(subItem.href) ? 'bg-primary/10 text-primary dark:bg-primary/20' : ''}>
                    {subItem.label}
                  </DropdownMenuItem>
                </Link>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          // Standard navigation item
          <Link key={index} href={item.href}>
            <Button 
              variant={isActive(item.href) ? "default" : "ghost"} 
              size="sm" 
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                isActive(item.href) 
                  ? 'bg-primary/10 text-primary dark:bg-primary/20' 
                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {item.label}
            </Button>
          </Link>
        )
      ))}
      
      {/* Admin item - only shown to admins */}
      {user?.isAdmin && (
        <Link href="/admin">
          <Button 
            variant={isActive('/admin') ? "default" : "ghost"} 
            size="sm" 
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              isActive('/admin') 
                ? 'bg-primary/10 text-primary dark:bg-primary/20' 
                : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {"Admin"}
          </Button>
        </Link>
      )}
    </nav>
  );
};

export default MainNav;