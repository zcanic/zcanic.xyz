const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { verifyToken } = require('../middleware/authMiddleware');

// Apply verifyToken middleware to all routes
// Using router.use with the middleware function directly
router.use(verifyToken);

// 获取单个任务状态
router.get('/:taskId', taskController.getTaskStatus);

// 批量获取任务状态
router.post('/batch', taskController.batchGetTasksStatus);

module.exports = router; 