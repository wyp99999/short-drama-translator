const TransactionModel = require('../models/Transaction');
const logger = require('../services/logger');

// 获取交易明细列表
exports.getTransactions = (req, res) => {
  try {
    const userId = req.user?.userId;
    const { page = 1, limit = 20, type } = req.query;
    
    const result = TransactionModel.getByUserId(userId, { 
      page: parseInt(page), 
      limit: parseInt(limit),
      type 
    });
    
    res.json({
      code: 0,
      data: result,
      message: 'success'
    });
  } catch (error) {
    logger.error('Get transactions error', { error: error.message });
    res.status(500).json({
      code: 500,
      message: '获取交易明细失败'
    });
  }
};

// 获取交易统计
exports.getStatistics = (req, res) => {
  try {
    const userId = req.user?.userId;
    
    const stats = TransactionModel.getStatistics(userId);
    
    res.json({
      code: 0,
      data: stats,
      message: 'success'
    });
  } catch (error) {
    logger.error('Get statistics error', { error: error.message });
    res.status(500).json({
      code: 500,
      message: '获取统计信息失败'
    });
  }
};
