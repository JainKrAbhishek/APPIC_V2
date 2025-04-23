import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ImportAction, ImportTab, TabMap } from "./types";

// Tab configuration data
export const TAB_CONFIG: TabMap = {
  "questions": {
    title: "Questions",
    description: "Import questions with options, answers, and metadata",
    fileInstructions: "Upload a CSV file with question content, options, answers, category, topic, and metadata. For quantitative questions, ensure the topic field matches a valid topic name.",
    templateFilename: "questions-template.csv",
    apiEndpoint: (action) => `/api/admin/questions/bulk/${action}`
  },
  "practice-sets": {
    title: "Practice Sets",
    description: "Import practice sets with associated questions",
    fileInstructions: "Upload a CSV file with practice set details and associated question IDs",
    templateFilename: "practice-sets-template.csv",
    apiEndpoint: (action) => `/api/admin/practice-sets/bulk/${action}`
  },
  "quant-content": {
    title: "Quantitative Content",
    description: "Import quantitative learning content",
    fileInstructions: "Upload a CSV file with quantitative topics and content",
    templateFilename: "quant-content-template.csv",
    apiEndpoint: (action) => `/api/admin/quant/content/bulk/${action}`
  },
  "verbal-content": {
    title: "Verbal Content",
    description: "Import verbal learning content",
    fileInstructions: "Upload a CSV file with verbal topics and content",
    templateFilename: "verbal-content-template.csv",
    apiEndpoint: (action) => `/api/admin/verbal/content/bulk/${action}`
  }
};

/**
 * Hook to manage file selection and state
 */
export function useFileSelection() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  const resetFile = () => {
    setSelectedFile(null);
  };
  
  return { selectedFile, handleFileChange, resetFile };
}

/**
 * Hook for file preview functionality
 */
export function useFilePreview(activeTab: ImportTab) {
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const endpoint = TAB_CONFIG[activeTab].apiEndpoint('preview');
  
  const previewMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      setIsLoading(true);
      
      try {
        const response = await apiRequest<{success: boolean; message: string; data: any[]}>(endpoint, {
          method: 'POST',
          data: formData,
        });
        
        // Type assertion to handle response structure
        const typedResponse = response as unknown as {data: any[]};
        setPreviewData(typedResponse.data);
        return response;
      } finally {
        setIsLoading(false);
      }
    },
    onError: (error: any) => {
      console.error("Error previewing file:", error);
      toast({
        title: "Preview Failed",
        description: error.message || "Failed to preview CSV file. Please check the file format.",
        variant: "destructive",
      });
    }
  });
  
  const resetPreview = () => {
    setPreviewData(null);
  };
  
  return { 
    previewData, 
    previewMutation, 
    isPreviewLoading: isLoading || previewMutation.isPending,
    resetPreview
  };
}

/**
 * Hook for file import functionality
 */
export function useFileImport(activeTab: ImportTab) {
  const [importedCount, setImportedCount] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const endpoint = TAB_CONFIG[activeTab].apiEndpoint('import');
  
  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      setIsLoading(true);
      
      try {
        const response = await apiRequest<{success: boolean; message: string; importedCount: number; errors?: any[]}>(endpoint, {
          method: 'POST',
          data: formData,
        });
        
        // Type assertion to handle response structure
        const typedResponse = response as unknown as {importedCount: number};
        setImportedCount(typedResponse.importedCount || 0);
        setShowSuccess(true);
        
        // Invalidate relevant queries based on the active tab
        if (activeTab === "questions") {
          queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
        } else if (activeTab === "practice-sets") {
          queryClient.invalidateQueries({ queryKey: ["/api/practice-sets"] });
        } else if (activeTab === "quant-content") {
          queryClient.invalidateQueries({ queryKey: ["/api/quant/topics"] });
          queryClient.invalidateQueries({ queryKey: ["/api/quant/content"] });
        } else if (activeTab === "verbal-content") {
          queryClient.invalidateQueries({ queryKey: ["/api/verbal/topics"] });
          queryClient.invalidateQueries({ queryKey: ["/api/verbal/content"] });
        }
        
        // Invalidate admin stats
        queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
        
        return response;
      } finally {
        setIsLoading(false);
      }
    },
    onError: (error: any) => {
      console.error("Error importing file:", error);
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import CSV file. Please check the file format.",
        variant: "destructive",
      });
    }
  });
  
  const resetImport = () => {
    setShowSuccess(false);
  };
  
  return { 
    importedCount, 
    showSuccess, 
    importMutation, 
    isImportLoading: isLoading || importMutation.isPending,
    resetImport
  };
}

/**
 * Hook for template download functionality
 */
export function useTemplateDownload(activeTab: ImportTab) {
  const { toast } = useToast();
  const endpoint = TAB_CONFIG[activeTab].apiEndpoint('template');
  const filename = TAB_CONFIG[activeTab].templateFilename;
  
  const downloadTemplateMutation = useMutation({
    mutationFn: async () => {
      try {
        const response = await fetch(endpoint);
        
        if (!response.ok) {
          throw new Error(`Failed to download template: ${response.statusText}`);
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Error downloading template:", error);
        throw error;
      }
    },
    onError: (error: any) => {
      toast({
        title: "Download Failed",
        description: error.message || "Failed to download template.",
        variant: "destructive",
      });
    }
  });
  
  return { 
    downloadTemplateMutation,
    isDownloadLoading: downloadTemplateMutation.isPending
  };
}