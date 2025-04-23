import { Router, Request, Response } from 'express';
import { isAuthenticated } from '../middleware/auth';
import { db } from '../db';
import { 
  essayPrompts, 
  userEssays, 
  EssayTaskType, 
  insertEssayPromptSchema,
  insertUserEssaySchema
} from '@shared/schema';
import { eq, desc, and } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();

/**
 * Get all essay prompts
 * GET /api/essays/prompts
 */
router.get('/api/essays/prompts', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const prompts = await db.query.essayPrompts.findMany({
      orderBy: desc(essayPrompts.id)
    });
    
    return res.json(prompts);
  } catch (error) {
    console.error('Error fetching essay prompts:', error);
    return res.status(500).json({ success: false, message: 'Error fetching essay prompts' });
  }
});

/**
 * Get a specific essay prompt by ID
 * GET /api/essays/prompts/:id
 */
router.get('/api/essays/prompts/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const promptId = parseInt(req.params.id);
    
    if (isNaN(promptId)) {
      return res.status(400).json({ success: false, message: 'Invalid prompt ID' });
    }
    
    const prompt = await db.query.essayPrompts.findFirst({
      where: eq(essayPrompts.id, promptId)
    });
    
    if (!prompt) {
      return res.status(404).json({ success: false, message: 'Essay prompt not found' });
    }
    
    return res.json(prompt);
  } catch (error) {
    console.error('Error fetching essay prompt:', error);
    return res.status(500).json({ success: false, message: 'Error fetching essay prompt' });
  }
});

/**
 * Get essay prompts by type (issue or argument)
 * GET /api/essays/prompts/type/:taskType
 */
router.get('/api/essays/prompts/type/:taskType', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const taskType = req.params.taskType;
    
    if (taskType !== EssayTaskType.ISSUE && taskType !== EssayTaskType.ARGUMENT) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid task type. Must be either "issue" or "argument"' 
      });
    }
    
    const prompts = await db.query.essayPrompts.findMany({
      where: eq(essayPrompts.taskType, taskType),
      orderBy: desc(essayPrompts.id)
    });
    
    return res.json(prompts);
  } catch (error) {
    console.error('Error fetching essay prompts by type:', error);
    return res.status(500).json({ success: false, message: 'Error fetching essay prompts' });
  }
});

/**
 * Create a new essay prompt (admin only)
 * POST /api/essays/prompts
 */
router.post('/api/essays/prompts', isAuthenticated, async (req: Request, res: Response) => {
  try {
    // Check if user is admin
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Unauthorized: Admin access required' });
    }
    
    // Validate request body
    const result = insertEssayPromptSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid prompt data', 
        errors: result.error.format() 
      });
    }
    
    // Insert new prompt
    const [newPrompt] = await db.insert(essayPrompts).values(result.data).returning();
    
    return res.status(201).json(newPrompt);
  } catch (error) {
    console.error('Error creating essay prompt:', error);
    return res.status(500).json({ success: false, message: 'Error creating essay prompt' });
  }
});

/**
 * Get user's essay submissions
 * GET /api/essays/user
 */
router.get('/api/essays/user', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    
    const essays = await db.query.userEssays.findMany({
      where: eq(userEssays.userId, userId),
      orderBy: desc(userEssays.createdAt),
      with: {
        prompt: true
      }
    });
    
    return res.json(essays);
  } catch (error) {
    console.error('Error fetching user essays:', error);
    return res.status(500).json({ success: false, message: 'Error fetching user essays' });
  }
});

/**
 * Get a specific user essay by ID
 * GET /api/essays/user/:id
 */
router.get('/api/essays/user/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const essayId = parseInt(req.params.id);
    const userId = req.user!.id;
    
    if (isNaN(essayId)) {
      return res.status(400).json({ success: false, message: 'Invalid essay ID' });
    }
    
    const essay = await db.query.userEssays.findFirst({
      where: and(
        eq(userEssays.id, essayId),
        eq(userEssays.userId, userId)
      ),
      with: {
        prompt: true
      }
    });
    
    if (!essay) {
      return res.status(404).json({ success: false, message: 'Essay not found' });
    }
    
    return res.json(essay);
  } catch (error) {
    console.error('Error fetching user essay:', error);
    return res.status(500).json({ success: false, message: 'Error fetching user essay' });
  }
});

/**
 * Start a new essay (creates an initial record)
 * POST /api/essays/start
 */
router.post('/api/essays/start', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const startEssaySchema = z.object({
      promptId: z.number().int().positive()
    });
    
    // Validate request body
    const result = startEssaySchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid data', 
        errors: result.error.format() 
      });
    }
    
    const userId = req.user!.id;
    const { promptId } = result.data;
    
    // Check if prompt exists
    const prompt = await db.query.essayPrompts.findFirst({
      where: eq(essayPrompts.id, promptId)
    });
    
    if (!prompt) {
      return res.status(404).json({ success: false, message: 'Essay prompt not found' });
    }
    
    // Create initial essay record
    const [newEssay] = await db.insert(userEssays).values({
      userId,
      promptId,
      content: '',
      wordCount: 0,
      timeSpent: 0,
      isCompleted: false
    }).returning();
    
    return res.status(201).json(newEssay);
  } catch (error) {
    console.error('Error starting essay:', error);
    return res.status(500).json({ success: false, message: 'Error starting essay' });
  }
});

/**
 * Save essay progress
 * PUT /api/essays/save/:id
 */
router.put('/api/essays/save/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const essayId = parseInt(req.params.id);
    const userId = req.user!.id;
    
    if (isNaN(essayId)) {
      return res.status(400).json({ success: false, message: 'Invalid essay ID' });
    }
    
    // Define schema for saving essay progress
    const saveEssaySchema = z.object({
      content: z.string(),
      wordCount: z.number().int().nonnegative(),
      timeSpent: z.number().int().nonnegative()
    });
    
    // Validate request body
    const result = saveEssaySchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid data', 
        errors: result.error.format() 
      });
    }
    
    // Check if essay exists and belongs to user
    const existingEssay = await db.query.userEssays.findFirst({
      where: and(
        eq(userEssays.id, essayId),
        eq(userEssays.userId, userId)
      )
    });
    
    if (!existingEssay) {
      return res.status(404).json({ success: false, message: 'Essay not found' });
    }
    
    // Update essay
    const [updatedEssay] = await db.update(userEssays)
      .set({
        content: result.data.content,
        wordCount: result.data.wordCount,
        timeSpent: result.data.timeSpent,
        updatedAt: new Date()
      })
      .where(and(
        eq(userEssays.id, essayId),
        eq(userEssays.userId, userId)
      ))
      .returning();
    
    return res.json(updatedEssay);
  } catch (error) {
    console.error('Error saving essay:', error);
    return res.status(500).json({ success: false, message: 'Error saving essay' });
  }
});

/**
 * Submit essay for evaluation
 * POST /api/essays/submit/:id
 */
router.post('/api/essays/submit/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const essayId = parseInt(req.params.id);
    const userId = req.user!.id;
    
    if (isNaN(essayId)) {
      return res.status(400).json({ success: false, message: 'Invalid essay ID' });
    }
    
    // Check if essay exists and belongs to user
    const existingEssay = await db.query.userEssays.findFirst({
      where: and(
        eq(userEssays.id, essayId),
        eq(userEssays.userId, userId)
      ),
      with: {
        prompt: true
      }
    });
    
    if (!existingEssay) {
      return res.status(404).json({ success: false, message: 'Essay not found' });
    }
    
    // Check if content is too short
    if (existingEssay.content.split(/\s+/).length < 50) {
      return res.status(400).json({ 
        success: false, 
        message: 'Essay is too short. Please write at least 50 words before submitting.' 
      });
    }
    
    // TODO: Implement AI-based essay evaluation
    // This would integrate with an AI service to analyze the essay
    // For now, we'll mark it as completed and return a placeholder response
    
    // Basic feedback structure as a placeholder
    const placeholderFeedback: EssayFeedback = {
      overallScore: 4 as EssayScoreValue,
      criteria: {
        structure: {
          score: 4,
          feedback: "Your essay has a clear structure with an introduction, body paragraphs, and conclusion."
        },
        clarity: {
          score: 4,
          feedback: "Your ideas are presented clearly and are easy to follow."
        },
        reasoning: {
          score: 4,
          feedback: "You provide logical arguments to support your position."
        },
        evidence: {
          score: 3,
          feedback: "The essay would benefit from more specific examples to support your claims."
        },
        grammar: {
          score: 4,
          feedback: "The writing is generally free of grammatical errors."
        }
      },
      strengths: [
        "Clear organization of ideas",
        "Logical progression of arguments",
        "Good sentence variety"
      ],
      weaknesses: [
        "Some claims lack sufficient evidence",
        "Conclusion could be more thorough"
      ],
      suggestions: [
        "Incorporate more specific examples to support your claims",
        "Expand your conclusion to reinforce your main points"
      ],
      summary: "Overall, this is a well-written essay that demonstrates good analytical skills. With some additional evidence and a stronger conclusion, it could be even more effective."
    };
    
    // Update essay as completed with feedback
    const [updatedEssay] = await db.update(userEssays)
      .set({
        isCompleted: true,
        feedback: placeholderFeedback,
        score: 4, // Placeholder score
        updatedAt: new Date()
      })
      .where(and(
        eq(userEssays.id, essayId),
        eq(userEssays.userId, userId)
      ))
      .returning();
    
    return res.json({
      success: true,
      essay: updatedEssay,
      feedback: placeholderFeedback
    });
  } catch (error) {
    console.error('Error submitting essay:', error);
    return res.status(500).json({ success: false, message: 'Error submitting essay' });
  }
});

export default router;