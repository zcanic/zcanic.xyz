const express = require('express');
const { body, validationResult } = require('express-validator'); // 导入验证器
const rateLimit = require('express-rate-limit'); // <-- 导入速率限制器
const authController = require('../controllers/authController');
const logger = require('../utils/logger'); // <-- Added import for logger
const { handleValidationErrors } = require('../middleware/validationErrorHandler'); // <-- 导入共享的处理函数
const { verifyToken } = require('../middleware/authMiddleware'); // <-- 导入 verifyToken

const router = express.Router();

// --- 速率限制器配置 ---
const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 分钟
	max: 10, // 每个 IP 在窗口期内最多 10 次请求
	message: '尝试次数过多喵，请 15 分钟后再试！',
	standardHeaders: true, // 返回 RateLimit-* 头信息
	legacyHeaders: false, // 不返回 X-RateLimit-* 头信息
});

// --- 注册路由 ---
// POST /api/auth/register
router.post(
  '/register',
  authLimiter, // <-- 应用速率限制
  // 验证规则
  body('username', '用户名格式不正确喵 (3-20位字母、数字或下划线)！').isString().trim().matches(/^[a-zA-Z0-9_]{3,20}$/),
  body('password', '密码长度至少需要 6 位喵！').isString().isLength({ min: 6 }),
  handleValidationErrors, // <-- 使用导入的函数
  // 控制器
  authController.register
);

// --- 登录路由 ---
// POST /api/auth/login
router.post(
  '/login',
  authLimiter, // <-- 应用速率限制
  // 验证规则 (可以稍微宽松一点，因为控制器还会检查)
  body('username', '用户名不能为空喵！').isString().trim().notEmpty(),
  body('password', '密码不能为空喵！').isString().notEmpty(),
  handleValidationErrors, // <-- 使用导入的函数
  // 控制器
  authController.login
);

// --- 登出路由 --- 
// POST /api/auth/logout (使用 POST 避免 CSRF 问题，即使只是清除 cookie)
// 也可以是 GET，取决于具体安全考量
router.post('/logout', authController.logout);

// --- 获取当前用户信息路由 --- 
// GET /api/auth/me (需要认证)
router.get(
    '/me',
    verifyToken, // <-- 先验证 token (现在从 cookie 读取)
    authController.getMe // <-- 指向新的控制器函数
);

module.exports = router; 