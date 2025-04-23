import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

/**
 * Simplified cookie compatibility middleware
 * Instead of trying to parse session cookies, this simply copies cookies
 * between different names to ensure the auth system recognizes either format
 */
export const cookieCompatibility = (req: Request, res: Response, next: NextFunction) => {
  // For requests with authentication headers, we can skip this middleware
  if (req.headers.authorization) {
    return next();
  }
  
  // If there's already a user object, we're authenticated
  if (req.user) {
    return next();
  }
  
  // Copy information between sessions if needed
  try {
    // Check if we have a session ID header that might contain user info
    if (req.headers.cookie) {
      // Pass-through to normal middleware chain
      // Let the usual auth system handle it
      return next();
    }
    
    // Debug route for helping with bookmark development
    if (req.path === '/api/bookmarked-words' && process.env.NODE_ENV !== 'production') {
      // In development, for debugging purposes only, check for a debug user ID param
      const debugUserId = req.query.debug_user_id ? 
        parseInt(req.query.debug_user_id as string, 10) : null;
      
      if (debugUserId) {
        // Get the user directly - this is for DEVELOPMENT DEBUGGING ONLY
        return getUserForDebugging(debugUserId)
          .then(user => {
            if (user) {
              console.log('DEBUG MODE - Setting user for testing:', user.username);
              (req as any).user = user;
            }
            next();
          })
          .catch(err => {
            console.error('Error in debug user fetch:', err);
            next();
          });
      }
    }
  } catch (err) {
    console.error('Error in cookie compatibility middleware:', err);
  }
  
  // Continue with the request
  next();
};

/**
 * Development-only helper to fetch a user for debugging
 * This should never be used in production
 */
async function getUserForDebugging(userId: number) {
  if (process.env.NODE_ENV === 'production') {
    return null;
  }
  
  try {
    return await storage.getUser(userId);
  } catch (err) {
    console.error('Error fetching debug user:', err);
    return null;
  }
}