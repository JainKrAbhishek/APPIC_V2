import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImportTab, ImportTabsProps } from './types';
import { TAB_CONFIG } from './hooks';

const ImportTabs: React.FC<ImportTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="flex overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
      <TabsList className="flex w-full sm:w-auto bg-muted/50 p-1 rounded-lg">
        {Object.entries(TAB_CONFIG).map(([key, info]) => (
          <TabsTrigger 
            key={key} 
            value={key}
            className="px-3 py-1.5 text-xs rounded-md whitespace-nowrap data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
          >
            {info.title}
          </TabsTrigger>
        ))}
      </TabsList>
    </div>
  );
};

export default ImportTabs;