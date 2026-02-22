// 云环境数据库配置 - 支持 PostgreSQL
const { Pool } = require('pg');

let pool;

function initDatabase() {
  // 从环境变量获取数据库连接信息
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.warn('DATABASE_URL not set, using SQLite fallback');
    return require('./db'); // 回退到 SQLite
  }

  const config = {
    connectionString: databaseUrl,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 10, // 连接池大小
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };

  pool = new Pool(config);

  // 测试连接
  pool.query('SELECT 1')
    .then(() => console.log('✅ PostgreSQL connected successfully'))
    .catch(err => {
      console.error('❌ PostgreSQL connection error:', err.message);
      console.log('Falling back to SQLite...');
      pool = null;
    });

  return {
    query: (text, params) => pool.query(text, params),
    end: () => pool.end(),
    on: (event, callback) => pool.on(event, callback),
  };
}

// 导出数据库实例
const db = initDatabase();

module.exports = db;