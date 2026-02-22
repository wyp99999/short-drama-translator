const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');

router.get('/poll', taskController.pollTask);
router.post('/:taskId/complete', taskController.completeTask);

module.exports = router;
