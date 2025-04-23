import React, { useRef, useState, useEffect } from 'react';

export interface Card3DProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
  glareEnabled?: boolean;
  glareColor?: string;
  colorScheme?: 'green' | 'blue' | 'purple' | 'mixed';
  borderGlow?: boolean;
  scale?: number;
  borderHighlight?: boolean;
}

export const Card3D = React.forwardRef<HTMLDivElement, Card3DProps>(({
  children,
  className = "",
  intensity = 10,
  glareEnabled = true,
  glareColor = "rgba(255, 255, 255, 0.4)",
  colorScheme = 'green',
  borderGlow = false,
  scale = 1.02,
  borderHighlight = false,
  ...props
}, ref) => {
  // Create a mutable ref that we'll merge with the forwarded ref
  const localRef = useRef<HTMLDivElement | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [glarePosition, setGlarePosition] = useState({ x: 0, y: 0 });
  
  // Get border color based on the colorScheme prop
  const getBorderColor = () => {
    switch(colorScheme) {
      case 'blue':
        return { shadow: 'rgba(56, 189, 248, 0.4)', highlight: 'rgb(56, 189, 248)' };
      case 'purple':
        return { shadow: 'rgba(168, 85, 247, 0.4)', highlight: 'rgb(168, 85, 247)' };
      case 'mixed':
        return { shadow: 'rgba(139, 92, 246, 0.4)', highlight: 'rgb(139, 92, 246)' };
      case 'green':
      default:
        return { shadow: 'rgba(16, 185, 129, 0.4)', highlight: 'rgb(16, 185, 129)' };
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!localRef.current) return;
    
    const rect = localRef.current.getBoundingClientRect();
    
    // Calculate mouse position as a percentage of card dimensions
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    // Convert to rotation angles (centered at 0, so -1 to 1 range)
    const rotateY = intensity * (x - 0.5) * 2; 
    const rotateX = intensity * (0.5 - y) * 2;
    
    setRotation({ x: rotateX, y: rotateY });
    setGlarePosition({ x, y });
  };

  useEffect(() => {
    const card = localRef.current;
    if (!card) return;
    
    card.addEventListener('mouseenter', () => setIsHovering(true));
    card.addEventListener('mouseleave', () => {
      setIsHovering(false);
      setRotation({ x: 0, y: 0 }); // Reset rotation on mouse leave
    });
    card.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      card.removeEventListener('mouseenter', () => setIsHovering(true));
      card.removeEventListener('mouseleave', () => {
        setIsHovering(false);
        setRotation({ x: 0, y: 0 });
      });
      card.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const { shadow, highlight } = getBorderColor();

  // Handler for ref merging
  const setRefs = React.useCallback((node: HTMLDivElement | null) => {
    // Set the local ref
    // TypeScript type assertion to allow assignment
    (localRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    
    // Handle the forwarded ref
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
    }
  }, [ref]);

  return (
    <div
      ref={setRefs}
      className={`relative rounded-lg transition-transform ${className}`}
      style={{
        transform: isHovering 
          ? `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale(${scale})`
          : 'perspective(1000px) rotateX(0) rotateY(0) scale(1)',
        transition: 'transform 0.2s ease',
        willChange: 'transform',
        transformStyle: 'preserve-3d',
        boxShadow: borderGlow && isHovering 
          ? `0 0 15px ${shadow}, 0 0 5px ${shadow}`
          : 'none',
        border: borderHighlight && isHovering 
          ? `1px solid ${highlight}` 
          : '1px solid transparent'
      }}
      {...props}
    >
      {/* Glare effect */}
      {glareEnabled && (
        <div
          className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none"
          style={{
            opacity: isHovering ? 0.5 : 0,
            transition: 'opacity 0.2s ease',
          }}
        >
          <div
            className="absolute rounded-full blur-xl"
            style={{
              background: glareColor,
              width: '100%',
              height: '100%',
              transform: `translate(${(glarePosition.x - 0.5) * 100}%, ${(glarePosition.y - 0.5) * 100}%)`,
              filter: 'blur(20px)',
              top: `-50%`,
              left: `-50%`,
            }}
          ></div>
        </div>
      )}
      {children}
    </div>
  );
});