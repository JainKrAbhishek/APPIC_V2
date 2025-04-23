// Main component
export { default as ContentAccessManager } from './ContentAccessManager';

// Tab components
export { default as AccessRulesTab } from './AccessRulesTab';
export { default as BulkActionsTab } from './BulkActionsTab';

// Form components
export { default as AccessRuleForm } from './AccessRuleForm';
export { default as BulkActionForm } from './BulkActionForm';

// Table components
export { default as AccessRuleTable } from './AccessRuleTable';
export { default as ContentSelectionTable } from './ContentSelectionTable';

// Types and utilities
export * from './types';
export * from './hooks';

// Default export for backward compatibility
import ContentAccessManager from './ContentAccessManager';
export default ContentAccessManager;