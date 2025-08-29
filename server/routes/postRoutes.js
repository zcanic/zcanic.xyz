const express = require('express');
const { body, param, validationResult } = require('express-validator'); // 导入验证器
const postController = require('../controllers/postController');
const { verifyToken } = require('../middleware/authMiddleware'); // 导入认证中间件
const logger = require('../utils/logger'); // 导入 logger
const { handleValidationErrors } = require('../middleware/validationErrorHandler'); // <-- 导入共享的处理函数
const postValidationRules = require('../middleware/validators/postValidators'); // <-- 导入验证规则

const router = express.Router();

// --- 帖子路由 ---

// GET /api/posts - 获取所有帖子 (公开，支持搜索)
router.get('/', postController.getAllPosts);

// POST /api/posts - 创建新帖子 (需要认证)
router.post(
  '/', 
  verifyToken, 
  postValidationRules.createPost, // <-- 使用导入的规则
  handleValidationErrors, 
  postController.createPost
);

// GET /api/posts/:id - 获取单个帖子详情 (公开)
router.get(
  '/:id', 
  postValidationRules.getPostById, // <-- 使用导入的规则
  handleValidationErrors, 
  postController.getPostById
);

// DELETE /api/posts/:id - 删除帖子 (需要认证 + 权限检查)
router.delete(
  '/:id', 
  verifyToken, 
  postValidationRules.deletePost, // <-- 使用导入的规则
  handleValidationErrors, 
  postController.deletePost
);

module.exports = router; 