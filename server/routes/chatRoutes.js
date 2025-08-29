const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { verifyToken } = require('../middleware/authMiddleware');

// 所有聊天路由都需要身份验证
router.use(verifyToken);

// 获取用户会话列表
router.get('/sessions', chatController.getUserSessions);

// 创建新的聊天会话
router.post('/sessions', chatController.createSession);

// 获取特定会话的消息历史
router.get('/sessions/:sessionId/messages', chatController.getSessionMessages);

// 发送消息到特定会话
router.post('/sessions/:sessionId/messages', chatController.sendMessage);

// 删除会话
router.delete('/sessions/:sessionId', chatController.deleteSession);

module.exports = router; 