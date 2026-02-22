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
