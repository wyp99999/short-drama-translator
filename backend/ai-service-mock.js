const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function pollTask() {
  try {
    const response = await axios.get(`${API_BASE}/tasks/poll`);
    const task = response.data.data;
    
    if (task) {
      console.log('获取到任务:', task.projectId);
      await processTask(task);
    } else {
      console.log('暂无待处理任务');
    }
  } catch (error) {
    console.error('轮询任务失败:', error.message);
  }
}

async function processTask(task) {
  console.log('开始处理任务:', task.projectId);
  
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  const translations = {};
  task.languages.forEach(lang => {
    translations[lang] = `/uploads/translated_${task.projectId}_${lang}.mp4`;
  });
  
  try {
    await axios.post(`${API_BASE}/tasks/${task.projectId}/complete`, {
      status: 'completed',
      translations
    });
    console.log('任务完成:', task.projectId);
  } catch (error) {
    console.error('提交结果失败:', error.message);
  }
}

console.log('AI翻译服务模拟器启动...');
console.log('每15秒轮询一次任务');

pollTask();
setInterval(pollTask, 15000);
