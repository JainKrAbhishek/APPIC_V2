import { z } from "zod";
import { eq, and, asc } from "drizzle-orm";
import { db } from "../db";
import { 
  questions, practiceSets, practiceResults, 
  bookmarkedQuestions, words, insertBookmarkedQuestionSchema 
} from "@shared/schema";
import type { 
  Question, InsertQuestion, 
  PracticeSet, InsertPracticeSet, 
  PracticeResult, InsertPracticeResult,
  Word
} from "@shared/schema";

// This uses the mixin pattern to add practice-related storage methods
export function PracticeStorageMixin(Base: any) {
  return class PracticeStorage extends Base {
    // Question methods
    async getQuestion(id: number): Promise<Question | undefined> {
      const result = await db.select().from(questions).where(eq(questions.id, id)).limit(1);
      return result.length ? result[0] : undefined;
    }

    async getQuestionsByType(type: string): Promise<Question[]> {
      return await db
        .select()
        .from(questions)
        .where(eq(questions.type, type))
        .orderBy(asc(questions.id));
    }

    async createQuestion(questionData: InsertQuestion): Promise<Question> {
      const result = await db.insert(questions).values(questionData).returning();
      return result[0];
    }

    async updateQuestion(
      id: number,
      questionData: Partial<Question>
    ): Promise<Question | undefined> {
      const result = await db
        .update(questions)
        .set({
          ...questionData,
          updatedAt: new Date(),
        })
        .where(eq(questions.id, id))
        .returning();
      return result.length ? result[0] : undefined;
    }

    async deleteQuestion(id: number): Promise<boolean> {
      const result = await db.delete(questions).where(eq(questions.id, id)).returning();
      return result.length > 0;
    }

    async getAllQuestions(): Promise<Question[]> {
      return await db.select().from(questions).orderBy(asc(questions.id));
    }

    // Practice Set methods
    async getPracticeSet(id: number): Promise<PracticeSet | undefined> {
      const result = await db.select().from(practiceSets).where(eq(practiceSets.id, id)).limit(1);
      return result.length ? result[0] : undefined;
    }

    async getPracticeSetsByType(type: string): Promise<PracticeSet[]> {
      return await db
        .select()
        .from(practiceSets)
        .where(eq(practiceSets.type, type))
        .orderBy(asc(practiceSets.id));
    }

    async createPracticeSet(setData: InsertPracticeSet): Promise<PracticeSet> {
      const result = await db.insert(practiceSets).values(setData).returning();
      return result[0];
    }

    async updatePracticeSet(
      id: number,
      setData: Partial<PracticeSet>
    ): Promise<PracticeSet | undefined> {
      console.log(`[DEBUG] updatePracticeSet called for ID: ${id}`);
      console.log(`[DEBUG] setData:`, JSON.stringify(setData, null, 2));
      
      // Ensure questionIds is properly handled when it's included in the update
      if (setData.questionIds !== undefined) {
        console.log(`[DEBUG] questionIds before update:`, JSON.stringify(setData.questionIds, null, 2));
        console.log(`[DEBUG] questionIds type:`, Array.isArray(setData.questionIds) ? 'Array' : typeof setData.questionIds);
        
        // If not an array, fix it
        if (!Array.isArray(setData.questionIds)) {
          console.warn(`[WARN] questionIds is not an array, trying to fix...`);
          try {
            // Try to convert if it's a JSON string
            if (typeof setData.questionIds === 'string') {
              setData.questionIds = JSON.parse(setData.questionIds);
              console.log(`[DEBUG] Converted questionIds from string to:`, JSON.stringify(setData.questionIds, null, 2));
            }
          } catch (e) {
            console.error(`[ERROR] Failed to parse questionIds:`, e);
          }
        }
      }
      
      try {
        const result = await db
          .update(practiceSets)
          .set({
            ...setData,
            updatedAt: new Date(),
          })
          .where(eq(practiceSets.id, id))
          .returning();
        
        console.log(`[DEBUG] Update result:`, JSON.stringify(result, null, 2));
        return result.length ? result[0] : undefined;
      } catch (error) {
        console.error(`[ERROR] Failed to update practice set:`, error);
        throw error;
      }
    }

    async deletePracticeSet(id: number): Promise<boolean> {
      const result = await db.delete(practiceSets).where(eq(practiceSets.id, id)).returning();
      return result.length > 0;
    }

    async getAllPracticeSets(): Promise<PracticeSet[]> {
      return await db.select().from(practiceSets).orderBy(asc(practiceSets.id));
    }

    // Practice Result methods
    async getPracticeResult(id: number): Promise<PracticeResult | undefined> {
      const result = await db.select().from(practiceResults).where(eq(practiceResults.id, id)).limit(1);
      return result.length ? result[0] : undefined;
    }

    async getPracticeResultsByUser(userId: number): Promise<PracticeResult[]> {
      return await db
        .select()
        .from(practiceResults)
        .where(eq(practiceResults.userId, userId))
        .orderBy(asc(practiceResults.id));
    }

    async createPracticeResult(resultData: InsertPracticeResult): Promise<PracticeResult> {
      const result = await db.insert(practiceResults).values(resultData).returning();
      return result[0];
    }

    // Bookmarked Questions methods
    async getBookmarkedQuestion(
      userId: number,
      questionId: number
    ): Promise<any | undefined> {
      const result = await db
        .select()
        .from(bookmarkedQuestions)
        .where(
          and(
            eq(bookmarkedQuestions.userId, userId),
            eq(bookmarkedQuestions.questionId, questionId)
          )
        )
        .limit(1);
      return result.length ? result[0] : undefined;
    }

    async getBookmarkedQuestionsByUser(userId: number): Promise<Question[]> {
      // Join the bookmarkedQuestions and questions tables to get the bookmarked questions for a user
      const result = await db
        .select({
          id: questions.id,
          content: questions.content,
          options: questions.options,
          correctAnswer: questions.correctAnswer,
          explanation: questions.explanation,
          type: questions.type,
          difficulty: questions.difficulty,
          tags: questions.tags,
          createdAt: questions.createdAt,
          updatedAt: questions.updatedAt,
          typeId: questions.typeId,
          subtype: questions.subtype,
        })
        .from(bookmarkedQuestions)
        .innerJoin(questions, eq(bookmarkedQuestions.questionId, questions.id))
        .where(eq(bookmarkedQuestions.userId, userId));
      return result;
    }

    async createBookmarkedQuestion(bookmarkData: z.infer<typeof insertBookmarkedQuestionSchema>): Promise<any> {
      const result = await db.insert(bookmarkedQuestions).values(bookmarkData).returning();
      return result[0];
    }

    async deleteBookmarkedQuestion(userId: number, questionId: number): Promise<boolean> {
      const result = await db
        .delete(bookmarkedQuestions)
        .where(
          and(
            eq(bookmarkedQuestions.userId, userId),
            eq(bookmarkedQuestions.questionId, questionId)
          )
        )
        .returning();
      return result.length > 0;
    }
  };
}