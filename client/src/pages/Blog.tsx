import React from 'react';
import BlogList from '../components/blog/BlogList';
import { BookOpen, ChevronRight, Sparkles } from 'lucide-react';

const Blog = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-900/60 pt-24 pb-20">
      {/* Hero Section */}
      <div className="container mx-auto px-4 mb-16">
        <div className="max-w-7xl mx-auto">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 border border-primary/10 dark:border-primary/20 p-8 md:p-12">
            <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/5 to-transparent dark:from-primary/10"></div>
            <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_30%_30%,rgba(0,0,0,0.1)_0%,transparent_70%)]"></div>
            
            <div className="flex items-center gap-2 px-4 py-1.5 bg-primary/10 dark:bg-primary/20 w-fit rounded-full mb-6">
              <BookOpen className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">GRE Blog</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4 max-w-2xl relative">
              <span className="relative">
                GRE Prep & 
                <span className="relative inline-block">
                  <span className="relative z-10">Strategies</span>
                  <span className="absolute bottom-1 left-0 w-full h-3 bg-primary/20 dark:bg-primary/30 -rotate-1 rounded-sm"></span>
                </span>
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mb-8">
              Expert tips, in-depth guides, and proven strategies to help you excel on the GRE exam and achieve your graduate school goals.
            </p>
            
            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span>Updated regularly</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <ChevronRight className="h-4 w-4" />
                <span>Written by GRE experts</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Blog Content */}
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          <BlogList />
        </div>
      </div>
      
      {/* Featured Categories */}
      <div className="container mx-auto px-4 mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Top GRE Resources
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Browse our most popular content categories
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800/50 shadow-sm hover:shadow-md transition-shadow rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700/50">
              <div className="h-3 bg-emerald-500"></div>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Verbal Reasoning</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">Master reading comprehension, text completion, and sentence equivalence questions.</p>
                <a href="/blog/category/verbal" className="text-primary text-sm font-medium flex items-center gap-1 hover:underline">
                  Explore guides <ChevronRight className="h-3 w-3" />
                </a>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800/50 shadow-sm hover:shadow-md transition-shadow rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700/50">
              <div className="h-3 bg-blue-500"></div>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Quantitative Reasoning</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">Improve your math skills with problem-solving techniques and concept explanations.</p>
                <a href="/blog/category/quantitative" className="text-primary text-sm font-medium flex items-center gap-1 hover:underline">
                  Explore guides <ChevronRight className="h-3 w-3" />
                </a>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800/50 shadow-sm hover:shadow-md transition-shadow rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700/50">
              <div className="h-3 bg-amber-500"></div>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Analytical Writing</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">Learn to craft compelling arguments and analyze issues with structured essays.</p>
                <a href="/blog/category/writing" className="text-primary text-sm font-medium flex items-center gap-1 hover:underline">
                  Explore guides <ChevronRight className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Blog;