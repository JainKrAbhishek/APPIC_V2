import express, { Request, Response } from 'express';
import { isAuthenticated } from '../middleware/auth';
import { storage } from '../storage';
import { calculateNextReview } from '../../client/src/features/vocabulary/utils/spaced-repetition';
import { z } from 'zod';

// Define the express Request with user property
declare global {
  namespace Express {
    interface User {
      id: number;
      username: string;
      email: string;
      userType: string;
      [key: string]: any;
    }
  }
}

const router = express.Router();

// Get words due for review
router.get("/api/spaced-repetition/due-words", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Get limit from query params or use default
    const limit = parseInt(req.query.limit as string) || 20;
    
    // Get all word progress for the user
    const allWordProgress = await storage.getWordProgressByUser(userId);
    
    // Get all words
    const allWords = await storage.getAllWords();
    
    // Map words with their progress
    const wordsWithProgress = allWords.map(word => {
      const progress = allWordProgress.find(wp => wp.wordId === word.id);
      
      // If there's no progress record, consider it a new word
      if (!progress) {
        return {
          ...word,
          isNew: true,
          isDue: true,
          repetitionLevel: 0,
          efFactor: 250, // Default easiness factor (2.5)
          correctStreak: 0,
          reviewHistory: []
        };
      }
      
      // If there is progress, include it with the word
      return {
        ...word,
        isNew: false,
        isDue: !progress.nextReviewDate || new Date(progress.nextReviewDate) <= new Date(),
        repetitionLevel: progress.repetitionLevel || 0,
        efFactor: progress.efFactor || 250,
        nextReviewDate: progress.nextReviewDate,
        correctStreak: progress.correctStreak || 0,
        reviewHistory: progress.reviewHistory || []
      };
    });
    
    // Filter to only due words (either new or with nextReviewDate <= now)
    const dueWords = wordsWithProgress
      .filter(word => word.isDue)
      .sort((a, b) => {
        // First, sort by new status (new words first)
        if (a.isNew && !b.isNew) return -1;
        if (!a.isNew && b.isNew) return 1;
        
        // Then by repetition level (lower levels first)
        if (a.repetitionLevel !== b.repetitionLevel) {
          return a.repetitionLevel - b.repetitionLevel;
        }
        
        // Then by day/group number
        if (a.day !== b.day) {
          return a.day - b.day;
        }
        
        // Finally by order within the day
        return a.order - b.order;
      })
      .slice(0, limit);
    
    return res.json(dueWords);
  } catch (error) {
    console.error("Error fetching due words:", error);
    return res.status(500).json({ error: "Failed to fetch due words" });
  }
});

// Update word review progress
router.post("/api/spaced-repetition/update-review", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    
    // Validate request body
    const updateSchema = z.object({
      wordId: z.number(),
      quality: z.number().min(0).max(5),
      repetitionLevel: z.number().min(0),
      efFactor: z.number().min(130),
      nextReviewDate: z.string().datetime(),
      correctStreak: z.number().min(0),
      reviewHistory: z.array(
        z.object({
          date: z.string().datetime(),
          quality: z.number().min(0).max(5),
          interval: z.number().min(0),
          efFactor: z.number().min(130)
        })
      )
    });
    
    const validation = updateSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: "Invalid request data", 
        details: validation.error.format() 
      });
    }
    
    const { 
      wordId, 
      quality, 
      repetitionLevel, 
      efFactor, 
      nextReviewDate, 
      correctStreak, 
      reviewHistory 
    } = validation.data;
    
    // Check if the user already has progress for this word
    const existingProgress = await storage.getWordProgress(userId, wordId);
    
    if (existingProgress) {
      // Update existing progress
      const updatedProgress = await storage.updateWordProgress(
        existingProgress.id,
        {
          repetitionLevel,
          efFactor,
          nextReviewDate: new Date(nextReviewDate),
          correctStreak,
          reviewHistory,
          bookmarked: existingProgress.bookmarked,
          lastPracticed: new Date()
        }
      );
      
      return res.json(updatedProgress);
    } else {
      // Create new progress
      const newProgress = await storage.createWordProgress({
        userId,
        wordId,
        repetitionLevel,
        efFactor,
        nextReviewDate: new Date(nextReviewDate),
        correctStreak,
        reviewHistory,
        bookmarked: false,
        lastPracticed: new Date()
      });
      
      return res.json(newProgress);
    }
  } catch (error) {
    console.error("Error updating word review:", error);
    return res.status(500).json({ error: "Failed to update word review" });
  }
});

// Get spaced repetition statistics
router.get("/api/spaced-repetition/stats", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    
    // Get all word progress for the user
    const allWordProgress = await storage.getWordProgressByUser(userId);
    
    // Get all words
    const allWords = await storage.getAllWords();
    
    // Count total words
    const totalWords = allWords.length;
    
    // Count mastered words (repetition level >= 5)
    const masteredCount = allWordProgress.filter(wp => wp.repetitionLevel && wp.repetitionLevel >= 5).length;
    
    // Count words in learning (started but not mastered)
    const learningCount = allWordProgress.filter(wp => wp.repetitionLevel && wp.repetitionLevel > 0 && wp.repetitionLevel < 5).length;
    
    // Count new words (not started)
    const newCount = totalWords - masteredCount - learningCount;
    
    // Calculate average easiness factor
    const totalEasinessFactor = allWordProgress.reduce((sum, wp) => {
      return sum + (wp.efFactor || 250);
    }, 0);
    
    const averageEasinessFactor = allWordProgress.length > 0 
      ? totalEasinessFactor / allWordProgress.length / 100 
      : 2.5;
    
    // Calculate current streak
    const correctStreaks = allWordProgress.map(wp => wp.correctStreak || 0);
    const currentStreak = correctStreaks.length > 0 
      ? Math.max(...correctStreaks) 
      : 0;
    
    // Count total reviews
    const totalReviews = allWordProgress.reduce((sum, wp) => {
      const reviewHistory = wp.reviewHistory || [];
      return sum + (Array.isArray(reviewHistory) ? reviewHistory.length : 0);
    }, 0);
    
    return res.json({
      totalWords,
      masteredCount,
      learningCount,
      newCount,
      averageEasinessFactor,
      streaks: {
        current: currentStreak
      },
      totalReviews
    });
  } catch (error) {
    console.error("Error fetching spaced repetition stats:", error);
    return res.status(500).json({ error: "Failed to fetch spaced repetition stats" });
  }
});

export default router;