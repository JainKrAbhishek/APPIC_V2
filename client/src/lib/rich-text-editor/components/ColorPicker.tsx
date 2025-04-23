import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Paintbrush, Highlighter } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useEditorOperations } from '../hooks/editor-operations';

interface ColorPickerProps {
  type: 'color' | 'backgroundColor';
}

/**
 * Component for picking text or background colors
 */
const ColorPicker: React.FC<ColorPickerProps> = ({ type }) => {
  const { setTextColor, setBackgroundColor } = useEditorOperations();
  const [isOpen, setIsOpen] = useState(false);

  // Define color palette
  const colors = [
    { name: 'Default', value: 'inherit', class: 'bg-transparent border border-gray-300' },
    { name: 'Gray', value: '#6b7280', class: 'bg-gray-500' },
    { name: 'Red', value: '#ef4444', class: 'bg-red-500' },
    { name: 'Orange', value: '#f97316', class: 'bg-orange-500' },
    { name: 'Amber', value: '#f59e0b', class: 'bg-amber-500' },
    { name: 'Yellow', value: '#eab308', class: 'bg-yellow-500' },
    { name: 'Lime', value: '#84cc16', class: 'bg-lime-500' },
    { name: 'Green', value: '#22c55e', class: 'bg-green-500' },
    { name: 'Emerald', value: '#10b981', class: 'bg-emerald-500' },
    { name: 'Teal', value: '#14b8a6', class: 'bg-teal-500' },
    { name: 'Cyan', value: '#06b6d4', class: 'bg-cyan-500' },
    { name: 'Sky', value: '#0ea5e9', class: 'bg-sky-500' },
    { name: 'Blue', value: '#3b82f6', class: 'bg-blue-500' },
    { name: 'Indigo', value: '#6366f1', class: 'bg-indigo-500' },
    { name: 'Violet', value: '#8b5cf6', class: 'bg-violet-500' },
    { name: 'Purple', value: '#a855f7', class: 'bg-purple-500' },
    { name: 'Fuchsia', value: '#d946ef', class: 'bg-fuchsia-500' },
    { name: 'Pink', value: '#ec4899', class: 'bg-pink-500' },
    { name: 'Rose', value: '#f43f5e', class: 'bg-rose-500' },
    { name: 'Black', value: '#000000', class: 'bg-black' },
  ];

  // Apply color based on type
  const applyColor = (colorValue: string) => {
    if (type === 'color') {
      setTextColor(colorValue);
    } else {
      setBackgroundColor(colorValue);
    }
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
        >
          {type === 'color' ? (
            <Paintbrush className="h-4 w-4" />
          ) : (
            <Highlighter className="h-4 w-4" />
          )}
          <span className="sr-only">
            {type === 'color' ? 'Text Color' : 'Background Color'}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3">
        <div className="space-y-2">
          <h4 className="font-medium text-sm">
            {type === 'color' ? 'Text Color' : 'Highlight Color'}
          </h4>
          <div className="grid grid-cols-5 gap-2">
            {colors.map((color) => (
              <button
                key={color.value}
                className={`w-8 h-8 rounded-full ${color.class} cursor-pointer flex items-center justify-center transition-transform hover:scale-110`}
                title={color.name}
                onClick={() => applyColor(color.value)}
              />
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ColorPicker;