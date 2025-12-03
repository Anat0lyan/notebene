import pg from 'pg';
import bcrypt from 'bcryptjs';
import type { Pool } from 'pg';

const { Pool: PgPool } = pg;

let pool: Pool | null = null;

export const getDb = (): Pool => {
  if (!pool) {
    pool = new PgPool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'notabene',
      password: process.env.DB_PASSWORD || 'postgres',
      port: parseInt(process.env.DB_PORT || '5432', 10),
    });

    // Handle pool errors
    pool.on('error', (err: Error) => {
      console.error('Unexpected error on idle client', err);
    });
  }
  return pool;
};

// Helper function to execute query
export const query = async (text: string, params?: unknown[]): Promise<unknown[]> => {
  const db = getDb();
  const result = await db.query(text, params);
  return result.rows;
};

// Helper function to execute query and return first row
export const queryOne = async <T = unknown>(text: string, params?: unknown[]): Promise<T | null> => {
  const db = getDb();
  const result = await db.query(text, params);
  return (result.rows[0] as T) || null;
};

// Helper function to execute query and return last inserted id
export const queryInsert = async (text: string, params?: unknown[]): Promise<number> => {
  const db = getDb();
  const result = await db.query(text + ' RETURNING id', params);
  return (result.rows[0] as { id: number }).id;
};

export const initDatabase = async (): Promise<void> => {
  const db = getDb();
  
  try {
    // Create tables
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Check if tags table has user_id column (for migration)
    const tagsTableInfo = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tags' AND column_name = 'user_id'
    `);
    
    // Check if note_tags table has user_id column
    const noteTagsTableInfo = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'note_tags' AND column_name = 'user_id'
    `);
    
    // If tables exist without user_id, drop and recreate (migration)
    if (tagsTableInfo.rows.length === 0 || noteTagsTableInfo.rows.length === 0) {
      console.log('Migrating tags and note_tags tables: adding user_id column...');
      // Drop existing constraints and tables
      await db.query('DROP TABLE IF EXISTS note_tags CASCADE');
      await db.query('DROP TABLE IF EXISTS tags CASCADE');
    }

    await db.query(`
      CREATE TABLE IF NOT EXISTS tags (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        name VARCHAR(255) NOT NULL,
        color VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, name)
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS notes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        title VARCHAR(255) NOT NULL,
        content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_archived BOOLEAN DEFAULT FALSE,
        is_favorite BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create note_tags table with user_id for better performance and security
    await db.query(`
      CREATE TABLE IF NOT EXISTS note_tags (
        note_id INTEGER NOT NULL,
        tag_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        PRIMARY KEY (note_id, tag_id),
        FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create indexes for better performance
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
    `);
    
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_notes_archived ON notes(is_archived);
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_note_tags_note_id ON note_tags(note_id);
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_note_tags_tag_id ON note_tags(tag_id);
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_note_tags_user_id ON note_tags(user_id);
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        completed BOOLEAN DEFAULT FALSE,
        due_date TIMESTAMP,
        priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
        note_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        recurring_type VARCHAR(20) DEFAULT 'none' CHECK (recurring_type IN ('none', 'daily', 'weekly', 'monthly')),
        recurring_interval INTEGER DEFAULT 1,
        reminder TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE SET NULL
      )
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_tasks_note_id ON tasks(note_id);
    `);

    // Create default user for testing (password: admin)
    const existingUser = await db.query('SELECT * FROM users WHERE username = $1', ['admin']);
    if (existingUser.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('admin', 10);
      await db.query('INSERT INTO users (username, password) VALUES ($1, $2)', ['admin', hashedPassword]);
      console.log('Default admin user created (username: admin, password: admin)');
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

