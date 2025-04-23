import { Router, Request, Response } from 'express';
import { isAdmin } from '../middleware/auth';
import { apiKeyManager } from '../api-key-manager';
import { insertApiKeySchema } from '@shared/schema';
import { z } from 'zod';

const router = Router();

/**
 * Get all API keys
 * GET /api/admin/api-keys
 */
router.get('/', isAdmin, async (_req: Request, res: Response) => {
  try {
    const keys = await apiKeyManager.getAllApiKeys();
    // Don't send encrypted key values to the frontend for security
    const safeKeys = keys.map(key => ({
      ...key,
      keyValue: '••••••••••••••••', // Mask actual values
    }));
    res.status(200).json(safeKeys);
  } catch (error) {
    console.error('Error fetching API keys:', error);
    res.status(500).json({ message: 'Failed to fetch API keys' });
  }
});

/**
 * Create a new API key
 * POST /api/admin/api-keys
 */
router.post('/', isAdmin, async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validationSchema = insertApiKeySchema.extend({
      keyValue: z.string().min(1, 'API key is required')
    });
    
    const { name, keyType, keyValue } = validationSchema.parse(req.body);
    
    // Store the API key
    const apiKey = await apiKeyManager.storeApiKey(name, keyType, keyValue);
    
    // Reload environment variables
    await apiKeyManager.loadApiKeysToEnvironment();
    
    // Return a masked version
    const safeKey = {
      ...apiKey,
      keyValue: '••••••••••••••••',
    };
    
    res.status(201).json(safeKey);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Invalid API key data', errors: error.errors });
    } else {
      console.error('Error creating API key:', error);
      res.status(500).json({ message: 'Failed to create API key' });
    }
  }
});

/**
 * Update an existing API key
 * PUT /api/admin/api-keys/:id
 */
router.put('/:id', isAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid API key ID' });
    }
    
    const { name, keyValue, isActive } = req.body;
    
    // Update the API key
    const updatedKey = await apiKeyManager.updateApiKey(id, name, keyValue, isActive);
    
    if (!updatedKey) {
      return res.status(404).json({ message: 'API key not found' });
    }
    
    // Reload environment variables
    await apiKeyManager.loadApiKeysToEnvironment();
    
    // Return a masked version
    const safeKey = {
      ...updatedKey,
      keyValue: '••••••••••••••••',
    };
    
    res.status(200).json(safeKey);
  } catch (error) {
    console.error('Error updating API key:', error);
    res.status(500).json({ message: 'Failed to update API key' });
  }
});

/**
 * Delete an API key
 * DELETE /api/admin/api-keys/:id
 */
router.delete('/:id', isAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid API key ID' });
    }
    
    const success = await apiKeyManager.deleteApiKey(id);
    
    if (!success) {
      return res.status(404).json({ message: 'API key not found' });
    }
    
    // Reload environment variables
    await apiKeyManager.loadApiKeysToEnvironment();
    
    res.status(200).json({ message: 'API key deleted successfully' });
  } catch (error) {
    console.error('Error deleting API key:', error);
    res.status(500).json({ message: 'Failed to delete API key' });
  }
});

export default router;