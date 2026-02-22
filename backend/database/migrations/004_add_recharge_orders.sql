CREATE TABLE IF NOT EXISTS recharge_orders (
  order_no TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  amount REAL NOT NULL,
  points INTEGER NOT NULL,
  channel TEXT NOT NULL,
  status TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL,
  paid_at TEXT,
  error TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_recharge_orders_user ON recharge_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_recharge_orders_created ON recharge_orders(created_at);

