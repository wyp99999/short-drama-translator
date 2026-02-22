const db = require('./db');
const fs = require('fs');
const path = require('path');

function initDatabase() {
  // 执行主schema
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  db.exec(schema);
  
  // 执行migrations
  const migrationsDir = path.join(__dirname, 'migrations');
  if (fs.existsSync(migrationsDir)) {
    const migrationFiles = fs.readdirSync(migrationsDir).sort();
    
    // 创建迁移记录表
    db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT UNIQUE,
        executed_at TEXT
      )
    `);
    
    for (const file of migrationFiles) {
      if (file.endsWith('.sql')) {
        // 检查是否已执行
        const checkStmt = db.prepare('SELECT 1 FROM migrations WHERE filename = ?');
        const executed = checkStmt.get(file);
        
        if (!executed) {
          console.log(`Executing migration: ${file}`);
          const migration = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
          
          // 执行迁移
          db.exec(migration);
          
          // 记录迁移
          const insertStmt = db.prepare('INSERT INTO migrations (filename, executed_at) VALUES (?, ?)');
          insertStmt.run(file, new Date().toISOString());
        }
      }
    }
  }
  
  console.log('Database initialized successfully');
}

initDatabase();
