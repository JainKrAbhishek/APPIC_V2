import React, { useState, useEffect } from 'react';
import { useRoute, Link } from 'wouter';
import { 
  Calendar, 
  Clock, 
  User, 
  Tag, 
  ChevronLeft, 
  MessageSquare,
  Share,
  ArrowLeft
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

type BlogPost = {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  categoryId: number;
  featuredImage: string | null;
  publishedAt: string;
  readTime: number;
  authorId: number;
  author?: {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
  };
  category?: {
    id: number;
    name: string;
    slug: string;
  };
};

type BlogComment = {
  id: number;
  postId: number;
  userId: number | null;
  name: string | null;
  email: string | null;
  content: string;
  status: string;
  parentId: number | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    username: string;
    firstName: string | null;
    lastName: string | null;
  };
};

type BlogCategory = {
  id: number;
  name: string;
  slug: string;
  description: string;
};

const BlogPage: React.FC = () => {
  const [, params] = useRoute<{ slug: string }>('/blog/:slug');
  const slug = params?.slug;
  
  const [post, setPost] = useState<BlogPost | null>(null);
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchBlogPost = async () => {
      if (!slug) return;
      
      try {
        setLoading(true);
        
        // Fetch the blog post
        const postResponse = await apiRequest<{success: boolean, post: BlogPost}>(`/api/blog/posts/${slug}`);
        
        if (postResponse.success && postResponse.post) {
          setPost(postResponse.post);
          
          // Fetch related posts by category
          if (postResponse.post.category && postResponse.post.category.slug) {
            const categoryResponse = await apiRequest<{success: boolean, posts: BlogPost[]}>(
              `/api/blog/categories/${postResponse.post.category.slug}/posts`, 
              { 
                params: { limit: 3 } 
              }
            );
            
            if (categoryResponse.success) {
              // Filter out the current post from related posts
              setRelatedPosts(categoryResponse.posts.filter(p => p.id !== postResponse.post.id).slice(0, 3));
            }
          }
          
          // Fetch comments for this post
          const commentsResponse = await apiRequest<{success: boolean, comments: BlogComment[]}>(
            `/api/blog/posts/${postResponse.post.id}/comments`
          );
          
          if (commentsResponse.success) {
            setComments(commentsResponse.comments);
          }
        } else {
          setError('Blog post not found');
        }
        
        // Fetch categories (for sidebar)
        const categoriesResponse = await apiRequest<{success: boolean, categories: BlogCategory[]}>('/api/blog/categories');
        
        if (categoriesResponse.success) {
          setCategories(categoriesResponse.categories);
        }
        
      } catch (err) {
        console.error('Error fetching blog post:', err);
        setError('Failed to load blog post');
      } finally {
        setLoading(false);
      }
    };

    fetchBlogPost();
  }, [slug]);

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Get initials for avatar fallback
  const getInitials = (firstName?: string | null, lastName?: string | null): string => {
    if (!firstName && !lastName) return 'U';
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`;
  };

  // Handle comment submission
  const handleSubmitComment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!post?.id || !commentText.trim()) {
      return;
    }
    
    try {
      setCommentLoading(true);
      
      const response = await apiRequest<{success: boolean, message: string, comment: BlogComment}>(
        `/api/blog/posts/${post.id}/comments`,
        { 
          method: 'POST', 
          data: { content: commentText } 
        }
      );
      
      if (response.success) {
        setComments(prev => [...prev, response.comment]);
        setCommentText('');
        toast({
          title: 'Comment Posted',
          description: 'Your comment has been submitted successfully.',
        });
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to post comment.',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Error posting comment:', err);
      toast({
        title: 'Error',
        description: 'Failed to post your comment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setCommentLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-10 w-2/3 mb-4" />
          <div className="flex items-center gap-3 mb-8">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-24" />
          </div>
          
          <Skeleton className="h-64 w-full mb-8" />
          
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !post) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Blog Post Not Found</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8">{error || 'The blog post you are looking for does not exist.'}</p>
          <Link href="/blog">
            <Button className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Blog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Back Link */}
        <Link href="/blog">
          <Button variant="ghost" className="mb-6 text-gray-600 dark:text-gray-300 hover:text-primary">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Blog
          </Button>
        </Link>
        
        {/* Post Header */}
        {post.category && (
          <div className="mb-4">
            <Link href={`/blog/category/${post.category.slug}`}>
              <span className="inline-block px-3 py-1 bg-emerald-100/80 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-medium rounded-full">
                {post.category.name}
              </span>
            </Link>
          </div>
        )}
        
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
          {post.title}
        </h1>
        
        <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 dark:text-gray-400 mb-8">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(post.publishedAt)}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>{post.readTime} min read</span>
          </div>
          
          {post.author && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{post.author.firstName} {post.author.lastName}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span>{comments.length} comments</span>
          </div>
        </div>
        
        {/* Featured Image */}
        {post.featuredImage && (
          <div className="mb-8 rounded-lg overflow-hidden">
            <img 
              src={post.featuredImage} 
              alt={post.title} 
              className="w-full h-auto"
            />
          </div>
        )}
        
        {/* Post Content */}
        <div className="prose prose-lg max-w-none dark:prose-invert mb-12 text-gray-700 dark:text-gray-200">
          <div dangerouslySetInnerHTML={{ __html: post.content }} />
        </div>
        
        {/* Share & Tags */}
        <div className="flex flex-wrap justify-between items-center py-6 border-t border-b border-gray-200 dark:border-gray-700 mb-12">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <Share className="h-4 w-4" />
            <span className="font-medium text-sm">Share this article:</span>
            <div className="flex gap-2">
              <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951z"/>
                </svg>
              </button>
              <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M5.026 15c6.038 0 9.341-5.003 9.341-9.334 0-.14 0-.282-.006-.422A6.685 6.685 0 0 0 16 3.542a6.658 6.658 0 0 1-1.889.518 3.301 3.301 0 0 0 1.447-1.817 6.533 6.533 0 0 1-2.087.793A3.286 3.286 0 0 0 7.875 6.03a9.325 9.325 0 0 1-6.767-3.429 3.289 3.289 0 0 0 1.018 4.382A3.323 3.323 0 0 1 .64 6.575v.045a3.288 3.288 0 0 0 2.632 3.218 3.203 3.203 0 0 1-.865.115 3.23 3.23 0 0 1-.614-.057 3.283 3.283 0 0 0 3.067 2.277A6.588 6.588 0 0 1 .78 13.58a6.32 6.32 0 0 1-.78-.045A9.344 9.344 0 0 0 5.026 15z"/>
                </svg>
              </button>
              <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854V1.146zm4.943 12.248V6.169H2.542v7.225h2.401zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248-.822 0-1.359.54-1.359 1.248 0 .694.521 1.248 1.327 1.248h.016zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016a5.54 5.54 0 0 1 .016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225h2.4z"/>
                </svg>
              </button>
            </div>
          </div>
          
          {post.category && (
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mt-4 md:mt-0">
              <Tag className="h-4 w-4" />
              <Link href={`/blog/category/${post.category.slug}`}>
                <span className="text-sm hover:text-primary transition-colors cursor-pointer">
                  {post.category.name}
                </span>
              </Link>
            </div>
          )}
        </div>
        
        {/* Comments Section */}
        <div className="mb-12">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Comments ({comments.length})
          </h3>
          
          {comments.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              No comments yet. Be the first to share your thoughts!
            </p>
          ) : (
            <div className="space-y-6">
              {comments.map(comment => (
                <div 
                  key={comment.id} 
                  className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-100 dark:border-gray-700/50"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {comment.user 
                          ? getInitials(comment.user.firstName, comment.user.lastName)
                          : comment.name?.[0] || 'G'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex flex-wrap justify-between">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {comment.user 
                            ? `${comment.user.firstName || ''} ${comment.user.lastName || ''}`.trim() || comment.user.username
                            : comment.name || 'Anonymous'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(comment.createdAt)}
                        </div>
                      </div>
                      <div className="mt-2 text-gray-700 dark:text-gray-300">
                        {comment.content}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Comment Form */}
          <div className="mt-8">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Leave a Comment
            </h4>
            
            <form onSubmit={handleSubmitComment} className="space-y-4">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Share your thoughts..."
                className="w-full min-h-[120px] p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
              
              <Button 
                type="submit" 
                disabled={commentLoading || !commentText.trim()} 
                className="ml-auto"
              >
                {commentLoading ? 'Posting...' : 'Post Comment'}
              </Button>
            </form>
          </div>
        </div>
        
        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Related Articles
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map(relatedPost => (
                <Card key={relatedPost.id} className="bg-white dark:bg-gray-800/50 shadow-sm hover:shadow-md transition-shadow">
                  {relatedPost.featuredImage && (
                    <div className="h-36 overflow-hidden">
                      <img 
                        src={relatedPost.featuredImage} 
                        alt={relatedPost.title} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                      <Link href={`/blog/${relatedPost.slug}`}>
                        {relatedPost.title}
                      </Link>
                    </h4>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(relatedPost.publishedAt)}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{relatedPost.readTime} min</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogPage;