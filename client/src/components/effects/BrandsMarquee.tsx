import React from 'react';

// Simplified placeholder component to replace the animation effects
const BrandsMarquee = ({ className = '' }: { className?: string }) => {
  return (
    <div className={`flex justify-center gap-8 flex-wrap ${className}`}>
      {['University 1', 'University 2', 'University 3', 'University 4', 'University 5'].map((name, index) => (
        <div key={index} className="text-gray-400 dark:text-gray-500 text-sm font-medium">
          {name}
        </div>
      ))}
    </div>
  );
};

export default BrandsMarquee;