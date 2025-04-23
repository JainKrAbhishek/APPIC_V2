import { pgTable, serial, text, timestamp, integer, boolean, jsonb } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { relations } from 'drizzle-orm';
import { z } from 'zod';

// Task types for essays (Issue or Argument)
export const EssayTaskType = {
  ISSUE: 'issue',
  ARGUMENT: 'argument'
} as const;

export type EssayTaskTypeValue = typeof EssayTaskType[keyof typeof EssayTaskType];

// Score scale (0-6 for GRE essays)
export const EssayScoreScale = {
  ZERO: 0,
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
  SIX: 6
} as const;

export type EssayScoreValue = typeof EssayScoreScale[keyof typeof EssayScoreScale];

// Table for essay prompts
export const essayPrompts = pgTable("essay_prompts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  taskType: text("task_type").notNull().$type<EssayTaskTypeValue>(),
  prompt: text("prompt").notNull(),
  sampleEssay: text("sample_essay"),
  difficultyLevel: integer("difficulty_level").default(1),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Schema for inserting new essay prompts
export const insertEssayPromptSchema = createInsertSchema(essayPrompts, {
  taskType: z.enum([EssayTaskType.ISSUE, EssayTaskType.ARGUMENT]),
  tags: z.array(z.string()).optional()
}).omit({ id: true });

// Table for user essays
export const userEssays = pgTable("user_essays", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  promptId: integer("prompt_id").notNull().references(() => essayPrompts.id),
  content: text("content").notNull(),
  wordCount: integer("word_count").notNull(),
  timeSpent: integer("time_spent").notNull(),
  score: integer("score"),
  feedback: jsonb("feedback").$type<EssayFeedback>(),
  isCompleted: boolean("is_completed").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Define relationships
export const essayPromptsRelations = relations(essayPrompts, ({ many }) => ({
  essays: many(userEssays)
}));

export const userEssaysRelations = relations(userEssays, ({ one }) => ({
  prompt: one(essayPrompts, {
    fields: [userEssays.promptId],
    references: [essayPrompts.id]
  })
}));

// Schema for inserting new user essays
export const insertUserEssaySchema = createInsertSchema(userEssays).omit({ 
  id: true, 
  feedback: true,
  score: true
});

// Interface for essay feedback
export interface EssayFeedback {
  overallScore: EssayScoreValue;
  criteria: {
    structure: {
      score: number;
      feedback: string;
    };
    clarity: {
      score: number;
      feedback: string;
    };
    reasoning: {
      score: number;
      feedback: string;
    };
    evidence: {
      score: number;
      feedback: string;
    };
    grammar: {
      score: number;
      feedback: string;
    };
  };
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  summary: string;
}

// Export types
export type InsertEssayPrompt = z.infer<typeof insertEssayPromptSchema>;
export type EssayPrompt = typeof essayPrompts.$inferSelect;

export type InsertUserEssay = z.infer<typeof insertUserEssaySchema>;
export type UserEssay = typeof userEssays.$inferSelect;