import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Vocabulary words schema
export const words = pgTable("words", {
  id: serial("id").primaryKey(),
  word: text("word").notNull(),
  definition: text("definition").notNull(),
  example: text("example").notNull(),
  pronunciation: text("pronunciation"),
  day: integer("day").notNull(), // 1-34 day curriculum
  order: integer("order").notNull(), // order in the day's curriculum
  synonyms: text("synonyms").array(), // Array of synonyms
  partOfSpeech: text("part_of_speech"), // noun, verb, adjective, etc.
});

export const insertWordSchema = createInsertSchema(words).pick({
  word: true,
  definition: true,
  example: true,
  pronunciation: true,
  day: true,
  order: true,
  synonyms: true,
  partOfSpeech: true,
});

// User progress schema for vocabulary
export const wordProgress = pgTable("word_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  wordId: integer("word_id").notNull(),
  learned: boolean("learned").default(false),
  mastered: boolean("mastered").default(false),
  bookmarked: boolean("bookmarked").default(false),
  lastPracticed: timestamp("last_practiced"),
  // Spaced repetition fields
  repetitionLevel: integer("repetition_level").default(0), // 0-5 representing difficulty level
  nextReviewDate: timestamp("next_review_date"), // When this word should be reviewed next
  reviewHistory: jsonb("review_history").default('[]'), // Array of review attempts and results
  efFactor: integer("ef_factor").default(250), // Easiness factor (SM-2 algorithm) - stored as int (x100)
  correctStreak: integer("correct_streak").default(0), // Number of consecutive correct answers
});

export const insertWordProgressSchema = createInsertSchema(wordProgress).pick({
  userId: true,
  wordId: true,
  learned: true,
  mastered: true,
  bookmarked: true,
  lastPracticed: true,
  repetitionLevel: true,
  nextReviewDate: true,
  reviewHistory: true,
  efFactor: true,
  correctStreak: true,
});

// Review history item schema for tracking individual review sessions
export const reviewHistoryItemSchema = z.object({
  date: z.string(), // ISO date string
  quality: z.number().min(0).max(5), // 0-5 rating (how well the user remembered)
  interval: z.number(), // interval in days until next review
  efFactor: z.number(), // easiness factor after this review
});

export type ReviewHistoryItem = z.infer<typeof reviewHistoryItemSchema>;

// Type exports
export type InsertWord = z.infer<typeof insertWordSchema>;
export type Word = typeof words.$inferSelect;

export type InsertWordProgress = z.infer<typeof insertWordProgressSchema>;
export type WordProgress = typeof wordProgress.$inferSelect;