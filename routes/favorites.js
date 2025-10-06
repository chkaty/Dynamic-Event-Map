const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { getCache, setCache, invalidatePattern } = require('../config/redis');
const logger = require('../utils/logger');

// Get user favorites
router.get('/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const cacheKey = `favorites:${userId}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const result = await db.query(
      `SELECT e.* FROM events e
       INNER JOIN favorites f ON e.id = f.event_id
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC`,
      [userId]
    );

    await setCache(cacheKey, result.rows);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// Add event to favorites
router.post('/', async (req, res, next) => {
  try {
    const { userId, eventId } = req.body;

    if (!userId || !eventId) {
      return res.status(400).json({
        error: { message: 'Missing userId or eventId', status: 400 },
      });
    }

    // Check if event exists
    const eventCheck = await db.query('SELECT id FROM events WHERE id = $1', [eventId]);
    if (eventCheck.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Event not found', status: 404 } });
    }

    const result = await db.query(
      'INSERT INTO favorites (user_id, event_id) VALUES ($1, $2) ON CONFLICT (user_id, event_id) DO NOTHING RETURNING *',
      [userId, eventId]
    );

    await invalidatePattern(`favorites:${userId}`);
    logger.info(`Favorite added: user ${userId}, event ${eventId}`);
    res.status(201).json(result.rows[0] || { message: 'Already in favorites' });
  } catch (error) {
    next(error);
  }
});

// Remove event from favorites
router.delete('/:userId/:eventId', async (req, res, next) => {
  try {
    const { userId, eventId } = req.params;

    const result = await db.query(
      'DELETE FROM favorites WHERE user_id = $1 AND event_id = $2 RETURNING *',
      [userId, eventId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Favorite not found', status: 404 } });
    }

    await invalidatePattern(`favorites:${userId}`);
    logger.info(`Favorite removed: user ${userId}, event ${eventId}`);
    res.json({ message: 'Favorite removed successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
