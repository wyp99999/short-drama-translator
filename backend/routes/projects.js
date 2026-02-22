const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const projectController = require('../controllers/projectController');
const { authenticateToken } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'video-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.mp4', '.mkv'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only .mp4 and .mkv files are allowed'));
    }
  }
});

// 所有项目路由都需要认证
router.use(authenticateToken);

router.get('/', projectController.getProjects);
router.post('/', upload.single('video'), projectController.createProject);
router.put('/:id', projectController.updateProject);
router.delete('/:id', projectController.deleteProject);
router.get('/:id/status', projectController.getProjectStatus);
router.get('/:id/preview', projectController.getProjectPreview);

module.exports = router;
