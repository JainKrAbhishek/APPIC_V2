import { eq, and, desc, asc, sql, like, or, isNull, inArray } from "drizzle-orm";
import { BlogPost, InsertBlogPost, blogPosts, blogCategories, BlogCategory, InsertBlogCategory, blogComments, BlogComment, InsertBlogComment, users } from "@shared/schema";
import { db } from "../db";

export interface BlogStorageInterface {
  // Category methods
  getAllCategories(): Promise<BlogCategory[]>;
  getCategoryById(id: number): Promise<BlogCategory | null>;
  getCategoryBySlug(slug: string): Promise<BlogCategory | null>;
  createCategory(data: InsertBlogCategory): Promise<BlogCategory>;
  updateCategory(id: number, data: Partial<InsertBlogCategory>): Promise<BlogCategory | null>;
  deleteCategory(id: number): Promise<boolean>;
  
  // Blog post methods
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
  
  // Comment methods
  getCommentsByPostId(postId: number): Promise<BlogComment[]>;
  getCommentById(id: number): Promise<BlogComment | null>;
  createComment(data: InsertBlogComment): Promise<BlogComment>;
  updateComment(id: number, data: Partial<InsertBlogComment>): Promise<BlogComment | null>;
  deleteComment(id: number): Promise<boolean>;
  approveComment(id: number): Promise<boolean>;
  getCommentCount(postId: number): Promise<number>;
}

export const BlogStorageMixin = (Base: any) => {
  return class BlogStorage extends Base {
    // Category methods
    async getAllCategories(): Promise<BlogCategory[]> {
      return await db.select().from(blogCategories).orderBy(asc(blogCategories.name));
    }
    
    async getCategoryById(id: number): Promise<BlogCategory | null> {
      const results = await db.select().from(blogCategories).where(eq(blogCategories.id, id));
      return results.length > 0 ? results[0] : null;
    }
    
    async getCategoryBySlug(slug: string): Promise<BlogCategory | null> {
      const results = await db.select().from(blogCategories).where(eq(blogCategories.slug, slug));
      return results.length > 0 ? results[0] : null;
    }
    
    async createCategory(data: InsertBlogCategory): Promise<BlogCategory> {
      const results = await db.insert(blogCategories).values(data).returning();
      return results[0];
    }
    
    async updateCategory(id: number, data: Partial<InsertBlogCategory>): Promise<BlogCategory | null> {
      const results = await db.update(blogCategories)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(blogCategories.id, id))
        .returning();
      return results.length > 0 ? results[0] : null;
    }
    
    async deleteCategory(id: number): Promise<boolean> {
      const results = await db.delete(blogCategories).where(eq(blogCategories.id, id)).returning();
      return results.length > 0;
    }
    
    // Blog post methods
    async getAllPosts(limit = 10, offset = 0, includeAuthor = false): Promise<BlogPost[]> {
      if (includeAuthor) {
        const results = await db.select({
          post: blogPosts,
          author: users
        })
        .from(blogPosts)
        .leftJoin(users, eq(blogPosts.authorId, users.id))
        .limit(limit)
        .offset(offset)
        .orderBy(desc(blogPosts.createdAt));
        
        return results.map(r => ({
          ...r.post,
          author: r.author
        })) as BlogPost[];
      } else {
        return await db.select().from(blogPosts)
          .limit(limit)
          .offset(offset)
          .orderBy(desc(blogPosts.createdAt));
      }
    }
    
    async getPublishedPosts(limit = 10, offset = 0, includeAuthor = false): Promise<BlogPost[]> {
      if (includeAuthor) {
        const results = await db.select({
          post: blogPosts,
          author: users
        })
        .from(blogPosts)
        .leftJoin(users, eq(blogPosts.authorId, users.id))
        .where(and(
          eq(blogPosts.status, 'published'),
          sql`${blogPosts.publishedAt} <= NOW()`
        ))
        .limit(limit)
        .offset(offset)
        .orderBy(desc(blogPosts.publishedAt));
        
        return results.map(r => ({
          ...r.post,
          author: r.author
        })) as BlogPost[];
      } else {
        return await db.select().from(blogPosts)
          .where(and(
            eq(blogPosts.status, 'published'),
            sql`${blogPosts.publishedAt} <= NOW()`
          ))
          .limit(limit)
          .offset(offset)
          .orderBy(desc(blogPosts.publishedAt));
      }
    }
    
    async getPostsByCategory(categoryId: number, limit = 10, offset = 0): Promise<BlogPost[]> {
      return await db.select().from(blogPosts)
        .where(and(
          eq(blogPosts.categoryId, categoryId),
          eq(blogPosts.status, 'published'),
          sql`${blogPosts.publishedAt} <= NOW()`
        ))
        .limit(limit)
        .offset(offset)
        .orderBy(desc(blogPosts.publishedAt));
    }
    
    async getPostsByAuthor(authorId: number, limit = 10, offset = 0): Promise<BlogPost[]> {
      return await db.select().from(blogPosts)
        .where(eq(blogPosts.authorId, authorId))
        .limit(limit)
        .offset(offset)
        .orderBy(desc(blogPosts.createdAt));
    }
    
    async getPostsByTag(tag: string, limit = 10, offset = 0): Promise<BlogPost[]> {
      return await db.select().from(blogPosts)
        .where(and(
          sql`${tag} = ANY(${blogPosts.tags})`,
          eq(blogPosts.status, 'published'),
          sql`${blogPosts.publishedAt} <= NOW()`
        ))
        .limit(limit)
        .offset(offset)
        .orderBy(desc(blogPosts.publishedAt));
    }
    
    async getPostById(id: number, includeAuthor = false): Promise<BlogPost | null> {
      if (includeAuthor) {
        const results = await db.select({
          post: blogPosts,
          author: users
        })
        .from(blogPosts)
        .leftJoin(users, eq(blogPosts.authorId, users.id))
        .where(eq(blogPosts.id, id));
        
        if (results.length === 0) return null;
        
        return {
          ...results[0].post,
          author: results[0].author
        } as BlogPost;
      } else {
        const results = await db.select().from(blogPosts).where(eq(blogPosts.id, id));
        return results.length > 0 ? results[0] : null;
      }
    }
    
    async getPostBySlug(slug: string, includeAuthor = false): Promise<BlogPost | null> {
      if (includeAuthor) {
        const results = await db.select({
          post: blogPosts,
          author: users
        })
        .from(blogPosts)
        .leftJoin(users, eq(blogPosts.authorId, users.id))
        .where(eq(blogPosts.slug, slug));
        
        if (results.length === 0) return null;
        
        return {
          ...results[0].post,
          author: results[0].author
        } as BlogPost;
      } else {
        const results = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug));
        return results.length > 0 ? results[0] : null;
      }
    }
    
    async createPost(data: InsertBlogPost): Promise<BlogPost> {
      const results = await db.insert(blogPosts).values(data).returning();
      return results[0];
    }
    
    async updatePost(id: number, data: Partial<InsertBlogPost>): Promise<BlogPost | null> {
      const results = await db.update(blogPosts)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(blogPosts.id, id))
        .returning();
      return results.length > 0 ? results[0] : null;
    }
    
    async deletePost(id: number): Promise<boolean> {
      const results = await db.delete(blogPosts).where(eq(blogPosts.id, id)).returning();
      return results.length > 0;
    }
    
    async searchPosts(query: string, limit = 10, offset = 0): Promise<BlogPost[]> {
      const searchTerms = query.split(' ').filter(term => term.length > 0);
      
      if (searchTerms.length === 0) {
        return [];
      }
      
      const conditions = searchTerms.map(term => {
        const likeTerm = `%${term}%`;
        return or(
          like(blogPosts.title, likeTerm),
          like(blogPosts.excerpt, likeTerm),
          sql`${blogPosts.content}::text LIKE ${likeTerm}`
        );
      });
      
      return await db.select().from(blogPosts)
        .where(and(
          or(...conditions),
          eq(blogPosts.status, 'published'),
          sql`${blogPosts.publishedAt} <= NOW()`
        ))
        .limit(limit)
        .offset(offset)
        .orderBy(desc(blogPosts.publishedAt));
    }
    
    // Comment methods
    async getCommentsByPostId(postId: number): Promise<BlogComment[]> {
      return await db.select().from(blogComments)
        .where(and(
          eq(blogComments.postId, postId),
          eq(blogComments.status, 'approved'),
          isNull(blogComments.parentId)
        ))
        .orderBy(asc(blogComments.createdAt));
    }
    
    async getCommentById(id: number): Promise<BlogComment | null> {
      const results = await db.select().from(blogComments).where(eq(blogComments.id, id));
      return results.length > 0 ? results[0] : null;
    }
    
    async createComment(data: InsertBlogComment): Promise<BlogComment> {
      const results = await db.insert(blogComments).values(data).returning();
      return results[0];
    }
    
    async updateComment(id: number, data: Partial<InsertBlogComment>): Promise<BlogComment | null> {
      const results = await db.update(blogComments)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(blogComments.id, id))
        .returning();
      return results.length > 0 ? results[0] : null;
    }
    
    async deleteComment(id: number): Promise<boolean> {
      const results = await db.delete(blogComments).where(eq(blogComments.id, id)).returning();
      return results.length > 0;
    }
    
    async approveComment(id: number): Promise<boolean> {
      const results = await db.update(blogComments)
        .set({ status: 'approved', updatedAt: new Date() })
        .where(eq(blogComments.id, id))
        .returning();
      return results.length > 0;
    }
    
    async getCommentCount(postId: number): Promise<number> {
      const result = await db.select({ count: sql<number>`COUNT(*)` })
        .from(blogComments)
        .where(and(
          eq(blogComments.postId, postId),
          eq(blogComments.status, 'approved')
        ));
      return result[0].count;
    }
  };
};