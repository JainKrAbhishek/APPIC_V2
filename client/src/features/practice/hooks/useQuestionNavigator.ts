import { useState, useEffect } from 'react';

// Bu bir geçici hook dosyasıdır, gerçek uygulama mantığı ileride eklenecektir
export default function useQuestionNavigator(isMobile: boolean) {
  const [navigatorState, setNavigatorState] = useState({
    showNavigator: !isMobile, // Show navigator by default on desktop, hide on mobile
    navigatorCollapsed: false
  });
  
  // Update navigator visibility when screen size changes
  useEffect(() => {
    setNavigatorState(prev => ({
      ...prev,
      showNavigator: !isMobile
    }));
  }, [isMobile]);
  
  const toggleNavigator = () => {
    setNavigatorState(prev => ({
      ...prev,
      showNavigator: !prev.showNavigator
    }));
  };
  
  const collapseNavigator = () => {
    setNavigatorState(prev => ({
      ...prev,
      navigatorCollapsed: !prev.navigatorCollapsed
    }));
  };
  
  return {
    navigatorState,
    toggleNavigator,
    collapseNavigator
  };
}