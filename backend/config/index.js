require('dotenv').config();

const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  database: {
    path: process.env.DB_PATH || './data/app.db'
  },
  
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379
  },
  
  upload: {
    maxSize: parseInt(process.env.MAX_FILE_SIZE) || 500 * 1024 * 1024,
    allowedTypes: ['.mp4', '.mkv']
  },
  
  security: {
    rateLimitWindow: 15 * 60 * 1000,
    rateLimitMax: 100,
    uploadLimitWindow: 60 * 60 * 1000,
    uploadLimitMax: 10
  },
  
  cost: {
    perMinute: 10
  }
};

module.exports = config;
