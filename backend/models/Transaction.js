const db = require('../database/db');
const { v4: uuidv4 } = require('uuid');

class TransactionModel {
  create(data) {
    try {
      const id = uuidv4();
      const now = new Date().toISOString();
      
      const stmt = db.prepare(`
        INSERT INTO transactions (id, user_id, project_id, type, amount, balance_after, description, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        id,
        data.userId,
        data.projectId || null,
        data.type,
        data.amount,
        data.balanceAfter,
        data.description,
        now
      );
      
      return this.getById(id);
    } catch (error) {
      console.error('Create transaction error:', error);
      throw error;
    }
  }
  
  getById(id) {
    try {
      const stmt = db.prepare('SELECT * FROM transactions WHERE id = ?');
      return stmt.get(id);
    } catch (error) {
      console.error('Get transaction error:', error);
      return null;
    }
  }
  
  // 获取用户的交易明细列表
  getByUserId(userId, options = {}) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const type = options.type;
    const offset = (page - 1) * limit;
    
    try {
      let query = 'SELECT * FROM transactions WHERE user_id = ?';
      let countQuery = 'SELECT COUNT(*) as total FROM transactions WHERE user_id = ?';
      let queryParams = [userId];
      let countParams = [userId];
      
      // 按类型筛选
      if (type) {
        query += ' AND type = ?';
        countQuery += ' AND type = ?';
        queryParams.push(type);
        countParams.push(type);
      }
      
      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      queryParams.push(limit, offset);
      
      const stmt = db.prepare(query);
      const rows = stmt.all(...queryParams);
      
      const countStmt = db.prepare(countQuery);
      const { total } = countStmt.get(...countParams);
      
      return {
        list: rows.map(row => this.formatRow(row)),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Get transactions error:', error);
      return { list: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
    }
  }
  
  // 获取消费统计
  getStatistics(userId) {
    try {
      const stmt = db.prepare(`
        SELECT 
          type,
          COUNT(*) as count,
          SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as income,
          SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as expense
        FROM transactions 
        WHERE user_id = ?
        GROUP BY type
      `);
      
      return stmt.all(userId);
    } catch (error) {
      console.error('Get statistics error:', error);
      return [];
    }
  }
  
  formatRow(row) {
    return {
      id: row.id,
      userId: row.user_id,
      projectId: row.project_id,
      type: row.type,
      amount: row.amount,
      balanceAfter: row.balance_after,
      description: row.description,
      createdAt: row.created_at
    };
  }
}

module.exports = new TransactionModel();
