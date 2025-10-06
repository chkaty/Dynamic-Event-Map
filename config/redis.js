const redis = require('redis');
const logger = require('../utils/logger');

let redisClient;

async function initRedis() {
  const config = {
    socket: {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
    },
  };

  if (process.env.REDIS_PASSWORD) {
    config.password = process.env.REDIS_PASSWORD;
  }

  redisClient = redis.createClient(config);

  redisClient.on('error', (err) => {
    logger.error('Redis Client Error', err);
  });

  redisClient.on('connect', () => {
    logger.info('Redis Client Connected');
  });

  await redisClient.connect();
}

async function getCache(key) {
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logger.error('Redis get error:', error);
    return null;
  }
}

async function setCache(key, value, ttl = parseInt(process.env.CACHE_TTL) || 300) {
  try {
    await redisClient.setEx(key, ttl, JSON.stringify(value));
    return true;
  } catch (error) {
    logger.error('Redis set error:', error);
    return false;
  }
}

async function deleteCache(key) {
  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    logger.error('Redis delete error:', error);
    return false;
  }
}

async function invalidatePattern(pattern) {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
    return true;
  } catch (error) {
    logger.error('Redis invalidate pattern error:', error);
    return false;
  }
}

module.exports = {
  initRedis,
  getCache,
  setCache,
  deleteCache,
  invalidatePattern,
  client: () => redisClient,
};
