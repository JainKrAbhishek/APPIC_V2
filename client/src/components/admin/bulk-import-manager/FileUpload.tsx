import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { FileSpreadsheet, Upload, Download, Info } from "lucide-react";
import { FileUploadProps } from './types';

const FileUpload: React.FC<FileUploadProps> = ({
  isLoading,
  selectedFile,
  onFileChange,
  onPreview,
  onImport,
  onDownloadTemplate,
  previewIsLoading,
  importIsLoading,
  downloadIsLoading,
  fileInstructions
}) => {
  return (
    <>
      <div className="bg-muted/50 rounded-md border overflow-hidden">
        <div className="flex items-center gap-2 p-3 border-b bg-muted/70">
          <Info className="h-4 w-4 text-blue-500" />
          <h3 className="text-sm font-medium">File Format Instructions</h3>
        </div>
        
        <div className="p-3 sm:p-4">
          <div className="flex flex-col gap-3">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{fileInstructions}</p>
              
              <div className="bg-blue-50 text-blue-700 text-xs p-2 rounded border border-blue-100 mt-2">
                <p className="flex items-start">
                  <Info className="h-3.5 w-3.5 mr-1 mt-0.5 flex-shrink-0" />
                  <span>Download the template to see the required fields and format for your data.</span>
                </p>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              className="flex items-center justify-center gap-1.5 w-full sm:w-auto mt-1"
              onClick={onDownloadTemplate}
              disabled={downloadIsLoading}
            >
              {downloadIsLoading ? (
                <Spinner size="sm" className="mr-1" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span>Download Template</span>
            </Button>
          </div>
        </div>
      </div>
    
      <div className="bg-muted/20 p-3 rounded-md border border-dashed">
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="csv-file" className="flex items-center gap-1.5 mb-1">
            <Upload className="h-4 w-4 text-primary" />
            <span className="font-medium">Upload CSV File</span>
          </Label>
          <div className="relative">
            <Input 
              id="csv-file" 
              type="file" 
              accept=".csv"
              onChange={onFileChange}
              disabled={isLoading}
              className="
                file:mr-4 file:py-1.5 file:px-2.5 file:rounded-md file:border-0
                file:text-xs file:font-medium file:bg-primary/90 file:text-white
                hover:file:bg-primary hover:file:cursor-pointer focus:outline-none
                border-muted-foreground/30
              "
            />
            <div className="absolute inset-0 pointer-events-none border border-primary/0 rounded-md
              group-focus-within:border-primary/50 group-hover:border-primary/50"></div>
          </div>
          {selectedFile && (
            <div className="flex items-center mt-2 bg-muted/30 rounded p-2 text-xs text-muted-foreground">
              <FileSpreadsheet className="h-4 w-4 mr-2 text-primary/80" />
              <div className="overflow-hidden">
                <p className="truncate font-medium">{selectedFile.name}</p>
                <p className="text-xs opacity-70">{Math.round(selectedFile.size / 1024)} KB</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mt-4">
        <Button
          variant="outline"
          onClick={onPreview}
          disabled={!selectedFile || isLoading}
          className="flex items-center justify-center gap-1.5"
          size="sm"
        >
          {previewIsLoading ? (
            <Spinner size="sm" className="mr-1" />
          ) : (
            <Info className="h-4 w-4" />
          )}
          <span>Preview Data</span>
        </Button>
        
        <Button
          onClick={onImport}
          disabled={!selectedFile || isLoading}
          className="flex items-center justify-center gap-1.5"
          size="sm"
        >
          {importIsLoading ? (
            <Spinner size="sm" className="mr-1" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          <span>Import File</span>
        </Button>
      </div>
    </>
  );
};

export default FileUpload;