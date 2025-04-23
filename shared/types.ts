import { Request } from 'express';
import { User } from './schema';

/**
 * Represents any user object from the database
 * Used for more flexible typing than strict schema User
 */
export interface UserRecord {
  id: number;
  username: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null; 
  isAdmin?: boolean | null;
  userType?: string | null;
  [key: string]: any; // Allow any additional properties
}

/**
 * Extends Express Request to include authenticated user information
 */
export interface RequestWithUser extends Request {
  user?: UserRecord;
}