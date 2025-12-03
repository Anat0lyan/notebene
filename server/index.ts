import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { initDatabase } from './config/database.js';
import notesRoutes from './routes/notes.js';
import tagsRoutes from './routes/tags.js';
import authRoutes from './routes/auth.js';
import tasksRoutes from './routes/tasks.js';

dotenv.config();

const app: Express = express();
const PORT: number = parseInt(process.env.PORT || '3000', 10);

// Get directory paths for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Path to client/dist (relative to compiled dist folder)
// When compiled, __dirname is server/dist/, so we go up to project root, then to client/dist
const clientDistPath = path.resolve(__dirname, '..', '..', 'client', 'dist');

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Initialize database
await initDatabase();

// API Routes (must be before static files)
app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/tags', tagsRoutes);
app.use('/api/tasks', tasksRoutes);

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Serve static files from client/dist
const shouldServeStatic = process.env.NODE_ENV === 'production' || process.env.SERVE_STATIC === 'true';
const staticExists = existsSync(clientDistPath);

if (shouldServeStatic && staticExists) {
  // Serve static assets
  app.use(express.static(clientDistPath, {
    maxAge: '1y', // Cache static assets for 1 year
    etag: true
  }));

  // Serve index.html for all non-API routes (SPA fallback)
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });

  console.log(`📦 Serving static files from: ${clientDistPath}`);
} else if (shouldServeStatic && !staticExists) {
  console.warn(`⚠️  Warning: Static files directory not found at ${clientDistPath}`);
  console.warn(`   Run 'cd client && npm run build' to build the frontend`);
}

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📍 API endpoints available at http://localhost:${PORT}/api`);
  console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
  if (process.env.NODE_ENV === 'production' || process.env.SERVE_STATIC === 'true') {
    console.log(`🌐 Frontend available at http://localhost:${PORT}`);
  }
});

