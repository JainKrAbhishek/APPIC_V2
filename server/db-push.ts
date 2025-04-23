import { pool } from './db';

async function main() {
  console.log('Starting database schema migration');
  
  try {
    // Create blog_categories table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "blog_categories" (
        "id" SERIAL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "slug" TEXT NOT NULL UNIQUE,
        "description" TEXT,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('blog_categories table created');
    
    // Create blog_posts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "blog_posts" (
        "id" SERIAL PRIMARY KEY,
        "title" TEXT NOT NULL,
        "slug" TEXT NOT NULL UNIQUE,
        "excerpt" TEXT,
        "content" TEXT NOT NULL,
        "featured_image" TEXT,
        "author_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "category_id" INTEGER REFERENCES "blog_categories"("id") ON DELETE SET NULL,
        "status" TEXT NOT NULL DEFAULT 'draft',
        "published_at" TIMESTAMP,
        "meta_title" TEXT,
        "meta_description" TEXT,
        "tags" TEXT[] DEFAULT '{}',
        "read_time" INTEGER DEFAULT 0,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('blog_posts table created');
    
    // Create blog_comments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "blog_comments" (
        "id" SERIAL PRIMARY KEY,
        "post_id" INTEGER NOT NULL REFERENCES "blog_posts"("id") ON DELETE CASCADE,
        "user_id" INTEGER REFERENCES "users"("id") ON DELETE SET NULL,
        "parent_id" INTEGER REFERENCES "blog_comments"("id") ON DELETE CASCADE,
        "name" TEXT,
        "email" TEXT,
        "content" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'pending',
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('blog_comments table created');
    
    console.log('Database schema migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Database schema migration failed:', error);
    process.exit(1);
  }
}

main();