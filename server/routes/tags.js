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
    // Get tags that belong to the current user
    const tags = await query(`
      SELECT t.id, t.name, t.color, t.created_at, COUNT(nt.note_id)::int as note_count
      FROM tags t
      LEFT JOIN note_tags nt ON t.id = nt.tag_id AND nt.user_id = $1
      WHERE t.user_id = $1
      GROUP BY t.id, t.name, t.color, t.created_at
      ORDER BY t.name
    `, [req.user.id]);

    res.json(tags);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update tag (name and/or color)
router.put('/:id', async (req, res) => {
  try {
    const { name, color } = req.body;
    const db = getDb();
    
    // Check if tag exists and belongs to user
    const tagExists = await queryOne(`
      SELECT t.* FROM tags t
      WHERE t.id = $1 AND t.user_id = $2
      LIMIT 1
    `, [req.params.id, req.user.id]);
    
    if (!tagExists) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    // Check if new name conflicts with existing tag (only check user's tags)
    if (name && name !== tagExists.name) {
      const conflictingTag = await queryOne(`
        SELECT t.* FROM tags t
        WHERE t.name = $1 AND t.id != $2 AND t.user_id = $3
        LIMIT 1
      `, [name, req.params.id, req.user.id]);
      if (conflictingTag) {
        return res.status(400).json({ error: 'Tag with this name already exists' });
      }
    }

    // Update tag
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      updateValues.push(name);
    }

    if (color !== undefined) {
      updateFields.push(`color = $${paramIndex++}`);
      updateValues.push(color);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateValues.push(req.params.id, req.user.id);
    const queryText = `UPDATE tags SET ${updateFields.join(', ')} WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1} RETURNING *`;
    
    const result = await db.query(queryText, updateValues);
    const updatedTag = result.rows[0];

    // Get tag with note_count (consistent with GET endpoint)
    const tagWithCount = await queryOne(`
      SELECT t.id, t.name, t.color, t.created_at, COUNT(nt.note_id)::int as note_count
      FROM tags t
      LEFT JOIN note_tags nt ON t.id = nt.tag_id
      LEFT JOIN notes n ON nt.note_id = n.id
      WHERE t.id = $1 AND t.user_id = $2
      GROUP BY t.id, t.name, t.color, t.created_at
    `, [req.params.id, req.user.id]);

    // Return tag with note_count, or fallback to updated tag with 0 count if no notes found
    if (tagWithCount) {
      res.json(tagWithCount);
    } else {
      // Tag exists but has no notes (shouldn't happen after our check, but handle it)
      res.json({ ...updatedTag, note_count: 0 });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update tag color (kept for backward compatibility)
router.patch('/:id/color', async (req, res) => {
  try {
    const { color } = req.body;
    const db = getDb();
    
    // Check if tag belongs to user
    const tagExists = await queryOne('SELECT * FROM tags WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (!tagExists) {
      return res.status(404).json({ error: 'Tag not found' });
    }
    
    await db.query('UPDATE tags SET color = $1 WHERE id = $2 AND user_id = $3', [color, req.params.id, req.user.id]);
    const tag = await queryOne('SELECT * FROM tags WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    
    res.json(tag);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete tag
router.delete('/:id', async (req, res) => {
  try {
    const db = getDb();
    
    // Check if tag exists and belongs to user
    const tagExists = await queryOne(`
      SELECT t.* FROM tags t
      WHERE t.id = $1 AND t.user_id = $2
      LIMIT 1
    `, [req.params.id, req.user.id]);
    
    if (!tagExists) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    // Delete tag (note_tags will be deleted automatically due to CASCADE)
    await db.query('DELETE FROM tags WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    
    res.json({ message: 'Tag deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
