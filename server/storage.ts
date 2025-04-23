// This file is kept for backward compatibility
// but has been refactored into smaller modules in the storage directory

// Import the interface and storage implementation from the modular structure
// Use the exact exports from the storage/index.ts file
import { 
  IStorage as StorageInterface,
  storage as dbStorage 
} from "./storage/index";

// Re-export for backward compatibility
export type IStorage = StorageInterface;
export const storage = dbStorage;