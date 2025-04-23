import { eq, and, asc } from "drizzle-orm";
import { db } from "../db";
import { verbalTopics, verbalContent, verbalProgress } from "@shared/schema";
import type { 
  VerbalTopic, InsertVerbalTopic, 
  VerbalContent, InsertVerbalContent, 
  VerbalProgress, InsertVerbalProgress 
} from "@shared/schema";

// This uses the mixin pattern to add verbal content-related storage methods
export function VerbalStorageMixin(Base: any) {
  return class VerbalStorage extends Base {
    // Verbal Topic methods
    async getVerbalTopic(id: number): Promise<VerbalTopic | undefined> {
      console.log(`[VerbalStorage] Getting topic with ID: ${id}`);
      const result = await db.select().from(verbalTopics).where(eq(verbalTopics.id, id)).limit(1);
      return result.length ? result[0] : undefined;
    }

    async getVerbalTopicsByType(type: string): Promise<VerbalTopic[]> {
      console.log(`[VerbalStorage] Getting topics for type: ${type}`);
      return await db
        .select()
        .from(verbalTopics)
        .where(eq(verbalTopics.type, type))
        .orderBy(asc(verbalTopics.order));
    }

    async createVerbalTopic(topicData: InsertVerbalTopic): Promise<VerbalTopic> {
      console.log(`[VerbalStorage] Creating new topic:`, topicData);
      const result = await db.insert(verbalTopics).values(topicData).returning();
      return result[0];
    }

    async updateVerbalTopic(
      id: number,
      topicData: Partial<VerbalTopic>
    ): Promise<VerbalTopic | undefined> {
      console.log(`[VerbalStorage] Updating topic ${id}:`, topicData);
      const result = await db
        .update(verbalTopics)
        .set({
          ...topicData,
          updatedAt: new Date(),
        })
        .where(eq(verbalTopics.id, id))
        .returning();
      return result.length ? result[0] : undefined;
    }

    async deleteVerbalTopic(id: number): Promise<boolean> {
      console.log(`[VerbalStorage] Deleting topic: ${id}`);
      const result = await db.delete(verbalTopics).where(eq(verbalTopics.id, id)).returning();
      return result.length > 0;
    }

    async getAllVerbalTopics(): Promise<VerbalTopic[]> {
      console.log(`[VerbalStorage] Getting all topics`);
      return await db
        .select()
        .from(verbalTopics)
        .orderBy(asc(verbalTopics.type), asc(verbalTopics.order));
    }

    async getDistinctVerbalTypes(): Promise<string[]> {
      console.log(`[VerbalStorage] Getting distinct types`);
      const result = await db
        .selectDistinct({ type: verbalTopics.type })
        .from(verbalTopics)
        .orderBy(asc(verbalTopics.type));
      return result.map((row) => row.type);
    }

    // Verbal Content methods
    async getVerbalContent(id: number): Promise<VerbalContent | undefined> {
      console.log(`[VerbalStorage] Getting content with ID: ${id}`);
      const result = await db.select().from(verbalContent).where(eq(verbalContent.id, id)).limit(1);
      return result.length ? result[0] : undefined;
    }

    async getVerbalContentByTopic(topicId: number): Promise<VerbalContent[]> {
      console.log(`[VerbalStorage] Getting content for topic: ${topicId}`);
      return await db
        .select()
        .from(verbalContent)
        .where(eq(verbalContent.topicId, topicId))
        .orderBy(asc(verbalContent.order));
    }

    async createVerbalContent(contentData: InsertVerbalContent): Promise<VerbalContent> {
      console.log(`[VerbalStorage] Creating new content:`, contentData);
      const result = await db.insert(verbalContent).values(contentData).returning();
      return result[0];
    }

    async updateVerbalContent(
      id: number,
      contentData: Partial<VerbalContent>
    ): Promise<VerbalContent | undefined> {
      console.log(`[VerbalStorage] Updating content ${id}:`, contentData);
      const result = await db
        .update(verbalContent)
        .set({
          ...contentData,
          updatedAt: new Date(),
        })
        .where(eq(verbalContent.id, id))
        .returning();
      return result.length ? result[0] : undefined;
    }

    async deleteVerbalContent(id: number): Promise<boolean> {
      console.log(`[VerbalStorage] Deleting content: ${id}`);
      const result = await db.delete(verbalContent).where(eq(verbalContent.id, id)).returning();
      return result.length > 0;
    }

    async getAllVerbalContent(): Promise<VerbalContent[]> {
      console.log(`[VerbalStorage] Getting all content`);
      return await db.select().from(verbalContent).orderBy(asc(verbalContent.topicId), asc(verbalContent.order));
    }

    // Verbal Progress methods
    async getVerbalProgress(
      userId: number,
      topicId: number
    ): Promise<VerbalProgress | undefined> {
      console.log(`[VerbalStorage] Getting progress for user ${userId} and topic ${topicId}`);
      const result = await db
        .select()
        .from(verbalProgress)
        .where(
          and(
            eq(verbalProgress.userId, userId),
            eq(verbalProgress.topicId, topicId)
          )
        )
        .limit(1);
      return result.length ? result[0] : undefined;
    }

    async createVerbalProgress(progressData: InsertVerbalProgress): Promise<VerbalProgress> {
      console.log(`[VerbalStorage] Creating new progress:`, progressData);
      const result = await db.insert(verbalProgress).values(progressData).returning();
      return result[0];
    }

    async updateVerbalProgress(
      id: number,
      progressData: Partial<VerbalProgress>
    ): Promise<VerbalProgress | undefined> {
      console.log(`[VerbalStorage] Updating progress ${id}:`, progressData);
      const result = await db
        .update(verbalProgress)
        .set({
          ...progressData,
          updatedAt: new Date(),
        })
        .where(eq(verbalProgress.id, id))
        .returning();
      return result.length ? result[0] : undefined;
    }

    async getVerbalProgressByUser(userId: number): Promise<VerbalProgress[]> {
      console.log(`[VerbalStorage] Getting all progress for user: ${userId}`);
      return await db
        .select()
        .from(verbalProgress)
        .where(eq(verbalProgress.userId, userId));
    }

    async getCompletedVerbalTopics(userId: number): Promise<VerbalTopic[]> {
      console.log(`[VerbalStorage] Getting completed topics for user: ${userId}`);
      const result = await db
        .select({
          id: verbalTopics.id,
          title: verbalTopics.title,
          description: verbalTopics.description,
          type: verbalTopics.type,
          order: verbalTopics.order,
          createdAt: verbalTopics.createdAt,
          updatedAt: verbalTopics.updatedAt,
        })
        .from(verbalProgress)
        .innerJoin(verbalTopics, eq(verbalProgress.topicId, verbalTopics.id))
        .where(
          and(
            eq(verbalProgress.userId, userId),
            eq(verbalProgress.completed, true)
          )
        );
      return result;
    }
  };
}