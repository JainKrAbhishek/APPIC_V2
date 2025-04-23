import { useState, useEffect } from 'react';

export const useScrollAnimation = () => {
  const [scrollY, setScrollY] = useState(0);
  
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  // Calculate various scroll-based animations
  const getScrollProgress = () => {
    const docHeight = Math.max(
      document.body.scrollHeight, 
      document.body.offsetHeight, 
      document.documentElement.clientHeight,
      document.documentElement.scrollHeight, 
      document.documentElement.offsetHeight
    );
    
    const windowHeight = window.innerHeight;
    const scrollable = docHeight - windowHeight;
    
    return scrollY / scrollable;
  };
  
  // Calculate element visibility based on scroll position
  const calculateVisibility = (element: HTMLElement | null) => {
    if (!element) return 0;
    
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    
    // Element is above the viewport
    if (rect.bottom < 0) return 0;
    
    // Element is below the viewport
    if (rect.top > windowHeight) return 0;
    
    // Element is partially visible at the top
    if (rect.top < 0) {
      return rect.bottom / rect.height;
    }
    
    // Element is partially visible at the bottom
    if (rect.bottom > windowHeight) {
      return (windowHeight - rect.top) / rect.height;
    }
    
    // Element is fully visible
    return 1;
  };
  
  return {
    scrollY,
    scrollProgress: getScrollProgress(),
    calculateVisibility
  };
};