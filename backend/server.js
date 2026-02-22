const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const logger = require('./services/logger');
const requestLogger = require('./middleware/requestLogger');
const security = require('./middleware/security');
const errorHandler = require('./middleware/errorHandler');
const config = require('./config');

const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const rechargeRoutes = require('./routes/recharge');

const app = express();
const PORT = config.port;

app.use(security.helmet);
app.use(cors());

if (config.nodeEnv === 'production') {
  app.use(security.rateLimiter);
  app.use(security.speedLimiter);
}
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', security.authLimiter, authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/recharge', rechargeRoutes);
app.use('/health', healthRoutes);

app.use(errorHandler);

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', { error: err.message, stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason: String(reason) });
});

let queue;
try {
  queue = require('./services/jobProcessor');
  logger.info('Job queue initialized');
} catch (err) {
  logger.warn('Job queue not available', { error: err.message });
}

app.listen(PORT, () => {
  logger.info(`Server started`, { port: PORT, env: config.nodeEnv });
});
