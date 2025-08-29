// server/routes/memoryRoutes.js
const express = require('express');
const router = express.Router();
const memoryController = require('../controllers/memoryController');
const { verifyToken } = require('../middleware/authMiddleware');
const logger = require('../utils/logger');

// Middleware to verify token for all memory routes
router.use(verifyToken);

// --- Routes --- 

// GET /api/memory - Get memories for the logged-in user
router.get('/', async (req, res, next) => {
  logger.info(`[Route /memory GET] Request received from user ${req.user.id}`);
  try {
    const pool = req.app.locals.pool; // Get pool from app locals
    // Pass the pool as the first argument
    const memories = await memoryController.getMemoriesForUser(pool, req.user.id);
    res.json(memories);
  } catch (error) {
    logger.error(`[Route /memory GET] Error fetching memories for user ${req.user.id}:`, error);
    next(error); // Pass errors to the global error handler
  }
});

// POST /api/memory - Add a new memory for the logged-in user
// (Implementation for v1 might be deferred or admin-only)
/*
router.post('/', async (req, res) => {
  logger.info(`[Route /memory POST] Request received from user ${req.user.id}`);
  const { type, content } = req.body;
  if (!content) {
    return res.status(400).json({ message: '记忆内容不能为空喵！' });
  }
  try {
    // const newMemory = await memoryController.addMemory(req.user.id, type, content);
    // res.status(201).json(newMemory);
    res.status(501).json({ message: '添加记忆功能暂未实现喵'}); // Placeholder
  } catch (error) {
    logger.error(`[Route /memory POST] Error adding memory for user ${req.user.id}:`, error);
    res.status(500).json({ message: error.message || '添加记忆失败喵 T_T' });
  }
});
*/

module.exports = router; 