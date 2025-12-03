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

// Get tasks by note_id
router.get('/by-note/:noteId', async (req, res) => {
  try {
    const { noteId } = req.params;
    const db = getDb();
    
    // Verify note belongs to user
    const note = await queryOne('SELECT * FROM notes WHERE id = $1 AND user_id = $2', [noteId, req.user.id]);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const tasks = await query(`
      SELECT t.*, n.title as note_title
      FROM tasks t
      LEFT JOIN notes n ON t.note_id = n.id
      WHERE t.note_id = $1 AND t.user_id = $2
      ORDER BY t.due_date ASC NULLS LAST
    `, [noteId, req.user.id]);

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all tasks with optional filters
router.get('/', async (req, res) => {
  try {
    const { filter, sort = 'due_date', order = 'ASC' } = req.query;
    const db = getDb();
    
    let queryText = `
      SELECT t.*, n.title as note_title
      FROM tasks t
      LEFT JOIN notes n ON t.note_id = n.id
      WHERE t.user_id = $1
    `;
    const params = [req.user.id];

    let paramIndex = 2;

    // Apply filters
    if (filter === 'today') {
      queryText += ` AND DATE(t.due_date) = CURRENT_DATE AND t.completed = FALSE`;
    } else if (filter === 'upcoming') {
      queryText += ` AND t.due_date > CURRENT_TIMESTAMP AND t.completed = FALSE`;
    } else if (filter === 'overdue') {
      queryText += ` AND t.due_date < CURRENT_TIMESTAMP AND t.completed = FALSE`;
    } else if (filter === 'completed') {
      queryText += ` AND t.completed = TRUE`;
    } else if (filter === 'pending') {
      queryText += ` AND t.completed = FALSE`;
    }

    // Apply sorting
    const validSorts = ['due_date', 'priority', 'created_at', 'title'];
    const sortField = validSorts.includes(sort) ? sort : 'due_date';
    const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    
    if (sortField === 'priority') {
      queryText += ` ORDER BY CASE t.priority 
        WHEN 'high' THEN 1 
        WHEN 'medium' THEN 2 
        WHEN 'low' THEN 3 
      END ${sortOrder}, t.due_date ASC`;
    } else {
      queryText += ` ORDER BY t.${sortField} ${sortOrder} NULLS LAST`;
    }

    const tasks = await query(queryText, params);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get task statistics
router.get('/stats', async (req, res) => {
  try {
    const db = getDb();
    
    const stats = await queryOne(`
      SELECT 
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE completed = TRUE)::int as completed,
        COUNT(*) FILTER (WHERE completed = FALSE AND DATE(due_date) = CURRENT_DATE)::int as due_today,
        COUNT(*) FILTER (WHERE completed = FALSE AND due_date < CURRENT_TIMESTAMP)::int as overdue,
        COUNT(*) FILTER (WHERE completed = FALSE AND due_date > CURRENT_TIMESTAMP)::int as upcoming
      FROM tasks
      WHERE user_id = $1
    `, [req.user.id]);

    res.json(stats || { total: 0, completed: 0, due_today: 0, overdue: 0, upcoming: 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single task
router.get('/:id', async (req, res) => {
  try {
    const task = await queryOne(`
      SELECT t.*, n.title as note_title
      FROM tasks t
      LEFT JOIN notes n ON t.note_id = n.id
      WHERE t.id = $1 AND t.user_id = $2
    `, [req.params.id, req.user.id]);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create task
router.post('/', async (req, res) => {
  try {
    const { 
      title, 
      description, 
      dueDate, 
      priority = 'medium', 
      noteId, 
      recurringType = 'none',
      recurringInterval = 1,
      reminder
    } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    // Validate note belongs to user if provided
    if (noteId) {
      const note = await queryOne('SELECT * FROM notes WHERE id = $1 AND user_id = $2', [noteId, req.user.id]);
      if (!note) {
        return res.status(404).json({ error: 'Note not found' });
      }
    }

    const db = getDb();
    const result = await db.query(`
      INSERT INTO tasks (
        user_id, title, description, due_date, priority, 
        note_id, recurring_type, recurring_interval, reminder
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      req.user.id,
      title,
      description || null,
      dueDate || null,
      priority,
      noteId || null,
      recurringType,
      recurringInterval,
      reminder || null
    ]);

    const task = result.rows[0];
    
    // Get note title if exists
    if (task.note_id) {
      const note = await queryOne('SELECT title FROM notes WHERE id = $1', [task.note_id]);
      task.note_title = note?.title || null;
    }

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update task
router.put('/:id', async (req, res) => {
  try {
    const { 
      title, 
      description, 
      dueDate, 
      priority, 
      noteId, 
      recurringType,
      recurringInterval,
      reminder
    } = req.body;

    const db = getDb();
    
    // Check if task exists and belongs to user
    const existingTask = await queryOne('SELECT * FROM tasks WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Validate note if provided
    if (noteId !== undefined) {
      if (noteId) {
        const note = await queryOne('SELECT * FROM notes WHERE id = $1 AND user_id = $2', [noteId, req.user.id]);
        if (!note) {
          return res.status(404).json({ error: 'Note not found' });
        }
      }
    }

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (title !== undefined) {
      updateFields.push(`title = $${paramIndex++}`);
      updateValues.push(title);
    }
    if (description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      updateValues.push(description);
    }
    if (dueDate !== undefined) {
      updateFields.push(`due_date = $${paramIndex++}`);
      updateValues.push(dueDate);
    }
    if (priority !== undefined) {
      updateFields.push(`priority = $${paramIndex++}`);
      updateValues.push(priority);
    }
    if (noteId !== undefined) {
      updateFields.push(`note_id = $${paramIndex++}`);
      updateValues.push(noteId);
    }
    if (recurringType !== undefined) {
      updateFields.push(`recurring_type = $${paramIndex++}`);
      updateValues.push(recurringType);
    }
    if (recurringInterval !== undefined) {
      updateFields.push(`recurring_interval = $${paramIndex++}`);
      updateValues.push(recurringInterval);
    }
    if (reminder !== undefined) {
      updateFields.push(`reminder = $${paramIndex++}`);
      updateValues.push(reminder);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(req.params.id);
    
    const queryText = `UPDATE tasks SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const result = await db.query(queryText, updateValues);
    const updatedTask = result.rows[0];

    // Get note title if exists
    if (updatedTask.note_id) {
      const note = await queryOne('SELECT title FROM notes WHERE id = $1', [updatedTask.note_id]);
      updatedTask.note_title = note?.title || null;
    }

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle task completion
router.patch('/:id/toggle', async (req, res) => {
  try {
    const db = getDb();
    
    const task = await queryOne('SELECT * FROM tasks WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await db.query('UPDATE tasks SET completed = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [!task.completed, req.params.id]);
    const updated = await queryOne('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
    
    // Get note title if exists
    if (updated.note_id) {
      const note = await queryOne('SELECT title FROM notes WHERE id = $1', [updated.note_id]);
      updated.note_title = note?.title || null;
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete task
router.delete('/:id', async (req, res) => {
  try {
    const db = getDb();
    
    const task = await queryOne('SELECT * FROM tasks WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await db.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

