import crypto from 'crypto';
import { storage } from '../storage';
// NOTE: We import emailService dynamically later to avoid circular dependencies

// Token types
export const TokenType = {
  EMAIL_VERIFICATION: 'email_verification',
  PASSWORD_RESET: 'password_reset'
} as const;

export type TokenTypeValue = typeof TokenType[keyof typeof TokenType];

// Generate a random token
export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

// Create and save a token in the database
export async function createToken(
  userId: number,
  tokenType: TokenTypeValue,
  expiryHours: number
): Promise<string> {
  // Generate a random token
  const token = generateToken();
  
  // Calculate expiry time
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + expiryHours);
  
  // Save token to database
  await storage.createUserToken({
    userId,
    tokenType,
    token,
    expiresAt,
    used: false,
  });
  
  return token;
}

// Verify if a token is valid and not expired
export async function verifyToken(
  token: string,
  tokenType: TokenTypeValue
): Promise<{ valid: boolean; userId?: number; error?: string }> {
  try {
    // Retrieve token from database
    const tokenRecord = await storage.getUserTokenByToken(token);
    
    if (!tokenRecord) {
      return { valid: false, error: 'Token not found' };
    }
    
    if (tokenRecord.tokenType !== tokenType) {
      return { valid: false, error: 'Invalid token type' };
    }
    
    if (tokenRecord.used) {
      return { valid: false, error: 'Token already used' };
    }
    
    const now = new Date();
    if (now > tokenRecord.expiresAt) {
      return { valid: false, error: 'Token expired' };
    }
    
    return { valid: true, userId: tokenRecord.userId };
    
  } catch (error) {
    console.error('Error verifying token:', error);
    return { valid: false, error: 'An error occurred while verifying token' };
  }
}

// Mark a token as used after it has been successfully used
export async function markTokenAsUsed(token: string): Promise<boolean> {
  try {
    const tokenRecord = await storage.getUserTokenByToken(token);
    
    if (!tokenRecord) {
      return false;
    }
    
    return await storage.markTokenAsUsed(tokenRecord.id);
  } catch (error) {
    console.error('Error marking token as used:', error);
    return false;
  }
}

// Send a verification email
export async function sendVerificationEmail(
  userId: number,
  email: string,
  firstName: string
): Promise<{ success: boolean; error?: string; token?: string }> {
  try {
    // Generate a verification token valid for 24 hours
    const token = await createToken(userId, TokenType.EMAIL_VERIFICATION, 24);
    
    // Dynamically import email service to avoid circular dependencies
    try {
      const { emailService } = await import('./email-service');
      
      // Check if email service is configured before attempting to send
      if (emailService.isConfigured()) {
        // Send the verification email
        return await emailService.sendVerificationEmail(userId, email, token);
      } else {
        console.warn('Email service not configured. Generated verification token but not sending email.');
        // Return token in development or test environments for easier testing
        if (process.env.NODE_ENV !== 'production') {
          return { 
            success: false, 
            error: 'Email service not configured',
            token // Only include token in non-production environments
          };
        }
        return { 
          success: false, 
          error: 'Email service not configured' 
        };
      }
    } catch (importError) {
      console.error('Error importing email service:', importError);
      // Return token in development or test environments for easier testing
      if (process.env.NODE_ENV !== 'production') {
        return { 
          success: false, 
          error: 'Failed to import email service',
          token // Only include token in non-production environments
        };
      }
      return { 
        success: false, 
        error: 'Failed to import email service' 
      };
    }
  } catch (error) {
    console.error('Error sending verification email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send verification email' 
    };
  }
}

// Send a password reset email
export async function sendPasswordResetEmail(
  userId: number,
  email: string
): Promise<{ success: boolean; error?: string; token?: string }> {
  try {
    // Generate a password reset token valid for 1 hour
    const token = await createToken(userId, TokenType.PASSWORD_RESET, 1);
    
    // Dynamically import email service to avoid circular dependencies
    try {
      const { emailService } = await import('./email-service');
      
      // Check if email service is configured before attempting to send
      if (emailService.isConfigured()) {
        // Send the password reset email
        return await emailService.sendPasswordResetEmail(userId, email, token);
      } else {
        console.warn('Email service not configured. Generated password reset token but not sending email.');
        // Return token in development or test environments for easier testing
        if (process.env.NODE_ENV !== 'production') {
          return { 
            success: false, 
            error: 'Email service not configured',
            token // Only include token in non-production environments
          };
        }
        return { 
          success: false, 
          error: 'Email service not configured' 
        };
      }
    } catch (importError) {
      console.error('Error importing email service:', importError);
      // Return token in development or test environments for easier testing
      if (process.env.NODE_ENV !== 'production') {
        return { 
          success: false, 
          error: 'Failed to import email service',
          token // Only include token in non-production environments
        };
      }
      return { 
        success: false, 
        error: 'Failed to import email service' 
      };
    }
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send password reset email' 
    };
  }
}

// Clean up expired tokens
export async function cleanupExpiredTokens(): Promise<number> {
  return await storage.deleteExpiredTokens();
}