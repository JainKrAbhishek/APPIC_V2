import React from 'react';
import { useLocation } from 'wouter';
import BlogList from '../components/blog/BlogList';

const BlogSearch = () => {
  // Get search query from URL
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split('?')[1]);
  const query = searchParams.get('q') || '';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 pb-16">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Search Results
            </h1>
            {query && (
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Showing results for: <span className="font-semibold">"{query}"</span>
              </p>
            )}
          </div>
          
          <BlogList initialSearchQuery={query} />
        </div>
      </div>
    </div>
  );
};

export default BlogSearch;