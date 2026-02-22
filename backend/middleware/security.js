const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

// 跳过认证接口的限流检查
const skipAuthRoutes = (req) => {
  return req.path.startsWith('/api/auth/');
};

const securityMiddleware = {
  helmet: helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "blob:"],
        mediaSrc: ["'self'", "blob:", "http://localhost:*"]
      }
    }
  }),
  
  // 通用限流 - 跳过认证接口
  rateLimiter: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    skip: skipAuthRoutes,
    message: { code: 429, message: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false
  }),
  
  // 认证接口专用限流（更宽松）
  authLimiter: rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 20, // 认证接口允许更多请求
    message: { code: 429, message: '登录尝试次数过多，请15分钟后再试' },
    standardHeaders: true,
    legacyHeaders: false
  }),
  
  uploadLimiter: rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: { code: 429, message: 'Upload limit exceeded, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false
  }),
  
  speedLimiter: slowDown({
    windowMs: 15 * 60 * 1000,
    delayAfter: 50,
    delayMs: () => 500,
    validate: { delayMs: false },
    skip: skipAuthRoutes
  })
};

module.exports = securityMiddleware;
