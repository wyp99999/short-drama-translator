const db = require('../database/db');

class TaskModel {
  create(data) {
    const now = new Date().toISOString();
    
    const stmt = db.prepare(`
      INSERT INTO tasks (id, project_id, status, languages, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      data.projectId,
      data.projectId,
      'pending',
      JSON.stringify(data.languages || []),
      now
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
    const allowedFields = ['status', 'progress', 'completed_languages', 'translations', 'error', 'started_at', 'completed_at'];
    const updates = {};
    
    for (const key of allowedFields) {
      if (data[key] !== undefined) {
        if (key === 'translations' || key === 'completed_languages') {
          updates[key] = JSON.stringify(data[key]);
        } else {
          updates[key] = data[key];
        }
      }
    }
    
    if (Object.keys(updates).length === 0) return this.getById(id);
    
    const setClause = Object.keys(updates).map(f => `${f} = ?`).join(', ');
    const stmt = db.prepare(`UPDATE tasks SET ${setClause} WHERE id = ?`);
    stmt.run(...Object.values(updates), id);
    
    return this.getById(id);
  }
  
  formatRow(row) {
    return {
      id: row.id,
      projectId: row.project_id,
      status: row.status,
      progress: row.progress,
      languages: JSON.parse(row.languages || '[]'),
      completedLanguages: JSON.parse(row.completed_languages || '[]'),
      translations: JSON.parse(row.translations || '{}'),
      error: row.error,
      createdAt: row.created_at,
      startedAt: row.started_at,
      completedAt: row.completed_at
    };
  }
}

module.exports = new TaskModel();
