import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Verbal Topics schema
export const verbalTopics = pgTable("verbal_topics", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // e.g., "reading_comprehension", "text_completion", etc.
  order: integer("order").notNull(), // Ordering within the type
});

export const insertVerbalTopicSchema = createInsertSchema(verbalTopics).pick({
  title: true,
  description: true,
  type: true,
  order: true,
});

// Verbal Content schema (individual learning content for each topic)
export const verbalContent = pgTable("verbal_content", {
  id: serial("id").primaryKey(),
  topicId: integer("topic_id").notNull(), // Foreign key to verbalTopics
  title: text("title").notNull(),
  content: json("content").notNull(), // Rich text content as JSON (Slate/Plate format)
  order: integer("order").notNull(), // Order within the topic
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertVerbalContentSchema = createInsertSchema(verbalContent).pick({
  topicId: true,
  title: true,
  content: true,
  order: true,
});

// User progress for verbal topics
export const verbalProgress = pgTable("verbal_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  topicId: integer("topic_id").notNull(),
  completed: boolean("completed").default(false),
  lastAccessed: timestamp("last_accessed"),
});

export const insertVerbalProgressSchema = createInsertSchema(verbalProgress).pick({
  userId: true,
  topicId: true,
  completed: true,
  lastAccessed: true,
});

// Type exports for verbal content
export type InsertVerbalTopic = z.infer<typeof insertVerbalTopicSchema>;
export type VerbalTopic = typeof verbalTopics.$inferSelect;

export type InsertVerbalContent = z.infer<typeof insertVerbalContentSchema>;
export type VerbalContent = typeof verbalContent.$inferSelect;

export type InsertVerbalProgress = z.infer<typeof insertVerbalProgressSchema>;
export type VerbalProgress = typeof verbalProgress.$inferSelect;