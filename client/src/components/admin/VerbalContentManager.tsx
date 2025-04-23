/**
 * @file VerbalContentManager.tsx
 * 
 * This file provides backward compatibility for the existing VerbalContentManager component.
 * The component has been refactored into a domain-driven structure for better maintainability.
 * 
 * For new code, please import directly from:
 * 1. The enhanced version: './VerbalContentManager.enhanced.tsx'
 * 2. Or the individual components: './verbal-content/TopicsList', './verbal-content/ContentList', etc.
 */

import VerbalContentManager from './VerbalContentManager.enhanced';

export default VerbalContentManager;