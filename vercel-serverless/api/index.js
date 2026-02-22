// Vercel Serverless Function - 短剧翻译 API
// 部署到 Vercel 的 /api 路由

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

// 中间件
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// 内存数据库（Demo 用）
let projects = [];
let nextId = 1;

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'short-drama-translator',
    timestamp: new Date().toISOString(),
    version: '1.0.0-demo'
  });
});

// 获取项目列表
app.get('/api/projects', (req, res) => {
  res.json({
    success: true,
    data: projects,
    count: projects.length
  });
});

// 创建项目
app.post('/api/projects', (req, res) => {
  const { name, description, videoUrl, targetLanguage } = req.body;
  
  if (!name || !targetLanguage) {
    return res.status(400).json({
      success: false,
      message: '项目名称和目标语言是必填项'
    });
  }

  const project = {
    id: nextId++,
    name,
    description: description || '',
    videoUrl: videoUrl || '',
    targetLanguage,
    status: 'pending',
    progress: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  projects.push(project);

  // 模拟翻译进度
  setTimeout(() => {
    project.status = 'processing';
    project.progress = 50;
  }, 2000);

  setTimeout(() => {
    project.status = 'completed';
    project.progress = 100;
    project.completedAt = new Date().toISOString();
  }, 5000);

  res.json({
    success: true,
    data: project,
    message: '项目创建成功'
  });
});

// 获取项目详情
app.get('/api/projects/:id', (req, res) => {
  const project = projects.find(p => p.id === parseInt(req.params.id));
  
  if (!project) {
    return res.status(404).json({
      success: false,
      message: '项目不存在'
    });
  }

  res.json({
    success: true,
    data: project
  });
});

// 更新项目
app.put('/api/projects/:id', (req, res) => {
  const project = projects.find(p => p.id === parseInt(req.params.id));
  
  if (!project) {
    return res.status(404).json({
      success: false,
      message: '项目不存在'
    });
  }

  Object.assign(project, req.body, {
    updatedAt: new Date().toISOString()
  });

  res.json({
    success: true,
    data: project,
    message: '项目更新成功'
  });
});

// 删除项目
app.delete('/api/projects/:id', (req, res) => {
  const index = projects.findIndex(p => p.id === parseInt(req.params.id));
  
  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: '项目不存在'
    });
  }

  projects.splice(index, 1);

  res.json({
    success: true,
    message: '项目删除成功'
  });
});

// 获取任务状态
app.get('/api/projects/:id/status', (req, res) => {
  const project = projects.find(p => p.id === parseInt(req.params.id));
  
  if (!project) {
    return res.status(404).json({
      success: false,
      message: '项目不存在'
    });
  }

  res.json({
    success: true,
    data: {
      id: project.id,
      status: project.status,
      progress: project.progress,
      estimatedTime: project.status === 'processing' ? '剩余 2-3 分钟' : null
    }
  });
});

// 任务轮询接口（AI 服务使用）
app.get('/api/tasks/poll', (req, res) => {
  const pendingTask = projects.find(p => p.status === 'pending');
  
  if (!pendingTask) {
    return res.json({
      success: true,
      data: null,
      message: '没有待处理任务'
    });
  }

  pendingTask.status = 'processing';
  pendingTask.progress = 30;

  res.json({
    success: true,
    data: {
      taskId: pendingTask.id,
      projectId: pendingTask.id,
      videoUrl: pendingTask.videoUrl,
      targetLanguage: pendingTask.targetLanguage,
      createdAt: pendingTask.createdAt
    }
  });
});

// 任务完成接口
app.post('/api/tasks/:id/complete', (req, res) => {
  const project = projects.find(p => p.id === parseInt(req.params.id));
  
  if (!project) {
    return res.status(404).json({
      success: false,
      message: '项目不存在'
    });
  }

  const { translatedUrl, duration, cost } = req.body;

  project.status = 'completed';
  project.progress = 100;
  project.translatedUrl = translatedUrl || 'https://example.com/demo-translated.mp4';
  project.duration = duration || 120;
  project.cost = cost || 1200;
  project.completedAt = new Date().toISOString();

  res.json({
    success: true,
    data: project,
    message: '任务完成'
  });
});

// 404 处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API 路由不存在',
    availableRoutes: [
      'GET    /health',
      'GET    /api/projects',
      'POST   /api/projects',
      'GET    /api/projects/:id',
      'PUT    /api/projects/:id',
      'DELETE /api/projects/:id',
      'GET    /api/projects/:id/status',
      'GET    /api/tasks/poll',
      'POST   /api/tasks/:id/complete'
    ]
  });
});

// 导出为 Vercel Serverless Function
module.exports = app;