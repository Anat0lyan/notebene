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


// Get all notes with optional filters
router.get('/', async (req, res) => {
  try {
    const { search, tags, sort = 'updated_at', order = 'DESC', archived = false } = req.query;
    const db = getDb();
    
    let queryText = `
      SELECT n.id, n.user_id, n.title, n.content, n.created_at, n.updated_at, n.is_archived, n.is_favorite,
        STRING_AGG(t.id::text || ':' || t.name || ':' || COALESCE(t.color, ''), ',' ORDER BY t.name) FILTER (WHERE t.id IS NOT NULL) as tags_data
      FROM notes n
      LEFT JOIN note_tags nt ON n.id = nt.note_id AND nt.user_id = $1
      LEFT JOIN tags t ON nt.tag_id = t.id
      WHERE n.user_id = $1 AND n.is_archived = $2
    `;
    const params = [req.user.id, archived === 'true' || archived === true];

    let paramIndex = 3;

    if (search) {
      queryText += ` AND (n.title ILIKE $${paramIndex} OR n.content ILIKE $${paramIndex + 1})`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
      paramIndex += 2;
    }

    queryText += ' GROUP BY n.id, n.user_id, n.title, n.content, n.created_at, n.updated_at, n.is_archived, n.is_favorite';

    if (tags) {
      const tagIds = Array.isArray(tags) ? tags : [tags];
      const placeholders = tagIds.map((_, i) => `$${paramIndex + i}`).join(',');
      queryText += ` HAVING COUNT(CASE WHEN t.id IN (${placeholders}) THEN 1 END) = $${paramIndex + tagIds.length}`;
      params.push(...tagIds, tagIds.length);
    }

    const validSorts = ['created_at', 'updated_at', 'title'];
    const sortField = validSorts.includes(sort) ? sort : 'updated_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    queryText += ` ORDER BY n.${sortField} ${sortOrder}`;

    const notes = await query(queryText, params);

    const formattedNotes = notes.map(note => ({
      ...note,
      tags: note.tags_data && note.tags_data.trim()
        ? note.tags_data.split(',').map(tagStr => {
            const [id, name, color] = tagStr.split(':');
            return { id: parseInt(id), name, color: color || null };
          })
        : []
    }));

    res.json(formattedNotes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single note
router.get('/:id', async (req, res) => {
  try {
    const note = await queryOne('SELECT * FROM notes WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const tags = await query(`
      SELECT t.* FROM tags t
      INNER JOIN note_tags nt ON t.id = nt.tag_id
      WHERE nt.note_id = $1 AND nt.user_id = $2
    `, [req.params.id, req.user.id]);

    res.json({ ...note, tags });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create note
router.post('/', async (req, res) => {
  try {
    const { title, content, tags = [] } = req.body;
    const db = getDb();

    const result = await db.query(
      'INSERT INTO notes (user_id, title, content) VALUES ($1, $2, $3) RETURNING id',
      [req.user.id, title, content]
    );

    const noteId = result.rows[0].id;

    // Handle tags
    for (const tagName of tags) {
      if (!tagName.trim()) continue;
      
      let tag = await queryOne('SELECT * FROM tags WHERE name = $1 AND user_id = $2', [tagName.trim(), req.user.id]);
      if (!tag) {
        const tagResult = await db.query('INSERT INTO tags (name, user_id) VALUES ($1, $2) RETURNING id', [tagName.trim(), req.user.id]);
        tag = { id: tagResult.rows[0].id, name: tagName.trim() };
      }

      await db.query(
        'INSERT INTO note_tags (note_id, tag_id, user_id) VALUES ($1, $2, $3) ON CONFLICT (note_id, tag_id) DO NOTHING',
        [noteId, tag.id, req.user.id]
      );
    }

    const note = await queryOne('SELECT * FROM notes WHERE id = $1', [noteId]);
    const noteTags = await query(`
      SELECT t.* FROM tags t
      INNER JOIN note_tags nt ON t.id = nt.tag_id
      WHERE nt.note_id = $1
    `, [noteId]);

    res.status(201).json({ ...note, tags: noteTags });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update note
router.put('/:id', async (req, res) => {
  try {
    const { title, content, tags = [] } = req.body;
    const db = getDb();

    const existingNote = await queryOne('SELECT * FROM notes WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (!existingNote) {
      return res.status(404).json({ error: 'Note not found' });
    }

    await db.query(
      'UPDATE notes SET title = $1, content = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
      [title, content, req.params.id]
    );

    // Update tags
    await db.query('DELETE FROM note_tags WHERE note_id = $1', [req.params.id]);

    for (const tagName of tags) {
      if (!tagName.trim()) continue;
      
      let tag = await queryOne('SELECT * FROM tags WHERE name = $1 AND user_id = $2', [tagName.trim(), req.user.id]);
      if (!tag) {
        const tagResult = await db.query('INSERT INTO tags (name, user_id) VALUES ($1, $2) RETURNING id', [tagName.trim(), req.user.id]);
        tag = { id: tagResult.rows[0].id, name: tagName.trim() };
      }

      await db.query('INSERT INTO note_tags (note_id, tag_id, user_id) VALUES ($1, $2, $3)', [req.params.id, tag.id, req.user.id]);
    }

    const note = await queryOne('SELECT * FROM notes WHERE id = $1', [req.params.id]);
    const noteTags = await query(`
      SELECT t.* FROM tags t
      INNER JOIN note_tags nt ON t.id = nt.tag_id
      WHERE nt.note_id = $1 AND nt.user_id = $2
    `, [req.params.id, req.user.id]);

    res.json({ ...note, tags: noteTags });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete note
router.delete('/:id', async (req, res) => {
  try {
    const note = await queryOne('SELECT * FROM notes WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const db = getDb();
    await db.query('DELETE FROM notes WHERE id = $1', [req.params.id]);
    res.json({ message: 'Note deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle archive
router.patch('/:id/archive', async (req, res) => {
  try {
    const note = await queryOne('SELECT * FROM notes WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const db = getDb();
    await db.query('UPDATE notes SET is_archived = $1 WHERE id = $2', [!note.is_archived, req.params.id]);
    const updated = await queryOne('SELECT * FROM notes WHERE id = $1', [req.params.id]);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle favorite
router.patch('/:id/favorite', async (req, res) => {
  try {
    const note = await queryOne('SELECT * FROM notes WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const db = getDb();
    await db.query('UPDATE notes SET is_favorite = $1 WHERE id = $2', [!note.is_favorite, req.params.id]);
    const updated = await queryOne('SELECT * FROM notes WHERE id = $1', [req.params.id]);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
