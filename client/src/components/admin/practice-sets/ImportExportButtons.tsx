import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent,
  DialogDescription, 
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Upload, 
  Download, 
  Loader2, 
  FileX, 
  File, 
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ImportExportButtonsProps {
  onExport: () => Promise<void>;
  onImport: (data: any) => Promise<void>;
  isImporting: boolean;
  isExporting: boolean;
}

const ImportExportButtons: React.FC<ImportExportButtonsProps> = ({
  onExport,
  onImport,
  isImporting,
  isExporting,
}) => {
  const { toast } = useToast();
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<any>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importPreview, setImportPreview] = useState<boolean>(false);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    setImportData(null);
    setImportPreview(false);
    
    const files = e.target.files;
    if (!files || files.length === 0) {
      setImportFile(null);
      return;
    }

    const file = files[0];
    if (file.type !== "application/json") {
      setImportError("Please select a JSON file.");
      return;
    }

    setImportFile(file);
    
    // Read the file contents
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        setImportData(parsed);
        setImportPreview(true);
      } catch (error) {
        setImportError("Invalid JSON format. Please check your file.");
      }
    };
    reader.readAsText(file);
  };

  // Handle import confirmation
  const handleImportConfirm = async () => {
    if (!importData) return;
    
    try {
      await onImport(importData);
      toast({
        title: "Import successful",
        description: "Practice sets have been imported successfully.",
      });
      setIsImportDialogOpen(false);
      setImportFile(null);
      setImportData(null);
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Import failed",
        description: "There was an error importing practice sets.",
        variant: "destructive",
      });
    }
  };

  // Handle export button click
  const handleExport = async () => {
    try {
      await onExport();
      toast({
        title: "Export successful",
        description: "Practice sets have been exported successfully.",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export failed",
        description: "There was an error exporting practice sets.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div className="flex space-x-2">
        <Button 
          variant="outline" 
          size="sm"
          className="gap-2"
          onClick={() => setIsImportDialogOpen(true)}
          disabled={isImporting}
        >
          {isImporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          Import
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          className="gap-2"
          onClick={handleExport}
          disabled={isExporting}
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Export
        </Button>
      </div>

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Import Practice Sets</DialogTitle>
            <DialogDescription>
              Upload a JSON file to import practice sets.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {!importPreview ? (
              <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
                <input
                  type="file"
                  id="import-file"
                  className="hidden"
                  accept=".json"
                  onChange={handleFileSelect}
                />
                <label
                  htmlFor="import-file"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  {importFile ? (
                    <div className="flex items-center gap-2">
                      <File className="h-8 w-8 text-muted-foreground" />
                      <div className="text-sm">
                        <p className="font-medium">{importFile.name}</p>
                        <p className="text-muted-foreground">
                          {(importFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                      <span className="text-sm font-medium">
                        Click to select a file or drop it here
                      </span>
                      <span className="text-xs text-muted-foreground mt-1">
                        JSON files only (.json)
                      </span>
                    </>
                  )}
                </label>
              </div>
            ) : (
              <div className="space-y-3">
                <Alert variant="default" className="bg-muted/50">
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Ready to import</AlertTitle>
                  <AlertDescription>
                    {importData?.length > 1 
                      ? `${importData.length} practice sets found in file.` 
                      : `1 practice set found in file.`}
                  </AlertDescription>
                </Alert>
                
                <Button 
                  variant="default" 
                  onClick={() => {
                    setImportPreview(false);
                    setImportFile(null);
                    setImportData(null);
                  }}
                  size="sm"
                  className="w-full"
                >
                  Select Different File
                </Button>
              </div>
            )}
            
            {importError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{importError}</AlertDescription>
              </Alert>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="ghost" 
              onClick={() => setIsImportDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleImportConfirm} 
              disabled={!importData || isImporting}
              className="gap-2"
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Import
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ImportExportButtons;