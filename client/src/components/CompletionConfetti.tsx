import React, { useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

interface CompletionConfettiProps {
  show: boolean;
}

export const CompletionConfetti: React.FC<CompletionConfettiProps> = ({ show }) => {
  const { width, height } = useWindowSize();
  const [isActive, setIsActive] = useState(false);
  
  useEffect(() => {
    if (show) {
      setIsActive(true);
      const timer = setTimeout(() => {
        setIsActive(false);
      }, 5000); // Run confetti for 5 seconds
      
      return () => clearTimeout(timer);
    }
  }, [show]);
  
  if (!isActive) return null;
  
  return (
    <Confetti
      width={width}
      height={height}
      recycle={false}
      numberOfPieces={200}
      gravity={0.2}
      colors={['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6']}
    />
  );
};