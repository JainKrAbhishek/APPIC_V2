import { db } from "./db";
import { practiceSets, InsertPracticeSet } from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * This script creates new practice sets for organizing questions by topic
 */
async function createNewPracticeSets() {
  console.log("Creating new practice sets...");

  // Quantitative practice sets
  const quantPracticeSets: InsertPracticeSet[] = [
    {
      type: "quantitative",
      title: "Algebra Basics - Equations and Expressions",
      description: "Practice solving basic algebraic equations and working with expressions",
      difficulty: 3,
      questionIds: [1, 11, 15],
      timeLimit: 1800, // 30 minutes
      tags: "algebra,equations,factoring",
      isPublished: true,
      categoryFilter: "Algebra",
      subtypeFilter: "multiple_choice",
      topicFilter: "Basic Algebraic Expressions",
      relatedTopicId: 70,
      relatedTopicType: "quant",
      showInTopic: true
    },
    {
      type: "quantitative",
      title: "Arithmetic - Probability and Combinations",
      description: "Practice probability concepts and counting principles",
      difficulty: 2,
      questionIds: [2, 8],
      timeLimit: 1200, // 20 minutes
      tags: "arithmetic,probability,counting",
      isPublished: true,
      categoryFilter: "Arithmetic",
      subtypeFilter: "multiple_choice",
      topicFilter: "Probability",
      relatedTopicId: 13,
      relatedTopicType: "quant",
      showInTopic: true
    },
    {
      type: "quantitative", 
      title: "Algebra - Sequences and Patterns",
      description: "Work with sequences, series, and pattern recognition",
      difficulty: 3,
      questionIds: [3],
      timeLimit: 600, // 10 minutes
      tags: "algebra,sequences,patterns",
      isPublished: true,
      categoryFilter: "Algebra",
      subtypeFilter: "multiple_choice",
      topicFilter: "Sequences",
      relatedTopicId: 70,
      relatedTopicType: "quant",
      showInTopic: true
    },
    {
      type: "quantitative",
      title: "Arithmetic - Number Properties",
      description: "Practice working with divisibility, factors, and multiples",
      difficulty: 2,
      questionIds: [9],
      timeLimit: 600, // 10 minutes
      tags: "arithmetic,divisibility,factors",
      isPublished: true,
      categoryFilter: "Arithmetic",
      subtypeFilter: "multiple_answer",
      topicFilter: "Factors / Divisors",
      relatedTopicId: 13,
      relatedTopicType: "quant",
      showInTopic: true
    },
    {
      type: "quantitative",
      title: "Geometry Essentials",
      description: "Practice problems related to triangles and other polygons",
      difficulty: 2,
      questionIds: [7],
      timeLimit: 600, // 10 minutes
      tags: "geometry,triangles,polygons",
      isPublished: true,
      categoryFilter: "Geometry",
      subtypeFilter: "multiple_choice",
      topicFilter: "Triangles and Polygons",
      relatedTopicId: 75,
      relatedTopicType: "quant",
      showInTopic: true
    },
  ];

  // Verbal practice sets
  const verbalPracticeSets: InsertPracticeSet[] = [
    {
      type: "verbal",
      title: "Text Completion - Single Blank",
      description: "Practice filling in single blanks in sentences",
      difficulty: 3,
      questionIds: [4, 12],
      timeLimit: 600, // 10 minutes
      tags: "verbal,text completion,vocabulary",
      isPublished: true,
      categoryFilter: "text_completion",
      subtypeFilter: "text_completion",
      topicFilter: "Single Blank Text Completion",
      relatedTopicId: 4,
      relatedTopicType: "verbal",
      showInTopic: true
    },
    {
      type: "verbal",
      title: "Reading Comprehension - Critical Reading",
      description: "Practice analyzing and interpreting complex passages",
      difficulty: 4,
      questionIds: [5],
      timeLimit: 900, // 15 minutes
      tags: "verbal,reading comprehension,critical analysis",
      isPublished: true,
      categoryFilter: "reading_comprehension",
      subtypeFilter: "reading_comprehension",
      topicFilter: "Reading Comprehension - Social Sciences",
      relatedTopicId: 1,
      relatedTopicType: "verbal",
      showInTopic: true
    },
    {
      type: "verbal",
      title: "Sentence Equivalence Practice",
      description: "Practice finding pairs of words that create equivalent sentences",
      difficulty: 2,
      questionIds: [14],
      timeLimit: 600, // 10 minutes
      tags: "verbal,sentence equivalence,vocabulary",
      isPublished: true,
      categoryFilter: "sentence_equivalence",
      subtypeFilter: "sentence_equivalence",
      topicFilter: "Basic Sentence Equivalence",
      relatedTopicId: 6,
      relatedTopicType: "verbal",
      showInTopic: true
    }
  ];

  // Combine all practice sets
  const allPracticeSets = [...quantPracticeSets, ...verbalPracticeSets];

  for (const set of allPracticeSets) {
    try {
      // Check if a similar practice set already exists to avoid duplicates
      const existing = await db.select()
        .from(practiceSets)
        .where(eq(practiceSets.title, set.title))
        .limit(1);

      if (existing.length === 0) {
        const result = await db.insert(practiceSets).values(set).returning();
        console.log(`Created practice set: ${result[0].title} (ID: ${result[0].id})`);
      } else {
        console.log(`Practice set "${set.title}" already exists (ID: ${existing[0].id}), skipping...`);
      }
    } catch (error) {
      console.error(`Error creating practice set "${set.title}":`, error);
    }
  }

  console.log("Finished creating practice sets");
}

// Export the function to be used in routes
export { createNewPracticeSets };

// If this script is run directly, execute the function
// Use import.meta.url for ES modules instead of require.main
if (import.meta.url.endsWith('/create-practice-sets.ts')) {
  createNewPracticeSets().catch(console.error);
}