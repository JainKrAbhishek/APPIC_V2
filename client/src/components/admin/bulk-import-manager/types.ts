import { ReactNode } from "react";

// Tab types
export type ImportTab = "questions" | "practice-sets" | "quant-content" | "verbal-content";
export type ImportAction = "preview" | "import" | "template";

// State interfaces
export interface ImportStatus {
  imported: number;
  skipped: number;
  errors: number;
}

// Props interfaces
export interface ImportTabsProps {
  activeTab: ImportTab;
  onTabChange: (tab: ImportTab) => void;
}

export interface FileUploadProps {
  isLoading: boolean;
  selectedFile: File | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPreview: () => void;
  onImport: () => void;
  onDownloadTemplate: () => void;
  previewIsLoading: boolean;
  importIsLoading: boolean;
  downloadIsLoading: boolean;
  fileInstructions: string;
}

export interface ImportSuccessProps {
  importedCount: number;
  tabTitle: string;
  onReset: () => void;
}

export interface DataPreviewProps {
  data: any[] | null;
  isLoading: boolean;
}

// Helper types
export interface TabInfo {
  title: string;
  description: string;
  fileInstructions: string;
  templateFilename: string;
  apiEndpoint: (action: ImportAction) => string;
}

export interface TabMap {
  [key: string]: TabInfo;
}