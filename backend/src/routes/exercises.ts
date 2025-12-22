import express, { Request, Response } from 'express';
import { query } from '../config/database';

const router = express.Router();

// Get all exercises
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await query(
      'SELECT id, name, description, category, difficulty_level, created_at FROM exercises ORDER BY created_at DESC'
    );
    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount
    });
  } catch (error) {
    console.error('Error fetching exercises:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching exercises',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get exercise by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query(
      'SELECT id, name, description, category, difficulty_level, created_at FROM exercises WHERE id = $1',
      [id]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Exercise not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching exercise:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching exercise',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create new exercise
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description, category, difficulty_level } = req.body;
    
    if (!name || !category) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, category'
      });
    }
    
    const result = await query(
      'INSERT INTO exercises (name, description, category, difficulty_level) VALUES ($1, $2, $3, $4) RETURNING id, name, description, category, difficulty_level, created_at',
      [name, description || null, category, difficulty_level || 'intermediate']
    );
    
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Exercise created successfully'
    });
  } catch (error) {
    console.error('Error creating exercise:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating exercise',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
