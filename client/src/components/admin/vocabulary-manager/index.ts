import VocabularyManager from "./VocabularyManager";

// Re-export for backward compatibility
export default VocabularyManager;

// Export individual components for reuse
export { default as WordForm } from "./WordForm";
export { default as WordTable } from "./WordTable";
export { default as SearchFilters } from "./SearchFilters";
export { default as VocabularyBulkActions } from "./VocabularyBulkActions";

// Export types and hooks
export * from "./types";
export * from "./hooks";