import { Request, Response, Router } from "express";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { storage } from "../storage";
import { insertContentAccessControlSchema } from "@shared/schema";
import { isAuthenticated, isAdmin } from "../middleware/auth";

const router = Router();

// Get content access rules
router.get("/api/admin/content-access", isAdmin, async (req, res) => {
  try {
    const { contentType, userType } = req.query;
    
    if (!contentType && !userType) {
      return res.status(400).json({ 
        message: "Please provide at least one filter parameter (contentType or userType)" 
      });
    }
    
    // Apply filters based on query parameters
    if (contentType && userType) {
      const rules = await storage.getContentAccessByType(
        contentType as string, 
        userType as string
      );
      return res.json(rules);
    } 
    
    // TODO: Implement more filtered queries if needed
    
    res.status(400).json({ message: "Invalid filter parameters" });
  } catch (error) {
    console.error("Error fetching content access rules:", error);
    res.status(500).json({ message: "Failed to fetch content access rules" });
  }
});

// Create a content access rule
router.post("/api/admin/content-access", isAdmin, async (req, res) => {
  try {
    const data = insertContentAccessControlSchema.parse(req.body);
    
    // Check if a rule for this content and user type already exists
    const existingRules = await storage.getContentAccessByType(
      data.contentType,
      data.userType
    );
    
    const existingRule = existingRules.find(rule => rule.contentId === data.contentId);
    
    if (existingRule) {
      return res.status(409).json({ 
        message: "A rule for this content and user type already exists",
        existingRule
      });
    }
    
    const rule = await storage.setContentAccess(data);
    res.status(201).json(rule);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.message });
    }
    console.error("Error creating content access rule:", error);
    res.status(500).json({ message: "Failed to create content access rule" });
  }
});

// Update a content access rule
router.patch("/api/admin/content-access/:id", isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { isAccessible } = req.body;
    
    if (typeof isAccessible !== 'boolean') {
      return res.status(400).json({ message: "isAccessible must be a boolean value" });
    }
    
    const rule = await storage.updateContentAccess(id, isAccessible);
    
    if (!rule) {
      return res.status(404).json({ message: "Access rule not found" });
    }
    
    res.json(rule);
  } catch (error) {
    console.error("Error updating content access rule:", error);
    res.status(500).json({ message: "Failed to update content access rule" });
  }
});

// Delete a content access rule
router.delete("/api/admin/content-access/:id", isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const success = await storage.deleteContentAccess(id);
    
    if (!success) {
      return res.status(404).json({ message: "Access rule not found" });
    }
    
    res.json({ message: "Access rule deleted successfully" });
  } catch (error) {
    console.error("Error deleting content access rule:", error);
    res.status(500).json({ message: "Failed to delete content access rule" });
  }
});

// Bulk create content access rules
router.post("/api/admin/content-access/bulk", isAdmin, async (req, res) => {
  try {
    const { contentType, userType, isAccessible, contentIds } = req.body;
    
    // Validate request
    if (!contentType || !userType || contentIds?.length === 0 || typeof isAccessible !== 'boolean') {
      return res.status(400).json({ 
        message: "Missing required fields: contentType, userType, isAccessible, and contentIds array" 
      });
    }
    
    // Process each content ID
    const results = [];
    
    for (const contentId of contentIds) {
      try {
        const accessData = {
          contentType,
          contentId,
          userType,
          isAccessible
        };
        
        const rule = await storage.setContentAccess(accessData);
        results.push(rule);
      } catch (error) {
        console.error(`Error creating access rule for content ID ${contentId}:`, error);
      }
    }
    
    res.status(201).json({ 
      message: `Successfully created ${results.length} of ${contentIds.length} access rules`,
      results
    });
  } catch (error) {
    console.error("Error creating bulk content access rules:", error);
    res.status(500).json({ message: "Failed to create bulk content access rules" });
  }
});

// Check access for vocabulary content
router.get("/api/content-access/vocabulary", isAuthenticated, async (req, res) => {
  try {
    const { day } = req.query;
    const user = req.user as any;
    const userType = user.userType || "free"; // Default to free if not specified
    
    if (!day) {
      return res.status(400).json({ message: "Day parameter is required" });
    }
    
    const dayNumber = parseInt(day as string);
    
    // First check if there's a rule for this specific day
    const hasAccess = await storage.getContentAccess("vocabulary_day", dayNumber, userType);
    
    // Get the words for this day
    const words = await storage.getWordsByDay(dayNumber);
    
    if (hasAccess) {
      // If user has access to the full day, return all words
      return res.json({
        hasAccess: true,
        accessType: "full",
        wordsLimit: words.length,
        totalWords: words.length
      });
    } else {
      // Apply default limits based on user type if no specific rule exists
      let limit = 10; // Default limit for free users
      
      switch (userType) {
        case "premium":
          limit = 30;
          break;
        case "business":
          limit = 100;
          break;
        case "admin":
          limit = words.length; // Full access
          break;
      }
      
      return res.json({
        hasAccess: true,
        accessType: "limited",
        wordsLimit: Math.min(limit, words.length),
        totalWords: words.length
      });
    }
  } catch (error) {
    console.error("Error checking vocabulary access:", error);
    res.status(500).json({ message: "Failed to check vocabulary access" });
  }
});

// Get content list by type for admin panel
router.get("/api/admin/content", isAdmin, async (req, res) => {
  try {
    const { type } = req.query;
    
    if (!type) {
      return res.status(400).json({ message: "Content type is required" });
    }
    
    let content: any[] = [];
    
    switch (type) {
      case "quant_topic":
        content = await storage.getAllQuantTopics();
        break;
      case "verbal_topic":
        content = await storage.getAllVerbalTopics();
        break;
      case "practice_set":
        content = await storage.getAllPracticeSets();
        break;
      case "question":
        content = await storage.getAllQuestions();
        break;
      case "vocabulary_day":
        // Get all distinct vocabulary days
        const days = await storage.getDistinctVocabularyDays();
        // Create content items for each day
        content = days.map(day => ({
          id: day,
          title: `Day ${day}`,
          description: `Vocabulary words for day ${day}`,
          type: "vocabulary_day",
          day: day
        }));
        break;
      case "vocabulary_word":
        // Get all vocabulary words
        const words = await storage.getAllWords();
        content = words.map(word => ({
          id: word.id,
          title: word.word,
          description: word.definition,
          type: "vocabulary_word",
          day: word.day
        }));
        break;
      default:
        return res.status(400).json({ message: "Invalid content type" });
    }
    
    res.json(content);
  } catch (error) {
    console.error("Error fetching content list:", error);
    res.status(500).json({ message: "Failed to fetch content list" });
  }
});

export default router;