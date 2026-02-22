const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { authenticateToken } = require('../middleware/auth');

// 所有交易路由都需要认证
router.use(authenticateToken);

router.get('/', transactionController.getTransactions);
router.get('/statistics', transactionController.getStatistics);

module.exports = router;
