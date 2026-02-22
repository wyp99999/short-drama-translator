const express = require('express');
const router = express.Router();
const rechargeController = require('../controllers/rechargeController');
const { authenticateToken } = require('../middleware/auth');

// 获取充值比率（公开）
router.get('/rate', rechargeController.getRate);

// 充值需要认证
router.post('/', authenticateToken, rechargeController.recharge);

// 支付回调接口（供支付宝/微信支付回调使用）
router.post('/callback/alipay', rechargeController.alipayCallback);
router.post('/callback/wechat', rechargeController.wechatCallback);

// 查询充值订单状态
router.get('/order/:orderNo', authenticateToken, rechargeController.getOrderStatus);

module.exports = router;
