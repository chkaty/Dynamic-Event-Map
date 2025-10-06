const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { getCache, setCache, invalidatePattern } = require('../config/redis');
const logger = require('../utils/logger');

// Get all events with optional filtering
router.get('/', async (req, res, next) => {
  try {
    const {
      category,
      startDate,
      endDate,
      minLat,
      maxLat,
      minLng,
      maxLng,
      page = 1,
      limit = 50,
    } = req.query;

    const cacheKey = `events:${JSON.stringify(req.query)}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    let query = 'SELECT * FROM events WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (category) {
      query += ` AND category = $${paramCount}`;
      params.push(category);
      paramCount++;
    }

    if (startDate) {
      query += ` AND start_time >= $${paramCount}`;
      params.push(startDate);
      paramCount++;
    }

    if (endDate) {
      query += ` AND end_time <= $${paramCount}`;
      params.push(endDate);
      paramCount++;
    }

    if (minLat && maxLat && minLng && maxLng) {
      query += ` AND latitude BETWEEN $${paramCount} AND $${paramCount + 1}`;
      query += ` AND longitude BETWEEN $${paramCount + 2} AND $${paramCount + 3}`;
      params.push(minLat, maxLat, minLng, maxLng);
      paramCount += 4;
    }

    query += ' ORDER BY start_time ASC';
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, (page - 1) * limit);

    const result = await db.query(query, params);

    const countQuery = 'SELECT COUNT(*) FROM events WHERE 1=1';
    const countResult = await db.query(countQuery);
    const total = parseInt(countResult.rows[0].count);

    const response = {
      events: result.rows,
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

// Get single event
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const cacheKey = `event:${id}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const result = await db.query('SELECT * FROM events WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Event not found', status: 404 } });
    }

    await setCache(cacheKey, result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Create new event
router.post('/', async (req, res, next) => {
  try {
    const {
      title,
      description,
      latitude,
      longitude,
      start_time,
      end_time,
      category,
      image_url,
      organizer,
    } = req.body;

    if (!title || !latitude || !longitude || !start_time || !end_time) {
      return res.status(400).json({
        error: { message: 'Missing required fields', status: 400 },
      });
    }

    const result = await db.query(
      `INSERT INTO events (title, description, latitude, longitude, start_time, end_time, category, image_url, organizer)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [title, description, latitude, longitude, start_time, end_time, category, image_url, organizer]
    );

    await invalidatePattern('events:*');
    logger.info(`Event created: ${result.rows[0].id}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Update event
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      latitude,
      longitude,
      start_time,
      end_time,
      category,
      image_url,
      organizer,
    } = req.body;

    const result = await db.query(
      `UPDATE events 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           latitude = COALESCE($3, latitude),
           longitude = COALESCE($4, longitude),
           start_time = COALESCE($5, start_time),
           end_time = COALESCE($6, end_time),
           category = COALESCE($7, category),
           image_url = COALESCE($8, image_url),
           organizer = COALESCE($9, organizer),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $10
       RETURNING *`,
      [title, description, latitude, longitude, start_time, end_time, category, image_url, organizer, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Event not found', status: 404 } });
    }

    await invalidatePattern('events:*');
    await invalidatePattern(`event:${id}`);
    logger.info(`Event updated: ${id}`);
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Delete event
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query('DELETE FROM events WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Event not found', status: 404 } });
    }

    await invalidatePattern('events:*');
    await invalidatePattern(`event:${id}`);
    logger.info(`Event deleted: ${id}`);
    res.json({ message: 'Event deleted successfully', id });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
