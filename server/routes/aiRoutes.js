const express = require('express');
const { body, validationResult } = require('express-validator'); // 导入验证器
const aiController = require('../controllers/aiController');
const { verifyToken } = require('../middleware/authMiddleware');
const logger = require('../utils/logger');
const { DEFAULT_SYSTEM_PROMPT } = require('../config/prompts');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// --- 验证错误处理中间件 ---
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('[AiRoutes] 验证错误喵', { errors: errors.array(), path: req.path });
    return res.status(400).json({ message: errors.array()[0].msg }); 
  }
  next();
};

// 配置系统提示API的速率限制
const systemPromptLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5分钟
  max: 20, // 每个IP限制20次请求
  message: '请求系统提示太频繁了喵，请稍后再试！',
  standardHeaders: true,
  legacyHeaders: false,
});

// 系统提示缓存（内存缓存）
let systemPromptCache = {
  data: null,
  timestamp: 0
};

// --- 路由定义 ---

// POST /api/ai/chat - 需要认证
router.post(
  '/chat',
  verifyToken,
  // 验证规则
  body('messages', 'messages 必须是一个非空数组喵！').isArray({ min: 1 }),
  // 验证 messages 数组中的每个对象 (如果需要更严格)
  // body('messages[*].role', '消息角色必须是 user 或 assistant 或 system 喵！').isIn(['user', 'assistant', 'system']),
  // body('messages[*].content', '消息内容不能为空喵！').isString().notEmpty(),
  // 对可选参数进行验证
  body('model').optional().isString().withMessage('模型名称必须是字符串喵！'),
  body('temperature').optional().isFloat({ min: 0, max: 2 }).withMessage('温度值必须在 0 到 2 之间喵！'),
  body('max_tokens').optional({ nullable: true }).isInt({ min: 1 }).withMessage('max_tokens 必须是正整数喵！'),
  // 处理验证结果
  handleValidationErrors,
  // 控制器
  aiController.chatCompletion
);

// 增强：获取系统提示的路由 (添加缓存和速率限制)
router.get('/system-prompt', systemPromptLimiter, (req, res) => {
  // 检查缓存是否有效（2分钟内）
  const now = Date.now();
  const cacheAge = now - systemPromptCache.timestamp;
  const cacheValid = systemPromptCache.data && cacheAge < 120000; // 2分钟缓存
  
  if (cacheValid) {
    logger.info('[aiRoutes] 返回缓存的系统提示');
    return res.json(systemPromptCache.data);
  }
  
  // 缓存无效，返回新数据并更新缓存
  const responseData = { systemPrompt: DEFAULT_SYSTEM_PROMPT };
  
  // 更新缓存
  systemPromptCache = {
    data: responseData,
    timestamp: now
  };
  
  logger.info('[aiRoutes] 返回新的系统提示并更新缓存');
  res.json(responseData);
});

// 未来可以添加其他 AI 路由
// router.post('/summarize', verifyToken, summarizeValidationRules, handleValidationErrors, aiController.summarizeText);
// router.post('/suggest-title', verifyToken, suggestTitleValidationRules, handleValidationErrors, aiController.suggestTitle);

module.exports = router; 