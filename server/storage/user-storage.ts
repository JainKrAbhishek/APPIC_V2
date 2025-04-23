import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { users, userTokens } from "@shared/schema";
import type { User, InsertUser, UserToken, InsertUserToken } from "@shared/schema";

// This uses the mixin pattern to add user-related storage methods
export function UserStorageMixin(Base: any) {
  return class UserStorage extends Base {
    // User methods
    async getUser(id: number): Promise<User | undefined> {
      const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return result.length ? result[0] : undefined;
    }

    async getUserByUsername(username: string): Promise<User | undefined> {
      const result = await db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);
      return result.length ? result[0] : undefined;
    }

    async getUserByEmail(email: string): Promise<User | undefined> {
      const result = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      return result.length ? result[0] : undefined;
    }

    async createUser(userData: InsertUser): Promise<User> {
      const result = await db.insert(users).values(userData).returning();
      return result[0];
    }

    async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
      const result = await db
        .update(users)
        .set({
          ...userData,
          updatedAt: new Date(),
        })
        .where(eq(users.id, id))
        .returning();
      return result.length ? result[0] : undefined;
    }

    async getAllUsers(): Promise<User[]> {
      return await db.select().from(users);
    }

    async updateUserPassword(id: number, newPassword: string): Promise<boolean> {
      const result = await db
        .update(users)
        .set({
          password: newPassword,
          updatedAt: new Date(),
        })
        .where(eq(users.id, id))
        .returning();
      return result.length > 0;
    }

    async verifyUserEmail(id: number): Promise<boolean> {
      const result = await db
        .update(users)
        .set({
          emailVerified: true,
          updatedAt: new Date(),
        })
        .where(eq(users.id, id))
        .returning();
      return result.length > 0;
    }

    async getUsersByType(userType: string): Promise<User[]> {
      return await db
        .select()
        .from(users)
        .where(eq(users.userType, userType));
    }

    async updateUserSubscription(
      id: number, 
      subscriptionData: {
        subscriptionId?: string;
        subscriptionPlan?: string;
        subscriptionPriceId?: string;
        subscriptionStatus?: string;
        subscriptionStartDate?: Date;
        subscriptionEndDate?: Date;
        userType?: string;
        stripeCustomerId?: string;
      }
    ): Promise<User | undefined> {
      const result = await db
        .update(users)
        .set({
          ...subscriptionData,
          updatedAt: new Date(),
        })
        .where(eq(users.id, id))
        .returning();
      return result.length ? result[0] : undefined;
    }

    // User Tokens methods for email verification and password reset
    async createUserToken(tokenData: InsertUserToken): Promise<UserToken> {
      const result = await db.insert(userTokens).values(tokenData).returning();
      return result[0];
    }

    async getUserTokenByToken(token: string): Promise<UserToken | undefined> {
      const result = await db
        .select()
        .from(userTokens)
        .where(eq(userTokens.token, token))
        .limit(1);
      return result.length ? result[0] : undefined;
    }

    async getUserTokensByUser(userId: number, tokenType: string): Promise<UserToken[]> {
      return await db
        .select()
        .from(userTokens)
        .where(
          and(
            eq(userTokens.userId, userId),
            eq(userTokens.tokenType, tokenType)
          )
        );
    }

    async markTokenAsUsed(id: number): Promise<boolean> {
      const result = await db
        .update(userTokens)
        .set({
          used: true,
          updatedAt: new Date(),
        })
        .where(eq(userTokens.id, id))
        .returning();
      return result.length > 0;
    }

    async deleteExpiredTokens(): Promise<number> {
      const now = new Date();
      const result = await db
        .delete(userTokens)
        .where(
          and(
            eq(userTokens.used, false),
            (cb) => cb.lt(userTokens.expiresAt, now.toISOString())
          )
        );
      return result.rowCount || 0;
    }
  };
}