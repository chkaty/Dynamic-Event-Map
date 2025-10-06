const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { getCache, setCache } = require('../config/redis');

// Search events by title, description, or organizer
router.get('/', async (req, res, next) => {
  try {
    const { q, page = 1, limit = 50 } = req.query;

    if (!q) {
      return res.status(400).json({
        error: { message: 'Search query parameter "q" is required', status: 400 },
      });
    }

    const cacheKey = `search:${q}:${page}:${limit}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const searchPattern = `%${q}%`;
    const result = await db.query(
      `SELECT * FROM events 
       WHERE title ILIKE $1 OR description ILIKE $1 OR organizer ILIKE $1
       ORDER BY start_time ASC
       LIMIT $2 OFFSET $3`,
      [searchPattern, limit, (page - 1) * limit]
    );

    const countResult = await db.query(
      `SELECT COUNT(*) FROM events 
       WHERE title ILIKE $1 OR description ILIKE $1 OR organizer ILIKE $1`,
      [searchPattern]
    );

    const total = parseInt(countResult.rows[0].count);

    const response = {
      events: result.rows,
      query: q,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };

    await setCache(cacheKey, response);
    res.json(response);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
