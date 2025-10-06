const request = require('supertest');
const app = require('../server');

// Mock database and redis to avoid actual connections during tests
jest.mock('../config/database', () => ({
  initDatabase: jest.fn().mockResolvedValue(undefined),
  query: jest.fn(),
  pool: {
    connect: jest.fn().mockResolvedValue({
      query: jest.fn(),
      release: jest.fn(),
    }),
  },
}));

jest.mock('../config/redis', () => ({
  initRedis: jest.fn().mockResolvedValue(undefined),
  getCache: jest.fn().mockResolvedValue(null),
  setCache: jest.fn().mockResolvedValue(true),
  deleteCache: jest.fn().mockResolvedValue(true),
  invalidatePattern: jest.fn().mockResolvedValue(true),
}));

const db = require('../config/database');

describe('Events API', () => {
  describe('GET /api/events', () => {
    it('should return all events', async () => {
      const mockEvents = [
        {
          id: 1,
          title: 'Test Event',
          description: 'Test Description',
          latitude: 40.7128,
          longitude: -74.0060,
          start_time: '2024-01-01T10:00:00Z',
          end_time: '2024-01-01T12:00:00Z',
          category: 'Music',
        },
      ];

      db.query.mockResolvedValueOnce({ rows: mockEvents });
      db.query.mockResolvedValueOnce({ rows: [{ count: '1' }] });

      const response = await request(app).get('/api/events');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('events');
      expect(response.body).toHaveProperty('pagination');
    });

    it('should filter events by category', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });
      db.query.mockResolvedValueOnce({ rows: [{ count: '0' }] });

      const response = await request(app).get('/api/events?category=Music');

      expect(response.status).toBe(200);
      expect(db.query).toHaveBeenCalled();
    });
  });

  describe('POST /api/events', () => {
    it('should create a new event', async () => {
      const newEvent = {
        title: 'New Event',
        description: 'New Description',
        latitude: 40.7128,
        longitude: -74.0060,
        start_time: '2024-01-01T10:00:00Z',
        end_time: '2024-01-01T12:00:00Z',
        category: 'Music',
      };

      db.query.mockResolvedValueOnce({
        rows: [{ id: 1, ...newEvent }],
      });

      const response = await request(app)
        .post('/api/events')
        .send(newEvent);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(newEvent.title);
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/events')
        .send({ title: 'Incomplete Event' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/events/:id', () => {
    it('should return a single event', async () => {
      const mockEvent = {
        id: 1,
        title: 'Test Event',
        latitude: 40.7128,
        longitude: -74.0060,
      };

      db.query.mockResolvedValueOnce({ rows: [mockEvent] });

      const response = await request(app).get('/api/events/1');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 1);
    });

    it('should return 404 for non-existent event', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app).get('/api/events/999');

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/events/:id', () => {
    it('should update an event', async () => {
      const updatedEvent = {
        id: 1,
        title: 'Updated Event',
      };

      db.query.mockResolvedValueOnce({
        rows: [updatedEvent],
      });

      const response = await request(app)
        .put('/api/events/1')
        .send({ title: 'Updated Event' });

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Updated Event');
    });
  });

  describe('DELETE /api/events/:id', () => {
    it('should delete an event', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

      const response = await request(app).delete('/api/events/1');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });
  });
});

describe('Search API', () => {
  describe('GET /api/search', () => {
    it('should search events by query', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });
      db.query.mockResolvedValueOnce({ rows: [{ count: '0' }] });

      const response = await request(app).get('/api/search?q=music');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('query', 'music');
    });

    it('should return 400 without query parameter', async () => {
      const response = await request(app).get('/api/search');

      expect(response.status).toBe(400);
    });
  });
});

describe('Favorites API', () => {
  describe('GET /api/favorites/:userId', () => {
    it('should return user favorites', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app).get('/api/favorites/user123');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /api/favorites', () => {
    it('should add event to favorites', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // Event exists check
      db.query.mockResolvedValueOnce({ rows: [{ id: 1, user_id: 'user123', event_id: 1 }] });

      const response = await request(app)
        .post('/api/favorites')
        .send({ userId: 'user123', eventId: 1 });

      expect(response.status).toBe(201);
    });

    it('should return 400 for missing fields', async () => {
      const response = await request(app)
        .post('/api/favorites')
        .send({ userId: 'user123' });

      expect(response.status).toBe(400);
    });
  });
});

describe('Health Check', () => {
  it('should return healthy status', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'healthy');
  });
});
