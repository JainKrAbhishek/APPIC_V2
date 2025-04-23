import { eq, and, asc, desc } from "drizzle-orm";
import { db } from "../db";
import { words, wordProgress } from "@shared/schema";
import type { Word, InsertWord, WordProgress, InsertWordProgress } from "@shared/schema";

// This uses the mixin pattern to add vocabulary-related storage methods
export function VocabularyStorageMixin(Base: any) {
  return class VocabularyStorage extends Base {
    // Word methods
    async getWord(id: number): Promise<Word | undefined> {
      const result = await db.select().from(words).where(eq(words.id, id)).limit(1);
      return result.length ? result[0] : undefined;
    }

    async getWordsByDay(day: number): Promise<Word[]> {
      return await db
        .select()
        .from(words)
        .where(eq(words.day, day))
        .orderBy(asc(words.id));
    }

    async createWord(wordData: InsertWord): Promise<Word> {
      const result = await db.insert(words).values(wordData).returning();
      return result[0];
    }

    async updateWord(id: number, wordData: Partial<Word>): Promise<Word | undefined> {
      const result = await db
        .update(words)
        .set(wordData)  // Remove updatedAt since it's not in the schema
        .where(eq(words.id, id))
        .returning();
      return result.length ? result[0] : undefined;
    }

    async deleteWord(id: number): Promise<boolean> {
      const result = await db.delete(words).where(eq(words.id, id)).returning();
      return result.length > 0;
    }

    async getAllWords(): Promise<Word[]> {
      return await db.select().from(words).orderBy(asc(words.day), asc(words.id));
    }

    async getDistinctVocabularyDays(): Promise<number[]> {
      const result = await db
        .selectDistinct({ day: words.day })
        .from(words)
        .orderBy(asc(words.day));
      return result.map((row) => row.day);
    }

    // Word Progress methods
    async getWordProgress(
      userId: number,
      wordId: number
    ): Promise<WordProgress | undefined> {
      const result = await db
        .select()
        .from(wordProgress)
        .where(
          and(
            eq(wordProgress.userId, userId),
            eq(wordProgress.wordId, wordId)
          )
        )
        .limit(1);
      return result.length ? result[0] : undefined;
    }

    async createWordProgress(progressData: InsertWordProgress): Promise<WordProgress> {
      const result = await db.insert(wordProgress).values(progressData).returning();
      return result[0];
    }

    async updateWordProgress(
      id: number,
      progressData: Partial<WordProgress>
    ): Promise<WordProgress | undefined> {
      const result = await db
        .update(wordProgress)
        .set(progressData) // Remove updatedAt since it's not in the schema
        .where(eq(wordProgress.id, id))
        .returning();
      return result.length ? result[0] : undefined;
    }

    async getWordProgressByUser(userId: number): Promise<WordProgress[]> {
      return await db
        .select()
        .from(wordProgress)
        .where(eq(wordProgress.userId, userId));
    }

    async getBookmarkedWords(userId: number): Promise<Word[]> {
      try {
        console.log(`Fetching bookmarked words for userId=${userId} from database`);
        
        // First, check if the user has any word progress entries - using proper column naming
        const progressEntries = await db
          .select()
          .from(wordProgress)
          .where(eq(wordProgress.userId, userId));
        
        console.log(`User ${userId} has ${progressEntries.length} total word progress entries`);
        
        // Count how many of those are bookmarked
        const bookmarkedEntries = progressEntries.filter(entry => entry.bookmarked);
        console.log(`User ${userId} has ${bookmarkedEntries.length} bookmarked entries`);
        
        if (bookmarkedEntries.length > 0) {
          console.log('Sample bookmarked word IDs:', bookmarkedEntries.slice(0, 3).map(e => e.wordId));
        }
        
        // VERBOSE LOGGING to help debug
        console.log('Using userId column in the DB as:', wordProgress.userId.name);
        console.log('Using wordId column in the DB as:', wordProgress.wordId.name);
        console.log('Using bookmarked column in the DB as:', wordProgress.bookmarked.name);
        
        // Join the wordProgress and words tables to get the bookmarked words for a user
        // Only select fields that exist in the schema
        const result = await db
          .select({
            id: words.id,
            word: words.word,
            definition: words.definition,
            example: words.example,
            pronunciation: words.pronunciation, 
            day: words.day,
            order: words.order,
            synonyms: words.synonyms,
            partOfSpeech: words.partOfSpeech,
          })
          .from(wordProgress)
          .innerJoin(words, eq(wordProgress.wordId, words.id))
          .where(
            and(
              eq(wordProgress.userId, userId),
              eq(wordProgress.bookmarked, true)
            )
          );
        
        console.log(`Found ${result.length} bookmarked words for user ${userId}`);
        
        // Debug: If there's a mismatch, log details
        if (result.length !== bookmarkedEntries.length) {
          console.log(`WARNING: Mismatch between bookmarked entries (${bookmarkedEntries.length}) and returned words (${result.length})`);
          
          // Check for words that might be missing
          const wordIds = new Set(result.map(w => w.id));
          const missingWordIds = bookmarkedEntries
            .filter(entry => !wordIds.has(entry.wordId))
            .map(entry => entry.wordId);
          
          if (missingWordIds.length > 0) {
            console.log(`Words missing from results: ${missingWordIds.join(', ')}`);
            
            // Try to find these words directly
            for (const wordId of missingWordIds.slice(0, 3)) { // Check first 3 only
              const wordCheck = await db
                .select()
                .from(words)
                .where(eq(words.id, wordId));
              
              console.log(`Word ${wordId} exists in database: ${wordCheck.length > 0 ? 'Yes' : 'No'}`);
            }
          }
        }
        
        // Log a snippet of the returned data for debugging
        if (result.length > 0) {
          console.log('Sample bookmarked words data:', 
            result.slice(0, 2).map(word => ({
              id: word.id,
              word: word.word,
              day: word.day,
            }))
          );
        }
        
        return result;
      } catch (error) {
        console.error("Error in getBookmarkedWords:", error);
        // Return empty array instead of letting the error propagate
        return [];
      }
    }
  };
}