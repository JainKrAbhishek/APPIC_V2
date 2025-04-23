/**
 * @file VerbalContentManager.nx.tsx
 * 
 * This file provides backward compatibility for the refactored VerbalContentManager component.
 * 
 * It re-exports the component from its new location in the domain-driven folder structure
 * to ensure existing imports continue to work without requiring changes throughout the codebase.
 * 
 * New code should import directly from the verbal-content/VerbalContentManager file instead.
 */

import VerbalContentManager from './verbal-content/VerbalContentManager';

export default VerbalContentManager;