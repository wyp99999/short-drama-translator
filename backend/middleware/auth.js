const jwt = require('jsonwebtoken');
const UserModel = require('../models/User');
const logger = require('../services/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// 验证JWT Token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      code: 401,
      message: '未提供认证令牌'
    });
  }
  
  try {
    // 验证token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 检查会话是否有效
    const session = UserModel.getSessionByToken(token);
    if (!session) {
      return res.status(401).json({
        code: 401,
        message: '登录已过期，请重新登录'
      });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        code: 401,
        message: '登录已过期，请重新登录'
      });
    }
    
    logger.error('Token verification error', { error: error.message });
    return res.status(403).json({
      code: 403,
      message: '无效的认证令牌'
    });
  }
}

// 可选认证（用于某些公共接口）
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const session = UserModel.getSessionByToken(token);
      if (session) {
        req.user = decoded;
      }
    } catch (error) {
      // 忽略错误，继续执行
    }
  }
  
  next();
}

module.exports = {
  authenticateToken,
  optionalAuth
};
