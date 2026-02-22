const TaskModel = require('../models/Task');
const ProjectModel = require('../models/Project');

let translationQueue = null;
try {
  const queueModule = require('../services/queue');
  translationQueue = queueModule.translationQueue;
} catch (err) {
  console.log('Queue not available');
}

exports.pollTask = (req, res) => {
  try {
    const task = TaskModel.getPending();
    
    if (!task) {
      return res.json({
        code: 0,
        data: null,
        message: 'No pending tasks'
      });
    }
    
    TaskModel.update(task.id, {
      status: 'processing',
      startedAt: new Date().toISOString()
    });
    
    if (translationQueue) {
      translationQueue.add({
        taskId: task.id,
        projectId: task.projectId,
        videoUrl: task.video_url,
        languages: task.languages
      });
    }
    
    res.json({
      code: 0,
      data: {
        taskId: task.id,
        projectId: task.projectId,
        videoUrl: task.video_url,
        languages: task.languages,
        createdAt: task.createdAt
      },
      message: 'Task assigned'
    });
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message });
  }
};

exports.completeTask = (req, res) => {
  try {
    const { taskId } = req.params;
    const { status, translations, error } = req.body;
    
    const task = TaskModel.getById(taskId);
    if (!task) {
      return res.status(404).json({ code: 404, message: 'Task not found' });
    }
    
    const updateData = {
      status: status === 'completed' ? 'completed' : 'failed',
      completedAt: new Date().toISOString()
    };
    
    if (status === 'completed' && translations) {
      updateData.translations = translations;
      updateData.completedLanguages = Object.keys(translations);
    }
    
    if (status === 'failed' && error) {
      updateData.error = error;
    }
    
    TaskModel.update(taskId, updateData);
    ProjectModel.update(taskId, { status: updateData.status });
    
    res.json({
      code: 0,
      message: 'Task completed'
    });
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message });
  }
};
