const express = require('express');
const router = express.Router();
const db = require('../database/db');

router.get('/', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    services: {}
  };
  
  try {
    db.prepare('SELECT 1').get();
    health.services.database = 'ok';
  } catch (err) {
    health.services.database = 'error';
    health.status = 'degraded';
  }
  
  try {
    const queueModule = require('../services/queue');
    if (queueModule && queueModule.translationQueue) {
      await queueModule.translationQueue.client.ping();
      health.services.redis = 'ok';
    } else {
      health.services.redis = 'not_configured';
    }
  } catch (err) {
    health.services.redis = 'not_configured';
  }
  
  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

router.get('/metrics', (req, res) => {
  const metrics = {
    timestamp: new Date().toISOString(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    uptime: process.uptime()
  };
  res.json(metrics);
});

module.exports = router;
