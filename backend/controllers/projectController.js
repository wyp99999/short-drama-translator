const ProjectModel = require('../models/Project');
const TaskModel = require('../models/Task');
const UserModel = require('../models/User');
const { getVideoDurationInSeconds } = require('get-video-duration');
const path = require('path');

const COST_PER_MINUTE = 10;

exports.getProjects = (req, res) => {
  try {
    const { keyword, page = 1, limit = 10 } = req.query;
    const userId = req.user?.userId;
    
    const result = ProjectModel.getPaged(keyword, userId, { 
      page: parseInt(page), 
      limit: parseInt(limit) 
    });
    
    const formattedProjects = result.list.map(p => ({
      id: p.id,
      name: p.name,
      materialCount: p.materialCount,
      languages: Array.isArray(p.languages) ? p.languages.join('、') : p.languages,
      createdAt: p.createdAt,
      completedAt: TaskModel.getByProjectId(p.id)?.completedAt || null,
      videoDuration: p.videoDuration,
      status: p.status,
      cost: p.cost
    }));
    
    res.json({
      code: 0,
      data: {
        list: formattedProjects,
        pagination: result.pagination
      },
      message: 'success'
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ code: 500, message: error.message });
  }
};

exports.createProject = async (req, res) => {
  try {
    const { name, languages } = req.body;
    const videoFile = req.file;
    const userId = req.user?.userId;
    
    if (!name || !videoFile || !languages) {
      return res.status(400).json({ 
        code: 400, 
        message: '请填写所有必填字段' 
      });
    }
    
    let languageList;
    try {
      languageList = JSON.parse(languages);
    } catch (e) {
      return res.status(400).json({ code: 400, message: '语言格式无效' });
    }
    
    // 获取视频时长
    let durationSeconds = 0;
    try {
      const videoPath = path.join(__dirname, '../uploads', videoFile.filename);
      durationSeconds = await getVideoDurationInSeconds(videoPath);
    } catch (err) {
      console.error('Get video duration error:', err);
      // 如果获取失败，使用默认值3分钟
      durationSeconds = 180;
    }
    
    // 转换为分钟（向上取整）
    const durationMinutes = Math.ceil(durationSeconds / 60);
    const totalCost = durationMinutes * COST_PER_MINUTE * languageList.length;
    
    // 检查用户余额
    const user = UserModel.getById(userId);
    if (!user) {
      return res.status(404).json({ code: 404, message: '用户不存在' });
    }
    
    if (user.balance < totalCost) {
      return res.status(400).json({ 
        code: 400, 
        message: `积分不足，需要 ${totalCost} 积分，当前余额 ${user.balance} 积分` 
      });
    }
    
    // 扣费
    const deductResult = UserModel.deductBalance(
      userId, 
      totalCost, 
      null, // projectId还未创建
      `创建项目"${name}"，视频时长${durationMinutes}分钟，${languageList.length}种语言`
    );
    
    if (!deductResult.success) {
      return res.status(400).json({ 
        code: 400, 
        message: deductResult.message || '扣费失败' 
      });
    }
    
    // 格式化视频时长显示
    const minutes = Math.floor(durationSeconds / 60);
    const seconds = Math.floor(durationSeconds % 60);
    const durationText = `${minutes}分钟${seconds > 0 ? seconds + '秒' : ''}`;
    
    // 创建项目
    const project = ProjectModel.create({
      name,
      languages: languageList,
      videoUrl: `/uploads/${videoFile.filename}`,
      videoDuration: durationText,
      cost: totalCost,
      userId
    });
    
    res.json({
      code: 0,
      data: {
        ...project,
        balance: deductResult.balance
      },
      message: '项目创建成功'
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ code: 500, message: error.message });
  }
};

exports.updateProject = (req, res) => {
  try {
    const { id } = req.params;
    const { name, languages } = req.body;
    const userId = req.user?.userId;
    
    const project = ProjectModel.getById(id, userId);
    if (!project) {
      return res.status(404).json({ code: 404, message: '项目不存在' });
    }
    
    // Handle name update
    if (name !== undefined && name !== null) {
      ProjectModel.update(id, { name }, userId);
    }
    
    // Handle languages update
    if (languages && Array.isArray(languages) && languages.length > 0) {
      const existingLangs = project.languages || [];
      const newLanguages = languages.filter(lang => !existingLangs.includes(lang));
      
      if (newLanguages.length > 0) {
        // 计算新增语言的费用
        const durationMatch = project.videoDuration.match(/(\d+)分钟/);
        const durationMinutes = durationMatch ? parseInt(durationMatch[1]) : 3;
        const additionalCost = durationMinutes * COST_PER_MINUTE * newLanguages.length;
        
        // 检查余额
        const user = UserModel.getById(userId);
        if (user.balance < additionalCost) {
          return res.status(400).json({ 
            code: 400, 
            message: `积分不足，需要 ${additionalCost} 积分，当前余额 ${user.balance} 积分` 
          });
        }
        
        // 扣费
        const deductResult = UserModel.deductBalance(
          userId, 
          additionalCost, 
          id,
          `项目"${project.name}"新增${newLanguages.length}种语言翻译`
        );
        
        if (!deductResult.success) {
          return res.status(400).json({ 
            code: 400, 
            message: deductResult.message || '扣费失败' 
          });
        }
        
        const updatedLangs = [...existingLangs, ...newLanguages];
        
        ProjectModel.update(id, {
          languages: updatedLangs,
          cost: project.cost + additionalCost
        }, userId);
      }
    }
    
    const updated = ProjectModel.getById(id, userId);
    
    res.json({
      code: 0,
      data: updated,
      message: '项目更新成功'
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ code: 500, message: error.message });
  }
};

exports.deleteProject = (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    
    const result = ProjectModel.delete(id, userId);
    
    if (!result) {
      return res.status(404).json({ code: 404, message: '项目不存在' });
    }
    
    res.json({
      code: 0,
      message: '项目删除成功'
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ code: 500, message: error.message });
  }
};

exports.getProjectStatus = (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    
    // 先验证项目属于当前用户
    const project = ProjectModel.getById(id, userId);
    if (!project) {
      return res.status(404).json({ code: 404, message: '项目不存在' });
    }
    
    const task = TaskModel.getByProjectId(id);
    
    if (!task) {
      return res.status(404).json({ code: 404, message: '任务不存在' });
    }
    
    res.json({
      code: 0,
      data: task,
      message: 'success'
    });
  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({ code: 500, message: error.message });
  }
};

exports.getProjectPreview = (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    
    const project = ProjectModel.getById(id, userId);
    const task = TaskModel.getByProjectId(id);
    
    if (!project) {
      return res.status(404).json({ code: 404, message: '项目不存在' });
    }
    
    res.json({
      code: 0,
      data: {
        id: project.id,
        name: project.name,
        videoUrl: project.videoUrl,
        languages: project.languages,
        translations: task ? task.translations : {}
      },
      message: 'success'
    });
  } catch (error) {
    console.error('Get preview error:', error);
    res.status(500).json({ code: 500, message: error.message });
  }
};
