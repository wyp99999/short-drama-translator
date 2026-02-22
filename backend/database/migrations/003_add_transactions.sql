-- 创建交易明细表
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  project_id TEXT,
  type TEXT NOT NULL, -- 'recharge'(充值), 'consume'(消费), 'refund'(退款)
  amount REAL NOT NULL, -- 正数为收入，负数为支出
  balance_after REAL NOT NULL, -- 交易后余额
  description TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_project ON transactions(project_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at);

-- 修改users表默认余额为1000
UPDATE users SET balance = 1000 WHERE balance = 44184.4;
