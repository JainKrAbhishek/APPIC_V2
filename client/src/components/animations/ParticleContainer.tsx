import React, { useRef, useState, useCallback, useEffect } from 'react';

export interface ParticleContainerProps {
  children: React.ReactNode;
  className?: string;
  particleCount?: number;
  colorScheme?: 'green' | 'blue' | 'purple' | 'mixed';
  size?: 'small' | 'medium' | 'large' | 'varied';
  speed?: 'slow' | 'medium' | 'fast';
}

export const ParticleContainer: React.FC<ParticleContainerProps> = ({
  children,
  className = "",
  particleCount = 50,
  colorScheme = 'green',
  size = 'medium',
  speed = 'medium'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    size: number;
    speed: number;
    color: string;
    opacity: number;
    direction: number;
  }>>([]);

  // Get colors based on the colorScheme prop
  const getColors = useCallback(() => {
    switch(colorScheme) {
      case 'blue':
        return ['rgba(56, 189, 248, 0.6)', 'rgba(59, 130, 246, 0.6)'];
      case 'purple':
        return ['rgba(168, 85, 247, 0.6)', 'rgba(139, 92, 246, 0.6)'];
      case 'mixed':
        return ['rgba(14, 165, 233, 0.5)', 'rgba(168, 85, 247, 0.5)', 'rgba(34, 197, 94, 0.5)'];
      case 'green':
      default:
        return ['rgba(34, 197, 94, 0.6)', 'rgba(16, 185, 129, 0.6)'];
    }
  }, [colorScheme]);

  // Get size range based on the size prop
  const getSizeRange = useCallback(() => {
    switch(size) {
      case 'small':
        return { min: 1, max: 3 };
      case 'large':
        return { min: 3, max: 8 };
      case 'varied':
        return { min: 1, max: 8 };
      case 'medium':
      default:
        return { min: 2, max: 5 };
    }
  }, [size]);

  // Get speed factor based on the speed prop
  const getSpeedFactor = useCallback(() => {
    switch(speed) {
      case 'slow':
        return { min: 0.1, max: 0.3 };
      case 'fast':
        return { min: 0.3, max: 0.8 };
      case 'medium':
      default:
        return { min: 0.2, max: 0.5 };
    }
  }, [speed]);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const colors = getColors();
    const { min: minSize, max: maxSize } = getSizeRange();
    const { min: minSpeed, max: maxSpeed } = getSpeedFactor();
    
    // Create particles
    const newParticles = Array(particleCount).fill(0).map((_, id) => ({
      id,
      x: Math.random() * rect.width,
      y: Math.random() * rect.height,
      size: minSize + Math.random() * (maxSize - minSize),
      speed: minSpeed + Math.random() * (maxSpeed - minSpeed),
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: 0.1 + Math.random() * 0.5,
      direction: Math.random() * Math.PI * 2
    }));
    
    setParticles(newParticles);
    
    // Animation loop for particle movement
    let animationFrameId: number;
    let lastTime = 0;
    
    const animate = (time: number) => {
      if (!containerRef.current) return;
      
      const deltaTime = time - lastTime;
      lastTime = time;
      
      if (deltaTime > 0) {
        setParticles(prev => prev.map(particle => {
          // Update position based on direction and speed
          const dx = Math.cos(particle.direction) * particle.speed * deltaTime * 0.1;
          const dy = Math.sin(particle.direction) * particle.speed * deltaTime * 0.1;
          
          let newX = particle.x + dx;
          let newY = particle.y + dy;
          let newDirection = particle.direction;
          
          // Bounce off the walls
          if (newX < 0 || newX > rect.width) {
            newDirection = Math.PI - newDirection;
            newX = newX < 0 ? 0 : rect.width;
          }
          
          if (newY < 0 || newY > rect.height) {
            newDirection = -newDirection;
            newY = newY < 0 ? 0 : rect.height;
          }
          
          // Random direction changes occasionally
          if (Math.random() < 0.01) {
            newDirection += (Math.random() - 0.5) * 0.5;
          }
          
          return {
            ...particle,
            x: newX,
            y: newY,
            direction: newDirection
          };
        }));
      }
      
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animationFrameId = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [particleCount, getColors, getSizeRange, getSpeedFactor]);

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
      {/* Render particles */}
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute rounded-full mix-blend-screen"
          style={{
            left: `${particle.x}px`,
            top: `${particle.y}px`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            opacity: particle.opacity,
            filter: 'blur(1px)',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none'
          }}
        />
      ))}
      <div className="relative z-10">{children}</div>
    </div>
  );
};