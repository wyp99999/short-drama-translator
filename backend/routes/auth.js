const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// 公开接口
router.post('/register', authController.register);
router.post('/login', authController.login);

// 需要认证的接口
router.post('/logout', authenticateToken, authController.logout);
router.get('/me', authenticateToken, authController.getCurrentUser);

module.exports = router;
