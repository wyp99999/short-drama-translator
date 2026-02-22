const UserModel = require('../models/User');
const logger = require('../services/logger');
const db = require('../database/db');

const POINTS_PER_YUAN = 100;

function createRechargeOrder({ userId, amount, points, channel, description }) {
  const orderNo = `R${Date.now()}${userId}`;
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO recharge_orders (order_no, user_id, amount, points, channel, status, description, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(orderNo, userId, amount, points, channel, 'pending', description, now);
  return { orderNo, createdAt: now };
}

function completeRechargeOrder(orderNo) {
  const orderStmt = db.prepare('SELECT * FROM recharge_orders WHERE order_no = ?');
  const order = orderStmt.get(orderNo);
  if (!order) {
    return { success: false, message: '订单不存在' };
  }
  if (order.status === 'paid') {
    const user = UserModel.getById(order.user_id);
    return { success: true, order, balance: user ? user.balance : undefined };
  }
  if (order.status === 'failed') {
    return { success: false, message: order.error || '订单已失败' };
  }

  const description =
    order.description ||
    `充值 ${order.amount} 元，获得 ${order.points} 积分 [${
      order.channel === 'alipay' ? '支付宝' : '微信支付'
    }]`;

  const result = UserModel.rechargeBalance(
    order.user_id,
    order.points,
    description
  );

  if (!result.success) {
    const failStmt = db.prepare(
      'UPDATE recharge_orders SET status = ?, error = ? WHERE order_no = ?'
    );
    failStmt.run('failed', result.message || '充值失败', orderNo);
    return { success: false, message: result.message || '充值失败' };
  }

  const paidAt = new Date().toISOString();
  const updateStmt = db.prepare(
    'UPDATE recharge_orders SET status = ?, paid_at = ? WHERE order_no = ?'
  );
  updateStmt.run('paid', paidAt, orderNo);

  return {
    success: true,
    order: { ...order, status: 'paid', paid_at: paidAt },
    balance: result.balance
  };
}

// 充值
exports.recharge = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { amount, channel = 'alipay' } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        code: 400,
        message: '请输入有效的充值金额'
      });
    }
    
    const validChannels = ['alipay', 'wechat'];
    if (!validChannels.includes(channel)) {
      return res.status(400).json({
        code: 400,
        message: '请选择有效的支付方式'
      });
    }
    
    const points = Math.floor(amount * POINTS_PER_YUAN);
    const description = `充值 ${amount} 元，获得 ${points} 积分 [${
      channel === 'alipay' ? '支付宝' : '微信支付'
    }]`;

    const orderInfo = createRechargeOrder({
      userId,
      amount,
      points,
      channel,
      description
    });

    logger.info('Payment order created', {
      userId,
      amount,
      points,
      channel,
      orderNo: orderInfo.orderNo
    });

    const result = completeRechargeOrder(orderInfo.orderNo);

    if (!result.success) {
      return res.status(500).json({
        code: 500,
        message: result.message || '充值失败'
      });
    }

    logger.info('User recharged successfully', {
      userId,
      amount,
      points,
      channel,
      orderNo: orderInfo.orderNo
    });
    
    res.json({
      code: 0,
      message: '充值成功',
      data: {
        amount,
        points,
        balance: result.balance,
        channel: channel,
        orderNo: orderInfo.orderNo,
        status: 'paid',
        channelName: channel === 'alipay' ? '支付宝' : '微信支付'
      }
    });
  } catch (error) {
    logger.error('Recharge error', { error: error.message });
    res.status(500).json({
      code: 500,
      message: '充值失败，请稍后重试'
    });
  }
};

// 获取充值比率
exports.getRate = (req, res) => {
  res.json({
    code: 0,
    data: {
      rate: POINTS_PER_YUAN,
      description: '1元 = 100积分'
    }
  });
};

// 支付宝回调
exports.alipayCallback = async (req, res) => {
  try {
    const { out_trade_no, trade_status, total_amount } = req.body;
    
    logger.info('Alipay callback received', { orderNo: out_trade_no, status: trade_status });
    
    if (trade_status === 'TRADE_SUCCESS' || trade_status === 'TRADE_FINISHED') {
      const result = completeRechargeOrder(out_trade_no);
      if (result.success) {
        logger.info('Alipay payment success', {
          orderNo: out_trade_no,
          amount: total_amount
        });
      } else {
        logger.error('Alipay payment complete failed', {
          orderNo: out_trade_no,
          error: result.message
        });
      }
    }
    
    res.send('success');
  } catch (error) {
    logger.error('Alipay callback error', { error: error.message });
    res.send('fail');
  }
};

// 微信支付回调
exports.wechatCallback = async (req, res) => {
  try {
    const xmlData = req.body;
    
    logger.info('WechatPay callback received');
    
    res.set('Content-Type', 'application/xml');
    res.send('<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>');
  } catch (error) {
    logger.error('WechatPay callback error', { error: error.message });
    res.set('Content-Type', 'application/xml');
    res.send('<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[处理失败]]></return_msg></xml>');
  }
};

// 查询订单状态
exports.getOrderStatus = async (req, res) => {
  try {
    const { orderNo } = req.params;
    const userId = req.user?.userId;
    
    const stmt = db.prepare(
      'SELECT * FROM recharge_orders WHERE order_no = ? AND user_id = ?'
    );
    const order = stmt.get(orderNo, userId);

    if (!order) {
      return res.status(404).json({
        code: 404,
        message: '订单不存在'
      });
    }

    logger.info('Order status queried', {
      userId,
      orderNo,
      status: order.status
    });

    let message = '订单处理中';
    if (order.status === 'paid') {
      message = '订单已支付';
    } else if (order.status === 'failed') {
      message = order.error || '订单支付失败';
    }

    res.json({
      code: 0,
      data: {
        orderNo: order.order_no,
        status: order.status,
        amount: order.amount,
        points: order.points,
        channel: order.channel,
        message
      }
    });
  } catch (error) {
    logger.error('Get order status error', { error: error.message });
    res.status(500).json({
      code: 500,
      message: '查询订单状态失败'
    });
  }
};
