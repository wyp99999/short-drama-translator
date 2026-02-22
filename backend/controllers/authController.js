const jwt = require('jsonwebtoken');
const UserModel = require('../models/User');
const logger = require('../services/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// 生成JWT Token
function generateToken(user) {
  return jwt.sign(
    { 
      userId: user.id, 
      username: user.username,
      email: user.email 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// 注册
exports.register = (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // 验证输入
    if (!username || !email || !password) {
      return res.status(400).json({
        code: 400,
        message: '请填写所有必填字段'
      });
    }
    
    // 验证用户名格式
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return res.status(400).json({
        code: 400,
        message: '用户名必须是3-20位字母、数字或下划线'
      });
    }
    
    // 验证邮箱格式
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        code: 400,
        message: '请输入有效的邮箱地址'
      });
    }
    
    // 验证密码长度
    if (password.length < 6) {
      return res.status(400).json({
        code: 400,
        message: '密码长度不能少于6位'
      });
    }
    
    // 检查用户名是否已存在
    const existingUser = UserModel.getByUsername(username);
    if (existingUser) {
      return res.status(409).json({
        code: 409,
        message: '用户名已被使用'
      });
    }
    
    // 检查邮箱是否已存在
    const existingEmail = UserModel.getByEmail(email);
    if (existingEmail) {
      return res.status(409).json({
        code: 409,
        message: '邮箱已被注册'
      });
    }
    
    // 创建用户
    const user = UserModel.create({
      username,
      email,
      password
    });
    
    if (!user) {
      return res.status(500).json({
        code: 500,
        message: '创建用户失败'
      });
    }
    
    // 生成Token
    const token = generateToken(user);
    
    // 保存会话
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    UserModel.createSession(user.id, token, expiresAt.toISOString());
    
    logger.info('User registered', { userId: user.id, username: user.username });
    
    res.status(201).json({
      code: 0,
      message: '注册成功',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          balance: user.balance
        },
        token
      }
    });
  } catch (error) {
    logger.error('Register error', { error: error.message, stack: error.stack });
    res.status(500).json({
      code: 500,
      message: '注册失败，请稍后重试'
    });
  }
};

// 登录
exports.login = (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        code: 400,
        message: '请输入用户名和密码'
      });
    }
    
    // 查找用户
    const user = UserModel.getByUsername(username);
    if (!user) {
      return res.status(401).json({
        code: 401,
        message: '用户名或密码错误'
      });
    }
    
    // 验证密码
    const isValid = UserModel.verifyPassword(user, password);
    if (!isValid) {
      return res.status(401).json({
        code: 401,
        message: '用户名或密码错误'
      });
    }
    
    // 更新最后登录时间
    UserModel.updateLastLogin(user.id);
    
    // 生成Token
    const token = generateToken(user);
    
    // 保存会话
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    UserModel.createSession(user.id, token, expiresAt.toISOString());
    
    logger.info('User logged in', { userId: user.id, username: user.username });
    
    res.json({
      code: 0,
      message: '登录成功',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          balance: user.balance
        },
        token
      }
    });
  } catch (error) {
    logger.error('Login error', { error: error.message });
    res.status(500).json({
      code: 500,
      message: '登录失败，请稍后重试'
    });
  }
};

// 退出登录
exports.logout = (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      UserModel.deleteSession(token);
    }
    
    logger.info('User logged out', { userId: req.user?.userId });
    
    res.json({
      code: 0,
      message: '退出登录成功'
    });
  } catch (error) {
    logger.error('Logout error', { error: error.message });
    res.status(500).json({
      code: 500,
      message: '退出登录失败'
    });
  }
};

// 获取当前用户信息
exports.getCurrentUser = (req, res) => {
  try {
    const user = UserModel.getById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
    }
    
    res.json({
      code: 0,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        balance: user.balance
      }
    });
  } catch (error) {
    logger.error('Get current user error', { error: error.message });
    res.status(500).json({
      code: 500,
      message: '获取用户信息失败'
    });
  }
};
