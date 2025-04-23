import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { quantQuestionTypes, verbalQuestionTypes } from "./question-types";

// Practice questions schema
export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // "verbal", "vocabulary", "quantitative"
  subtype: text("subtype").notNull(), // e.g., "reading_comprehension", "text_completion", etc.
  category: text("category"), // e.g., "algebra", "geometry", "reading_comprehension", etc.
  topic: text("topic"), // more specific topic within a category
  difficulty: integer("difficulty").default(1), // 1-5 difficulty level
  content: json("content").notNull(), // Rich text question content (Slate/Plate format)
  options: json("options").notNull(), // Rich text answer options as object array
  answer: text("answer").notNull(), // correct answer identifier
  explanation: json("explanation").notNull(), // Rich text explanation
  imageUrls: text("image_urls").array(), // Array of image URLs used in question
  latexFormulas: json("latex_formulas"), // Any LaTeX formulas used in the question
  tags: text("tags"), // Comma-separated tags for search and filtering
  // References to question type tables
  quantQuestionTypeId: integer("quant_question_type_id").references(() => quantQuestionTypes.id),
  verbalQuestionTypeId: integer("verbal_question_type_id").references(() => verbalQuestionTypes.id),
});

export const insertQuestionSchema = createInsertSchema(questions).pick({
  type: true,
  subtype: true,
  category: true,
  topic: true,
  difficulty: true,
  content: true,
  options: true,
  answer: true,
  explanation: true,
  imageUrls: true,
  latexFormulas: true,
  tags: true,
  quantQuestionTypeId: true,
  verbalQuestionTypeId: true,
});

// Bookmarked questions schema
export const bookmarkedQuestions = pgTable("bookmarked_questions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  questionId: integer("question_id").notNull(),
  practiceSetId: integer("practice_set_id"), // Optional: track which practice set it was bookmarked from
  bookmarkedAt: timestamp("bookmarked_at").defaultNow().notNull(),
  notes: text("notes"), // Optional user notes about the question
});

export const insertBookmarkedQuestionSchema = createInsertSchema(bookmarkedQuestions).pick({
  userId: true,
  questionId: true,
  practiceSetId: true,
  bookmarkedAt: true,
  notes: true,
});

// Practice sets schema
export const practiceSets = pgTable("practice_sets", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // "verbal", "vocabulary", "quantitative"
  title: text("title").notNull(),
  description: text("description").notNull(),
  difficulty: integer("difficulty").default(1), // 1-5 difficulty level
  questionIds: integer("question_ids").array().notNull(),
  timeLimit: integer("time_limit").default(30), // Time limit in minutes
  tags: text("tags"), // Comma-separated tags
  isPublished: boolean("is_published").default(true), // Whether the set is published and visible to users
  
  // Filter fields
  categoryFilter: text("category_filter"), // Filter by category (e.g., "Algebra", "Arithmetic")
  subtypeFilter: text("subtype_filter"), // Filter by question subtype
  topicFilter: text("topic_filter"), // Filter by specific topic
  
  // Topic association fields
  relatedTopicId: integer("related_topic_id"), // ID of the associated topic
  relatedTopicType: text("related_topic_type"), // Type of the related topic (e.g., "quant", "verbal")
  showInTopic: boolean("show_in_topic").default(true), // Whether to show this set in the topic view
});

export const insertPracticeSetSchema = createInsertSchema(practiceSets).pick({
  type: true,
  title: true,
  description: true,
  difficulty: true,
  questionIds: true,
  timeLimit: true,
  tags: true,
  isPublished: true,
  // Include filter fields
  categoryFilter: true,
  subtypeFilter: true,
  topicFilter: true,
  // Include topic association fields
  relatedTopicId: true,
  relatedTopicType: true,
  showInTopic: true,
});

// User practice results schema
export const practiceResults = pgTable("practice_results", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  practiceSetId: integer("practice_set_id").notNull(),
  score: integer("score").notNull(),
  maxScore: integer("max_score").notNull(),
  completedAt: timestamp("completed_at").notNull(),
  timeSpent: integer("time_spent").notNull(), // in seconds
  answers: json("answers").notNull(), // user's answers with correctness
});

export const insertPracticeResultSchema = createInsertSchema(practiceResults).pick({
  userId: true,
  practiceSetId: true,
  score: true,
  maxScore: true,
  completedAt: true,
  timeSpent: true,
  answers: true,
});

// Type exports
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questions.$inferSelect;

export type InsertPracticeSet = z.infer<typeof insertPracticeSetSchema>;
export type PracticeSet = typeof practiceSets.$inferSelect;

export type InsertPracticeResult = z.infer<typeof insertPracticeResultSchema>;
export type PracticeResult = typeof practiceResults.$inferSelect;