const { Pool } = require('pg');
const logger = require('../utils/logger');

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
  process.exit(-1);
});

async function initDatabase() {
  const client = await pool.connect();
  try {
    // Create events table
    await client.query(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NOT NULL,
        category VARCHAR(100),
        image_url TEXT,
        organizer VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create favorites table
    await client.query(`
      CREATE TABLE IF NOT EXISTS favorites (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, event_id)
      )
    `);

    // Create indexes for better query performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_events_location ON events(latitude, longitude)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_events_category ON events(category)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id)
    `);

    logger.info('Database schema initialized successfully');
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  initDatabase,
  query: (text, params) => pool.query(text, params),
};
