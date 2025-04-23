import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import * as schema from "@shared/schema.js";
import { 
  insertUserSchema,
  insertWordSchema,
  insertWordProgressSchema,
  insertQuestionSchema,
  insertPracticeSetSchema,
  insertPracticeResultSchema,
  insertActivitySchema,
  insertQuantTopicSchema, 
  insertQuantContentSchema
} from "@shared/schema.js";
import { db, pool } from "./db";
import { sql } from "drizzle-orm";
// Sample data import removed since it's not needed
import { z } from "zod";
import session from "express-session";
import bcrypt from "bcryptjs";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import authRoutes from "./routes/auth-routes";
import subscriptionRoutes from "./routes/subscription-routes";
import contentAccessRoutes from "./routes/content-access-routes";
import bulkImportRoutes from "./routes/bulk-import-routes";
import adminToolsRoutes from "./routes/admin-tools";
import apiKeyRoutes from "./routes/api-key-routes";
import spacedRepetitionRoutes from "./routes/spaced-repetition-routes";
import blogRoutes from "./routes/blog-routes";
import essayRoutes from "./routes/essay-routes";
import profileRoutes from "./routes/profile-routes";
import connectPgSimple from "connect-pg-simple";
import { isAuthenticated, isAdmin } from "./middleware/auth";
import { cookieCompatibility } from "./middleware/cookie-compatibility";
import { createNewPracticeSets } from "./create-practice-sets";
import { updatePracticeSetTopicAssociations } from "./update-practice-set-topics";

// Extend express-session with our custom properties
declare module 'express-session' {
  interface SessionData {
    userAgent?: string;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // TEMPORARY DEBUG ROUTE - Test for session issues (compatible version)
  app.get('/api/debug-session', async (req, res) => {
    try {
      console.log('==================== DEBUG SESSION ====================');
      console.log('Session ID:', req.sessionID);
      console.log('Has req.isAuthenticated?', typeof req.isAuthenticated === 'function');
      
      // Different ways to check authentication
      const hasUser = !!req.user;
      const authViaFunction = typeof req.isAuthenticated === 'function' ? req.isAuthenticated() : null;
      
      console.log('Auth via req.user:', hasUser);
      console.log('Auth via isAuthenticated():', authViaFunction);
      console.log('User in session:', req.user);
      console.log('Session object:', req.session);
      console.log('Cookies:', req.headers.cookie);
      
      // Raw cookie parse
      const cookies = {};
      if (req.headers.cookie) {
        req.headers.cookie.split(';').forEach(cookie => {
          const parts = cookie.match(/(.*?)=(.*)$/);
          if (parts) {
            cookies[parts[1].trim()] = (parts[2] || '').trim();
          }
        });
      }
      console.log('Parsed cookies:', cookies);
      console.log('==================== DEBUG END ====================');
      
      if (hasUser && req.user) {
        // If authenticated, also try direct DB query for bookmarked words
        const userId = (req.user as any).id;
        
        // Check the user progress records directly to see what's in the database
        db.query(`
          SELECT wp.*, w.word, w.definition, w.day
          FROM word_progress wp
          JOIN words w ON wp.word_id = w.id
          WHERE wp.user_id = $1 AND wp.bookmarked = true
          LIMIT 10
        `, [userId])
        .then(result => {
          console.log(`Found ${result.rowCount} bookmarked words via direct DB query`);
          
          // Try the storage method as well for comparison
          storage.getBookmarkedWords(userId)
            .then(words => {
              console.log(`Storage method returned ${words.length} bookmarked words`);
              
              res.json({
                success: true,
                sessionValid: true,
                userId: userId,
                directQueryCount: result.rowCount,
                directQuerySample: result.rows.slice(0, 5),
                storageMethodCount: words.length,
                storageMethodSample: words.slice(0, 5),
                bookmarkedWords: words.slice(0, 5) // Return first 5 words
              });
            })
            .catch(storageErr => {
              console.error('Error in storage.getBookmarkedWords:', storageErr);
              res.json({
                success: true,
                sessionValid: true,
                userId: userId,
                directQueryCount: result.rowCount,
                directQuerySample: result.rows.slice(0, 5),
                storageMethodError: storageErr.message,
                bookmarkedWords: []
              });
            });
        })
        .catch(err => {
          console.error('Error in direct DB query:', err);
          res.json({
            success: true,
            sessionValid: true,
            userId: userId,
            error: err.message,
            bookmarkedWords: []
          });
        });
      } else {
        res.json({
          success: false,
          sessionValid: false,
          message: 'Not authenticated',
          sessionID: req.sessionID,
          cookies: req.headers.cookie
        });
      }
    } catch (error) {
      console.error('Error in debug session endpoint:', error);
      res.json({
        success: false,
        error: error.message
      });
    }
  });
  // Initialize PostgreSQL session store
  const PgSessionStore = connectPgSimple(session);

  // Setup session middleware with PostgreSQL store
  app.use(
    session({
      store: new PgSessionStore({
        pool: pool,                  // Use the same pool that is used elsewhere in the app
        tableName: 'session',        // Name of the session table created by create-session-table.js
        createTableIfMissing: true,  // Automatically create the session table if it doesn't exist
        pruneSessionInterval: 60     // Clean up expired sessions every 60 seconds
      }),
      secret: process.env.SESSION_SECRET || "your-secret-key", // Use env var in production
      resave: false,
      saveUninitialized: false,
      name: 'connect.sid',           // Standard name for compatibility
      rolling: true,                 // Reset expiration on each request to keep session alive during activity
      cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours for better user experience
        secure: false,               // Set to false for Replit deployment, even in production
        httpOnly: true,              // Prevents JavaScript from reading cookie data
        sameSite: 'lax'              // Protect against CSRF
      },
    })
  );
  
  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Apply cookie compatibility middleware to maintain sessions
  app.use(cookieCompatibility);
  
  // Auth middleware now imported from ./middleware/auth.ts
  
  // Bookmark Word API
  app.post('/api/bookmark-word', isAuthenticated, async (req, res) => {
    try {
      const { wordId, bookmarked } = req.body;
      const userId = (req.user as any).id;
      
      console.log(`Bookmarking word: wordId=${wordId}, userId=${userId}, bookmarked=${bookmarked}`);
      
      // Check if word progress exists
      let wordProgress = await storage.getWordProgress(userId, wordId);
      console.log('Existing word progress:', wordProgress);
      
      if (wordProgress) {
        // Update existing progress
        wordProgress = await storage.updateWordProgress(wordProgress.id, {
          ...wordProgress,
          bookmarked: bookmarked
        });
        console.log('Updated word progress:', wordProgress);
      } else {
        // Create new progress
        wordProgress = await storage.createWordProgress({
          userId,
          wordId,
          bookmarked,
          learned: false,
          mastered: false,
          lastPracticed: null
        });
        console.log('Created new word progress:', wordProgress);
      }
      
      // Create activity
      await storage.createActivity({
        userId,
        type: bookmarked ? 'bookmark_add' : 'bookmark_remove',
        createdAt: new Date(),
        details: { wordId }
      });
      
      // Debug: Check if bookmarked words are returned correctly
      const bookmarkedWords = await storage.getBookmarkedWords(userId);
      console.log(`Number of bookmarked words for user ${userId}: ${bookmarkedWords.length}`);
      
      res.status(200).json({ success: true, wordProgress });
    } catch (error) {
      console.error('Error bookmarking word:', error);
      res.status(500).json({ success: false, message: 'Failed to update bookmark status' });
    }
  });
  
  // Get Bookmarked Words API
  app.get('/api/bookmarked-words', async (req, res) => {
    // For development only - allow bypassing authentication with debug user ID param
    const debugUserId = req.query.debug_user_id ? parseInt(req.query.debug_user_id as string, 10) : null;
    
    try {
      // For debugging: if debug_user_id is provided, use it to set user for this request only
      if (debugUserId && process.env.NODE_ENV !== 'production') {
        try {
          // Fetch user directly for debugging
          const debugUser = await storage.getUser(debugUserId);
          if (debugUser) {
            console.log(`DEBUG MODE: Setting user for bookmarked-words API to ${debugUser.username}`);
            (req as any).user = debugUser;
          }
        } catch (debugErr) {
          console.error('Error fetching debug user:', debugErr);
        }
      }
      
      // Regular auth check for normal operation
      if (!req.user) {
        console.error('Authentication check failed: User not authenticated', {
          sessionID: req.sessionID, 
          path: '/api/bookmarked-words'
        });
        return res.status(401).json({ success: false, message: 'Not authenticated' });
      }
      
      const userId = (req.user as any).id;
      console.log(`Fetching bookmarked words for userId=${userId}`);
      
      // Simple authentication verification log
      console.log(`Authentication successful for bookmarked-words API`, {
        userId: userId,
        username: (req.user as any).username,
        sessionID: req.sessionID,
        path: '/api/bookmarked-words'
      });
      
      try {
        // Direct query for bookmarked words for more reliable results
        // This bypasses any potential issues with the storage method
        const result = await pool.query(`
          SELECT w.id, w.word, w.definition, w.example, w.pronunciation, 
                 w.day, w.order, w.synonyms, w.part_of_speech as "partOfSpeech"
          FROM word_progress wp
          JOIN words w ON wp.word_id = w.id
          WHERE wp.user_id = $1 AND wp.bookmarked = true
          ORDER BY w.day, w.id
        `, [userId]);
        
        // Log number of bookmarked words found
        console.log(`Found ${result.rowCount} bookmarked words for user ${userId}`);
        
        // For debugging - log a few words if available
        if (result.rowCount > 0) {
          console.log('Sample bookmarked words:', 
            result.rows.slice(0, 3).map(word => ({ 
              id: word.id, 
              word: word.word, 
              day: word.day 
            }))
          );
        } else {
          console.log('No bookmarked words found in database for this user');
          
          // Additional debug - check if user has ANY word_progress entries
          const progressCount = await pool.query(
            'SELECT COUNT(*) FROM word_progress WHERE user_id = $1',
            [userId]
          );
          console.log(`User has ${progressCount.rows[0].count} total word_progress entries`);
          
          // Check if any are marked as bookmarked
          const bookmarkedCount = await pool.query(
            'SELECT COUNT(*) FROM word_progress WHERE user_id = $1 AND bookmarked = true',
            [userId]
          );
          console.log(`User has ${bookmarkedCount.rows[0].count} bookmarked entries in word_progress`);
        }
        
        // Add explicit headers to ensure proper response
        res.setHeader('Content-Type', 'application/json');
        
        // Return bookmarked words (even if it's an empty array)
        return res.status(200).json(result.rows || []);
      } catch (fetchError) {
        // If there's still an error from the direct query, log it and try the storage method as fallback
        console.error('Error in direct DB query for bookmarked words:', fetchError);
        
        console.log('Trying storage method as fallback...');
        try {
          const bookmarkedWords = await storage.getBookmarkedWords(userId);
          console.log(`Storage method found ${bookmarkedWords.length} bookmarked words`);
          return res.status(200).json(bookmarkedWords || []);
        } catch (storageError) {
          console.error('Fallback storage method also failed:', storageError);
          return res.status(200).json([]); // Return empty array to avoid client errors
        }
      }
    } catch (error) {
      // General error handler for the route
      console.error('Unexpected error in bookmarked words endpoint:', error);
      // Return empty array rather than error to prevent client-side crashes
      return res.status(200).json([]);
    }
  });
  // Session configuration is already set up above
  // Removing duplicate session and passport initialization

  // Passport strategy for username/password login
  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return done(null, false, { message: "Incorrect username" });
      }
      
      // For testing, allow plain text password
      let isPasswordValid = false;
      if (user.password === password) {
        isPasswordValid = true;
      } else {
        // Try compare hashed password as well
        try {
          isPasswordValid = await bcrypt.compare(password, user.password);
        } catch (error) {
          console.error("Password comparison error:", error);
        }
      }
      
      if (!isPasswordValid) {
        console.log("Invalid password attempt");
        return done(null, false, { message: "Incorrect password" });
      }
      
      console.log("Login successful for user:", user.username);
      
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Authentication routes are registered in separate files
  // See ./routes/auth-routes.ts and ./routes/subscription-routes.ts

  // Admin stats API
  app.get("/api/admin/stats", isAdmin, async (req, res) => {
    try {
      // Get counts from database
      const [users, words, questions, practiceSets, quantTopics] = await Promise.all([
        storage.getAllUsers(),
        storage.getAllWords(),
        storage.getAllQuestions(),
        storage.getAllPracticeSets(),
        storage.getAllQuantTopics()
      ]);
      
      // Return stats
      res.json({
        usersCount: users.length,
        wordsCount: words.length,
        questionsCount: questions.length,
        practiceSetsCount: practiceSets.length,
        quantTopicsCount: quantTopics.length
      });
    } catch (err) {
      console.error("Error fetching admin stats:", err);
      res.status(500).json({ message: "Failed to get admin statistics" });
    }
  });
  
  // User routes
  // Get all users (admin only)
  app.get("/api/users", isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Remove password from each user
      const usersWithoutPassword = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      res.json(usersWithoutPassword);
    } catch (error) {
      console.error("Error fetching all users:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get specific user
  app.get("/api/user/:id", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(parseInt(req.params.id));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Only return own user data or admin can view any user
      if (req.user && ((req.user as any).id === user.id || 
          (req.user as any).isAdmin || (req.user as any).userType === 'admin')) {
        const { password, ...userWithoutPassword } = user;
        return res.json(userWithoutPassword);
      }
      
      res.status(403).json({ message: "Forbidden" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/user/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Only update own user data or admin can update any user
      if (req.user && ((req.user as any).id !== userId && 
          !(req.user as any).isAdmin && (req.user as any).userType !== 'admin')) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // If trying to update password, hash it first
      let userData = { ...req.body };
      if (userData.password) {
        userData.password = await bcrypt.hash(userData.password, 10);
      }
      
      // Convert camelCase form field names to snake_case for database
      if (userData.firstName !== undefined) {
        userData = {
          ...userData,
          firstName: userData.firstName,
        };
        delete userData.first_name;
      }
      
      if (userData.lastName !== undefined) {
        userData = {
          ...userData,
          lastName: userData.lastName,
        };
        delete userData.last_name;
      }
      
      if (userData.isAdmin !== undefined) {
        userData = {
          ...userData,
          isAdmin: userData.isAdmin,
        };
        delete userData.is_admin;
      }
      
      const user = await storage.updateUser(userId, userData);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Vocabulary data route - get vocabulary words from database
  app.get("/api/vocabulary/data", async (req, res) => {
    try {
      // Check if we should filter by day
      const day = req.query.day ? parseInt(req.query.day as string) : undefined;
      
      let words;
      if (day !== undefined) {
        // Get words for a specific day from database
        words = await storage.getWordsByDay(day);
        // Loaded vocabulary words for day from database
      } else {
        // Get all words from database
        words = await storage.getAllWords();
        // Loaded vocabulary words in total from database
      }
      
      // Format the response to match the expected structure in the client
      const formattedWords = words.map(word => ({
        key: word.id,
        group: word.day,
        word: word.word,
        definitions: [{
          part_of_speech: word.partOfSpeech || "unknown",
          definition: word.definition,
          sentence: word.example,
          synonyms: word.synonyms || []
        }]
      }));
      
      res.status(200).json(formattedWords);
    } catch (error) {
      console.error("Error fetching vocabulary data:", error);
      res.status(500).json({ message: "Server error loading vocabulary data" });
    }
  });
  
  // Get all available days in the vocabulary dataset
  app.get("/api/vocabulary/days", async (req, res) => {
    try {
      // Get all distinct day values from the database
      // This is a custom method we need to add to storage.ts
      const days = await storage.getDistinctVocabularyDays();
      
      // Set a proper total days value - should be the maximum day value
      const totalDays = days.length > 0 ? Math.max(...days) : 34; // Default to 34 if no days found
      
      // Found unique vocabulary days with max day value
      
      // Make sure we return all days from 1 to max day, even if there are gaps
      const allDays = Array.from({length: totalDays}, (_, i) => i + 1);
      
      res.status(200).json({ days: allDays, totalDays });
    } catch (error) {
      console.error("Error fetching vocabulary days:", error);
      res.status(500).json({ message: "Server error loading vocabulary days" });
    }
  });
  
  // Vocabulary import is now handled through the CSV upload in bulk-import-routes.ts
  
  // Note: Bookmark API routes are already defined above
  
  // Vocabulary routes
  // Get all available vocabulary days - must be defined before parametrized routes
  app.get("/api/words/days", async (req, res) => {
    try {
      const days = await storage.getDistinctVocabularyDays();
      res.json(days);
    } catch (error) {
      console.error("Error fetching vocabulary days:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/words", async (req, res) => {
    try {
      const day = req.query.day ? parseInt(req.query.day as string) : undefined;
      
      if (day) {
        const words = await storage.getWordsByDay(day);
        return res.json(words);
      }
      
      const words = await storage.getAllWords();
      res.json(words);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/words/:id", async (req, res) => {
    try {
      const word = await storage.getWord(parseInt(req.params.id));
      if (!word) {
        return res.status(404).json({ message: "Word not found" });
      }
      res.json(word);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/words", isAdmin, async (req, res) => {
    try {
      const wordData = insertWordSchema.parse(req.body);
      const word = await storage.createWord(wordData);
      res.status(201).json(word);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/words/:id", isAdmin, async (req, res) => {
    try {
      const word = await storage.updateWord(parseInt(req.params.id), req.body);
      if (!word) {
        return res.status(404).json({ message: "Word not found" });
      }
      res.json(word);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/words/:id", isAdmin, async (req, res) => {
    try {
      const success = await storage.deleteWord(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "Word not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Bulk delete words
  app.post("/api/words/bulk-delete", isAdmin, async (req, res) => {
    try {
      const { wordIds } = req.body;
      
      if (!wordIds || !Array.isArray(wordIds) || wordIds.length === 0) {
        return res.status(400).json({ message: "Word IDs array is required" });
      }
      
      // Delete words one by one and count successful deletions
      let successCount = 0;
      let failedCount = 0;
      
      for (const wordId of wordIds) {
        try {
          const success = await storage.deleteWord(wordId);
          if (success) {
            successCount++;
          } else {
            failedCount++;
          }
        } catch (error) {
          console.error(`Error deleting word ${wordId}:`, error);
          failedCount++;
        }
      }
      
      res.json({
        message: `Successfully deleted ${successCount} words, failed to delete ${failedCount} words`,
        successCount,
        failedCount,
        totalCount: wordIds.length
      });
    } catch (error) {
      console.error("Error in bulk delete words:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Export vocabulary words to CSV
  app.get("/api/export-vocabulary-csv", isAdmin, async (req, res) => {
    try {
      // Get filter parameters
      const day = req.query.day ? parseInt(req.query.day as string) : undefined;
      
      // Get words based on filter
      let words;
      if (day) {
        words = await storage.getWordsByDay(day);
      } else {
        words = await storage.getAllWords();
      }
      
      // Generate CSV header
      let csv = "id,word,definition,example,pronunciation,partOfSpeech,synonyms,day,order\n";
      
      // Add each word as a row
      words.forEach(word => {
        // Escape fields to handle commas, quotes, etc.
        const escapeCsv = (field: string | null) => {
          if (field === null) return '';
          // Replace double quotes with two double quotes and wrap in quotes if contains commas or quotes
          const escaped = field.replace(/"/g, '""');
          return (escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')) 
            ? `"${escaped}"` 
            : escaped;
        };
        
        // Convert synonyms array to a semicolon-separated string
        const synonymsStr = word.synonyms ? word.synonyms.join('; ') : '';
        
        csv += `${word.id},${escapeCsv(word.word)},${escapeCsv(word.definition)},${escapeCsv(word.example)},${escapeCsv(word.pronunciation)},${escapeCsv(word.partOfSpeech || '')},${escapeCsv(synonymsStr)},${word.day},${word.order}\n`;
      });
      
      // Send CSV as a file download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=vocabulary-export-${new Date().toISOString().split('T')[0]}.csv`);
      res.status(200).send(csv);
    } catch (error) {
      console.error("Error exporting vocabulary CSV:", error);
      res.status(500).json({ message: "Internal server error exporting vocabulary" });
    }
  });
  
  // Add verbal content routes
  app.post("/api/verbal/content", isAdmin, async (req, res) => {
    try {
      // Validate request body
      const verbalContentData = await storage.createVerbalContent(req.body);
      res.status(201).json(verbalContentData);
    } catch (error) {
      console.error("Error creating verbal content:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to create verbal content",
        error: error.message 
      });
    }
  });

  app.put("/api/verbal/content/:id", isAdmin, async (req, res) => {
    try {
      const contentId = parseInt(req.params.id);
      const verbalContentData = await storage.updateVerbalContent(contentId, req.body);
      res.json(verbalContentData);
    } catch (error) {
      console.error("Error updating verbal content:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to update verbal content",
        error: error.message 
      });
    }
  });

  app.get("/api/verbal/content/by-topic/:topicId", async (req, res) => {
    try {
      const topicId = parseInt(req.params.topicId);
      const content = await storage.getVerbalContentByTopic(topicId);
      res.json(content);
    } catch (error) {
      console.error("Error fetching verbal content:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch verbal content",
        error: error.message 
      });
    }
  });

  app.delete("/api/verbal/content/:id", isAdmin, async (req, res) => {
    try {
      const contentId = parseInt(req.params.id);
      await storage.deleteVerbalContent(contentId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting verbal content:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to delete verbal content",
        error: error.message 
      });
    }
  });

  // Import vocabulary words from CSV
  app.post("/api/import-vocabulary-csv", isAdmin, async (req, res) => {
    try {
      // Get the CSV data from request body
      const { csvData } = req.body;
      
      if (!csvData) {
        return res.status(400).json({ message: "CSV data is required" });
      }
      
      // Parse CSV
      const rows = csvData.trim().split('\n');
      
      // Check if CSV has header
      const header = rows[0].toLowerCase();
      const hasHeader = header.includes('word') && header.includes('definition');
      
      // Start from row 1 if has header, otherwise from row 0
      const dataRows = hasHeader ? rows.slice(1) : rows;
      
      // Get all existing words for duplicate checking
      const allWords = await storage.getAllWords();
      const existingWordMap = new Map();
      allWords.forEach(word => {
        existingWordMap.set(word.word.toLowerCase(), word);
      });
      
      // Process each row
      let importedCount = 0;
      let skippedCount = 0;
      let errorCount = 0;
      
      for (const row of dataRows) {
        try {
          if (!row.trim()) continue; // Skip empty rows
          
          // Split by comma, respecting quoted values
          const values: string[] = [];
          let currentValue = '';
          let inQuotes = false;
          
          for (let i = 0; i < row.length; i++) {
            const char = row[i];
            
            if (char === '"' && (i === 0 || row[i-1] !== '\\')) {
              // Toggle quote mode
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              // End of field
              values.push(currentValue);
              currentValue = '';
            } else {
              // Add character to current field
              currentValue += char;
            }
          }
          
          // Add the last field
          values.push(currentValue);
          
          // Remove quotes from fields
          const cleanValues = values.map(v => {
            if (v.startsWith('"') && v.endsWith('"')) {
              return v.slice(1, -1).replace(/""/g, '"');
            }
            return v;
          });
          
          // Extract fields based on updated format: word,definition,example,pronunciation,partOfSpeech,synonyms,day,order
          let [word, definition, example, pronunciation, partOfSpeech, synonymsStr, day, order] = cleanValues;
          
          // If not provided, set default values
          day = day || '1';
          order = order || '1';
          
          // Skip if word is empty
          if (!word.trim()) {
            skippedCount++;
            continue;
          }
          
          // Check for duplicates
          if (existingWordMap.has(word.toLowerCase())) {
            skippedCount++;
            continue;
          }
          
          // Convert synonyms string to array
          let synonyms = null;
          if (synonymsStr && synonymsStr.trim()) {
            synonyms = synonymsStr.split(';').map(s => s.trim());
          }
          
          // Create new word
          const newWord = await storage.createWord({
            word: word.trim(),
            definition: definition?.trim() || 'No definition provided',
            example: example?.trim() || 'No example provided',
            pronunciation: pronunciation?.trim() || null,
            partOfSpeech: partOfSpeech?.trim() || null,
            synonyms: synonyms,
            day: parseInt(day) || 1,
            order: parseInt(order) || 1,
          });
          
          // Add to tracking map
          existingWordMap.set(word.toLowerCase(), newWord);
          importedCount++;
        } catch (err) {
          console.error(`Error importing CSV row: ${row}`, err);
          errorCount++;
        }
      }
      
      res.status(200).json({
        message: "CSV import completed successfully",
        imported: importedCount,
        skipped: skippedCount,
        errors: errorCount
      });
    } catch (error) {
      console.error("Error importing vocabulary CSV:", error);
      res.status(500).json({ message: "Error importing vocabulary from CSV" });
    }
  });
  


  // Verbal Learning Routes
  app.get("/api/verbal/types", async (req, res) => {
    try {
      console.log("Getting verbal topic types");
      const types = ["reading", "sentence_equivalence", "text_completion", "critical_reasoning"];
      res.json(types);
    } catch (error) {
      console.error("Error fetching verbal types:", error);
      res.status(500).json({ message: "Failed to fetch verbal types" });
    }
  });

  app.get("/api/verbal/topics/:type", async (req, res) => {
    try {
      const { type } = req.params;
      console.log(`Getting verbal topics for type: ${type}`);
      
      // Get topics from storage
      const topics = await storage.getVerbalTopicsByType(type);
      res.json(topics);
    } catch (error) {
      console.error("Error fetching verbal topics:", error);
      res.status(500).json({ message: "Failed to fetch verbal topics" });
    }
  });

  app.get("/api/verbal/content/:topicId", async (req, res) => {
    try {
      const topicId = parseInt(req.params.topicId);
      console.log(`Getting verbal content for topic: ${topicId}`);
      
      // Get content from storage
      const content = await storage.getVerbalContentByTopic(topicId);
      res.json(content);
    } catch (error) {
      console.error("Error fetching verbal content:", error);
      res.status(500).json({ message: "Failed to fetch verbal content" });
    }
  });

  app.get("/api/verbal/progress/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      console.log(`Getting verbal progress for user: ${userId}`);
      
      // Get progress from storage
      const progress = await storage.getVerbalProgressByUser(userId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching verbal progress:", error);
      res.status(500).json({ message: "Failed to fetch verbal progress" });
    }
  });

  app.post("/api/verbal/progress", async (req, res) => {
    try {
      const progressData = req.body;
      console.log("Creating verbal progress:", progressData);
      
      // Create progress record
      const progress = await storage.createVerbalProgress(progressData);
      res.status(201).json(progress);
    } catch (error) {
      console.error("Error creating verbal progress:", error);
      res.status(500).json({ message: "Failed to create verbal progress" });
    }
  });

  app.patch("/api/verbal/progress/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const progressData = req.body;
      console.log(`Updating verbal progress ${id}:`, progressData);
      
      // Update progress record
      const progress = await storage.updateVerbalProgress(id, progressData);
      if (!progress) {
        return res.status(404).json({ message: "Progress record not found" });
      }
      res.json(progress);
    } catch (error) {
      console.error("Error updating verbal progress:", error);
      res.status(500).json({ message: "Failed to update verbal progress" });
    }
  });

  // Word Progress routes
  app.get("/api/word-progress", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const progress = await storage.getWordProgressByUser(userId);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/word-progress", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const progressData = insertWordProgressSchema.parse({
        ...req.body,
        userId
      });
      
      // Check if progress already exists
      const existingProgress = await storage.getWordProgress(userId, progressData.wordId);
      if (existingProgress) {
        const updated = await storage.updateWordProgress(existingProgress.id, progressData);
        return res.json(updated);
      }
      
      const progress = await storage.createWordProgress(progressData);
      res.status(201).json(progress);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Question routes
  
  // Database connectivity check endpoint - allow public access for diagnostics
  app.get("/api/questions/check-db-connection", async (req, res) => {
    try {
      // Check auth status for logging but don't require auth
      const isLoggedIn = req.isAuthenticated() && req.user;
      const userId = isLoggedIn ? (req.user as any).id : 'anonymous';
      console.log(`Database connection check requested by user: ${userId}`);
      
      // Simple database query to check connectivity
      const result = await pool.query('SELECT 1 as connection_test');
      if (result && result.rows && result.rows.length > 0) {
        console.log("Database connection check successful");
        return res.json({ 
          success: true, 
          message: "Database connection successful",
          authenticated: isLoggedIn
        });
      } else {
        console.error("Database connection check failed - empty result");
        return res.status(500).json({ 
          success: false, 
          message: "Database connection failed - no result",
          authenticated: isLoggedIn
        });
      }
    } catch (error) {
      console.error("Database connection check failed:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Database connection failed", 
        error: error instanceof Error ? error.message : String(error),
        authenticated: req.isAuthenticated() && req.user ? true : false
      });
    }
  });
  
  // Simple in-memory cache for questions
  const questionsCache = {
    all: { data: null as any[] | null, timestamp: 0 },
    byType: new Map<string, { data: any[], timestamp: number }>(),
    maxAge: 30000, // 30 seconds cache lifetime
    clear: function() {
      this.all = { data: null, timestamp: 0 };
      this.byType.clear();
      console.log('Questions cache cleared');
    }
  };

  // Check database connection (used for diagnostics)
  app.get("/api/questions/check-db-connection", isAdmin, async (req, res) => {
    try {
      // Perform a simple query to check database connectivity
      const result = await pool.query("SELECT 1 as connected");
      res.json({ success: true, message: "Database connection successful" });
    } catch (error) {
      console.error("Database connection check failed:", error);
      res.status(500).json({ success: false, message: "Database connection failed" });
    }
  });

  app.get("/api/questions", async (req, res) => {
    try {
      const type = req.query.type as string | undefined;
      const noCache = req.query.noCache === 'true';
      const now = Date.now();
      
      // Log the request
      console.log(`Questions request received: ${type ? `type=${type}` : 'all'}, noCache=${noCache}`);
      
      if (type) {
        // Check cache for this type
        const cacheEntry = questionsCache.byType.get(type);
        if (!noCache && cacheEntry && (now - cacheEntry.timestamp < questionsCache.maxAge)) {
          console.log(`Serving cached questions for type: ${type}, age: ${now - cacheEntry.timestamp}ms`);
          return res.json(cacheEntry.data);
        }
        
        // Cache miss or forced refresh, fetch from database
        console.log(`Cache miss for questions type=${type}, fetching from database`);
        const questions = await storage.getQuestionsByType(type);
        
        // Update cache
        questionsCache.byType.set(type, { data: questions, timestamp: now });
        return res.json(questions);
      }
      
      // All questions request
      if (!noCache && questionsCache.all.data && (now - questionsCache.all.timestamp < questionsCache.maxAge)) {
        console.log(`Serving cached questions (all), age: ${now - questionsCache.all.timestamp}ms`);
        return res.json(questionsCache.all.data);
      }
      
      // Cache miss or forced refresh for all questions
      console.log('Cache miss for all questions, fetching from database');
      const questions = await storage.getAllQuestions();
      
      // Update cache
      questionsCache.all = { data: questions, timestamp: now };
      res.json(questions);
    } catch (error) {
      console.error("Error fetching questions:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get bookmarked questions for the authenticated user
  app.get("/api/questions/bookmarked", isAuthenticated, async (req, res) => {
    const userId = (req.user as any).id;
    
    try {
      const bookmarkedQuestions = await storage.getBookmarkedQuestionsByUser(userId);
      return res.json(bookmarkedQuestions);
    } catch (error) {
      console.error("Error fetching bookmarked questions:", error);
      return res.status(500).json({ message: "Failed to fetch bookmarked questions" });
    }
  });
  
  // Alternative endpoint for bookmarked questions (for backward compatibility)
  app.get("/api/bookmarked-questions", isAuthenticated, async (req, res) => {
    const userId = (req.user as any).id;
    
    try {
      console.log(`[DEBUG] Fetching bookmarked questions for user ID ${userId}`);
      const bookmarkedQuestions = await storage.getBookmarkedQuestionsByUser(userId);
      console.log(`[DEBUG] Found ${bookmarkedQuestions?.length || 0} bookmarked questions`);
      
      // Return empty array instead of null to prevent client-side errors
      return res.json(bookmarkedQuestions || []);
    } catch (error) {
      console.error("Error fetching bookmarked questions:", error);
      // Return empty array to prevent client-side errors
      return res.json([]);
    }
  });
  
  // Create bookmark (alternative endpoint)
  app.post("/api/bookmarked-questions", isAuthenticated, async (req, res) => {
    const userId = (req.user as any).id;
    const { questionId } = req.body;
    
    if (!questionId || isNaN(parseInt(questionId))) {
      return res.status(400).json({ message: "Invalid question ID" });
    }
    
    const parsedQuestionId = parseInt(questionId);
    
    try {
      console.log(`[DEBUG] Creating bookmark for question ID ${parsedQuestionId}, user ID ${userId}`);
      
      // Check if the question exists
      const question = await storage.getQuestion(parsedQuestionId);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }

      // Check if the bookmark already exists
      const existingBookmark = await storage.getBookmarkedQuestion(userId, parsedQuestionId);
      if (existingBookmark) {
        return res.status(200).json({ message: "Question already bookmarked", bookmark: existingBookmark });
      }

      // Create the bookmark
      const bookmark = await storage.createBookmarkedQuestion({
        userId,
        questionId: parsedQuestionId,
      });
      
      console.log(`[DEBUG] Bookmark created:`, bookmark);

      // Create activity
      await storage.createActivity({
        userId,
        type: 'question_bookmark_add',
        createdAt: new Date(),
        details: { questionId: parsedQuestionId }
      });

      return res.status(201).json({ message: "Question bookmarked successfully", bookmark });
    } catch (error) {
      console.error("Error creating bookmark:", error);
      return res.status(500).json({ message: "Failed to bookmark question" });
    }
  });
  
  // Delete bookmark (alternative endpoint)
  app.delete("/api/bookmarked-questions/:questionId", isAuthenticated, async (req, res) => {
    const userId = (req.user as any).id;
    const questionId = parseInt(req.params.questionId, 10);
    
    if (isNaN(questionId)) {
      return res.status(400).json({ message: "Invalid question ID" });
    }
    
    try {
      console.log(`[DEBUG] Deleting bookmark for question ID ${questionId}, user ID ${userId}`);
      
      // Check if the bookmark exists
      const existingBookmark = await storage.getBookmarkedQuestion(userId, questionId);
      if (!existingBookmark) {
        return res.status(200).json({ message: "Bookmark not found or already removed" });
      }

      // Delete the bookmark
      const deleted = await storage.deleteBookmarkedQuestion(userId, questionId);
      
      if (deleted) {
        // Create activity
        await storage.createActivity({
          userId,
          type: 'question_bookmark_remove',
          createdAt: new Date(),
          details: { questionId }
        });
        
        return res.json({ message: "Bookmark removed successfully" });
      } else {
        return res.status(500).json({ message: "Failed to remove bookmark" });
      }
    } catch (error) {
      console.error("Error deleting bookmark:", error);
      return res.status(500).json({ message: "Failed to remove bookmark" });
    }
  });

  // Create a new question (admin only)
  app.post("/api/questions", isAdmin, async (req, res) => {
    try {
      const questionData = insertQuestionSchema.parse(req.body);
      const question = await storage.createQuestion(questionData);
      res.status(201).json(question);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.message });
      }
      console.error("Error creating question:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get bookmark status for a question
  app.get("/api/questions/:questionId/bookmark", isAuthenticated, async (req, res) => {
    const userId = (req.user as any).id;
    const questionId = parseInt(req.params.questionId, 10);

    if (isNaN(questionId)) {
      return res.status(400).json({ message: "Invalid question ID" });
    }

    try {
      const bookmark = await storage.getBookmarkedQuestion(userId, questionId);
      return res.json({ isBookmarked: !!bookmark });
    } catch (error) {
      console.error("Error checking bookmark status:", error);
      return res.status(500).json({ message: "Failed to check bookmark status" });
    }
  });

  // Create a bookmark
  app.post("/api/questions/:questionId/bookmark", isAuthenticated, async (req, res) => {
    const userId = (req.user as any).id;
    const questionId = parseInt(req.params.questionId, 10);

    if (isNaN(questionId)) {
      return res.status(400).json({ message: "Invalid question ID" });
    }

    try {
      // Check if the question exists
      const question = await storage.getQuestion(questionId);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }

      // Check if the bookmark already exists
      const existingBookmark = await storage.getBookmarkedQuestion(userId, questionId);
      if (existingBookmark) {
        return res.status(409).json({ message: "Question already bookmarked" });
      }

      // Create the bookmark
      const bookmark = await storage.createBookmarkedQuestion({
        userId,
        questionId,
      });

      // Create activity
      await storage.createActivity({
        userId,
        type: 'question_bookmark_add',
        createdAt: new Date(),
        details: { questionId }
      });

      return res.status(201).json({ message: "Question bookmarked successfully", bookmark });
    } catch (error) {
      console.error("Error creating bookmark:", error);
      return res.status(500).json({ message: "Failed to bookmark question" });
    }
  });

  // Delete a bookmark
  app.delete("/api/questions/:questionId/bookmark", isAuthenticated, async (req, res) => {
    const userId = (req.user as any).id;
    const questionId = parseInt(req.params.questionId, 10);

    if (isNaN(questionId)) {
      return res.status(400).json({ message: "Invalid question ID" });
    }

    try {
      // Check if the bookmark exists
      const existingBookmark = await storage.getBookmarkedQuestion(userId, questionId);
      if (!existingBookmark) {
        return res.status(404).json({ message: "Bookmark not found" });
      }

      // Delete the bookmark
      const deleted = await storage.deleteBookmarkedQuestion(userId, questionId);
      
      if (deleted) {
        // Create activity
        await storage.createActivity({
          userId,
          type: 'question_bookmark_remove',
          createdAt: new Date(),
          details: { questionId }
        });
        
        return res.json({ message: "Bookmark removed successfully" });
      } else {
        return res.status(500).json({ message: "Failed to remove bookmark" });
      }
    } catch (error) {
      console.error("Error deleting bookmark:", error);
      return res.status(500).json({ message: "Failed to remove bookmark" });
    }
  });
  
  // Get a specific question
  app.get("/api/questions/:id", async (req, res) => {
    try {
      const question = await storage.getQuestion(parseInt(req.params.id));
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      res.json(question);
    } catch (error) {
      console.error("Error fetching question:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update a question (admin only)
  app.patch("/api/questions/:id", isAdmin, async (req, res) => {
    try {
      const question = await storage.updateQuestion(parseInt(req.params.id), req.body);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      res.json(question);
    } catch (error) {
      console.error("Error updating question:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete a question (admin only)
  app.delete("/api/questions/:id", isAdmin, async (req, res) => {
    try {
      const success = await storage.deleteQuestion(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "Question not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting question:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Question Type routes
  app.get("/api/question-types/:type", async (req, res) => {
    try {
      const type = req.params.type;
      // Only allow quantitative or verbal
      if (type !== 'quantitative' && type !== 'verbal') {
        return res.status(400).json({ message: "Invalid question type. Must be 'quantitative' or 'verbal'" });
      }
      
      // Get question types from the appropriate table
      if (type === 'quantitative') {
        const result = await pool.query('SELECT * FROM quant_question_types ORDER BY id');
        res.json(result.rows);
      } else {
        const result = await pool.query('SELECT * FROM verbal_question_types ORDER BY id');
        res.json(result.rows);
      }
    } catch (error) {
      console.error(`Error retrieving ${req.params.type} question types:`, error);
      res.status(500).json({ message: "Failed to retrieve question types" });
    }
  });

  // Practice Set routes
  app.get("/api/practice-sets", async (req, res) => {
    try {
      const type = req.query.type as string | undefined;
      
      if (type) {
        const sets = await storage.getPracticeSetsByType(type);
        return res.json(sets);
      }
      
      const sets = await storage.getAllPracticeSets();
      res.json(sets);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/practice-sets/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const practiceSet = await storage.getPracticeSet(id);
      if (!practiceSet) {
        return res.status(404).json({ message: "Practice set not found" });
      }
      
      res.json(practiceSet);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/practice-sets", isAdmin, async (req, res) => {
    try {
      const setData = insertPracticeSetSchema.parse(req.body);
      const practiceSet = await storage.createPracticeSet(setData);
      res.status(201).json(practiceSet);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.patch("/api/practice-sets/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      console.log(`[DEBUG] Practice set update request for ID ${id}`);
      console.log(`[DEBUG] Request body:`, JSON.stringify(req.body, null, 2));
      
      // Validate the update data
      const updateData = insertPracticeSetSchema.partial().parse(req.body);
      
      console.log(`[DEBUG] Validated update data:`, JSON.stringify(updateData, null, 2));
      
      // Check if the practice set exists
      const existingSet = await storage.getPracticeSet(id);
      if (!existingSet) {
        return res.status(404).json({ message: "Practice set not found" });
      }
      
      console.log(`[DEBUG] Existing set:`, JSON.stringify(existingSet, null, 2));
      
      // Update the practice set
      const updatedSet = await storage.updatePracticeSet(id, updateData);
      
      console.log(`[DEBUG] Updated set:`, JSON.stringify(updatedSet, null, 2));
      
      res.json(updatedSet);
    } catch (error) {
      console.error(`[ERROR] Update practice set error:`, error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.delete("/api/practice-sets/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      // Check if the practice set exists
      const existingSet = await storage.getPracticeSet(id);
      if (!existingSet) {
        return res.status(404).json({ message: "Practice set not found" });
      }
      
      // Delete the practice set
      const success = await storage.deletePracticeSet(id);
      if (!success) {
        return res.status(500).json({ message: "Failed to delete practice set" });
      }
      
      res.status(200).json({ message: "Practice set deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Bulk actions for practice sets
  app.post("/api/practice-sets/bulk/delete", isAdmin, async (req, res) => {
    try {
      const { ids } = req.body;
      
      // Validate the IDs
      if (!Array.isArray(ids) || ids.some(id => typeof id !== 'number')) {
        return res.status(400).json({ message: "Invalid IDs format. Expected array of numbers." });
      }
      
      // Delete each practice set
      const results = await Promise.allSettled(
        ids.map(id => storage.deletePracticeSet(id))
      );
      
      // Count successes and failures
      const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
      const failed = ids.length - successful;
      
      res.status(200).json({ 
        message: `Deleted ${successful} practice sets successfully${failed > 0 ? `, ${failed} failed` : ''}`,
        successful,
        failed
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/practice-sets/bulk/copy", isAdmin, async (req, res) => {
    try {
      const { ids } = req.body;
      
      // Validate the IDs
      if (!Array.isArray(ids) || ids.some(id => typeof id !== 'number')) {
        return res.status(400).json({ message: "Invalid IDs format. Expected array of numbers." });
      }
      
      // Get all the practice sets to copy
      const practiceSets = await Promise.all(
        ids.map(id => storage.getPracticeSet(id))
      );
      
      // Filter out any undefined results (practice sets that weren't found)
      const validSets = practiceSets.filter(set => set) as any[];
      
      // Create copies of each practice set
      const copiedSets = await Promise.all(
        validSets.map(set => {
          // Create a new practice set with the same data but a new title
          const newSet = {
            ...set,
            title: `Copy of ${set.title}`,
            id: undefined // Remove the ID so a new one is generated
          };
          
          // Create the new practice set
          return storage.createPracticeSet({
            type: newSet.type,
            title: newSet.title,
            description: newSet.description,
            difficulty: newSet.difficulty,
            questionIds: newSet.questionIds
          });
        })
      );
      
      res.status(201).json({
        message: `Created ${copiedSets.length} copies successfully`,
        copies: copiedSets
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Practice Results routes
  app.get("/api/practice-results", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const results = await storage.getPracticeResultsByUser(userId);
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/practice-results/:id", isAuthenticated, async (req, res) => {
    try {
      const resultId = parseInt(req.params.id, 10);
      const userId = (req.user as any).id;
      
      if (isNaN(resultId)) {
        return res.status(400).json({ message: "Invalid practice result ID" });
      }
      
      const result = await storage.getPracticeResult(resultId);
      
      if (!result) {
        return res.status(404).json({ message: "Practice result not found" });
      }
      
      // Ensure the user can only access their own results
      if (result.userId !== userId && !(req.user as any).isAdmin) {
        return res.status(403).json({ message: "You do not have permission to access this practice result" });
      }
      
      res.json(result);
    } catch (error) {
      console.error("Error fetching practice result:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/practice-results", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const resultData = insertPracticeResultSchema.parse({
        ...req.body,
        userId,
        completedAt: new Date()
      });
      
      const result = await storage.createPracticeResult(resultData);
      
      // Update user stats
      const user = await storage.getUser(userId);
      if (user) {
        await storage.updateUser(userId, {
          practiceCompleted: (user.practiceCompleted || 0) + 1,
          timeSpent: (user.timeSpent || 0) + Math.floor(resultData.timeSpent / 60) // Convert seconds to minutes
        });
      }
      
      // Record activity
      await storage.createActivity({
        userId,
        type: "practice_completion",
        details: {
          practiceResultId: result.id,
          score: result.score,
          maxScore: result.maxScore
        },
        createdAt: new Date()
      });
      
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Activity routes
  app.get("/api/activities", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      try {
        // Check if table exists before querying
        const tableExists = await db.execute(sql`SELECT to_regclass('activities')`);
        console.log("Activities table check:", tableExists);
        
        const activities = await storage.getActivitiesByUser(userId, limit);
        res.json(activities || []);
      } catch (dbError) {
        console.error("Database error in activities route:", dbError);
        // Return empty array instead of error to prevent UI issues
        res.json([]);
      }
    } catch (error) {
      console.error("Error in activities route:", error);
      // Return empty array to prevent UI issues
      res.json([]);
    }
  });

  // Vocabulary Day Completion route
  app.post("/api/complete-vocabulary-day", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { day, wordsCompleted = 30 } = req.body;
      
      if (!day || isNaN(parseInt(day))) {
        return res.status(400).json({ message: "Day is required" });
      }
      
      const dayNumber = parseInt(day);
      
      // Get user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Update user's day and wordsLearned if the completed day is the current day
      let updatedUser = user;
      if (dayNumber === user.currentDay) {
        updatedUser = await storage.updateUser(userId, {
          currentDay: Math.min(user.currentDay + 1, 34), // Don't go beyond day 34
          wordsLearned: user.wordsLearned + wordsCompleted
        }) as any;
      }
      
      // Record activity
      await storage.createActivity({
        userId,
        type: "vocabulary_completion",
        details: { day: dayNumber, wordsCompleted },
        createdAt: new Date()
      });
      
      const { password, ...userWithoutPassword } = updatedUser;
      res.json({
        message: "Day completed successfully",
        user: userWithoutPassword
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Quantitative Content API Routes
  
  // Get all quantitative topics
  app.get("/api/quant/topics", async (req, res) => {
    try {
      // Check if we should filter by group or category
      const groupNumber = req.query.group ? parseInt(req.query.group as string) : undefined;
      const category = req.query.category ? req.query.category as string : undefined;
      
      let topics;
      if (groupNumber !== undefined) {
        // Get topics for a specific group
        topics = await storage.getQuantTopicsByGroup(groupNumber);
        console.log(`Loaded ${topics.length} quantitative topics for group ${groupNumber}`);
      } else if (category !== undefined) {
        // Get topics for a specific category
        topics = await storage.getQuantTopicsByCategory(category);
        console.log(`Loaded ${topics.length} quantitative topics for category ${category}`);
      } else {
        // Get all topics
        topics = await storage.getAllQuantTopics();
        console.log(`Loaded ${topics.length} quantitative topics in total`);
      }
      
      // Filter topics based on user subscription level
      if (req.user) {
        const userType = (req.user as any).userType || 'free';
        
        // If user is premium or admin, they can see all topics
        if (userType === 'premium' || userType === 'business' || userType === 'admin') {
          // No filtering needed, return all topics
        } else {
          // For free users, check access rights from content_access_control table
          const accessibleTopics = [];
          
          for (const topic of topics) {
            const isAccessible = await storage.getContentAccess('quant_topic', topic.id, userType);
            if (isAccessible) {
              accessibleTopics.push(topic);
            }
          }
          
          topics = accessibleTopics;
        }
      } else {
        // Non-authenticated users only see free content
        const accessibleTopics = [];
        
        for (const topic of topics) {
          const isAccessible = await storage.getContentAccess('quant_topic', topic.id, 'free');
          if (isAccessible) {
            accessibleTopics.push(topic);
          }
        }
        
        topics = accessibleTopics;
      }
      
      res.status(200).json(topics);
    } catch (error) {
      console.error("Error fetching quantitative topics:", error);
      res.status(500).json({ message: "Server error loading quantitative topics" });
    }
  });
  
  // Get a single quantitative topic by ID
  app.get("/api/quant/topics/:id", async (req, res) => {
    try {
      const topicId = parseInt(req.params.id);
      const topic = await storage.getQuantTopic(topicId);
      
      if (!topic) {
        return res.status(404).json({ message: "Topic not found" });
      }
      
      // Check access permissions based on user subscription level
      const userType = req.user ? (req.user as any).userType || 'free' : 'free';
      
      // Skip permission check for premium, business, and admin users
      if (userType === 'premium' || userType === 'business' || userType === 'admin') {
        return res.status(200).json(topic);
      }
      
      // For free users, check access rights from content_access_control table
      const isAccessible = await storage.getContentAccess('quant_topic', topicId, userType);
      
      if (!isAccessible) {
        return res.status(403).json({ 
          message: "Access denied. Please upgrade your subscription to access this content.",
          requiredSubscription: "premium"
        });
      }
      
      res.status(200).json(topic);
    } catch (error) {
      console.error("Error fetching quantitative topic:", error);
      res.status(500).json({ message: "Server error loading quantitative topic" });
    }
  });
  
  // Create a new quantitative topic (admin only)
  app.post("/api/quant/topics", isAdmin, async (req, res) => {
    try {
      const topicData = insertQuantTopicSchema.parse(req.body);
      const topic = await storage.createQuantTopic(topicData);
      
      res.status(201).json(topic);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.message });
      }
      console.error("Error creating quantitative topic:", error);
      res.status(500).json({ message: "Server error creating quantitative topic" });
    }
  });
  
  // Update a quantitative topic (admin only)
  app.patch("/api/quant/topics/:id", isAdmin, async (req, res) => {
    try {
      const topic = await storage.updateQuantTopic(parseInt(req.params.id), req.body);
      if (!topic) {
        return res.status(404).json({ message: "Topic not found" });
      }
      
      res.status(200).json(topic);
    } catch (error) {
      console.error("Error updating quantitative topic:", error);
      res.status(500).json({ message: "Server error updating quantitative topic" });
    }
  });
  
  // Delete a quantitative topic (admin only)
  app.delete("/api/quant/topics/:id", isAdmin, async (req, res) => {
    try {
      const success = await storage.deleteQuantTopic(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "Topic not found" });
      }
      
      res.status(200).json({ message: "Topic deleted successfully" });
    } catch (error) {
      console.error("Error deleting quantitative topic:", error);
      res.status(500).json({ message: "Server error deleting quantitative topic" });
    }
  });
  
  // Get all distinct groups for quantitative topics
  app.get("/api/quant/groups", async (req, res) => {
    try {
      const groups = await storage.getDistinctQuantGroups();
      
      res.status(200).json({ groups, totalGroups: groups.length });
    } catch (error) {
      console.error("Error fetching quantitative groups:", error);
      res.status(500).json({ message: "Server error loading quantitative groups" });
    }
  });
  
  // Get all distinct categories for quantitative topics
  app.get("/api/quant/categories", async (req, res) => {
    try {
      console.log("Fetching quantitative categories");
      const categories = await storage.getDistinctQuantCategories();
      console.log("Categories fetched successfully:", categories);
      
      // Send a more robust response with proper error handling
      if (!categories || !Array.isArray(categories)) {
        console.error("Invalid categories data:", categories);
        return res.status(500).json({ 
          message: "Server returned invalid categories data",
          categories: ["Algebra", "Arithmetic", "Data Analysis", "Geometry"] // Default categories as fallback
        });
      }
      
      res.status(200).json({ 
        categories, 
        totalCategories: categories.length,
        success: true
      });
    } catch (error) {
      console.error("Error fetching quantitative categories:", error);
      // Send a fallback with default categories in case of error
      res.status(200).json({ 
        message: "Error fetching categories, using defaults",
        categories: ["Algebra", "Arithmetic", "Data Analysis", "Geometry"],
        totalCategories: 4,
        success: false
      });
    }
  });
  
  // Get all content for a specific topic
  app.get("/api/quant/content", async (req, res) => {
    try {
      // More robust validation for topicId
      let topicId: number | undefined = undefined;
      
      if (req.query.topicId !== undefined && req.query.topicId !== null && req.query.topicId !== '') {
        const parsedId = parseInt(req.query.topicId as string);
        if (!isNaN(parsedId)) {
          topicId = parsedId;
        } else {
          return res.status(400).json({ message: "Invalid topic ID format" });
        }
      }
      
      // For getting content by topic, first check if user has access to the topic
      if (topicId !== undefined) {
        // Check access permissions based on user subscription level
        const userType = req.user ? (req.user as any).userType || 'free' : 'free';
        
        // Skip permission check for premium, business, and admin users
        if (!(userType === 'premium' || userType === 'business' || userType === 'admin')) {
          // For free users, check access rights from content_access_control table
          const isAccessible = await storage.getContentAccess('quant_topic', topicId, userType);
          
          if (!isAccessible) {
            return res.status(403).json({ 
              message: "Access denied. Please upgrade your subscription to access this content.",
              requiredSubscription: "premium"
            });
          }
        }
        
        const content = await storage.getQuantContentByTopic(topicId);
        return res.status(200).json(content);
      }
      
      // For getting all content, this should only be available to admins
      if (!(req.user && ((req.user as any).isAdmin || (req.user as any).userType === 'admin'))) {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }
      
      const content = await storage.getAllQuantContent();
      res.status(200).json(content);
    } catch (error) {
      console.error("Error fetching quantitative content:", error);
      res.status(500).json({ message: "Server error loading quantitative content" });
    }
  });
  
  // Get a single content item by ID
  app.get("/api/quant/content/:id", async (req, res) => {
    try {
      const contentId = parseInt(req.params.id);
      const content = await storage.getQuantContent(contentId);
      
      if (!content) {
        return res.status(404).json({ message: "Content not found" });
      }
      
      // Check access permissions based on user subscription level
      // We need to check access to the topic that this content belongs to
      const userType = req.user ? (req.user as any).userType || 'free' : 'free';
      
      // Skip permission check for premium, business, and admin users
      if (!(userType === 'premium' || userType === 'business' || userType === 'admin')) {
        // For free users, check access rights from content_access_control table
        const isAccessible = await storage.getContentAccess('quant_topic', content.topicId, userType);
        
        if (!isAccessible) {
          return res.status(403).json({ 
            message: "Access denied. Please upgrade your subscription to access this content.",
            requiredSubscription: "premium"
          });
        }
      }
      
      res.status(200).json(content);
    } catch (error) {
      console.error("Error fetching quantitative content:", error);
      res.status(500).json({ message: "Server error loading quantitative content" });
    }
  });
  
  // Create new content for a topic (admin only)
  app.post("/api/quant/content", isAdmin, async (req, res) => {
    try {
      const contentData = insertQuantContentSchema.parse(req.body);
      const content = await storage.createQuantContent(contentData);
      
      res.status(201).json(content);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.message });
      }
      console.error("Error creating quantitative content:", error);
      res.status(500).json({ message: "Server error creating quantitative content" });
    }
  });
  
  // Update content (admin only)
  app.patch("/api/quant/content/:id", isAdmin, async (req, res) => {
    try {
      const content = await storage.updateQuantContent(parseInt(req.params.id), req.body);
      if (!content) {
        return res.status(404).json({ message: "Content not found" });
      }
      
      res.status(200).json(content);
    } catch (error) {
      console.error("Error updating quantitative content:", error);
      res.status(500).json({ message: "Server error updating quantitative content" });
    }
  });
  
  // Delete content (admin only)
  app.delete("/api/quant/content/:id", isAdmin, async (req, res) => {
    try {
      const success = await storage.deleteQuantContent(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "Content not found" });
      }
      
      res.status(200).json({ message: "Content deleted successfully" });
    } catch (error) {
      console.error("Error deleting quantitative content:", error);
      res.status(500).json({ message: "Server error deleting quantitative content" });
    }
  });
  
  // Fetch content by topic ID
  app.get("/api/quant/content/by-topic/:topicId", async (req, res) => {
    try {
      const topicId = parseInt(req.params.topicId);
      if (isNaN(topicId)) {
        return res.status(400).json({ message: "Invalid topic ID" });
      }

      const contents = await storage.getQuantContentByTopic(topicId);
      console.log(`Fetched ${contents.length} content items for topic ${topicId}`);
      res.json(contents);
    } catch (error) {
      console.error("Error fetching content by topic:", error);
      res.status(500).json({ message: "Failed to fetch content" });
    }
  });
  
  // User progress on quantitative topics
  
  // Get progress for a user on a specific topic
  app.get("/api/quant/progress", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const topicId = req.query.topicId ? parseInt(req.query.topicId as string) : undefined;
      
      if (topicId !== undefined) {
        const progress = await storage.getQuantProgress(userId, topicId);
        return res.status(200).json(progress || null);
      }
      
      const progress = await storage.getQuantProgressByUser(userId);
      res.status(200).json(progress);
    } catch (error) {
      console.error("Error fetching quantitative progress:", error);
      res.status(500).json({ message: "Server error loading quantitative progress" });
    }
  });
  
  // Update progress for a user on a topic
  app.post("/api/quant/progress", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { topicId, completed, score, timeSpent, notes } = req.body;
      
      // Check if user has access to this topic based on subscription level
      const userType = (req.user as any).userType || 'free';
      
      // Skip permission check for premium, business, and admin users
      if (!(userType === 'premium' || userType === 'business' || userType === 'admin')) {
        // For free users, check access rights from content_access_control table
        const isAccessible = await storage.getContentAccess('quant_topic', topicId, userType);
        
        if (!isAccessible) {
          return res.status(403).json({ 
            message: "Access denied. Please upgrade your subscription to access this content.",
            requiredSubscription: "premium"
          });
        }
      }
      
      // Check if progress already exists
      let progress = await storage.getQuantProgress(userId, topicId);
      
      if (progress) {
        // Update existing progress
        progress = await storage.updateQuantProgress(progress.id, {
          completed: completed !== undefined ? completed : progress.completed,
          score: score !== undefined ? score : progress.score,
          timeSpent: timeSpent !== undefined ? timeSpent : progress.timeSpent,
          lastAccessed: new Date(),
          notes: notes !== undefined ? notes : progress.notes
        });
      } else {
        // Create new progress
        progress = await storage.createQuantProgress({
          userId,
          topicId,
          completed: completed || false,
          score: score || 0,
          timeSpent: timeSpent || 0,
          lastAccessed: new Date(),
          notes: notes || null
        });
      }
      
      // Create activity for completed topic
      if (completed) {
        await storage.createActivity({
          userId,
          type: "quant_topic_completion",
          createdAt: new Date(),
          details: { topicId, score }
        });
      }
      
      res.status(200).json(progress);
    } catch (error) {
      console.error("Error updating quantitative progress:", error);
      res.status(500).json({ message: "Server error updating quantitative progress" });
    }
  });

  // Route to initialize sample practice data for testing
  app.post('/api/admin/init-sample-data', isAdmin, async (req, res) => {
    try {
      // Sample data initialization is not needed anymore
      // await insertSampleData();
      res.json({ success: true, message: "Sample practice data initialization is deprecated" });
    } catch (error) {
      console.error("Error initializing sample data:", error);
      res.status(500).json({ success: false, message: "Failed to initialize sample data" });
    }
  });

  // Admin stats endpoint - Enhanced to include trend data
  app.get('/api/admin/stats', isAdmin, async (req, res) => {
    try {
      // Get vocabulary count
      const vocabularyData = await storage.getAllWords();
      const totalWords = vocabularyData.length;
      
      // Get questions count
      const questionsData = await storage.getAllQuestions();
      const totalQuestions = questionsData.length;
      
      // Get users count (active in last 30 days)
      const users = await storage.getAllUsers();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const activeUsers = users.filter(user => {
        if (!user.lastLoginAt) return false;
        const lastLogin = new Date(user.lastLoginAt);
        return lastLogin >= thirtyDaysAgo;
      }).length;
      
      // Get practice set count
      const practiceSetsCount = (await storage.getAllPracticeSets()).length;
      
      // Get quantitative topics count
      const quantTopicsCount = (await storage.getAllQuantTopics()).length;
      
      // Calculate trend data based on creation dates
      // For now, we'll use a simple approach by looking at items created in the last month vs. the previous month
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      
      const twoMonthsAgo = new Date();
      twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
      
      // Helper function to safely check creation date
      const wasCreatedBetween = (
        item: any, 
        startDate: Date, 
        endDate?: Date
      ): boolean => {
        // If no createdAt field, use id as a rough approximation
        // This assumes higher IDs are more recent which is generally true
        if (!item.createdAt && typeof item.id === 'number') {
          const midPointId = Math.floor(
            users.reduce((max, u) => Math.max(max, u.id || 0), 0) / 2
          );
          
          if (endDate) {
            // For items within a range, consider the middle third of IDs to be from previous month
            return item.id >= midPointId / 3 && item.id < midPointId * 2 / 3;
          } else {
            // For recent items, consider the highest third of IDs to be from the last month
            return item.id >= midPointId * 2 / 3;
          }
        }
        
        // If we have createdAt field, use it
        if (item.createdAt) {
          const created = new Date(item.createdAt);
          return endDate 
            ? (created >= startDate && created < endDate) 
            : (created >= startDate);
        }
        
        return false;
      };
      
      // Words trend
      const wordsLastMonth = vocabularyData.filter(word => 
        wasCreatedBetween(word, oneMonthAgo)
      ).length;
      
      const wordsPreviousMonth = vocabularyData.filter(word => 
        wasCreatedBetween(word, twoMonthsAgo, oneMonthAgo)
      ).length;
      
      const wordsTrend = wordsPreviousMonth === 0 
        ? 0 
        : Math.round((wordsLastMonth - wordsPreviousMonth) / wordsPreviousMonth * 100);
      
      // Questions trend
      const questionsLastMonth = questionsData.filter(q => 
        wasCreatedBetween(q, oneMonthAgo)
      ).length;
      
      const questionsPreviousMonth = questionsData.filter(q => 
        wasCreatedBetween(q, twoMonthsAgo, oneMonthAgo)
      ).length;
      
      const questionsTrend = questionsPreviousMonth === 0 
        ? 0 
        : Math.round((questionsLastMonth - questionsPreviousMonth) / questionsPreviousMonth * 100);
      
      // Users trend
      const usersLastMonth = users.filter(user => 
        wasCreatedBetween(user, oneMonthAgo)
      ).length;
      
      const usersPreviousMonth = users.filter(user => 
        wasCreatedBetween(user, twoMonthsAgo, oneMonthAgo)
      ).length;
      
      const usersTrend = usersPreviousMonth === 0 
        ? 0 
        : Math.round((usersLastMonth - usersPreviousMonth) / usersPreviousMonth * 100);
      
      res.json({
        totalWords,
        totalQuestions,
        activeUsers,
        practiceSetsCount,
        quantTopicsCount,
        wordsTrend,
        questionsTrend,
        usersTrend
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch admin statistics" });
    }
  });

  // Register new auth routes
  app.use('/api/auth', authRoutes);
  
  // Register subscription routes
  app.use('/api/subscriptions', subscriptionRoutes);
  
  // Register content access control routes
  app.use('/', contentAccessRoutes);

  // Register bulk import routes (admin only)
  app.use('/api/admin', isAdmin, bulkImportRoutes);
  
  // Register admin tools routes
  app.use('/api/admin-tools', adminToolsRoutes);
  
  // Register API keys routes (admin only)
  app.use('/api/admin/api-keys', isAdmin, apiKeyRoutes);
  
  // Register spaced repetition routes
  app.use('/', spacedRepetitionRoutes);
  
  // Register essay writing routes
  app.use('/', essayRoutes);

  // Register profile routes
  app.use('/', profileRoutes);
  
  // Register Blog Routes
  app.use('/', blogRoutes);

  // Verbal Content API Routes
  // Get verbal topic types (like Reading, Critical Reasoning, etc.)
  app.get("/api/verbal/types", async (req, res) => {
    try {
      const types = await storage.getDistinctVerbalTypes();
      console.log(`Loaded ${types.length} distinct verbal topic types`);
      res.status(200).json(types);
    } catch (error) {
      console.error("Error fetching verbal types:", error);
      res.status(500).json({ message: "Failed to fetch verbal types" });
    }
  });

  // Get verbal topics by type
  app.get("/api/verbal/topics/:type", async (req, res) => {
    try {
      const type = req.params.type;
      const topics = await storage.getVerbalTopicsByType(type);
      console.log(`Loaded ${topics.length} verbal topics for type ${type}`);
      
      // Filter topics based on user subscription level
      let filteredTopics = topics;
      if (req.user) {
        const userType = (req.user as any).userType || 'free';
        // Apply filtering logic based on contentAccessControl table
        // For simplicity, initially return all topics
      }
      
      res.status(200).json(filteredTopics);
    } catch (error) {
      console.error(`Error fetching verbal topics for type ${req.params.type}:`, error);
      res.status(500).json({ message: "Failed to fetch verbal topics" });
    }
  });

  // Get verbal content for a specific topic
  app.get("/api/verbal/content/:topicId", async (req, res) => {
    try {
      const topicId = parseInt(req.params.topicId);
      const content = await storage.getVerbalContentByTopic(topicId);
      console.log(`Loaded ${content.length} verbal content items for topic ID ${topicId}`);
      res.status(200).json(content);
    } catch (error) {
      console.error(`Error fetching verbal content for topic ID ${req.params.topicId}:`, error);
      res.status(500).json({ message: "Failed to fetch verbal content" });
    }
  });

  // Get user progress for verbal topics
  app.get("/api/verbal/progress/:userId", isAuthenticated, async (req, res) => {
    try {
      const userId = req.params.userId === 'undefined' ? (req.user as any).id : parseInt(req.params.userId);
      
      // Check if user is authorized to access this data
      if ((req.user as any).id !== userId && 
          !(req.user as any).isAdmin && (req.user as any).userType !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const progress = await storage.getVerbalProgressByUser(userId);
      console.log(`Loaded ${progress.length} verbal progress records for user ID ${userId}`);
      
      // Format response as a map of topicId -> progress for easier client-side use
      const progressMap: Record<number, any> = {};
      progress.forEach(p => {
        progressMap[p.topicId] = p;
      });
      
      res.status(200).json(progressMap);
    } catch (error) {
      console.error(`Error fetching verbal progress for user ID ${req.params.userId}:`, error);
      res.status(500).json({ message: "Failed to fetch verbal progress" });
    }
  });

  // Mark verbal topic as completed
  app.post("/api/verbal/progress", isAuthenticated, async (req, res) => {
    try {
      const { topicId, completed } = req.body;
      const userId = (req.user as any).id;
      
      // Check if progress record exists
      let progress = await storage.getVerbalProgress(userId, topicId);
      
      if (progress) {
        // Update existing progress
        progress = await storage.updateVerbalProgress(progress.id, {
          ...progress,
          completed: completed !== undefined ? completed : true,
          lastAccessed: new Date()
        });
      } else {
        // Create new progress record
        progress = await storage.createVerbalProgress({
          userId,
          topicId,
          completed: completed !== undefined ? completed : true,
          lastAccessed: new Date()
        });
      }
      
      // Create activity record
      await storage.createActivity({
        userId,
        type: 'verbal_topic_completed',
        createdAt: new Date(),
        details: { topicId }
      });
      
      res.status(200).json(progress);
    } catch (error) {
      console.error("Error updating verbal progress:", error);
      res.status(500).json({ message: "Failed to update verbal progress" });
    }
  });

  // Get all quantitative categories (for question editor)
  app.get("/api/quant/categories", async (req, res) => {
    try {
      const categories = await storage.getDistinctQuantCategories();
      res.json({ categories });
    } catch (error) {
      console.error("Error fetching quantitative categories:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get all verbal topics
  app.get("/api/verbal/topics", async (req, res) => {
    try {
      const topics = await storage.getAllVerbalTopics();
      console.log(`Loaded ${topics.length} verbal topics in total`);
      res.json(topics);
    } catch (error) {
      console.error("Error fetching verbal topics:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get all verbal types (for question editor)
  app.get("/api/verbal/types", async (req, res) => {
    try {
      const types = await storage.getDistinctVerbalTypes();
      res.json(types);
    } catch (error) {
      console.error("Error fetching verbal types:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create new practice sets (admin only)
  app.post("/api/admin/create-practice-sets", isAdmin, async (req, res) => {
    try {
      await createNewPracticeSets();
      res.json({ success: true, message: "Practice sets created successfully" });
    } catch (error) {
      console.error("Error creating practice sets:", error);
      res.status(500).json({ success: false, message: "Failed to create practice sets" });
    }
  });
  
  // Update practice set topic associations (admin only)
  app.post("/api/admin/update-practice-set-topics", isAdmin, async (req, res) => {
    try {
      await updatePracticeSetTopicAssociations();
      res.json({ success: true, message: "Practice set topic associations updated successfully" });
    } catch (error) {
      console.error("Error updating practice set topic associations:", error);
      res.status(500).json({ success: false, message: "Failed to update practice set topic associations" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
