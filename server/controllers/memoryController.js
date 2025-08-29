// server/controllers/memoryController.js

// const pool = require('../db/database').pool;
const logger = require('../utils/logger');

// TODO: Implement memory related functions

// Example: Get memories for a user
const getMemoriesForUser = async (pool, userId, limit = 5) => {
  logger.info(`[MemoryCtrl] Fetching memories for user ${userId} with limit ${limit}`);
  if (!pool) {
      logger.error('[MemoryCtrl] getMemoriesForUser called without a valid pool object.');
      throw new Error('Database pool is not available for memory retrieval.');
  }
  try {
    const [rows] = await pool.query(
      'SELECT id, memory_type, memory_content, created_at FROM user_memories WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
      [userId, limit]
    );
    logger.info(`[MemoryCtrl] Found ${rows.length} memories for user ${userId}`);
    return rows;
  } catch (error) {
    logger.error(`[MemoryCtrl] Error fetching memories for user ${userId}:`, error);
    throw new Error('无法获取记忆喵 T_T');
  }
};

// TODO: Add function to add memory (addMemory)
// Needs to accept pool as well
// const addMemory = async (pool, userId, type, content) => { ... };

module.exports = {
  getMemoriesForUser,
  // addMemory,
}; 