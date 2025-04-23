import express, { Request, Response } from "express";
import { isAuthenticated } from "../middleware/auth";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";

const router = express.Router();

const profileUpdateSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
});

const passwordUpdateSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6),
  confirmPassword: z.string().min(6),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

/**
 * Update user profile
 * PUT /api/auth/profile
 */
router.put("/api/auth/profile", isAuthenticated, async (req: Request, res: Response) => {
  try {
    // Validate the request body
    const validationResult = profileUpdateSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid request data", 
        errors: validationResult.error.errors 
      });
    }

    const data = validationResult.data;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    // Check if email is already taken by another user
    if (data.email) {
      const existingUser = await db.query.users.findFirst({
        where: (users, { eq, and, ne }) => 
          and(eq(users.email, data.email), ne(users.id, userId))
      });

      if (existingUser) {
        return res.status(400).json({ success: false, message: "Email already in use" });
      }
    }

    // Update the user
    await db.update(users)
      .set({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    return res.status(200).json({ success: true, message: "Profile updated successfully" });
  } catch (error) {
    console.error("Error updating profile:", error);
    return res.status(500).json({ success: false, message: "Failed to update profile" });
  }
});

/**
 * Change user password
 * PUT /api/auth/change-password
 */
router.put("/api/auth/change-password", isAuthenticated, async (req: Request, res: Response) => {
  try {
    // Validate the request body
    const validationResult = passwordUpdateSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid request data", 
        errors: validationResult.error.errors 
      });
    }

    const data = validationResult.data;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    // Get the user to verify current password
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(data.currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: "Current password is incorrect" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(data.newPassword, 10);

    // Update the password
    await db.update(users)
      .set({
        password: hashedPassword,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    return res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    return res.status(500).json({ success: false, message: "Failed to change password" });
  }
});

export default router;