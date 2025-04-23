import { Request, Response, NextFunction } from "express";

/**
 * Middleware to check if user is authenticated
 * Consistent implementation used across all routes
 */
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  // First check basic authentication
  if (!req.isAuthenticated()) {
    console.log('Authentication check failed: User not authenticated', { 
      sessionID: req.sessionID,
      path: req.path 
    });
    return res.status(401).json({ 
      success: false, 
      message: "Not authenticated" 
    });
  }

  // Get current user from the session
  const user = req.user as any;
  if (!user) {
    console.log('Authentication check failed: No user in request', { 
      sessionID: req.sessionID, 
      isAuthenticated: req.isAuthenticated(),
      path: req.path
    });
    return res.status(401).json({ 
      success: false, 
      message: "Invalid session user" 
    });
  }

  // Additional debug logging for session diagnostic
  if (process.env.NODE_ENV !== 'production') {
    console.log('Authentication successful', {
      userId: user.id,
      username: user.username,
      sessionID: req.sessionID,
      path: req.path
    });
  }

  // Authentication passed, proceed to the next middleware/handler
  next();
};

/**
 * Middleware to check if user is an admin
 */
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ 
      success: false, 
      message: "Not authenticated" 
    });
  }

  const user = req.user as any;
  if (!user || user.userType !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: "Forbidden: Admin access required" 
    });
  }

  next();
};