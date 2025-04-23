import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Quantitative Topics schema
export const quantTopics = pgTable("quant_topics", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  groupNumber: integer("group_number").notNull(), // For organizing topics into groups (e.g., "Group 1", "Group 2")
  category: text("category").notNull(), // Category like "Arithmetic", "Algebra", "Geometry", etc.
  order: integer("order").notNull(), // Ordering within the group
  icon: text("icon"), // Optional icon name for UI
  prerequisites: text("prerequisites"), // Comma-separated list of prerequisite topic IDs
});

export const insertQuantTopicSchema = createInsertSchema(quantTopics).pick({
  name: true,
  description: true,
  groupNumber: true,
  category: true,
  order: true,
  icon: true,
  prerequisites: true,
});

// Quantitative Content schema (individual learning content for each topic)
export const quantContent = pgTable("quant_content", {
  id: serial("id").primaryKey(),
  topicId: integer("topic_id").notNull(), // Foreign key to quantTopics
  title: text("title").notNull(),
  content: json("content").notNull(), // Rich text content as JSON (Slate/Plate format)
  examples: json("examples"), // Array of examples with rich text
  formulas: json("formulas"), // Array of formulas (LaTeX)
  imageUrls: text("image_urls").array(), // Array of image URLs
  order: integer("order").notNull(), // Order within the topic
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertQuantContentSchema = createInsertSchema(quantContent).pick({
  topicId: true,
  title: true,
  content: true,
  examples: true,
  formulas: true,
  imageUrls: true,
  order: true,
});

// User progress for quantitative topics
export const quantProgress = pgTable("quant_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  topicId: integer("topic_id").notNull(),
  completed: boolean("completed").default(false),
  score: integer("score").default(0), // Score from 0-100
  timeSpent: integer("time_spent").default(0), // in seconds
  lastAccessed: timestamp("last_accessed"),
  notes: text("notes"), // User's personal notes about the topic
});

export const insertQuantProgressSchema = createInsertSchema(quantProgress).pick({
  userId: true,
  topicId: true,
  completed: true,
  score: true,
  timeSpent: true,
  lastAccessed: true,
  notes: true,
});

// Type exports for quant content
export type InsertQuantTopic = z.infer<typeof insertQuantTopicSchema>;
export type QuantTopic = typeof quantTopics.$inferSelect;

export type InsertQuantContent = z.infer<typeof insertQuantContentSchema>;
export type QuantContent = typeof quantContent.$inferSelect;

export type InsertQuantProgress = z.infer<typeof insertQuantProgressSchema>;
export type QuantProgress = typeof quantProgress.$inferSelect;