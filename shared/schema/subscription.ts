import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Content Access Control - For managing what users can access based on subscription
export const contentAccessControl = pgTable("content_access_control", {
  id: serial("id").primaryKey(),
  contentType: text("content_type").notNull(), // Type of content: quant_topic, verbal_topic, practice_set, etc.
  contentId: integer("content_id").notNull(), // ID of the content
  userType: text("user_type").notNull(), // free, premium, business, admin, etc.
  isAccessible: boolean("is_accessible").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertContentAccessControlSchema = createInsertSchema(contentAccessControl).pick({
  contentType: true,
  contentId: true,
  userType: true,
  isAccessible: true,
});

// Subscription plans schema
export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  userType: text("user_type").notNull(), // The user type this plan gives (premium, business, etc.)
  description: text("description").notNull(),
  price: integer("price").notNull(), // Price in cents (e.g., 1999 for $19.99)
  billingPeriod: text("billing_period").notNull(), // "monthly", "yearly", etc.
  intervalCount: integer("interval_count").default(1), // e.g., 1 for monthly, 12 for yearly
  stripePriceId: text("stripe_price_id"), // Stripe price ID for checkout
  isActive: boolean("is_active").default(true),
  featuresJson: json("features_json"), // JSON array of features included in this plan
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).pick({
  name: true,
  userType: true,
  description: true,
  price: true,
  billingPeriod: true,
  intervalCount: true,
  stripePriceId: true,
  isActive: true,
  featuresJson: true,
});

// API Keys schema
export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  keyType: text("key_type").notNull(), // e.g., "stripe", "resend", etc.
  keyValue: text("key_value").notNull(), // Encrypted API key
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  lastUsedAt: timestamp("last_used_at"),
});

export const insertApiKeySchema = createInsertSchema(apiKeys).pick({
  name: true,
  keyType: true,
  keyValue: true,
  isActive: true,
});

// Activity schema to track user actions
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // e.g., "vocabulary_completion", "practice_set", etc.
  details: json("details").notNull(),
  createdAt: timestamp("created_at").notNull(),
});

export const insertActivitySchema = createInsertSchema(activities).pick({
  userId: true,
  type: true,
  details: true,
  createdAt: true,
});

// Type exports
export type InsertContentAccessControl = z.infer<typeof insertContentAccessControlSchema>;
export type ContentAccessControl = typeof contentAccessControl.$inferSelect;

export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;

export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type ApiKey = typeof apiKeys.$inferSelect;

export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;