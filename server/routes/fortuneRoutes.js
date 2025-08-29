// server/routes/fortuneRoutes.js
const express = require('express');
const { body, validationResult } = require('express-validator');
const fortuneController = require('../controllers/fortuneController');
const { verifyToken } = require('../middleware/authMiddleware');
const logger = require('../utils/logger');

const router = express.Router();

// --- 验证错误处理中间件 (复用或单独定义) ---
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('[FortuneRoutes] 验证错误喵', { errors: errors.array(), path: req.path, userId: req.user?.userId });
    // 只返回第一条错误信息给前端
    return res.status(400).json({ message: errors.array()[0].msg }); 
  }
  next();
};

// --- 路由定义 ---

// GET /api/fortune - 获取每日喵语 (需要认证)
router.get(
    '/', 
    verifyToken, // 确保用户已登录
    fortuneController.getDailyFortune
);

// POST /api/fortune/manual-trigger - 手动触发更新 (需要认证和密码)
router.post(
    '/manual-trigger',
    verifyToken, // 确保用户已登录
    // 验证请求体中必须包含 password 字段
    body('password', '必须提供手动触发密码喵！').notEmpty(),
    // 处理验证结果
    handleValidationErrors,
    // 控制器
    fortuneController.manualTriggerFortune
);

module.exports = router; 