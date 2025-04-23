import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User types enum
export const UserType = {
  FREE: "free",
  PREMIUM: "premium",
  BUSINESS: "business",
  ADMIN: "admin"
} as const;

export type UserTypeValue = typeof UserType[keyof typeof UserType];

// Subscription status enum
export const SubscriptionStatus = {
  NONE: "none",
  ACTIVE: "active",
  CANCELED: "canceled",
  PAST_DUE: "past_due",
  TRIAL: "trial"
} as const;

export type SubscriptionStatusValue = typeof SubscriptionStatus[keyof typeof SubscriptionStatus];

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  isAdmin: boolean("is_admin").default(false),
  currentDay: integer("current_day").default(1),
  wordsLearned: integer("words_learned").default(0),
  practiceCompleted: integer("practice_completed").default(0),
  timeSpent: integer("time_spent").default(0), // in minutes
  // Authentication fields
  emailVerified: boolean("email_verified").default(false),
  verificationToken: text("verification_token"),
  resetPasswordToken: text("reset_password_token"),
  resetPasswordExpires: timestamp("reset_password_expires"),
  // Subscription fields
  userType: text("user_type").default(UserType.FREE),
  subscriptionStatus: text("subscription_status").default(SubscriptionStatus.NONE),
  subscriptionId: text("subscription_id"),
  subscriptionPlan: text("subscription_plan"),
  subscriptionPriceId: text("subscription_price_id"),
  subscriptionStartDate: timestamp("subscription_start_date"),
  subscriptionEndDate: timestamp("subscription_end_date"),
  stripeCustomerId: text("stripe_customer_id"),
  // Last access
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  firstName: true,
  lastName: true,
  email: true,
  isAdmin: true,
  userType: true,
  emailVerified: true,
  subscriptionStatus: true,
});

// User Tokens for Email Verification and Password Reset
export const userTokens = pgTable("user_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  token: text("token").notNull(),
  tokenType: text("token_type").notNull(), // "verification" or "password_reset" or "api"
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserTokenSchema = createInsertSchema(userTokens).pick({
  userId: true,
  token: true,
  tokenType: true,
  expiresAt: true,
  isUsed: true,
});

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertUserToken = z.infer<typeof insertUserTokenSchema>;
export type UserToken = typeof userTokens.$inferSelect;