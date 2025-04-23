import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Quantitative Question Types table
export const quantQuestionTypes = pgTable("quant_question_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  hasOptions: boolean("has_options").default(false),
  optionsType: text("options_type"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Insert schema for quant question types
export const insertQuantQuestionTypeSchema = createInsertSchema(quantQuestionTypes).pick({
  name: true,
  description: true,
  hasOptions: true,
  optionsType: true,
});

// Verbal Question Types table
export const verbalQuestionTypes = pgTable("verbal_question_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  hasOptions: boolean("has_options").default(false),
  optionsType: text("options_type"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Insert schema for verbal question types
export const insertVerbalQuestionTypeSchema = createInsertSchema(verbalQuestionTypes).pick({
  name: true,
  description: true,
  hasOptions: true,
  optionsType: true,
});

// Export Types
export type InsertQuantQuestionType = z.infer<typeof insertQuantQuestionTypeSchema>;
export type QuantQuestionType = typeof quantQuestionTypes.$inferSelect;

export type InsertVerbalQuestionType = z.infer<typeof insertVerbalQuestionTypeSchema>;
export type VerbalQuestionType = typeof verbalQuestionTypes.$inferSelect;