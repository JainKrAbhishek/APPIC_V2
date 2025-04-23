import React, { useEffect, useRef, useState } from 'react';

export interface SpotlightProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'subtle' | 'strong' | 'multiple';
  colorScheme?: 'green' | 'blue' | 'purple' | 'mixed';
  size?: 'small' | 'medium' | 'large';
  followCursor?: boolean;
}

export const SpotlightContainer: React.FC<SpotlightProps> = ({ 
  children, 
  className = "", 
  variant = 'default',
  colorScheme = 'green',
  size = 'medium',
  followCursor = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  // Calculate size parameters based on the size prop
  const getSizeParams = () => {
    switch(size) {
      case 'small':
        return { blur: '60px', spread: '60px', size: '100px' };
      case 'large':
        return { blur: '140px', spread: '140px', size: '300px' };
      case 'medium':
      default:
        return { blur: '100px', spread: '100px', size: '200px' };
    }
  };

  // Get color based on the colorScheme prop
  const getColors = () => {
    switch(colorScheme) {
      case 'blue':
        return { primary: 'rgba(56, 189, 248, 0.4)', secondary: 'rgba(59, 130, 246, 0.4)' };
      case 'purple':
        return { primary: 'rgba(168, 85, 247, 0.4)', secondary: 'rgba(139, 92, 246, 0.4)' };
      case 'mixed':
        return { primary: 'rgba(14, 165, 233, 0.3)', secondary: 'rgba(168, 85, 247, 0.3)' };
      case 'green':
      default:
        return { primary: 'rgba(34, 197, 94, 0.4)', secondary: 'rgba(16, 185, 129, 0.4)' };
    }
  };

  // Get multiple spotlight positions for the 'multiple' variant
  const getMultipleSpotlights = () => {
    const { size } = getSizeParams();
    const { primary, secondary } = getColors();
    
    return [
      { top: '10%', left: '20%', background: primary, width: size, height: size },
      { top: '60%', right: '20%', background: secondary, width: size, height: size },
      { top: '30%', right: '30%', background: primary, width: size, height: size },
      { bottom: '20%', left: '30%', background: primary, width: size, height: size },
    ];
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!containerRef.current || !followCursor) return;
    
    // Get container dimensions and position
    const rect = containerRef.current.getBoundingClientRect();
    
    // Calculate mouse position relative to container
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setPosition({ x, y });
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    if (followCursor) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseenter', () => setIsHovering(true));
      container.addEventListener('mouseleave', () => setIsHovering(false));
    }
    
    return () => {
      if (followCursor) {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseenter', () => setIsHovering(true));
        container.removeEventListener('mouseleave', () => setIsHovering(false));
      }
    };
  }, [followCursor]);

  const { blur, spread } = getSizeParams();
  const { primary, secondary } = getColors();

  // Render different spotlight variants
  const renderSpotlight = () => {
    if (variant === 'multiple') {
      return (
        <>
          {getMultipleSpotlights().map((style, index) => (
            <div 
              key={index}
              className="absolute rounded-full animate-pulse-slow filter blur-3xl opacity-50"
              style={style}
            />
          ))}
        </>
      );
    }
    
    if (!followCursor) {
      // Center spotlight for non-follow cursor mode
      return (
        <div 
          className={`absolute rounded-full animate-pulse-slow filter blur-3xl transition-opacity duration-500 ${isHovering ? 'opacity-70' : 'opacity-50'}`}
          style={{
            background: primary,
            width: '40%',
            height: '40%',
            left: '30%',
            top: '30%',
            filter: `blur(${blur})`,
          }}
        />
      );
    }
    
    // Default mouse-following spotlight
    return (
      <div 
        className="absolute rounded-full filter transition-opacity duration-300"
        style={{
          background: variant === 'strong' ? `radial-gradient(circle, ${primary} 0%, ${secondary} 50%, transparent 80%)` : primary,
          width: variant === 'subtle' ? '150px' : '300px',
          height: variant === 'subtle' ? '150px' : '300px',
          left: position.x - (variant === 'subtle' ? 75 : 150),
          top: position.y - (variant === 'subtle' ? 75 : 150),
          opacity: variant === 'subtle' ? 0.3 : 0.5,
          filter: `blur(${variant === 'subtle' ? '40px' : blur})`,
          pointerEvents: 'none',
        }}
      />
    );
  };

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{ isolation: 'isolate' }}
    >
      {renderSpotlight()}
      <div className="relative z-10">{children}</div>
    </div>
  );
};