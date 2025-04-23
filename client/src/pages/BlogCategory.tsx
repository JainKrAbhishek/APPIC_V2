import React from 'react';
import { useRoute } from 'wouter';
import BlogList from '../components/blog/BlogList';

const BlogCategory = () => {
  const [, params] = useRoute<{ slug: string }>('/blog/category/:slug');
  const categorySlug = params?.slug;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 pb-16">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {categorySlug ? categorySlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Category'} Articles
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Browse articles in this category
            </p>
          </div>
          
          <BlogList categorySlug={categorySlug} />
        </div>
      </div>
    </div>
  );
};

export default BlogCategory;