const db = require('../database/db');
const { v4: uuidv4 } = require('uuid');

class ProjectModel {
  create(data) {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const stmt = db.prepare(`
      INSERT INTO projects (id, name, material_count, languages, created_at, 
        video_duration, status, video_url, cost, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      data.cost || 0,
      data.userId || null
    );
    
    const TaskModel = require('./Task');
    TaskModel.create({ projectId: id, languages: data.languages });
    
    return this.getById(id);
  }
  
  getAll(keyword, userId) {
    return this.getPaged(keyword, userId, { page: 1, limit: 1000 }).list;
  }

  getPaged(keyword, userId, options = {}) {
    const page = options.page && options.page > 0 ? options.page : 1;
    const limit = options.limit && options.limit > 0 ? options.limit : 10;
    const offset = (page - 1) * limit;

    let baseQuery = 'FROM projects';
    const whereParts = [];
    const params = [];

    if (userId) {
      whereParts.push('(user_id = ? OR user_id IS NULL)');
      params.push(userId);
    }

    if (keyword) {
      whereParts.push('name LIKE ?');
      params.push(`%${keyword}%`);
    }

    if (whereParts.length > 0) {
      baseQuery += ' WHERE ' + whereParts.join(' AND ');
    }

    const countStmt = db.prepare(`SELECT COUNT(*) as total ${baseQuery}`);
    const { total } = countStmt.get(...params);

    const listStmt = db.prepare(
      `SELECT * ${baseQuery} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    );
    const rows = listStmt.all(...params, limit, offset);

    return {
      list: rows.map(row => this.formatRow(row)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1
      }
    };
  }
  
  getById(id, userId) {
    let query = 'SELECT * FROM projects WHERE id = ?';
    let params = [id];
    
    if (userId) {
      query += ' AND (user_id = ? OR user_id IS NULL)';
      params.push(userId);
    }
    
    const stmt = db.prepare(query);
    const row = stmt.get(...params);
    return row ? this.formatRow(row) : null;
  }
  
  update(id, data, userId) {
    const allowedFields = ['name', 'status', 'video_url', 'cost', 'languages', 'updated_at'];
    const updates = {};
    
    for (const key of allowedFields) {
      if (data[key] !== undefined) {
        if (key === 'languages') {
          updates[key] = JSON.stringify(data[key]);
        } else {
          updates[key] = data[key];
        }
      }
    }
    
    if (Object.keys(updates).length === 0) return this.getById(id, userId);
    
    updates.updated_at = new Date().toISOString();
    
    let query = 'UPDATE projects SET ';
    query += Object.keys(updates).map(f => `${f} = ?`).join(', ');
    query += ' WHERE id = ?';
    
    const params = [...Object.values(updates), id];
    
    if (userId) {
      query += ' AND (user_id = ? OR user_id IS NULL)';
      params.push(userId);
    }
    
    const stmt = db.prepare(query);
    const result = stmt.run(...params);
    
    if (result.changes === 0) {
      return null;
    }
    
    return this.getById(id, userId);
  }
  
  delete(id, userId) {
    let query = 'DELETE FROM projects WHERE id = ?';
    let params = [id];
    
    if (userId) {
      query += ' AND (user_id = ? OR user_id IS NULL)';
      params.push(userId);
    }
    
    // 先删除关联的任务
    db.prepare('DELETE FROM tasks WHERE project_id = ?').run(id);
    
    const stmt = db.prepare(query);
    const result = stmt.run(...params);
    
    return result.changes > 0;
  }
  
  formatRow(row) {
    return {
      id: row.id,
      name: row.name,
      materialCount: row.material_count,
      languages: JSON.parse(row.languages || '[]'),
      createdAt: row.created_at,
      videoDuration: row.video_duration,
      status: row.status,
      videoUrl: row.video_url,
      cost: row.cost,
      userId: row.user_id
    };
  }
}

module.exports = new ProjectModel();
