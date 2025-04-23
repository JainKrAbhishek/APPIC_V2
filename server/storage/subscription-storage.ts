import { eq, and, asc, desc } from "drizzle-orm";
import { db } from "../db";
import { 
  subscriptionPlans, contentAccessControl, apiKeys, activities 
} from "@shared/schema";
import type { 
  SubscriptionPlan, InsertSubscriptionPlan,
  ContentAccessControl, InsertContentAccessControl,
  ApiKey, InsertApiKey,
  Activity, InsertActivity
} from "@shared/schema";

// This uses the mixin pattern to add subscription-related storage methods
export function SubscriptionStorageMixin(Base: any) {
  return class SubscriptionStorage extends Base {
    // Subscription Plan methods
    async getSubscriptionPlan(id: number): Promise<SubscriptionPlan | undefined> {
      const result = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, id)).limit(1);
      return result.length ? result[0] : undefined;
    }

    async getSubscriptionPlanByStripePriceId(stripePriceId: string): Promise<SubscriptionPlan | undefined> {
      const result = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.stripePriceId, stripePriceId))
        .limit(1);
      return result.length ? result[0] : undefined;
    }

    async getActiveSubscriptionPlans(): Promise<SubscriptionPlan[]> {
      return await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.isActive, true))
        .orderBy(asc(subscriptionPlans.price));
    }

    async createSubscriptionPlan(planData: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
      const result = await db.insert(subscriptionPlans).values(planData).returning();
      return result[0];
    }

    async updateSubscriptionPlan(
      id: number,
      planData: Partial<SubscriptionPlan>
    ): Promise<SubscriptionPlan | undefined> {
      const result = await db
        .update(subscriptionPlans)
        .set({
          ...planData,
          updatedAt: new Date(),
        })
        .where(eq(subscriptionPlans.id, id))
        .returning();
      return result.length ? result[0] : undefined;
    }

    async deactivateSubscriptionPlan(id: number): Promise<boolean> {
      const result = await db
        .update(subscriptionPlans)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(subscriptionPlans.id, id))
        .returning();
      return result.length > 0;
    }

    // API Key Management methods
    async getApiKey(id: number): Promise<ApiKey | undefined> {
      const result = await db.select().from(apiKeys).where(eq(apiKeys.id, id)).limit(1);
      return result.length ? result[0] : undefined;
    }

    async getApiKeyByType(keyType: string): Promise<ApiKey | undefined> {
      const result = await db
        .select()
        .from(apiKeys)
        .where(eq(apiKeys.keyType, keyType))
        .limit(1);
      return result.length ? result[0] : undefined;
    }

    async getAllApiKeys(): Promise<ApiKey[]> {
      return await db.select().from(apiKeys).orderBy(asc(apiKeys.name));
    }

    async createApiKey(apiKeyData: InsertApiKey): Promise<ApiKey> {
      const result = await db.insert(apiKeys).values(apiKeyData).returning();
      return result[0];
    }

    async updateApiKey(
      id: number,
      apiKeyData: Partial<ApiKey>
    ): Promise<ApiKey | undefined> {
      const result = await db
        .update(apiKeys)
        .set({
          ...apiKeyData,
          updatedAt: new Date(),
        })
        .where(eq(apiKeys.id, id))
        .returning();
      return result.length ? result[0] : undefined;
    }

    async deleteApiKey(id: number): Promise<boolean> {
      const result = await db.delete(apiKeys).where(eq(apiKeys.id, id)).returning();
      return result.length > 0;
    }

    async markApiKeyAsUsed(id: number): Promise<boolean> {
      const result = await db
        .update(apiKeys)
        .set({
          lastUsed: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(apiKeys.id, id))
        .returning();
      return result.length > 0;
    }

    // Content Access Control methods
    async getContentAccess(
      contentType: string,
      contentId: number,
      userType: string
    ): Promise<boolean> {
      const result = await db
        .select()
        .from(contentAccessControl)
        .where(
          and(
            eq(contentAccessControl.contentType, contentType),
            eq(contentAccessControl.contentId, contentId),
            eq(contentAccessControl.userType, userType)
          )
        )
        .limit(1);
      return result.length ? result[0].isAccessible : false;
    }

    async setContentAccess(accessData: InsertContentAccessControl): Promise<ContentAccessControl> {
      const result = await db.insert(contentAccessControl).values(accessData).returning();
      return result[0];
    }

    async updateContentAccess(
      id: number,
      isAccessible: boolean
    ): Promise<ContentAccessControl | undefined> {
      const result = await db
        .update(contentAccessControl)
        .set({
          isAccessible,
          updatedAt: new Date(),
        })
        .where(eq(contentAccessControl.id, id))
        .returning();
      return result.length ? result[0] : undefined;
    }

    async getContentAccessByType(
      contentType: string,
      userType: string
    ): Promise<ContentAccessControl[]> {
      return await db
        .select()
        .from(contentAccessControl)
        .where(
          and(
            eq(contentAccessControl.contentType, contentType),
            eq(contentAccessControl.userType, userType)
          )
        );
    }

    async deleteContentAccess(id: number): Promise<boolean> {
      const result = await db.delete(contentAccessControl).where(eq(contentAccessControl.id, id)).returning();
      return result.length > 0;
    }

    // Activity methods
    async getActivitiesByUser(userId: number, limit?: number): Promise<Activity[]> {
      const query = db
        .select()
        .from(activities)
        .where(eq(activities.userId, userId))
        .orderBy(desc(activities.createdAt));

      if (limit) {
        return await query.limit(limit);
      }

      return await query;
    }

    async createActivity(activityData: InsertActivity): Promise<Activity> {
      const result = await db.insert(activities).values(activityData).returning();
      return result[0];
    }
  };
}