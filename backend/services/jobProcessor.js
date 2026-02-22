const { translationQueue } = require('./queue');
const TaskModel = require('../models/Task');
const ProjectModel = require('../models/Project');

async function processTranslationJob(job) {
  const { taskId, languages, videoUrl } = job.data;
  
  console.log(`Processing translation job: ${taskId}`);
  
  TaskModel.update(taskId, {
    status: 'processing',
    startedAt: new Date().toISOString()
  });
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  const translations = {};
  languages.forEach(lang => {
    translations[lang] = videoUrl.replace('.mp4', `_${lang}.mp4`);
  });
  
  TaskModel.update(taskId, {
    status: 'completed',
    completedAt: new Date().toISOString(),
    translations: translations,
    completedLanguages: languages
  });
  
  ProjectModel.update(taskId, {
    status: 'completed'
  });
  
  return { success: true, translations };
}

if (translationQueue) {
  translationQueue.process(processTranslationJob);
  
  translationQueue.on('completed', (job, result) => {
    console.log(`Job ${job.id} completed`);
  });
  
  translationQueue.on('failed', (job, err) => {
    console.error(`Job ${job.id} failed:`, err.message);
    if (job.data && job.data.taskId) {
      TaskModel.update(job.data.taskId, {
        status: 'failed',
        error: err.message
      });
    }
  });
}

module.exports = { translationQueue, processTranslationJob };
