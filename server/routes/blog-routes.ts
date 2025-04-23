import express, { Request, Response } from 'express';
import { z } from 'zod';
import slugify from 'slugify';
import { isAuthenticated, isAdmin } from '../middleware/auth';
import { storage } from '../storage';
import { insertBlogPostSchema, insertBlogCategorySchema, insertBlogCommentSchema } from '@shared/schema';

const router = express.Router();

// Public blog routes
/**
 * Get all published blog posts with pagination
 * GET /api/blog/posts
 */
router.get('/api/blog/posts', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    const includeAuthor = req.query.includeAuthor === 'true';
    
    const posts = await storage.getPublishedPosts(limit, offset, includeAuthor);
    
    return res.status(200).json({
      success: true,
      posts,
      meta: {
        limit,
        offset,
        total: posts.length // In a real app, would get total count from DB
      }
    });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch blog posts'
    });
  }
});

/**
 * Get a single blog post by slug
 * GET /api/blog/posts/:slug
 */
router.get('/api/blog/posts/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const includeAuthor = req.query.includeAuthor === 'true';
    
    const post = await storage.getPostBySlug(slug, includeAuthor);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }
    
    // Only return published posts to public users
    if (post.status !== 'published' && (!req.user || !req.user.isAdmin)) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      post
    });
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch blog post'
    });
  }
});

/**
 * Get all blog posts by category
 * GET /api/blog/categories/:slug/posts
 */
router.get('/api/blog/categories/:slug/posts', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    
    // First, get the category by slug
    const category = await storage.getCategoryBySlug(slug);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    // Then get posts by category ID
    const posts = await storage.getPostsByCategory(category.id, limit, offset);
    
    return res.status(200).json({
      success: true,
      category,
      posts,
      meta: {
        limit,
        offset,
        total: posts.length // In a real app, would get total count from DB
      }
    });
  } catch (error) {
    console.error('Error fetching posts by category:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch posts by category'
    });
  }
});

/**
 * Get all blog categories
 * GET /api/blog/categories
 */
router.get('/api/blog/categories', async (req: Request, res: Response) => {
  try {
    const categories = await storage.getAllCategories();
    
    return res.status(200).json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Error fetching blog categories:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch blog categories'
    });
  }
});

/**
 * Search blog posts
 * GET /api/blog/search
 */
router.get('/api/blog/search', async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    const posts = await storage.searchPosts(query, limit, offset);
    
    return res.status(200).json({
      success: true,
      query,
      posts,
      meta: {
        limit,
        offset,
        total: posts.length // In a real app, would get total count from DB
      }
    });
  } catch (error) {
    console.error('Error searching blog posts:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to search blog posts'
    });
  }
});

/**
 * Get blog post comments
 * GET /api/blog/posts/:postId/comments
 */
router.get('/api/blog/posts/:postId/comments', async (req: Request, res: Response) => {
  try {
    const postId = parseInt(req.params.postId);
    
    if (isNaN(postId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid post ID'
      });
    }
    
    const comments = await storage.getCommentsByPostId(postId);
    
    return res.status(200).json({
      success: true,
      comments
    });
  } catch (error) {
    console.error('Error fetching blog comments:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch blog comments'
    });
  }
});

/**
 * Submit a blog post comment
 * POST /api/blog/posts/:postId/comments
 */
router.post('/api/blog/posts/:postId/comments', async (req: Request, res: Response) => {
  try {
    const postId = parseInt(req.params.postId);
    
    if (isNaN(postId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid post ID'
      });
    }
    
    // Validate post exists
    const post = await storage.getPostById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }
    
    const { content, name, email, parentId } = req.body;
    
    // Use zod to validate
    try {
      insertBlogCommentSchema.parse({
        postId,
        content,
        userId: req.user?.id,
        name: req.user ? undefined : name,
        email: req.user ? undefined : email,
        parentId: parentId ? parseInt(parentId) : undefined,
        status: req.user?.isAdmin ? 'approved' : 'pending'
      });
    } catch (validationError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid comment data',
        errors: validationError
      });
    }
    
    // Create the comment
    const newComment = await storage.createComment({
      postId,
      content,
      userId: req.user?.id,
      name: req.user ? undefined : name,
      email: req.user ? undefined : email,
      parentId: parentId ? parseInt(parentId) : undefined,
      status: req.user?.isAdmin ? 'approved' : 'pending'
    });
    
    return res.status(201).json({
      success: true,
      message: req.user?.isAdmin 
        ? 'Comment posted successfully' 
        : 'Comment submitted successfully and awaiting moderation',
      comment: newComment
    });
  } catch (error) {
    console.error('Error creating blog comment:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create blog comment'
    });
  }
});

// Admin blog management routes
/**
 * Get all blog posts (including drafts) for admin
 * GET /api/admin/blog/posts
 */
router.get('/api/admin/blog/posts', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    const includeAuthor = req.query.includeAuthor === 'true';
    
    const posts = await storage.getAllPosts(limit, offset, includeAuthor);
    
    return res.status(200).json({
      success: true,
      posts,
      meta: {
        limit,
        offset,
        total: posts.length // In a real app, would get total count from DB
      }
    });
  } catch (error) {
    console.error('Error fetching admin blog posts:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch blog posts'
    });
  }
});

/**
 * Create a new blog post
 * POST /api/admin/blog/posts
 */
router.post('/api/admin/blog/posts', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const {
      title,
      excerpt,
      content,
      featuredImage,
      categoryId,
      status,
      metaTitle,
      metaDescription,
      tags,
      publishedAt
    } = req.body;
    
    // Generate slug from title
    const slug = slugify(title, { lower: true, strict: true });
    
    // Check if slug already exists
    const existingPost = await storage.getPostBySlug(slug);
    if (existingPost) {
      return res.status(400).json({
        success: false,
        message: 'A post with this title already exists. Please choose a different title.'
      });
    }
    
    // Validate with zod schema
    try {
      insertBlogPostSchema.parse({
        title,
        slug,
        excerpt,
        content,
        featuredImage,
        authorId: req.user.id,
        categoryId: categoryId ? parseInt(categoryId) : undefined,
        status: status || 'draft',
        publishedAt: publishedAt ? new Date(publishedAt) : status === 'published' ? new Date() : undefined,
        metaTitle,
        metaDescription,
        tags: tags || [],
        readTime: Math.ceil(content.length / 1000) // Rough estimate: 1000 chars ~= 1 min read
      });
    } catch (validationError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid blog post data',
        errors: validationError
      });
    }
    
    // Create the blog post
    const newPost = await storage.createPost({
      title,
      slug,
      excerpt,
      content,
      featuredImage,
      authorId: req.user.id,
      categoryId: categoryId ? parseInt(categoryId) : undefined,
      status: status || 'draft',
      publishedAt: publishedAt ? new Date(publishedAt) : status === 'published' ? new Date() : undefined,
      metaTitle,
      metaDescription,
      tags: tags || [],
      readTime: Math.ceil(content.length / 1000) // Rough estimate: 1000 chars ~= 1 min read
    });
    
    return res.status(201).json({
      success: true,
      message: 'Blog post created successfully',
      post: newPost
    });
  } catch (error) {
    console.error('Error creating blog post:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create blog post'
    });
  }
});

/**
 * Update a blog post
 * PUT /api/admin/blog/posts/:id
 */
router.put('/api/admin/blog/posts/:id', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const postId = parseInt(req.params.id);
    
    if (isNaN(postId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid post ID'
      });
    }
    
    // Check if post exists
    const existingPost = await storage.getPostById(postId);
    if (!existingPost) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }
    
    const {
      title,
      excerpt,
      content,
      featuredImage,
      categoryId,
      status,
      metaTitle,
      metaDescription,
      tags,
      publishedAt
    } = req.body;
    
    // If title changed, generate new slug
    let slug = existingPost.slug;
    if (title && title !== existingPost.title) {
      slug = slugify(title, { lower: true, strict: true });
      
      // Check if new slug already exists (excluding current post)
      const slugExists = await storage.getPostBySlug(slug);
      if (slugExists && slugExists.id !== postId) {
        return res.status(400).json({
          success: false,
          message: 'A post with this title already exists. Please choose a different title.'
        });
      }
    }
    
    // Prepare update data
    const updateData: any = {};
    if (title) updateData.title = title;
    if (slug) updateData.slug = slug;
    if (excerpt) updateData.excerpt = excerpt;
    if (content) {
      updateData.content = content;
      updateData.readTime = Math.ceil(content.length / 1000);
    }
    if (featuredImage) updateData.featuredImage = featuredImage;
    if (categoryId) updateData.categoryId = parseInt(categoryId);
    if (status) updateData.status = status;
    if (status === 'published' && existingPost.status !== 'published') {
      updateData.publishedAt = new Date();
    } else if (publishedAt) {
      updateData.publishedAt = new Date(publishedAt);
    }
    if (metaTitle) updateData.metaTitle = metaTitle;
    if (metaDescription) updateData.metaDescription = metaDescription;
    if (tags) updateData.tags = tags;
    
    // Update the blog post
    const updatedPost = await storage.updatePost(postId, updateData);
    
    return res.status(200).json({
      success: true,
      message: 'Blog post updated successfully',
      post: updatedPost
    });
  } catch (error) {
    console.error('Error updating blog post:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update blog post'
    });
  }
});

/**
 * Delete a blog post
 * DELETE /api/admin/blog/posts/:id
 */
router.delete('/api/admin/blog/posts/:id', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const postId = parseInt(req.params.id);
    
    if (isNaN(postId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid post ID'
      });
    }
    
    // Check if post exists
    const existingPost = await storage.getPostById(postId);
    if (!existingPost) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }
    
    // Delete the blog post
    await storage.deletePost(postId);
    
    return res.status(200).json({
      success: true,
      message: 'Blog post deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete blog post'
    });
  }
});

/**
 * Create a new blog category
 * POST /api/admin/blog/categories
 */
router.post('/api/admin/blog/categories', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    
    // Generate slug from name
    const slug = slugify(name, { lower: true, strict: true });
    
    // Check if slug already exists
    const existingCategory = await storage.getCategoryBySlug(slug);
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'A category with this name already exists'
      });
    }
    
    // Validate with zod schema
    try {
      insertBlogCategorySchema.parse({
        name,
        slug,
        description
      });
    } catch (validationError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid blog category data',
        errors: validationError
      });
    }
    
    // Create the blog category
    const newCategory = await storage.createCategory({
      name,
      slug,
      description
    });
    
    return res.status(201).json({
      success: true,
      message: 'Blog category created successfully',
      category: newCategory
    });
  } catch (error) {
    console.error('Error creating blog category:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create blog category'
    });
  }
});

/**
 * Update a blog category
 * PUT /api/admin/blog/categories/:id
 */
router.put('/api/admin/blog/categories/:id', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const categoryId = parseInt(req.params.id);
    
    if (isNaN(categoryId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID'
      });
    }
    
    // Check if category exists
    const existingCategory = await storage.getCategoryById(categoryId);
    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: 'Blog category not found'
      });
    }
    
    const { name, description } = req.body;
    
    // If name changed, generate new slug
    let slug = existingCategory.slug;
    if (name && name !== existingCategory.name) {
      slug = slugify(name, { lower: true, strict: true });
      
      // Check if new slug already exists (excluding current category)
      const slugExists = await storage.getCategoryBySlug(slug);
      if (slugExists && slugExists.id !== categoryId) {
        return res.status(400).json({
          success: false,
          message: 'A category with this name already exists'
        });
      }
    }
    
    // Prepare update data
    const updateData: any = {};
    if (name) updateData.name = name;
    if (slug) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;
    
    // Update the blog category
    const updatedCategory = await storage.updateCategory(categoryId, updateData);
    
    return res.status(200).json({
      success: true,
      message: 'Blog category updated successfully',
      category: updatedCategory
    });
  } catch (error) {
    console.error('Error updating blog category:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update blog category'
    });
  }
});

/**
 * Delete a blog category
 * DELETE /api/admin/blog/categories/:id
 */
router.delete('/api/admin/blog/categories/:id', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const categoryId = parseInt(req.params.id);
    
    if (isNaN(categoryId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID'
      });
    }
    
    // Check if category exists
    const existingCategory = await storage.getCategoryById(categoryId);
    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: 'Blog category not found'
      });
    }
    
    // Delete the blog category
    await storage.deleteCategory(categoryId);
    
    return res.status(200).json({
      success: true,
      message: 'Blog category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting blog category:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete blog category'
    });
  }
});

/**
 * Approve a blog comment
 * POST /api/admin/blog/comments/:id/approve
 */
router.post('/api/admin/blog/comments/:id/approve', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const commentId = parseInt(req.params.id);
    
    if (isNaN(commentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid comment ID'
      });
    }
    
    // Check if comment exists
    const existingComment = await storage.getCommentById(commentId);
    if (!existingComment) {
      return res.status(404).json({
        success: false,
        message: 'Blog comment not found'
      });
    }
    
    // Approve the comment
    await storage.approveComment(commentId);
    
    return res.status(200).json({
      success: true,
      message: 'Comment approved successfully'
    });
  } catch (error) {
    console.error('Error approving blog comment:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to approve blog comment'
    });
  }
});

/**
 * Delete a blog comment
 * DELETE /api/admin/blog/comments/:id
 */
router.delete('/api/admin/blog/comments/:id', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const commentId = parseInt(req.params.id);
    
    if (isNaN(commentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid comment ID'
      });
    }
    
    // Check if comment exists
    const existingComment = await storage.getCommentById(commentId);
    if (!existingComment) {
      return res.status(404).json({
        success: false,
        message: 'Blog comment not found'
      });
    }
    
    // Delete the comment
    await storage.deleteComment(commentId);
    
    return res.status(200).json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting blog comment:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete blog comment'
    });
  }
});

export default router;