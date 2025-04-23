import { Router, Request, Response } from "express";
import { isAuthenticated, isAdmin } from "../middleware/auth";
import { storage } from "../storage";
import { db } from "../db";
import { users } from "../../shared/schema";
import { sql } from "drizzle-orm";

const router = Router();

// Admin status check endpoint
router.get("/check-admin", isAuthenticated, isAdmin, (req, res) => {
  return res.json({ 
    success: true, 
    message: 'Admin authenticated',
    user: {
      id: (req.user as any).id,
      username: (req.user as any).username,
      isAdmin: (req.user as any).isAdmin,
      userType: (req.user as any).userType
    }
  });
});

// Create a test question - admin only
router.post("/test-question", isAuthenticated, isAdmin, async (req, res) => {
  try {
    // Create a simple test question
    const questionData = {
      type: "quantitative",
      subtype: "multiple_choice",
      difficulty: 3,
      content: JSON.stringify([{"type":"paragraph","children":[{"text":"Test question content"}]}]),
      options: JSON.stringify([
        {"text":"Option A","isCorrect":true},
        {"text":"Option B","isCorrect":false},
        {"text":"Option C","isCorrect":false}
      ]),
      answer: "0",
      explanation: JSON.stringify([{"type":"paragraph","children":[{"text":"Test explanation"}]}]),
      topicId: null
    };
    
    const question = await storage.createQuestion(questionData);
    
    res.status(201).json({
      success: true,
      message: "Test question created successfully",
      question
    });
  } catch (error) {
    console.error("Error creating test question:", error);
    res.status(500).json({
      success: false,
      message: "Error creating test question"
    });
  }
});

// Grant admin privileges to a user
router.post("/grant-admin", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required"
      });
    }
    
    // For security, first check if the current user is already an admin
    if ((req.user as any).isAdmin === true || (req.user as any).userType === 'admin') {
      // User is already an admin, allow the operation
      const updatedUser = await storage.updateUser(userId, {
        isAdmin: true,
        userType: "admin"
      });
      
      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }
      
      return res.json({
        success: true,
        message: "User has been granted admin privileges",
        user: updatedUser
      });
    }
    
    // For non-admins, only allow them to update their own account
    if ((req.user as any).id !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only grant admin rights to your own account if you're not already an admin"
      });
    }
    
    // Use Drizzle to directly update the user record (as a fallback mechanism)
    try {
      // First attempt with the storage API
      const updatedUser = await storage.updateUser(userId, {
        isAdmin: true,
        userType: "admin"
      });
      
      if (updatedUser) {
        return res.json({
          success: true,
          message: "User has been granted admin privileges",
          user: updatedUser
        });
      }
      
      // If storage API fails, try direct database update
      console.log("Storage API failed, attempting direct DB update...");
      const result = await db.update(users)
        .set({ isAdmin: true, userType: "admin" })
        .where(sql`${users.id} = ${userId}`)
        .returning();
      
      if (result && result.length > 0) {
        return res.json({
          success: true,
          message: "User has been granted admin privileges (direct DB update)",
          user: result[0]
        });
      } else {
        return res.status(404).json({
          success: false,
          message: "User not found or update failed"
        });
      }
    } catch (error) {
      console.error("Error updating user:", error);
      return res.status(500).json({
        success: false,
        message: "Error updating user"
      });
    }
  } catch (error) {
    console.error("Error granting admin privileges:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while granting admin privileges"
    });
  }
});

export default router;