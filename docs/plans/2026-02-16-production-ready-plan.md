# 短剧翻译应用生产级完善计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将现有的内存版应用升级为生产就绪版本，集成SQLite持久化、任务队列、日志监控和Docker部署

**Architecture:** 采用SQLite单文件数据库存储项目和任务数据，使用Bull队列管理翻译任务，Winston记录结构化日志，Docker容器化部署

**Tech Stack:** SQLite3 + better-sqlite3, Redis + Bull, Winston, Docker, bcrypt, helmet, rate-limiter-flexible

---

## Task 1: 安装SQLite依赖并创建数据库

**Files:**
- Create: `backend/database/db.js`
- Create: `backend/database/schema.sql`
- Create: `backend/database/migrations/001_initial.sql`
- Modify: `backend/package.json`

**Step 1: 安装依赖**

Run: `cd backend && npm install better-sqlite3`
Expected: better-sqlite3 installed successfully

**Step 2: 创建数据库连接模块**

```javascript
// backend/database/db.js
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../data/app.db');
const dbDir = path.dirname(DB_PATH);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

module.exports = db;
```

**Step 3: 创建数据库Schema**

```sql
-- backend/database/schema.sql
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  material_count INTEGER DEFAULT 1,
  languages TEXT NOT NULL,
  created_at TEXT NOT NULL,
  video_duration TEXT,
  status TEXT DEFAULT 'pending',
  video_url TEXT,
  cost REAL DEFAULT 0,
  user_id TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  progress INTEGER DEFAULT 0,
  languages TEXT NOT NULL,
  completed_languages TEXT,
  translations TEXT,
  error TEXT,
  created_at TEXT NOT NULL,
  started_at TEXT,
  completed_at TEXT,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);
```

**Step 4: 初始化数据库**

```javascript
// backend/database/init.js
const db = require('./db');
const fs = require('fs');
const path = require('path');

function initDatabase() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  db.exec(schema);
  console.log('Database initialized successfully');
}

initDatabase();
```

**Step 5: Commit**

```bash
git add backend/database/
git add backend/package.json
git commit -m "feat: add SQLite database schema and connection"
```

---

## Task 2: 重构数据层使用SQLite

**Files:**
- Modify: `backend/models/Project.js`
- Modify: `backend/controllers/projectController.js`
- Modify: `backend/controllers/taskController.js`

**Step 1: 重构Project模型**

```javascript
// backend/models/Project.js
const db = require('../database/db');
const { v4: uuidv4 } = require('uuid');

class ProjectModel {
  create(data) {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const stmt = db.prepare(`
      INSERT INTO projects (id, name, material_count, languages, created_at, 
        video_duration, status, video_url, cost)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      data.name,
      data.materialCount || 1,
      JSON.stringify(data.languages),
      now,
      data.videoDuration || '',
      'pending',
      data.videoUrl || '',
      data.cost || 0
    );
    
    return this.getById(id);
  }
  
  getAll(keyword) {
    let query = 'SELECT * FROM projects ORDER BY created_at DESC';
    let params = [];
    
    if (keyword) {
      query = 'SELECT * FROM projects WHERE name LIKE ? ORDER BY created_at DESC';
      params = [`%${keyword}%`];
    }
    
    const stmt = db.prepare(query);
    const rows = stmt.all(...params);
    
    return rows.map(row => this.formatRow(row));
  }
  
  getById(id) {
    const stmt = db.prepare('SELECT * FROM projects WHERE id = ?');
    const row = stmt.get(id);
    return row ? this.formatRow(row) : null;
  }
  
  update(id, data) {
    const fields = Object.keys(data);
    if (fields.length === 0) return this.getById(id);
    
    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const stmt = db.prepare(`UPDATE projects SET ${setClause} WHERE id = ?`);
    stmt.run(...fields.map(f => data[f]), id);
    
    return this.getById(id);
  }
  
  delete(id) {
    const stmt = db.prepare('DELETE FROM projects WHERE id = ?');
    stmt.run(id);
    return true;
  }
  
  formatRow(row) {
    return {
      ...row,
      languages: JSON.parse(row.languages || '[]')
    };
  }
}

module.exports = new ProjectModel();
```

**Step 2: 重构Task模型**

```javascript
// backend/models/Task.js
const db = require('../database/db');

class TaskModel {
  create(data) {
    const stmt = db.prepare(`
      INSERT INTO tasks (id, project_id, status, languages, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      data.projectId,
      data.projectId,
      'pending',
      JSON.stringify(data.languages),
      new Date().toISOString()
    );
    
    return this.getById(data.projectId);
  }
  
  getById(id) {
    const stmt = db.prepare('SELECT * FROM tasks WHERE id = ?');
    const row = stmt.get(id);
    return row ? this.formatRow(row) : null;
  }
  
  getByProjectId(projectId) {
    const stmt = db.prepare('SELECT * FROM tasks WHERE project_id = ?');
    const row = stmt.get(projectId);
    return row ? this.formatRow(row) : null;
  }
  
  getPending() {
    const stmt = db.prepare(`
      SELECT t.*, p.video_url 
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE t.status = 'pending'
      LIMIT 1
    `);
    const row = stmt.get();
    return row ? this.formatRow(row) : null;
  }
  
  update(id, data) {
    const fields = Object.keys(data);
    if (fields.length === 0) return this.getById(id);
    
    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const stmt = db.prepare(`UPDATE tasks SET ${setClause} WHERE id = ?`);
    stmt.run(...fields.map(f => data[f]), id);
    
    return this.getById(id);
  }
  
  formatRow(row) {
    return {
      ...row,
      languages: JSON.parse(row.languages || '[]'),
      completedLanguages: JSON.parse(row.completed_languages || '[]'),
      translations: JSON.parse(row.translations || '{}')
    };
  }
}

module.exports = new TaskModel();
```

**Step 3: 更新控制器**

修改projectController.js以使用新模型：
- 使用Project.create()创建项目时同时创建任务
- 使用事务确保数据一致性

**Step 4: Commit**

```bash
git add backend/models/
git add backend/controllers/
git commit -m "refactor: migrate to SQLite database layer"
```

---

## Task 3: 添加Redis任务队列

**Files:**
- Modify: `backend/package.json`
- Create: `backend/services/queue.js`
- Create: `backend/services/jobProcessor.js`
- Modify: `backend/server.js`

**Step 1: 安装依赖**

Run: `cd backend && npm install bull ioredis`
Expected: bull and ioredis installed

**Step 2: 创建队列服务**

```javascript
// backend/services/queue.js
const Queue = require('bull');

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
};

const translationQueue = new Queue('translation', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    },
    timeout: 300000 // 5分钟
  }
});

module.exports = { translationQueue };
```

**Step 3: 创建任务处理器**

```javascript
// backend/services/jobProcessor.js
const { translationQueue } = require('./queue');
const TaskModel = require('../models/Task');
const ProjectModel = require('../models/Project');

// AI服务轮询处理器
async function processTranslationJob(job) {
  const { taskId, languages, videoUrl } = job.data;
  
  console.log(`Processing translation job: ${taskId}`);
  
  TaskModel.update(taskId, {
    status: 'processing',
    started_at: new Date().toISOString()
  });
  
  // 模拟AI处理时间
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  const translations = {};
  languages.forEach(lang => {
    translations[lang] = videoU
