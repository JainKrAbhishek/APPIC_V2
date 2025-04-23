import { useState } from 'react';

export const useFaqAccordion = () => {
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setOpenItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id) 
        : [...prev, id]
    );
  };

  const isOpen = (id: string) => openItems.includes(id);

  return { openItems, toggleItem, isOpen };
};