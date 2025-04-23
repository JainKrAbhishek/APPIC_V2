import { z } from "zod";
import { db } from "../db";
import { eq, and, asc, desc, sql } from "drizzle-orm";

// Import storage implementations
import { UserStorageMixin } from "./user-storage";
import { VocabularyStorageMixin } from "./vocabulary-storage";
import { PracticeStorageMixin } from "./practice-storage";
import { QuantStorageMixin } from "./quant-storage";
import { VerbalStorageMixin } from "./verbal-storage";
import { SubscriptionStorageMixin } from "./subscription-storage";
import { BlogStorageMixin } from "./blog-storage";

// Import types
import {
  User,
  InsertUser,
  Word,
  InsertWord,
  WordProgress,
  InsertWordProgress,
  Question,
  InsertQuestion,
  insertBookmarkedQuestionSchema,
  PracticeSet,
  InsertPracticeSet,
  PracticeResult,
  InsertPracticeResult,
  Activity,
  InsertActivity,
  ApiKey,
  InsertApiKey,
  QuantTopic,
  InsertQuantTopic,
  QuantContent,
  InsertQuantContent,
  QuantProgress,
  InsertQuantProgress,
  VerbalTopic,
  InsertVerbalTopic,
  VerbalContent,
  InsertVerbalContent,
  VerbalProgress,
  InsertVerbalProgress,
  ContentAccessControl,
  InsertContentAccessControl,
  UserToken,
  InsertUserToken,
  SubscriptionPlan,
  InsertSubscriptionPlan,
  BlogPost,
  InsertBlogPost,
  BlogCategory,
  InsertBlogCategory,
  BlogComment,
  InsertBlogComment
} from "@shared/schema";

// Storage interface with CRUD methods
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  updateUserPassword(id: number, newPassword: string): Promise<boolean>;
  verifyUserEmail(id: number): Promise<boolean>;
  getUsersByType(userType: string): Promise<User[]>;
  updateUserSubscription(
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
  ): Promise<User | undefined>;

  // User Tokens methods for email verification and password reset
  createUserToken(tokenData: InsertUserToken): Promise<UserToken>;
  getUserTokenByToken(token: string): Promise<UserToken | undefined>;
  getUserTokensByUser(userId: number, tokenType: string): Promise<UserToken[]>;
  markTokenAsUsed(id: number): Promise<boolean>;
  deleteExpiredTokens(): Promise<number>;

  // Subscription Plan methods
  getSubscriptionPlan(id: number): Promise<SubscriptionPlan | undefined>;
  getSubscriptionPlanByStripePriceId(stripePriceId: string): Promise<SubscriptionPlan | undefined>;
  getActiveSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  createSubscriptionPlan(planData: InsertSubscriptionPlan): Promise<SubscriptionPlan>;
  updateSubscriptionPlan(id: number, planData: Partial<SubscriptionPlan>): Promise<SubscriptionPlan | undefined>;
  deactivateSubscriptionPlan(id: number): Promise<boolean>;

  // API Key Management methods
  getApiKey(id: number): Promise<ApiKey | undefined>;
  getApiKeyByType(keyType: string): Promise<ApiKey | undefined>;
  getAllApiKeys(): Promise<ApiKey[]>;
  createApiKey(apiKeyData: InsertApiKey): Promise<ApiKey>;
  updateApiKey(id: number, apiKeyData: Partial<ApiKey>): Promise<ApiKey | undefined>;
  deleteApiKey(id: number): Promise<boolean>;
  markApiKeyAsUsed(id: number): Promise<boolean>;

  // Content Access Control methods
  getContentAccess(contentType: string, contentId: number, userType: string): Promise<boolean>;
  setContentAccess(accessData: InsertContentAccessControl): Promise<ContentAccessControl>;
  updateContentAccess(id: number, isAccessible: boolean): Promise<ContentAccessControl | undefined>;
  getContentAccessByType(contentType: string, userType: string): Promise<ContentAccessControl[]>;
  deleteContentAccess(id: number): Promise<boolean>;

  // Word methods
  getWord(id: number): Promise<Word | undefined>;
  getWordsByDay(day: number): Promise<Word[]>;
  createWord(word: InsertWord): Promise<Word>;
  updateWord(id: number, wordData: Partial<Word>): Promise<Word | undefined>;
  deleteWord(id: number): Promise<boolean>;
  getAllWords(): Promise<Word[]>;
  getDistinctVocabularyDays(): Promise<number[]>;

  // Word Progress methods
  getWordProgress(
    userId: number,
    wordId: number,
  ): Promise<WordProgress | undefined>;
  createWordProgress(wordProgress: InsertWordProgress): Promise<WordProgress>;
  updateWordProgress(
    id: number,
    progressData: Partial<WordProgress>,
  ): Promise<WordProgress | undefined>;
  getWordProgressByUser(userId: number): Promise<WordProgress[]>;
  getBookmarkedWords(userId: number): Promise<Word[]>;

  // Question methods
  getQuestion(id: number): Promise<Question | undefined>;
  getQuestionsByType(type: string): Promise<Question[]>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  updateQuestion(
    id: number,
    questionData: Partial<Question>,
  ): Promise<Question | undefined>;
  deleteQuestion(id: number): Promise<boolean>;
  getAllQuestions(): Promise<Question[]>;

  // Practice Set methods
  getPracticeSet(id: number): Promise<PracticeSet | undefined>;
  getPracticeSetsByType(type: string): Promise<PracticeSet[]>;
  createPracticeSet(practiceSet: InsertPracticeSet): Promise<PracticeSet>;
  updatePracticeSet(
    id: number,
    setData: Partial<PracticeSet>,
  ): Promise<PracticeSet | undefined>;
  deletePracticeSet(id: number): Promise<boolean>;
  getAllPracticeSets(): Promise<PracticeSet[]>;

  // Practice Result methods
  getPracticeResult(id: number): Promise<PracticeResult | undefined>;
  getPracticeResultsByUser(userId: number): Promise<PracticeResult[]>;
  createPracticeResult(result: InsertPracticeResult): Promise<PracticeResult>;

  // Bookmarked Questions methods
  getBookmarkedQuestion(
    userId: number,
    questionId: number
  ): Promise<any | undefined>;
  getBookmarkedQuestionsByUser(userId: number): Promise<Question[]>;
  createBookmarkedQuestion(bookmark: z.infer<typeof insertBookmarkedQuestionSchema>): Promise<any>;
  deleteBookmarkedQuestion(userId: number, questionId: number): Promise<boolean>;

  // Activity methods
  getActivitiesByUser(userId: number, limit?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;

  // Quantitative Topic methods
  getQuantTopic(id: number): Promise<QuantTopic | undefined>;
  getQuantTopicsByGroup(groupNumber: number): Promise<QuantTopic[]>;
  getQuantTopicsByCategory(category: string): Promise<QuantTopic[]>;
  createQuantTopic(topic: InsertQuantTopic): Promise<QuantTopic>;
  updateQuantTopic(
    id: number,
    topicData: Partial<QuantTopic>,
  ): Promise<QuantTopic | undefined>;
  deleteQuantTopic(id: number): Promise<boolean>;
  getAllQuantTopics(): Promise<QuantTopic[]>;
  getDistinctQuantGroups(): Promise<number[]>;
  getDistinctQuantCategories(): Promise<string[]>;

  // Quantitative Content methods
  getQuantContent(id: number): Promise<QuantContent | undefined>;
  getQuantContentByTopic(topicId: number): Promise<QuantContent[]>;
  createQuantContent(content: InsertQuantContent): Promise<QuantContent>;
  updateQuantContent(
    id: number,
    contentData: Partial<QuantContent>,
  ): Promise<QuantContent | undefined>;
  deleteQuantContent(id: number): Promise<boolean>;
  getAllQuantContent(): Promise<QuantContent[]>;

  // Quantitative Progress methods
  getQuantProgress(
    userId: number,
    topicId: number,
  ): Promise<QuantProgress | undefined>;
  createQuantProgress(progress: InsertQuantProgress): Promise<QuantProgress>;
  updateQuantProgress(
    id: number,
    progressData: Partial<QuantProgress>,
  ): Promise<QuantProgress | undefined>;
  getQuantProgressByUser(userId: number): Promise<QuantProgress[]>;
  getCompletedQuantTopics(userId: number): Promise<QuantTopic[]>;

  // Verbal Topic methods
  getVerbalTopic(id: number): Promise<VerbalTopic | undefined>;
  getVerbalTopicsByType(type: string): Promise<VerbalTopic[]>;
  createVerbalTopic(topic: InsertVerbalTopic): Promise<VerbalTopic>;
  updateVerbalTopic(id: number, topicData: Partial<VerbalTopic>): Promise<VerbalTopic | undefined>;
  deleteVerbalTopic(id: number): Promise<boolean>;
  getAllVerbalTopics(): Promise<VerbalTopic[]>;
  getDistinctVerbalTypes(): Promise<string[]>;

  // Verbal Content methods
  getVerbalContent(id: number): Promise<VerbalContent | undefined>;
  getVerbalContentByTopic(topicId: number): Promise<VerbalContent[]>;
  createVerbalContent(content: InsertVerbalContent): Promise<VerbalContent>;
  updateVerbalContent(id: number, contentData: Partial<VerbalContent>): Promise<VerbalContent | undefined>;
  deleteVerbalContent(id: number): Promise<boolean>;
  getAllVerbalContent(): Promise<VerbalContent[]>;

  // Verbal Progress methods
  getVerbalProgress(userId: number, topicId: number): Promise<VerbalProgress | undefined>;
  createVerbalProgress(progress: InsertVerbalProgress): Promise<VerbalProgress>;
  updateVerbalProgress(id: number, progressData: Partial<VerbalProgress>): Promise<VerbalProgress | undefined>;
  getVerbalProgressByUser(userId: number): Promise<VerbalProgress[]>;
  getCompletedVerbalTopics(userId: number): Promise<VerbalTopic[]>;

  // Blog Category methods
  getAllCategories(): Promise<BlogCategory[]>;
  getCategoryById(id: number): Promise<BlogCategory | null>;
  getCategoryBySlug(slug: string): Promise<BlogCategory | null>;
  createCategory(data: InsertBlogCategory): Promise<BlogCategory>;
  updateCategory(id: number, data: Partial<InsertBlogCategory>): Promise<BlogCategory | null>;
  deleteCategory(id: number): Promise<boolean>;
  
  // Blog Post methods
  getAllPosts(limit?: number, offset?: number, includeAuthor?: boolean): Promise<BlogPost[]>;
  getPublishedPosts(limit?: number, offset?: number, includeAuthor?: boolean): Promise<BlogPost[]>;
  getPostsByCategory(categoryId: number, limit?: number, offset?: number): Promise<BlogPost[]>;
  getPostsByAuthor(authorId: number, limit?: number, offset?: number): Promise<BlogPost[]>;
  getPostsByTag(tag: string, limit?: number, offset?: number): Promise<BlogPost[]>;
  getPostById(id: number, includeAuthor?: boolean): Promise<BlogPost | null>;
  getPostBySlug(slug: string, includeAuthor?: boolean): Promise<BlogPost | null>;
  createPost(data: InsertBlogPost): Promise<BlogPost>;
  updatePost(id: number, data: Partial<InsertBlogPost>): Promise<BlogPost | null>;
  deletePost(id: number): Promise<boolean>;
  searchPosts(query: string, limit?: number, offset?: number): Promise<BlogPost[]>;
  
  // Blog Comment methods
  getCommentsByPostId(postId: number): Promise<BlogComment[]>;
  getCommentById(id: number): Promise<BlogComment | null>;
  createComment(data: InsertBlogComment): Promise<BlogComment>;
  updateComment(id: number, data: Partial<InsertBlogComment>): Promise<BlogComment | null>;
  deleteComment(id: number): Promise<boolean>;
  approveComment(id: number): Promise<boolean>;
  getCommentCount(postId: number): Promise<number>;
}

// Base Storage Class that will be extended with mixins
export class BaseStorage {
  constructor() {
    console.log("Initializing base storage...");
  }
}

// Create the full DatabaseStorage class by applying mixins to the base class
export const DatabaseStorage = [
  UserStorageMixin,
  VocabularyStorageMixin,
  PracticeStorageMixin,
  QuantStorageMixin,
  VerbalStorageMixin,
  SubscriptionStorageMixin,
  BlogStorageMixin
].reduce((Base, Mixin) => Mixin(Base), BaseStorage as any) as {
  new (): IStorage;
};

// Create and export a singleton instance of the storage
export const storage = new DatabaseStorage();