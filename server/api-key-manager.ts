import { storage } from './storage';
import { ApiKey, InsertApiKey } from '@shared/schema';
import crypto from 'crypto';

/**
 * Class for managing API keys, including storing and retrieving them securely
 */
export class ApiKeyManager {
  private static instance: ApiKeyManager;

  private constructor() {
    // Private constructor to ensure singleton pattern
  }

  /**
   * Get the singleton instance of ApiKeyManager
   */
  public static getInstance(): ApiKeyManager {
    if (!ApiKeyManager.instance) {
      ApiKeyManager.instance = new ApiKeyManager();
    }
    return ApiKeyManager.instance;
  }

  /**
   * Encrypt an API key before storing it
   * @param plainKey The plain text API key
   * @returns The encrypted key value
   */
  private encryptKey(plainKey: string): string {
    // In a production environment, this would use a proper encryption method with a secure key
    // For demonstration, we're using a simple encoding
    // NOTE: This is not secure for production use - would need proper encryption with environment variable keys
    return Buffer.from(plainKey).toString('base64');
  }

  /**
   * Decrypt an API key after retrieving it
   * @param encryptedKey The encrypted API key
   * @returns The plain text API key
   */
  private decryptKey(encryptedKey: string): string {
    // Corresponding decryption method
    return Buffer.from(encryptedKey, 'base64').toString('utf-8');
  }

  /**
   * Store a new API key in the database
   * @param name A descriptive name for the API key
   * @param keyType The type of API key (e.g., "resend", "stripe")
   * @param keyValue The plain text API key
   * @returns The created API key record
   */
  async storeApiKey(name: string, keyType: string, keyValue: string): Promise<ApiKey> {
    // Encrypt the key before storing
    const encryptedKey = this.encryptKey(keyValue);
    
    // Create the API key record
    const apiKeyData: InsertApiKey = {
      name,
      keyType,
      keyValue: encryptedKey,
      isActive: true
    };
    
    return await storage.createApiKey(apiKeyData);
  }

  /**
   * Retrieve an API key by its type
   * @param keyType The type of API key to retrieve
   * @returns The plain text API key, or null if not found
   */
  async getApiKey(keyType: string): Promise<string | null> {
    try {
      // Get the API key record
      const apiKey = await storage.getApiKeyByType(keyType);
      
      if (!apiKey) {
        return null;
      }
      
      // Mark the key as used
      await storage.markApiKeyAsUsed(apiKey.id);
      
      // Decrypt and return the key
      return this.decryptKey(apiKey.keyValue);
    } catch (error) {
      console.error(`Error retrieving API key of type ${keyType}:`, error);
      return null;
    }
  }

  /**
   * Retrieve all API keys
   * @returns Array of API key records (without decrypted values)
   */
  async getAllApiKeys(): Promise<ApiKey[]> {
    return await storage.getAllApiKeys();
  }

  /**
   * Update an existing API key
   * @param id The ID of the API key to update
   * @param name Updated name for the API key
   * @param keyValue Updated plain text API key (if not provided, the existing key is kept)
   * @param isActive Whether the key should be active
   * @returns The updated API key record
   */
  async updateApiKey(
    id: number, 
    name?: string, 
    keyValue?: string, 
    isActive?: boolean
  ): Promise<ApiKey | undefined> {
    // Get the existing API key
    const existingKey = await storage.getApiKey(id);
    
    if (!existingKey) {
      return undefined;
    }
    
    // Prepare update data
    const updateData: Partial<ApiKey> = {};
    
    if (name !== undefined) {
      updateData.name = name;
    }
    
    if (keyValue !== undefined) {
      updateData.keyValue = this.encryptKey(keyValue);
    }
    
    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }
    
    // Update the key
    return await storage.updateApiKey(id, updateData);
  }

  /**
   * Delete an API key
   * @param id The ID of the API key to delete
   * @returns Whether the deletion was successful
   */
  async deleteApiKey(id: number): Promise<boolean> {
    return await storage.deleteApiKey(id);
  }

  /**
   * Load environment variables from stored API keys
   * This method retrieves API keys from the database and sets them as environment variables
   */
  async loadApiKeysToEnvironment(): Promise<void> {
    try {
      // Get all active API keys
      const apiKeys = await storage.getAllApiKeys();
      const activeKeys = apiKeys.filter(key => key.isActive);
      
      // Load each key into environment variables
      for (const key of activeKeys) {
        const plainKey = this.decryptKey(key.keyValue);
        
        // Set as environment variable based on key type
        switch (key.keyType) {
          case 'resend':
            process.env.RESEND_API_KEY = plainKey;
            break;
          case 'stripe':
            process.env.STRIPE_SECRET_KEY = plainKey;
            break;
          // Add additional key types as needed
          default:
            // For other key types, use a standardized format
            process.env[`API_KEY_${key.keyType.toUpperCase()}`] = plainKey;
        }
      }
      
      console.log(`Loaded ${activeKeys.length} API keys into environment variables`);
    } catch (error) {
      console.error('Error loading API keys to environment:', error);
    }
  }
}

// Export the singleton instance
export const apiKeyManager = ApiKeyManager.getInstance();