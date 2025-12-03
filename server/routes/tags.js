import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { getDb } from '../config/database.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Helper function to execute query
const query = async (text, params) => {
  const db = getDb();
  const result = await db.query(text, params);
  return result.rows;
};

// Helper function to execute query and return first row
const queryOne = async (text, params) => {
  const db = getDb();
  const result = await db.query(text, params);
  return result.rows[0] || null;
};

// Get all tags
router.get('/', async (req, res) => {
  try {
    // Get tags that are used by notes of the current user
    const tags = await query(`
      SELECT t.id, t.name, t.color, t.created_at, COUNT(nt.note_id)::int as note_count
      FROM tags t
      INNER JOIN note_tags nt ON t.id = nt.tag_id
      INNER JOIN notes n ON nt.note_id = n.id
      WHERE n.user_id = $1
      GROUP BY t.id, t.name, t.color, t.created_at
      ORDER BY t.name
    `, [req.user.id]);

    res.json(tags);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update tag color
router.patch('/:id/color', async (req, res) => {
  try {
    const { color } = req.body;
    const db = getDb();
    
    await db.query('UPDATE tags SET color = $1 WHERE id = $2', [color, req.params.id]);
    const tag = await queryOne('SELECT * FROM tags WHERE id = $1', [req.params.id]);
    
    res.json(tag);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
