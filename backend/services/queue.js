const Queue = require('bull');

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
};

const translationQueue = new Queue('translation', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    },
    timeout: 300000
  }
});

module.exports = { translationQueue, redisConfig };
