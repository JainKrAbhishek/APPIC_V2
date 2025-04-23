import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { FileSpreadsheet } from "lucide-react";
import { ImportTab } from "./types";

// Import components
import ImportTabs from "./ImportTabs";
import FileUpload from "./FileUpload";
import ImportSuccess from "./ImportSuccess";
import DataPreview from "./DataPreview";

// Import hooks
import { 
  TAB_CONFIG,
  useFileSelection, 
  useFilePreview, 
  useFileImport, 
  useTemplateDownload 
} from "./hooks";

const BulkImportManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ImportTab>("questions");
  
  // Use custom hooks
  const { selectedFile, handleFileChange, resetFile } = useFileSelection();
  
  const { 
    previewData, 
    previewMutation, 
    isPreviewLoading,
    resetPreview 
  } = useFilePreview(activeTab);
  
  const { 
    importedCount, 
    showSuccess, 
    importMutation, 
    isImportLoading, 
    resetImport 
  } = useFileImport(activeTab);
  
  const { 
    downloadTemplateMutation, 
    isDownloadLoading 
  } = useTemplateDownload(activeTab);

  // Reset all state when changing tabs
  const handleTabChange = (tab: ImportTab) => {
    setActiveTab(tab);
    resetFile();
    resetPreview();
    resetImport();
  };

  // Get the current tab information
  const currentTabInfo = TAB_CONFIG[activeTab];

  // Handler for previewing a file
  const handlePreview = () => {
    if (selectedFile) {
      previewMutation.mutate(selectedFile);
    }
  };

  // Handler for importing a file
  const handleImport = () => {
    if (selectedFile) {
      importMutation.mutate(selectedFile);
    }
  };

  // Handler for downloading a template
  const handleDownloadTemplate = () => {
    downloadTemplateMutation.mutate();
  };

  // Handler for resetting after import
  const handleReset = () => {
    resetFile();
    resetPreview();
    resetImport();
  };

  // Determine if any operation is loading
  const isLoading = isPreviewLoading || isImportLoading || isDownloadLoading;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-2">
          <div className="flex flex-row justify-between items-center gap-2">
            <div className="flex-1">
              <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                Bulk Import Manager
              </CardTitle>
              <CardDescription className="mt-1">
                Import multiple items at once using CSV files
              </CardDescription>
            </div>
            <div className="hidden sm:flex items-center justify-center bg-primary/10 rounded-full p-1 h-10 w-10">
              <FileSpreadsheet className="h-6 w-6 text-primary" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs 
            value={activeTab} 
            onValueChange={(value: string) => {
              // Only handle the tab change if the value is a valid ImportTab
              if (value === "questions" || value === "practice-sets" || 
                  value === "quant-content" || value === "verbal-content") {
                // TypeScript type assertion to ensure type safety
                handleTabChange(value as ImportTab);
              }
            }} 
            className="w-full">
            <ImportTabs 
              activeTab={activeTab} 
              onTabChange={handleTabChange} 
            />
            
            <TabsContent value={activeTab} className="pt-4">
              <div className="space-y-4">
                {showSuccess ? (
                  <ImportSuccess 
                    importedCount={importedCount} 
                    tabTitle={currentTabInfo.title} 
                    onReset={handleReset} 
                  />
                ) : (
                  <>
                    <FileUpload 
                      isLoading={isLoading}
                      selectedFile={selectedFile}
                      onFileChange={handleFileChange}
                      onPreview={handlePreview}
                      onImport={handleImport}
                      onDownloadTemplate={handleDownloadTemplate}
                      previewIsLoading={isPreviewLoading}
                      importIsLoading={isImportLoading}
                      downloadIsLoading={isDownloadLoading}
                      fileInstructions={currentTabInfo.fileInstructions}
                    />
                    
                    {/* Preview Data */}
                    {(previewData || isPreviewLoading) && (
                      <DataPreview 
                        data={previewData} 
                        isLoading={isPreviewLoading} 
                      />
                    )}
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="bg-muted/20 pt-4 flex flex-col items-start">
          <div className="text-sm text-muted-foreground">
            <h4 className="font-medium mb-2">Important Notes:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Ensure your CSV file follows the format in the template</li>
              <li>Use the preview feature to verify your data before import</li>
              <li>JSON fields should be properly formatted as valid JSON strings</li>
              <li>Dates should be in ISO format (YYYY-MM-DD)</li>
              <li>IDs that reference other records must exist in the database</li>
            </ul>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default BulkImportManager;