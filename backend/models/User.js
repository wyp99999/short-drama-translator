const db = require('../database/db');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;
const DEFAULT_BALANCE = 1000; // 新用户默认赠送1000积分

class UserModel {
  create(data) {
    try {
      const id = uuidv4();
      const now = new Date().toISOString();
      
      // 同步加密密码
      const passwordHash = bcrypt.hashSync(data.password, SALT_ROUNDS);
      
      const stmt = db.prepare(`
        INSERT INTO users (id, username, email, password_hash, balance, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        id,
        data.username,
        data.email,
        passwordHash,
        data.balance || DEFAULT_BALANCE,
        now
      );
      
      return this.getById(id);
    } catch (error) {
      console.error('Create user error:', error);
      throw error;
    }
  }
  
  getById(id) {
    try {
      const stmt = db.prepare('SELECT id, username, email, balance, created_at, last_login FROM users WHERE id = ?');
      return stmt.get(id);
    } catch (error) {
      console.error('Get user by id error:', error);
      return null;
    }
  }
  
  getByUsername(username) {
    try {
      const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
      return stmt.get(username);
    } catch (error) {
      console.error('Get user by username error:', error);
      return null;
    }
  }
  
  getByEmail(email) {
    try {
      const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
      return stmt.get(email);
    } catch (error) {
      console.error('Get user by email error:', error);
      return null;
    }
  }
  
  verifyPassword(user, password) {
    try {
      return bcrypt.compareSync(password, user.password_hash);
    } catch (error) {
      console.error('Verify password error:', error);
      return false;
    }
  }
  
  updateLastLogin(id) {
    try {
      const stmt = db.prepare('UPDATE users SET last_login = ? WHERE id = ?');
      stmt.run(new Date().toISOString(), id);
    } catch (error) {
      console.error('Update last login error:', error);
    }
  }
  
  // 扣除余额并记录交易（原子操作）
  deductBalance(userId, amount, projectId, description) {
    const transaction = db.transaction(() => {
      // 检查余额
      const user = this.getById(userId);
      if (!user || user.balance < amount) {
        return { success: false, message: '积分不足' };
      }
      
      // 扣除余额
      const stmt = db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?');
      stmt.run(amount, userId);
      
      // 记录交易
      const TransactionModel = require('./Transaction');
      TransactionModel.create({
        userId,
        projectId,
        type: 'consume',
        amount: -amount,
        balanceAfter: user.balance - amount,
        description
      });
      
      return { 
        success: true, 
        balance: user.balance - amount 
      };
    });
    
    try {
      return transaction();
    } catch (error) {
      console.error('Deduct balance error:', error);
      return { success: false, message: '扣费失败' };
    }
  }
  
  // 充值余额并记录交易
  rechargeBalance(userId, amount, description = '充值') {
    const transaction = db.transaction(() => {
      const user = this.getById(userId);
      if (!user) {
        return { success: false, message: '用户不存在' };
      }
      
      // 增加余额
      const stmt = db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?');
      stmt.run(amount, userId);
      
      // 记录交易
      const TransactionModel = require('./Transaction');
      TransactionModel.create({
        userId,
        type: 'recharge',
        amount,
        balanceAfter: user.balance + amount,
        description
      });
      
      return { 
        success: true, 
        balance: user.balance + amount 
      };
    });
    
    try {
      return transaction();
    } catch (error) {
      console.error('Recharge balance error:', error);
      return { success: false, message: '充值失败' };
    }
  }
  
  // 会话管理
  createSession(userId, token, expiresAt) {
    try {
      const id = uuidv4();
      const now = new Date().toISOString();
      
      const stmt = db.prepare(`
        INSERT INTO user_sessions (id, user_id, token, expires_at, created_at)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      stmt.run(id, userId, token, expiresAt, now);
      return id;
    } catch (error) {
      console.error('Create session error:', error);
      return null;
    }
  }
  
  getSessionByToken(token) {
    try {
      const stmt = db.prepare(`
        SELECT s.*, u.username, u.email, u.balance 
        FROM user_sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.token = ? AND s.expires_at > ?
      `);
      return stmt.get(token, new Date().toISOString());
    } catch (error) {
      console.error('Get session error:', error);
      return null;
    }
  }
  
  deleteSession(token) {
    try {
      const stmt = db.prepare('DELETE FROM user_sessions WHERE token = ?');
      stmt.run(token);
    } catch (error) {
      console.error('Delete session error:', error);
    }
  }
  
  deleteUserSessions(userId) {
    try {
      const stmt = db.prepare('DELETE FROM user_sessions WHERE user_id = ?');
      stmt.run(userId);
    } catch (error) {
      console.error('Delete user sessions error:', error);
    }
  }
}

module.exports = new UserModel();
