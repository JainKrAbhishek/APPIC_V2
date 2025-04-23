import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { apiRequest } from '@/lib/queryClient';

type BlogPost = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  categoryId: number;
  featuredImage: string | null;
  publishedAt: string;
  readTime: number;
  category?: {
    id: number;
    name: string;
    slug: string;
  };
};

interface RecentBlogPostsProps {
  limit?: number;
  className?: string;
}

const RecentBlogPosts: React.FC<RecentBlogPostsProps> = ({ 
  limit = 3,
  className = '' 
}) => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecentPosts = async () => {
      try {
        setLoading(true);
        const response = await apiRequest<{success: boolean, posts: BlogPost[]}>('/api/blog/posts', {
          params: { limit }
        });
        
        if (response.success) {
          setPosts(response.posts);
        } else {
          setError('Failed to load blog posts');
        }
      } catch (err) {
        console.error('Error fetching recent blog posts:', err);
        setError('Failed to load blog posts');
      } finally {
        setLoading(false);
      }
    };

    fetchRecentPosts();
  }, [limit]);

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${className}`}>
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-white dark:bg-gray-800/50 shadow-sm">
            <div className="p-4">
              <Skeleton className="h-40 w-full mb-4" />
              <Skeleton className="h-6 w-2/3 mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3 mb-4" />
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-red-500 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-gray-500 dark:text-gray-400">No blog posts available at the moment.</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {posts.map((post, index) => (
          <Card 
            key={post.id} 
            className={`group bg-white dark:bg-gray-800/50 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col rounded-xl border border-gray-100 dark:border-gray-700/30 ${
              index === 0 ? "md:col-span-3 md:grid md:grid-cols-2 md:items-center" : ""
            }`}
          >
            {post.featuredImage && (
              <div className={`overflow-hidden ${index === 0 ? "h-full max-h-[400px]" : "h-52"}`}>
                <Link href={`/blog/${post.slug}`} className="block h-full w-full">
                  <img 
                    src={post.featuredImage} 
                    alt={post.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
                  />
                </Link>
              </div>
            )}
            
            <CardContent className={`p-6 flex-grow ${index === 0 ? "flex flex-col justify-center" : ""}`}>
              <div className="flex items-center gap-2 mb-3">
                <Link href={`/blog/category/${post.category?.slug || ''}`}>
                  <span className="px-3 py-1 bg-primary/10 dark:bg-primary/20 text-primary text-xs font-medium rounded-full hover:bg-primary/20 transition-colors flex items-center gap-1">
                    {post.category?.name || 'GRE'}
                  </span>
                </Link>
              </div>
              
              <h3 className={`${index === 0 ? "text-2xl md:text-3xl" : "text-xl"} font-semibold mb-3 text-gray-900 dark:text-white group-hover:text-primary transition-colors line-clamp-2`}>
                <Link href={`/blog/${post.slug}`}>
                  {post.title}
                </Link>
              </h3>
              
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-5 line-clamp-3">
                {post.excerpt}
              </p>
              
              <div className="flex items-center justify-between mt-auto">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{formatDate(post.publishedAt)}</span>
                  </div>
                  
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{post.readTime} min read</span>
                  </div>
                </div>
                
                {index === 0 && (
                  <Link href={`/blog/${post.slug}`}>
                    <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 hover:bg-primary/10 -mr-2">
                      Read More <ArrowRight className="ml-1 h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="mt-10 text-center">
        <Link href="/blog">
          <Button variant="default" className="group relative overflow-hidden px-6 py-5">
            <span className="relative z-10">
              Browse All Articles
              <ArrowRight className="ml-2 h-4 w-4 inline-block group-hover:translate-x-1 transition-transform" />
            </span>
            <span className="absolute inset-0 bg-primary/10 dark:bg-primary/20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default RecentBlogPosts;