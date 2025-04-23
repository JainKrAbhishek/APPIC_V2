import { Router, Request, Response } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { 
  TokenType, 
  generateToken, 
  createToken, 
  verifyToken, 
  markTokenAsUsed,
  cleanupExpiredTokens,
  sendVerificationEmail
} from "../email/token-utils";
import { emailService } from "../email/email-service";
import bcrypt from "bcryptjs";
import passport from "passport";
import { insertUserSchema, UserType, SubscriptionStatus } from "../../shared/schema";
import { isAuthenticated, isAdmin } from "../middleware/auth";

// Import User type for typings
import type { User } from "../../shared/schema";

// We don't need to declare Express namespace types as we're using 'as User' in our code

const router = Router();

// Register new user
router.post("/register", async (req, res) => {
  try {
    // Extend the insert schema with password confirmation
    const registerSchema = insertUserSchema.extend({
      confirmPassword: z.string().min(1, "Please confirm your password")
    }).refine(data => data.password === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"]
    });
    
    const userData = registerSchema.parse(req.body);
    
    // Check if username already exists
    const existingUser = await storage.getUserByUsername(userData.username);
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: "Username already exists" 
      });
    }
    
    // Check if email already exists
    const existingEmail = await storage.getUserByEmail(userData.email);
    if (existingEmail) {
      return res.status(400).json({ 
        success: false,
        message: "Email already exists" 
      });
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    // Set default user type and subscription status
    const user = await storage.createUser({
      ...userData,
      password: hashedPassword,
      userType: UserType.FREE,
      emailVerified: false,
      subscriptionStatus: SubscriptionStatus.NONE
    });

    // For development mode or when email service is not configured
    if (!process.env.RESEND_API_KEY || process.env.NODE_ENV !== 'production') {
      // Generate a verification token
      const token = await createToken(user.id, TokenType.EMAIL_VERIFICATION, 24); // 24 hour expiry
      
      // Remove sensitive data before returning
      const { password, ...userWithoutPassword } = user;
      
      return res.status(201).json({ 
        success: true, 
        user: userWithoutPassword,
        message: "Registration successful but email service is not configured. For development purposes, here is your verification token.",
        token: token,
        verificationUrl: `${req.protocol}://${req.get('host')}/api/auth/verify-email?token=${token}`
      });
    }
    
    // For production with configured email service:
    // Import the utility function to avoid circular dependencies
    const { sendVerificationEmail } = await import("../email/token-utils");
    
    // Send verification email with fallback mechanism
    const emailResult = await sendVerificationEmail(
      user.id, 
      user.email, 
      user.firstName || user.username
    );
    
    // Even if email sending fails, the user is still created
    // We just log the error and continue
    if (!emailResult.success) {
      console.warn("Failed to send verification email:", emailResult.error);
    }
    
    // Remove sensitive data before returning
    const { password, ...userWithoutPassword } = user;
    
    res.status(201).json({ 
      success: true, 
      user: userWithoutPassword,
      message: "Registration successful. Please check your email to verify your account."
    });
  } catch (error) {
    console.error("Error in user registration:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        message: "Validation error",
        errors: error.errors
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: "An error occurred. Please try again later."
    });
  }
});

// Password reset request
router.post("/forgot-password", async (req, res) => {
  try {
    const schema = z.object({
      email: z.string().email("Invalid email address")
    });
    
    const { email } = schema.parse(req.body);
    
    // Get user by email
    const user = await storage.getUserByEmail(email);
    
    // For security reasons, always return success even if user not found
    if (!user) {
      return res.json({ 
        success: true, 
        message: "If your email is registered, you will receive password reset instructions." 
      });
    }
    
    // Clean up any expired tokens
    await cleanupExpiredTokens();
    
    // Generate a reset token
    const token = await createToken(user.id, TokenType.PASSWORD_RESET, 24); // 24 hours expiry
    
    // For development mode, we'll just handle it directly
    // since the email service is not configured
    
    // Check if the email service is configured
    if (!process.env.RESEND_API_KEY || process.env.NODE_ENV !== 'production') {
      // In development or when email service is not configured,
      // return the token directly for easier testing
      return res.json({
        success: true,
        message: "Email service is not configured. For development purposes, here is your reset token.",
        token: token,
        resetUrl: `${req.protocol}://${req.get('host')}/reset-password?token=${token}`
      });
    }
    
    // For production with configured email service:
    // Import the utility function to avoid circular dependencies
    const { sendPasswordResetEmail } = await import("../email/token-utils");
    
    // Use the utility function with email sending
    const result = await sendPasswordResetEmail(user.id, user.email);
    
    if (!result.success) {
      console.error("Failed to send password reset email:", result.error);
      
      // Check if we're in development mode and if email service is not configured
      if (process.env.NODE_ENV !== 'production' && result.token) {
        // Return the token in the response for testing in development
        return res.json({
          success: true,
          message: "Email service is not configured. For development purposes, here is your reset token.",
          token: result.token,
          resetUrl: `${req.protocol}://${req.get('host')}/reset-password?token=${result.token}`
        });
      }
      
      // In production, don't reveal details about the failure
      return res.status(500).json({ 
        success: false, 
        message: "Failed to send password reset email. Please try again later."
      });
    }
    
    res.json({ 
      success: true, 
      message: "If your email is registered, you will receive password reset instructions."
    });
  } catch (error) {
    console.error("Error in forgot password:", error);
    res.status(500).json({ success: false, message: "An error occurred. Please try again later." });
  }
});

// Reset password with token
router.post("/reset-password", async (req, res) => {
  try {
    const schema = z.object({
      token: z.string().min(1, "Token is required"),
      password: z.string().min(6, "Password must be at least 6 characters"),
      confirmPassword: z.string().min(1, "Please confirm your password")
    }).refine(data => data.password === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"]
    });
    
    const { token, password } = schema.parse(req.body);
    
    // Verify the token
    const tokenRecord = await verifyToken(token, TokenType.PASSWORD_RESET);
    
    if (!tokenRecord || !tokenRecord.valid || !tokenRecord.userId) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid or expired token. Please request a new password reset link."
      });
    }
    
    // Get the user
    const user = await storage.getUser(tokenRecord.userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Update the user's password
    const updated = await storage.updateUserPassword(user.id, hashedPassword);
    
    if (!updated) {
      return res.status(500).json({ 
        success: false, 
        message: "Failed to update password. Please try again."
      });
    }
    
    // Mark the token as used
    await markTokenAsUsed(token);
    
    res.json({ 
      success: true, 
      message: "Password has been reset successfully. You can now log in with your new password."
    });
  } catch (error) {
    console.error("Error in reset password:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        message: "Validation error",
        errors: error.errors
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: "An error occurred. Please try again later."
    });
  }
});

// Verify email address
router.get("/verify-email", async (req, res) => {
  try {
    const token = req.query.token as string;
    
    if (!token) {
      return res.status(400).json({ success: false, message: "No verification token provided" });
    }
    
    // Verify the token
    const tokenRecord = await verifyToken(token, TokenType.EMAIL_VERIFICATION);
    
    if (!tokenRecord || !tokenRecord.valid || !tokenRecord.userId) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid or expired token. Please request a new verification link."
      });
    }
    
    // Get the user
    const user = await storage.getUser(tokenRecord.userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    // Mark the user's email as verified
    const verified = await storage.verifyUserEmail(user.id);
    
    if (!verified) {
      return res.status(500).json({ 
        success: false, 
        message: "Failed to verify email. Please try again."
      });
    }
    
    // Mark the token as used
    await markTokenAsUsed(token);
    
    // Redirect to frontend success page
    res.redirect(`/email-verified?success=true`);
  } catch (error) {
    console.error("Error verifying email:", error);
    res.status(500).json({ 
      success: false, 
      message: "An error occurred while verifying your email. Please try again later."
    });
  }
});

// Login user
router.post("/login", (req, res, next) => {
  console.log('Login attempt for username:', req.body.username);
  
  passport.authenticate("local", (err: any, user: any, info: any) => {
    console.log('Passport authenticate result:', { err, user: user ? 'User found' : 'No user', info });
    
    if (err) {
      console.error("Error in login:", err);
      return res.status(500).json({ 
        success: false, 
        message: "An error occurred during login" 
      });
    }
    
    if (!user) {
      console.log('Login failed - Invalid credentials');
      return res.status(401).json({ 
        success: false, 
        message: info?.message || "Invalid username or password" 
      });
    }
    
    // Check if account is locked (would be implemented in schema with lockUntil field)
    if (user.lockUntil && new Date(user.lockUntil) > new Date()) {
      return res.status(403).json({
        success: false,
        message: "Account is temporarily locked. Please try again later."
      });
    }
    
    // Check if email is verified, unless in development mode
    if (process.env.NODE_ENV === 'production' && !user.emailVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in.",
        needsVerification: true
      });
    }

    // Log the user in with Passport
    console.log('Attempting to log in user:', user.id, user.username);
    req.login(user, (err: any) => {
      if (err) {
        console.error("Error in login session:", err);
        return res.status(500).json({ 
          success: false, 
          message: "An error occurred during login" 
        });
      }
      
      console.log('Login successful, session ID:', req.sessionID);
      console.log('Is authenticated after login:', req.isAuthenticated());
      console.log('req.user after login:', req.user);
      
      // Update last login timestamp
      storage.updateUser(user.id, { 
        lastLoginAt: new Date()
      }).catch(error => {
        console.error("Failed to update last login time:", error);
      });
      
      // Record login activity (tracking for security)
      try {
        storage.createActivity({
          userId: user.id,
          type: 'user_login',
          createdAt: new Date(),
          details: { 
            ip: req.ip,
            userAgent: req.headers['user-agent']
          }
        });
      } catch (error) {
        console.error("Failed to record login activity:", error);
      }
      
      // Remove sensitive data before returning
      const { password, ...userWithoutPassword } = user;
      
      return res.json({ 
        success: true, 
        user: userWithoutPassword,
        message: "Login successful" 
      });
    });
  })(req, res, next);
});

// Logout user
router.post("/logout", (req, res) => {
  // Check if user is logged in
  if (!req.isAuthenticated()) {
    return res.status(200).json({ 
      success: true, 
      message: "You were not logged in" 
    });
  }
  
  // Get user ID before logout for activity logging
  const userId = (req.user as any).id;
  
  // Perform the logout operation
  req.logout((err: any) => {
    if (err) {
      console.error("Error in logout:", err);
      return res.status(500).json({ 
        success: false, 
        message: "An error occurred during logout" 
      });
    }
    
    // Regenerate the session to prevent session fixation attacks
    req.session.regenerate((err: any) => {
      if (err) {
        console.error("Error regenerating session:", err);
      }
      
      // Log the logout activity (for security auditing)
      try {
        storage.createActivity({
          userId: userId,
          type: 'user_logout',
          createdAt: new Date(),
          details: { 
            ip: req.ip,
            userAgent: req.headers['user-agent']
          }
        }).catch(error => {
          console.error("Failed to record logout activity:", error);
        });
      } catch (error) {
        console.error("Failed to record logout activity:", error);
      }
      
      res.status(200).json({ 
        success: true, 
        message: "Logout successful" 
      });
    });
  });
});

// Get current user
router.get("/user", async (req, res) => {
  console.log('GET /user - Session ID:', req.sessionID);
  console.log('GET /user - Is authenticated:', req.isAuthenticated());
  console.log('GET /user - req.user:', req.user);
  console.log('GET /user - Session:', req.session);
  
  // Check if user is authenticated through Passport
  if (!req.isAuthenticated() || !req.user) {
    console.log('User not authenticated');
    return res.status(401).json({ 
      success: false, 
      message: "Not authenticated" 
    });
  }
  
  try {
    // Refresh user data from the database to ensure it's current
    const userId = (req.user as any).id;
    const freshUserData = await storage.getUser(userId);
    
    // Double-check user exists in database
    if (!freshUserData) {
      // User no longer exists in database, log them out
      req.logout((err) => {
        if (err) {
          console.error("Error logging out deleted user:", err);
        }
        return res.status(401).json({ 
          success: false, 
          message: "User account not found" 
        });
      });
      return;
    }
    
    // Check if user is no longer active (if status field exists)
    if (freshUserData.userType === 'suspended') {
      req.logout((err) => {
        if (err) {
          console.error("Error logging out suspended user:", err);
        }
        return res.status(403).json({ 
          success: false, 
          message: "Your account has been suspended or deactivated. Please contact support." 
        });
      });
      return;
    }
    
    // Check for session expiration based on subscription
    const isSubscribed = freshUserData.subscriptionStatus === 'active';
    // If user is not subscribed and session is older than 14 days, require re-login
    if (!isSubscribed && req.session.cookie.maxAge && req.session.cookie.maxAge < (3 * 24 * 60 * 60 * 1000)) {
      // Update session max age for subscribers (longer session)
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days for subscribers
    }
    
    // Remove sensitive data before returning
    const { password, ...userWithoutPassword } = freshUserData;
    
    res.json({ 
      success: true, 
      user: userWithoutPassword,
      // Include session info for client-side expiry handling
      session: {
        expiresAt: req.session.cookie.expires
      }
    });
  } catch (error) {
    console.error("Error retrieving current user:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving user information"
    });
  }
});

// Resend verification email
router.post("/resend-verification", isAuthenticated, async (req, res) => {
  try {
    const user = req.user as any;
    
    // Check if email is already verified
    if (user.emailVerified) {
      return res.status(400).json({ 
        success: false, 
        message: "Your email is already verified."
      });
    }
    
    // Clean up any expired tokens
    await cleanupExpiredTokens();
    
    // Import the utility function to avoid circular dependencies
    const { sendVerificationEmail } = await import("../email/token-utils");
    
    // Use the utility function which has built-in fallback mechanism
    const result = await sendVerificationEmail(
      user.id,
      user.email,
      user.firstName || user.username
    );
    
    if (!result.success) {
      console.error("Failed to send verification email:", result.error);
      
      // Check if we're in development mode and if email service is not configured
      if (process.env.NODE_ENV !== 'production' && result.token) {
        // Return the token in the response for testing in development
        return res.json({
          success: true,
          message: "Email service is not configured. For development purposes, here is your verification token.",
          token: result.token,
          verificationUrl: `${req.protocol}://${req.get('host')}/api/auth/verify-email?token=${result.token}`
        });
      }
      
      return res.status(500).json({ 
        success: false, 
        message: "Failed to send verification email. Please try again later."
      });
    }
    
    res.json({ 
      success: true, 
      message: "Verification email has been sent. Please check your email."
    });
  } catch (error) {
    console.error("Error resending verification email:", error);
    res.status(500).json({ 
      success: false, 
      message: "An error occurred. Please try again later."
    });
  }
});

// Debug endpoint to examine session state
router.get("/debug-session", (req, res) => {
  res.json({
    isAuthenticated: req.isAuthenticated(),
    sessionID: req.sessionID,
    sessionExpiry: req.session.cookie.expires,
    hasUser: !!req.user,
    userInfo: req.user ? {
      id: (req.user as any).id,
      username: (req.user as any).username,
      isAdmin: (req.user as any).isAdmin,
      userType: (req.user as any).userType
    } : null
  });
});

export default router;