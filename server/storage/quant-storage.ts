import { eq, and, asc } from "drizzle-orm";
import { db } from "../db";
import { quantTopics, quantContent, quantProgress } from "@shared/schema";
import type { 
  QuantTopic, InsertQuantTopic, 
  QuantContent, InsertQuantContent, 
  QuantProgress, InsertQuantProgress 
} from "@shared/schema";

// This uses the mixin pattern to add quantitative content-related storage methods
export function QuantStorageMixin(Base: any) {
  return class QuantStorage extends Base {
    // Quantitative Topic methods
    async getQuantTopic(id: number): Promise<QuantTopic | undefined> {
      const result = await db.select().from(quantTopics).where(eq(quantTopics.id, id)).limit(1);
      return result.length ? result[0] : undefined;
    }
    async getQuantTopicsByGroup(groupNumber: number): Promise<QuantTopic[]> {
      return await db
        .select()
        .from(quantTopics)
        .where(eq(quantTopics.groupNumber, groupNumber))
        .orderBy(asc(quantTopics.order));
    }
    async getQuantTopicsByCategory(category: string): Promise<QuantTopic[]> {
      return await db
        .select()
        .from(quantTopics)
        .where(eq(quantTopics.category, category))
        .orderBy(asc(quantTopics.order));
    }
    async createQuantTopic(topicData: InsertQuantTopic): Promise<QuantTopic> {
      const result = await db.insert(quantTopics).values(topicData).returning();
      return result[0];
    }
    async updateQuantTopic(
      id: number,
      topicData: Partial<QuantTopic>
    ): Promise<QuantTopic | undefined> {
      const result = await db
        .update(quantTopics)
        .set({
          ...topicData,
          updatedAt: new Date(),
        })
        .where(eq(quantTopics.id, id))
        .returning();
      return result.length ? result[0] : undefined;
    }
    async deleteQuantTopic(id: number): Promise<boolean> {
      const result = await db.delete(quantTopics).where(eq(quantTopics.id, id)).returning();
      return result.length > 0;
    }
    async getAllQuantTopics(): Promise<QuantTopic[]> {
      return await db
        .select()
        .from(quantTopics)
        .orderBy(asc(quantTopics.groupNumber), asc(quantTopics.order));
    }
    async getDistinctQuantGroups(): Promise<number[]> {
      const result = await db
        .selectDistinct({ groupNumber: quantTopics.groupNumber })
        .from(quantTopics)
        .orderBy(asc(quantTopics.groupNumber));
      return result.map((row) => row.groupNumber);
    }
    async getDistinctQuantCategories(): Promise<string[]> {
      const result = await db
        .selectDistinct({ category: quantTopics.category })
        .from(quantTopics)
        .orderBy(asc(quantTopics.category));
      return result.map((row) => row.category);
    }

    // Quantitative Content methods
    async getQuantContent(id: number): Promise<QuantContent | undefined> {
      const result = await db.select().from(quantContent).where(eq(quantContent.id, id)).limit(1);
      return result.length ? result[0] : undefined;
    }
    async getQuantContentByTopic(topicId: number): Promise<QuantContent[]> {
      console.log(`[Storage] Fetching content for topic ID: ${topicId}`);

      // Get the topic first to verify it exists
      const topic = await db
        .select()
        .from(quantTopics)
        .where(eq(quantTopics.id, topicId))
        .limit(1);

      console.log(`[Storage] Found topic:`, topic[0]?.name);

      // Get content for this topic with detailed logging
      const results = await db
        .select()
        .from(quantContent)
        .where(eq(quantContent.topicId, topicId))
        .orderBy(asc(quantContent.order));

      console.log(`[Storage] Found ${results.length} content items for topic ${topicId}`);
      console.log('[Storage] Content items:', results.map(r => ({
        id: r.id,
        title: r.title,
        topicId: r.topicId
      })));

      return results;
    }
    async createQuantContent(contentData: InsertQuantContent): Promise<QuantContent> {
      const result = await db.insert(quantContent).values(contentData).returning();
      return result[0];
    }
    async updateQuantContent(
      id: number,
      contentData: Partial<QuantContent>
    ): Promise<QuantContent | undefined> {
      const result = await db
        .update(quantContent)
        .set({
          ...contentData,
          updatedAt: new Date(),
        })
        .where(eq(quantContent.id, id))
        .returning();
      return result.length ? result[0] : undefined;
    }
    async deleteQuantContent(id: number): Promise<boolean> {
      const result = await db.delete(quantContent).where(eq(quantContent.id, id)).returning();
      return result.length > 0;
    }
    async getAllQuantContent(): Promise<QuantContent[]> {
      return await db
        .select()
        .from(quantContent)
        .orderBy(asc(quantContent.topicId), asc(quantContent.order));
    }

    // Quantitative Progress methods
    async getQuantProgress(
      userId: number,
      topicId: number
    ): Promise<QuantProgress | undefined> {
      const result = await db
        .select()
        .from(quantProgress)
        .where(
          and(
            eq(quantProgress.userId, userId),
            eq(quantProgress.topicId, topicId)
          )
        )
        .limit(1);
      return result.length ? result[0] : undefined;
    }
    async createQuantProgress(progressData: InsertQuantProgress): Promise<QuantProgress> {
      const result = await db.insert(quantProgress).values(progressData).returning();
      return result[0];
    }
    async updateQuantProgress(
      id: number,
      progressData: Partial<QuantProgress>
    ): Promise<QuantProgress | undefined> {
      const result = await db
        .update(quantProgress)
        .set({
          ...progressData,
          updatedAt: new Date(),
        })
        .where(eq(quantProgress.id, id))
        .returning();
      return result.length ? result[0] : undefined;
    }
    async getQuantProgressByUser(userId: number): Promise<QuantProgress[]> {
      return await db
        .select()
        .from(quantProgress)
        .where(eq(quantProgress.userId, userId));
    }
    async getCompletedQuantTopics(userId: number): Promise<QuantTopic[]> {
      const result = await db
        .select({
          id: quantTopics.id,
          title: quantTopics.title,
          description: quantTopics.description,
          groupNumber: quantTopics.groupNumber,
          category: quantTopics.category,
          order: quantTopics.order,
          difficulty: quantTopics.difficulty,
          createdAt: quantTopics.createdAt,
          updatedAt: quantTopics.updatedAt,
        })
        .from(quantProgress)
        .innerJoin(quantTopics, eq(quantProgress.topicId, quantTopics.id))
        .where(
          and(
            eq(quantProgress.userId, userId),
            eq(quantProgress.completed, true)
          )
        );
      return result;
    }
  };
}