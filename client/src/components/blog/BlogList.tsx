import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { 
  Calendar, 
  Clock, 
  Tag,
  ChevronLeft,
  ChevronRight,
  Search,
  X
} from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

type BlogCategory = {
  id: number;
  name: string;
  slug: string;
  description: string;
};

type PaginationMeta = {
  total: number;
  limit: number;
  offset: number;
};

interface BlogListProps {
  categorySlug?: string;
  initialSearchQuery?: string;
}

const BlogList: React.FC<BlogListProps> = ({ categorySlug, initialSearchQuery = '' }) => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>(categorySlug || '');
  const [meta, setMeta] = useState<PaginationMeta>({ total: 0, limit: 10, offset: 0 });

  // Fetch blog posts based on filters
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        let endpoint = '/api/blog/posts';
        
        // If searching
        if (searchQuery.trim()) {
          const searchResponse = await apiRequest<{success: boolean, posts: BlogPost[], query: string, meta: PaginationMeta}>(
            '/api/blog/search', 
            { 
              params: { 
                q: searchQuery.trim(),
                limit: meta.limit,
                offset: meta.offset
              } 
            }
          );
          
          if (searchResponse.success) {
            setPosts(searchResponse.posts);
            setMeta(searchResponse.meta);
          }
        } 
        // If filtering by category
        else if (selectedCategory && selectedCategory !== 'all' && selectedCategory.trim() !== '') {
          const categoryResponse = await apiRequest<{success: boolean, posts: BlogPost[], meta: PaginationMeta}>(
            `/api/blog/categories/${selectedCategory}/posts`, 
            { 
              params: { 
                limit: meta.limit,
                offset: meta.offset
              } 
            }
          );
          
          if (categoryResponse.success) {
            setPosts(categoryResponse.posts);
            setMeta(categoryResponse.meta);
          }
        } 
        // Default list
        else {
          const postsResponse = await apiRequest<{success: boolean, posts: BlogPost[], meta: PaginationMeta}>(
            endpoint, 
            { 
              params: { 
                limit: meta.limit,
                offset: meta.offset
              } 
            }
          );
          
          if (postsResponse.success) {
            setPosts(postsResponse.posts);
            setMeta(postsResponse.meta);
          }
        }
        
        // Fetch categories (always)
        const categoriesResponse = await apiRequest<{success: boolean, categories: BlogCategory[]}>('/api/blog/categories');
        
        if (categoriesResponse.success) {
          setCategories(categoriesResponse.categories);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching blog posts:', err);
        setError('Failed to load blog posts');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [selectedCategory, searchQuery, meta.limit, meta.offset]);

  // Function to get category name by ID
  const getCategoryName = (categoryId: number): string => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : '';
  };
  
  // Function to get category slug by ID
  const getCategorySlug = (categoryId: number): string => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.slug : '';
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Handle search submission
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Reset pagination when searching
    setMeta(prev => ({ ...prev, offset: 0 }));
  };

  // Handle pagination
  const handleNextPage = () => {
    if (meta.offset + meta.limit < meta.total) {
      setMeta(prev => ({ ...prev, offset: prev.offset + prev.limit }));
    }
  };

  const handlePrevPage = () => {
    if (meta.offset - meta.limit >= 0) {
      setMeta(prev => ({ ...prev, offset: prev.offset - prev.limit }));
    }
  };

  // Placeholder for empty state or loading
  if (loading) {
    return (
      <div className="space-y-8">
        <div className="bg-white dark:bg-gray-800/30 rounded-xl p-4 mb-6 shadow-sm border border-gray-100 dark:border-gray-700/30">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-64" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="bg-white dark:bg-gray-800/50 shadow-sm border border-gray-100 dark:border-gray-700/30 rounded-xl">
              <div className="p-4">
                <Skeleton className="h-48 w-full rounded-lg mb-4" />
                <Skeleton className="h-5 w-16 rounded-full mb-3" />
                <Skeleton className="h-8 w-5/6 mb-3" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3 mb-4" />
                <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-gray-700/30">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 px-4">
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-8 max-w-xl mx-auto border border-red-100 dark:border-red-800/30">
          <div className="text-red-500 dark:text-red-400 mb-2 text-2xl"><X className="h-8 w-8 mx-auto mb-2" /></div>
          <h3 className="text-lg font-medium text-red-800 dark:text-red-300 mb-2">Error Loading Content</h3>
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <Button 
            variant="outline" 
            className="mt-4 bg-white dark:bg-gray-800 border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800/30 rounded-xl p-4 md:p-6 shadow-sm border border-gray-100 dark:border-gray-700/30 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
            <Select 
              value={selectedCategory} 
              onValueChange={(value) => {
                setSelectedCategory(value);
                setMeta(prev => ({ ...prev, offset: 0 })); // Reset pagination when changing category
              }}
            >
              <SelectTrigger className="w-full md:w-[220px] bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.slug}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto">
            <Input
              type="search"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="min-w-[200px] md:min-w-[280px] bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
            />
            <Button type="submit" variant="default" size="icon" className="shrink-0">
              <Search className="h-4 w-4" />
            </Button>
          </form>
        </div>
        
        {/* Results Count */}
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-4 flex items-center">
          <div className="h-1.5 w-1.5 rounded-full bg-primary mr-2"></div>
          {meta.total === 0 ? (
            'No blog posts found'
          ) : (
            `Showing ${Math.min(meta.offset + 1, meta.total)}-${Math.min(meta.offset + meta.limit, meta.total)} of ${meta.total} articles`
          )}
        </div>
      </div>
      
      {/* Blog Post Grid */}
      {posts.length === 0 ? (
        <div className="text-center py-16 px-4">
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-8 max-w-xl mx-auto border border-gray-100 dark:border-gray-700/30">
            <div className="text-gray-400 dark:text-gray-500 mb-2 text-2xl"><Search className="h-8 w-8 mx-auto mb-2" /></div>
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">No Results Found</h3>
            <p className="text-gray-600 dark:text-gray-400">We couldn't find any blog posts that match your search criteria.</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map(post => (
            <Card key={post.id} className="bg-white dark:bg-gray-800/50 shadow-sm hover:shadow-md transition-shadow overflow-hidden rounded-xl border border-gray-100 dark:border-gray-700/30 flex flex-col">
              {post.featuredImage && (
                <div className="h-52 overflow-hidden">
                  <Link href={`/blog/${post.slug}`} className="block h-full w-full">
                    <img 
                      src={post.featuredImage} 
                      alt={post.title} 
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </Link>
                </div>
              )}
              
              <CardContent className="p-5 flex-grow">
                <div className="flex items-center gap-2 mb-3">
                  {post.categoryId && (
                    <Link href={`/blog/category/${getCategorySlug(post.categoryId)}`}>
                      <span className="px-3 py-1 bg-emerald-100/80 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-medium rounded-full flex items-center gap-1 hover:bg-emerald-200/80 dark:hover:bg-emerald-900/50 transition-colors">
                        <Tag className="h-3 w-3" />
                        {getCategoryName(post.categoryId)}
                      </span>
                    </Link>
                  )}
                </div>
                
                <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white group">
                  <Link href={`/blog/${post.slug}`} className="block hover:text-primary transition-colors">
                    {post.title}
                  </Link>
                </h3>
                
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
                  {post.excerpt}
                </p>
              </CardContent>
              
              <CardFooter className="bg-gray-50 dark:bg-gray-800/80 px-5 py-3 flex justify-between items-center border-t border-gray-100 dark:border-gray-700/50 mt-auto">
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{formatDate(post.publishedAt)}</span>
                </div>
                
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{post.readTime} min read</span>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* Pagination */}
      {meta.total > meta.limit && (
        <div className="flex justify-center mt-12">
          <div className="bg-white dark:bg-gray-800/30 rounded-full px-3 py-1.5 shadow-sm border border-gray-100 dark:border-gray-700/30 flex items-center space-x-2">
            <Button
              variant={meta.offset === 0 ? "ghost" : "outline"}
              size="sm"
              onClick={handlePrevPage}
              disabled={meta.offset === 0}
              className="flex items-center gap-1 rounded-full h-8 px-3"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            
            <div className="text-sm text-gray-600 dark:text-gray-300 px-4 border-l border-r border-gray-100 dark:border-gray-700/50">
              Page {Math.floor(meta.offset / meta.limit) + 1} of {Math.ceil(meta.total / meta.limit)}
            </div>
            
            <Button
              variant={meta.offset + meta.limit >= meta.total ? "ghost" : "outline"}
              size="sm"
              onClick={handleNextPage}
              disabled={meta.offset + meta.limit >= meta.total}
              className="flex items-center gap-1 rounded-full h-8 px-3"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogList;