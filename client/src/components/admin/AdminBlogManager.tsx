import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  ArrowUp, 
  ArrowDown, 
  Calendar,
  Image as ImageIcon,
  Tag,
  Save,
  X,
  Check,
  FileText,
  Pencil
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

type BlogPost = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string | null;
  categoryId: number;
  status: string;
  publishedAt: string;
  readTime: number;
  metaTitle?: string;
  metaDescription?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
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

// Form for blog post editing
type BlogPostForm = Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>;

const AdminBlogManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState('posts');
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state for editing/creating posts
  const [postForm, setPostForm] = useState<BlogPostForm>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featuredImage: '',
    categoryId: 0,
    status: 'draft',
    publishedAt: new Date().toISOString().split('T')[0],
    readTime: 3,
    metaTitle: '',
    metaDescription: '',
    tags: []
  });
  
  // Category form
  const [categoryForm, setCategoryForm] = useState<Omit<BlogCategory, 'id' | 'createdAt' | 'updatedAt'>>({
    name: '',
    slug: '',
    description: ''
  });
  
  // Dialog states
  const [postDialogOpen, setPostDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentItemId, setCurrentItemId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const { toast } = useToast();
  
  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        if (activeTab === 'posts') {
          const response = await apiRequest<{success: boolean, posts: BlogPost[]}>('/api/admin/blog/posts');
          if (response.success) {
            setPosts(response.posts);
          }
        } else if (activeTab === 'categories') {
          const response = await apiRequest<{success: boolean, categories: BlogCategory[]}>('/api/blog/categories');
          if (response.success) {
            setCategories(response.categories);
          }
        } else if (activeTab === 'comments') {
          // Fetch all blog posts to get comments
          const postsResponse = await apiRequest<{success: boolean, posts: BlogPost[]}>('/api/admin/blog/posts');
          
          if (postsResponse.success) {
            // For each post, fetch comments
            const allComments: any[] = [];
            
            for (const post of postsResponse.posts) {
              const commentsResponse = await apiRequest<{success: boolean, comments: any[]}>(`/api/blog/posts/${post.id}/comments`);
              
              if (commentsResponse.success) {
                allComments.push(...commentsResponse.comments.map(c => ({...c, postTitle: post.title})));
              }
            }
            
            setComments(allComments);
          }
        }
        
        // Always fetch categories for the dropdown in post form
        if (activeTab !== 'categories') {
          const categoriesResponse = await apiRequest<{success: boolean, categories: BlogCategory[]}>('/api/blog/categories');
          
          if (categoriesResponse.success) {
            setCategories(categoriesResponse.categories);
          }
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching blog data:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [activeTab]);
  
  // Generate slug from title
  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };
  
  // Handle post form changes
  const handlePostFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // If title changes, generate a slug automatically (unless slug was manually edited)
    if (name === 'title' && (!postForm.slug || postForm.slug === generateSlug(postForm.title))) {
      setPostForm(prev => ({
        ...prev,
        [name]: value,
        slug: generateSlug(value)
      }));
    } else {
      setPostForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Handle category form changes
  const handleCategoryFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // If name changes, generate a slug automatically (unless slug was manually edited)
    if (name === 'name' && (!categoryForm.slug || categoryForm.slug === generateSlug(categoryForm.name))) {
      setCategoryForm(prev => ({
        ...prev,
        [name]: value,
        slug: generateSlug(value)
      }));
    } else {
      setCategoryForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Submit post form
  const handlePostSubmit = async () => {
    try {
      if (isEditing && currentItemId) {
        // Update existing post
        const response = await apiRequest<{success: boolean, post: BlogPost}>(
          `/api/admin/blog/posts/${currentItemId}`,
          { method: 'PUT', data: postForm }
        );
        
        if (response.success) {
          // Update posts list with the updated post
          setPosts(prev => prev.map(p => p.id === currentItemId ? response.post : p));
          
          toast({
            title: 'Success',
            description: 'Blog post updated successfully',
          });
          
          setPostDialogOpen(false);
        } else {
          toast({
            title: 'Error',
            description: 'Failed to update blog post',
            variant: 'destructive',
          });
        }
      } else {
        // Create new post
        const response = await apiRequest<{success: boolean, post: BlogPost}>(
          '/api/admin/blog/posts',
          { method: 'POST', data: postForm }
        );
        
        if (response.success) {
          // Add new post to the list
          setPosts(prev => [...prev, response.post]);
          
          toast({
            title: 'Success',
            description: 'Blog post created successfully',
          });
          
          setPostDialogOpen(false);
        } else {
          toast({
            title: 'Error',
            description: 'Failed to create blog post',
            variant: 'destructive',
          });
        }
      }
    } catch (err) {
      console.error('Error submitting blog post:', err);
      toast({
        title: 'Error',
        description: 'An error occurred while saving the blog post',
        variant: 'destructive',
      });
    }
  };
  
  // Submit category form
  const handleCategorySubmit = async () => {
    try {
      if (isEditing && currentItemId) {
        // Update existing category
        const response = await apiRequest<{success: boolean, category: BlogCategory}>(
          `/api/admin/blog/categories/${currentItemId}`,
          { method: 'PUT', data: categoryForm }
        );
        
        if (response.success) {
          // Update categories list with the updated category
          setCategories(prev => prev.map(c => c.id === currentItemId ? response.category : c));
          
          toast({
            title: 'Success',
            description: 'Category updated successfully',
          });
          
          setCategoryDialogOpen(false);
        } else {
          toast({
            title: 'Error',
            description: 'Failed to update category',
            variant: 'destructive',
          });
        }
      } else {
        // Create new category
        const response = await apiRequest<{success: boolean, category: BlogCategory}>(
          '/api/admin/blog/categories',
          { method: 'POST', data: categoryForm }
        );
        
        if (response.success) {
          // Add new category to the list
          setCategories(prev => [...prev, response.category]);
          
          toast({
            title: 'Success',
            description: 'Category created successfully',
          });
          
          setCategoryDialogOpen(false);
        } else {
          toast({
            title: 'Error',
            description: 'Failed to create category',
            variant: 'destructive',
          });
        }
      }
    } catch (err) {
      console.error('Error submitting category:', err);
      toast({
        title: 'Error',
        description: 'An error occurred while saving the category',
        variant: 'destructive',
      });
    }
  };
  
  // Delete item (post or category)
  const handleDeleteItem = async () => {
    if (!currentItemId) return;
    
    try {
      if (activeTab === 'posts') {
        const response = await apiRequest<{success: boolean}>(
          `/api/admin/blog/posts/${currentItemId}`,
          { method: 'DELETE' }
        );
        
        if (response.success) {
          // Remove post from the list
          setPosts(prev => prev.filter(p => p.id !== currentItemId));
          
          toast({
            title: 'Success',
            description: 'Blog post deleted successfully',
          });
        } else {
          toast({
            title: 'Error',
            description: 'Failed to delete blog post',
            variant: 'destructive',
          });
        }
      } else if (activeTab === 'categories') {
        const response = await apiRequest<{success: boolean}>(
          `/api/admin/blog/categories/${currentItemId}`,
          { method: 'DELETE' }
        );
        
        if (response.success) {
          // Remove category from the list
          setCategories(prev => prev.filter(c => c.id !== currentItemId));
          
          toast({
            title: 'Success',
            description: 'Category deleted successfully',
          });
        } else {
          toast({
            title: 'Error',
            description: 'Failed to delete category',
            variant: 'destructive',
          });
        }
      } else if (activeTab === 'comments') {
        const response = await apiRequest<{success: boolean}>(
          `/api/admin/blog/comments/${currentItemId}`,
          { method: 'DELETE' }
        );
        
        if (response.success) {
          // Remove comment from the list
          setComments(prev => prev.filter(c => c.id !== currentItemId));
          
          toast({
            title: 'Success',
            description: 'Comment deleted successfully',
          });
        } else {
          toast({
            title: 'Error',
            description: 'Failed to delete comment',
            variant: 'destructive',
          });
        }
      }
    } catch (err) {
      console.error('Error deleting item:', err);
      toast({
        title: 'Error',
        description: 'An error occurred while deleting the item',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setCurrentItemId(null);
    }
  };
  
  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Edit post
  const handleEditPost = (post: BlogPost) => {
    setIsEditing(true);
    setCurrentItemId(post.id);
    setPostForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      featuredImage: post.featuredImage || '',
      categoryId: post.categoryId,
      status: post.status,
      publishedAt: new Date(post.publishedAt).toISOString().split('T')[0],
      readTime: post.readTime,
      metaTitle: post.metaTitle || '',
      metaDescription: post.metaDescription || '',
      tags: post.tags || []
    });
    setPostDialogOpen(true);
  };
  
  // Edit category
  const handleEditCategory = (category: BlogCategory) => {
    setIsEditing(true);
    setCurrentItemId(category.id);
    setCategoryForm({
      name: category.name,
      slug: category.slug,
      description: category.description
    });
    setCategoryDialogOpen(true);
  };
  
  // Reset forms when opening dialogs
  const handleNewPost = () => {
    setIsEditing(false);
    setCurrentItemId(null);
    setPostForm({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      featuredImage: '',
      categoryId: categories.length > 0 ? categories[0].id : 0,
      status: 'draft',
      publishedAt: new Date().toISOString().split('T')[0],
      readTime: 3,
      metaTitle: '',
      metaDescription: '',
      tags: []
    });
    setPostDialogOpen(true);
  };
  
  const handleNewCategory = () => {
    setIsEditing(false);
    setCurrentItemId(null);
    setCategoryForm({
      name: '',
      slug: '',
      description: ''
    });
    setCategoryDialogOpen(true);
  };
  
  // Approve comment
  const handleApproveComment = async (commentId: number) => {
    try {
      const response = await apiRequest<{success: boolean, comment: any}>(
        `/api/admin/blog/comments/${commentId}/approve`,
        { method: 'POST' }
      );
      
      if (response.success) {
        // Update comment in the list
        setComments(prev => prev.map(c => c.id === commentId ? {...c, status: 'approved'} : c));
        
        toast({
          title: 'Success',
          description: 'Comment approved successfully',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to approve comment',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Error approving comment:', err);
      toast({
        title: 'Error',
        description: 'An error occurred while approving the comment',
        variant: 'destructive',
      });
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Blog Management</h2>
      </div>
      
      <Tabs 
        defaultValue="posts" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="comments">Comments</TabsTrigger>
        </TabsList>
        
        {/* Posts Tab */}
        <TabsContent value="posts" className="space-y-4">
          <div className="flex justify-end mb-4">
            <Button onClick={handleNewPost}>
              <Plus className="mr-2 h-4 w-4" />
              New Post
            </Button>
          </div>
          
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 rounded-lg border">
                  <div className="flex gap-4">
                    <Skeleton className="h-12 w-12 rounded-md" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                    <Skeleton className="h-8 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Published</TableHead>
                    <TableHead className="w-[150px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                        No blog posts found. Create your first post!
                      </TableCell>
                    </TableRow>
                  ) : (
                    posts.map((post) => (
                      <TableRow key={post.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            {post.featuredImage ? (
                              <div className="h-10 w-16 rounded overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                                <img 
                                  src={post.featuredImage} 
                                  alt={post.title} 
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="h-10 w-16 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                                <ImageIcon className="h-5 w-5 text-gray-400" />
                              </div>
                            )}
                            <div className="truncate max-w-md">
                              <div className="truncate font-medium">{post.title}</div>
                              <div className="text-xs text-gray-500 truncate">/blog/{post.slug}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {categories.find(c => c.id === post.categoryId)?.name || 'Unknown'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            post.status === 'published' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          }`}>
                            {post.status === 'published' ? 'Published' : 'Draft'}
                          </span>
                        </TableCell>
                        <TableCell>{formatDate(post.publishedAt)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleEditPost(post)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              asChild
                            >
                              <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer">
                                <Eye className="h-4 w-4" />
                              </a>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => {
                                setCurrentItemId(post.id);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
        
        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-end mb-4">
            <Button onClick={handleNewCategory}>
              <Plus className="mr-2 h-4 w-4" />
              New Category
            </Button>
          </div>
          
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 rounded-lg border">
                  <div className="flex gap-4">
                    <Skeleton className="h-12 w-12 rounded-md" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                    <Skeleton className="h-8 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                        No categories found. Create your first category!
                      </TableCell>
                    </TableRow>
                  ) : (
                    categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <Tag className="h-4 w-4 text-primary" />
                            </div>
                            {category.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-500">{category.slug}</TableCell>
                        <TableCell>
                          <div className="max-w-md truncate">
                            {category.description || <span className="text-gray-400 italic">No description</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleEditCategory(category)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => {
                                setCurrentItemId(category.id);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
        
        {/* Comments Tab */}
        <TabsContent value="comments" className="space-y-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 rounded-lg border">
                  <div className="flex gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                    <Skeleton className="h-8 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Comment</TableHead>
                    <TableHead>Post</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                        No comments found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    comments.map((comment) => (
                      <TableRow key={comment.id}>
                        <TableCell>
                          <div className="flex items-start gap-3">
                            <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium">
                              {comment.user 
                                ? `${comment.user.firstName?.[0] || ''}${comment.user.lastName?.[0] || ''}`
                                : comment.name?.[0] || '?'}
                            </div>
                            <div>
                              <div className="font-medium">
                                {comment.user 
                                  ? `${comment.user.firstName || ''} ${comment.user.lastName || ''}`.trim() || comment.user.username
                                  : comment.name || 'Anonymous'}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">{comment.content}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate">{comment.postTitle}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            comment.status === 'approved' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          }`}>
                            {comment.status}
                          </span>
                        </TableCell>
                        <TableCell>{formatDate(comment.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {comment.status !== 'approved' && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleApproveComment(comment.id)}
                              >
                                <Check className="h-4 w-4 text-green-500" />
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => {
                                setCurrentItemId(comment.id);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Post Edit/Create Dialog */}
      <Dialog open={postDialogOpen} onOpenChange={setPostDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Blog Post' : 'Create New Blog Post'}</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
            <div className="md:col-span-2 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={postForm.title}
                  onChange={handlePostFormChange}
                  placeholder="Enter post title"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  name="slug"
                  value={postForm.slug}
                  onChange={handlePostFormChange}
                  placeholder="Enter URL slug"
                />
                <p className="text-xs text-gray-500">
                  This will be used in the URL: /blog/{postForm.slug || 'example-slug'}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  name="excerpt"
                  value={postForm.excerpt}
                  onChange={handlePostFormChange}
                  placeholder="Brief summary of the post"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="content">Content (HTML)</Label>
                <Textarea
                  id="content"
                  name="content"
                  value={postForm.content}
                  onChange={handlePostFormChange}
                  placeholder="Full post content in HTML format"
                  rows={12}
                  className="font-mono text-sm"
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="featuredImage">Featured Image URL</Label>
                <Input
                  id="featuredImage"
                  name="featuredImage"
                  value={postForm.featuredImage || ''}
                  onChange={handlePostFormChange}
                  placeholder="https://example.com/image.jpg"
                />
                {postForm.featuredImage && (
                  <div className="mt-2 rounded-md border overflow-hidden w-full h-32">
                    <img
                      src={postForm.featuredImage}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=Invalid+Image+URL';
                      }}
                    />
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="categoryId">Category</Label>
                <Select 
                  value={postForm.categoryId.toString()} 
                  onValueChange={(value) => {
                    setPostForm(prev => ({ ...prev, categoryId: parseInt(value) }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="readTime">Read Time (minutes)</Label>
                <Input
                  id="readTime"
                  name="readTime"
                  type="number"
                  min="1"
                  max="60"
                  value={postForm.readTime}
                  onChange={handlePostFormChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="publishedAt">Publish Date</Label>
                <Input
                  id="publishedAt"
                  name="publishedAt"
                  type="date"
                  value={postForm.publishedAt}
                  onChange={handlePostFormChange}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Switch
                    id="status"
                    checked={postForm.status === 'published'}
                    onCheckedChange={(checked) => {
                      setPostForm(prev => ({ 
                        ...prev, 
                        status: checked ? 'published' : 'draft' 
                      }));
                    }}
                  />
                  <span className="text-sm font-medium">
                    {postForm.status === 'published' ? 'Published' : 'Draft'}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Published posts will be visible to all users
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="metaTitle">SEO Title (optional)</Label>
                <Input
                  id="metaTitle"
                  name="metaTitle"
                  value={postForm.metaTitle || ''}
                  onChange={handlePostFormChange}
                  placeholder="SEO optimized title"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="metaDescription">SEO Description (optional)</Label>
                <Textarea
                  id="metaDescription"
                  name="metaDescription"
                  value={postForm.metaDescription || ''}
                  onChange={handlePostFormChange}
                  placeholder="SEO description for search engines"
                  rows={3}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setPostDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePostSubmit}>
              {isEditing ? 'Update Post' : 'Create Post'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Category Edit/Create Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Category' : 'Create New Category'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={categoryForm.name}
                onChange={handleCategoryFormChange}
                placeholder="Category name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                name="slug"
                value={categoryForm.slug}
                onChange={handleCategoryFormChange}
                placeholder="category-slug"
              />
              <p className="text-xs text-gray-500">
                This will be used in URLs: /blog/category/{categoryForm.slug || 'example-category'}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={categoryForm.description}
                onChange={handleCategoryFormChange}
                placeholder="Category description"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCategorySubmit}>
              {isEditing ? 'Update Category' : 'Create Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p>Are you sure you want to delete this {activeTab === 'posts' ? 'blog post' : activeTab === 'categories' ? 'category' : 'comment'}? This action cannot be undone.</p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteItem}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBlogManager;