// server/controllers/fortuneController.js
const openai = require('../config/openaiConfig'); 
const logger = require('../utils/logger'); 
const { getFortunePrompt } = require('../config/prompts'); // <-- Import the prompt function
const { callChatCompletion } = require('../utils/aiUtils'); // <-- Import callChatCompletion
const { v4: uuidv4 } = require('uuid');
const { createTask } = require('../utils/taskManager');
// const DailyFortune = require('../models/DailyFortune'); // <-- REMOVE Mongoose model import

// --- 辅助函数：计算当前喵语周期的开始时间 (UTC) ---
// 北京时间 (CST, UTC+8) 的凌晨 4 点是周期的开始
const getFortuneCycleStartCST = (now = new Date()) => {
    const CST_OFFSET = 8 * 60 * 60 * 1000; // UTC+8 偏移量（毫秒）
    const RESET_HOUR_CST = 4; // 北京时间凌晨 4 点

    // 1. 计算当前北京时间
    const nowCST = new Date(now.getTime() + CST_OFFSET);

    // 2. 获取北京时间的日期部分，并设置时间为当天的 4:00 AM
    const cycleStartCST = new Date(nowCST);
    cycleStartCST.setUTCHours(RESET_HOUR_CST, 0, 0, 0); // 在 UTC+8 的时间上设置小时

    // 3. 如果当前北京时间早于当天 4 点，则周期开始于前一天的 4 点
    if (nowCST < cycleStartCST) {
        cycleStartCST.setUTCDate(cycleStartCST.getUTCDate() - 1);
    }

    // 4. 将计算出的北京时间 4 点转换回 UTC 时间戳，以便于数据库存储和查询
    const cycleStartUTC = new Date(cycleStartCST.getTime() - CST_OFFSET);
    return cycleStartUTC;
};

// 格式化日期为 YYYY-MM-DD 格式，确保一致的日期存储格式
const formatDateForDB = (date) => {
    return date.toISOString().split('T')[0];
};

// --- 修改后的获取每日喵语 (异步处理版本) --- 
exports.getDailyFortune = async (req, res) => {
  logger.info('[fortuneController] getDailyFortune: 收到请求喵~');
  const currentUser = req.user; 
  const userId = currentUser?.id;
  const username = currentUser?.username || '主人';
  
  // 严格检查用户ID
  const isValidUserId = typeof userId === 'number' && userId > 0;
  if (!isValidUserId) {
    logger.warn('[fortuneController] getDailyFortune: 无效的用户ID', { userIdRaw: userId, user: currentUser });
    return res.status(401).json({ message: '需要有效的登录信息才能获取每日喵语哦！' });
  }
  
  const dbPool = req.app.locals.pool;

  if (!dbPool) {
    logger.error('[fortuneController] 数据库连接池不可用喵！');
    return res.status(500).json({ message: '数据库服务暂时不可用喵 T_T' });
  }

  // 检查OpenAI实例是否可用
  if (!openai) {
    logger.error('[fortuneController] OpenAI实例不可用，无法生成喵语！请检查API密钥配置。');
    return res.status(503).json({ message: 'AI服务暂时不可用喵，请联系管理员检查配置' });
  }

  try {
    const cycleStartTimeUTC = getFortuneCycleStartCST();
    const formattedDate = formatDateForDB(cycleStartTimeUTC);
    logger.info(`[fortuneController] 用户 ${username} (ID: ${userId}) 请求喵语，周期开始(UTC): ${cycleStartTimeUTC.toISOString()}, 格式化日期: ${formattedDate}`);

    // 1. 查询数据库中当前周期的记录
    const selectQuery = 'SELECT id, content, status, task_id FROM daily_fortunes WHERE user_id = ? AND DATE(generated_at) = ?';
    const [rows] = await dbPool.query(selectQuery, [userId, formattedDate]);

    if (rows.length > 0) {
      logger.info(`[fortuneController] 找到用户 ${username} 的当日喵语记录，状态: ${rows[0].status}`);
      
      // 返回现有喵语，包括处理中的状态
      return res.json({ 
        content: rows[0].content,
        status: rows[0].status || 'completed',
        fortuneId: rows[0].id,
        taskId: rows[0].task_id
      });
    }

    logger.info(`[fortuneController] 用户 ${username} 当日无记录，创建新的喵语任务...`);

    // 2. 如果没有记录，创建一个新的异步喵语任务
    const fortuneId = uuidv4();
    
    // 创建任务
    const taskId = await createTask(dbPool, userId, 'fortune', fortuneId);
    
    // 在数据库中创建占位记录 - 使用最小化的占位内容
    await dbPool.query(
      'INSERT INTO daily_fortunes (id, user_id, content, generated_at, status, task_id) VALUES (?, ?, ?, ?, ?, ?)',
      [fortuneId, userId, '', formattedDate, 'pending', taskId]
    );
    
    // 返回占位内容和pending状态
    res.status(202).json({
      content: '',
      status: 'pending',
      fortuneId,
      taskId
    });

  } catch (error) {
    logger.error('[fortuneController] 处理 getDailyFortune 时发生错误喵:', error, {
        userId: userId,
        username: username,
        errorMessage: error.message, 
        errorStack: error.stack,
        sqlErrorCode: error.code,
        sqlErrorNo: error.errno,
        sqlMessage: error.sqlMessage
    });
    
    res.status(500).json({ message: '获取每日喵语失败，请稍后再试' });
  }
};

// --- 修改后的手动触发功能 (异步处理版本) ---
exports.manualTriggerFortune = async (req, res) => {
    logger.info('[fortuneController] manualTriggerFortune: 收到手动触发请求喵~');
    const currentUser = req.user;
    const userId = currentUser?.id;
    const username = currentUser?.username || '主人';
    const userRole = currentUser?.role;
    
    // 严格检查用户ID
    const isValidUserId = typeof userId === 'number' && userId > 0;
    if (!isValidUserId) {
        logger.warn('[fortuneController] manualTrigger: 无效的用户ID', { userIdRaw: userId, user: currentUser });
        return res.status(401).json({ message: '需要有效的登录信息才能手动触发喵！' });
    }
    
    const { password } = req.body; 
    const dbPool = req.app.locals.pool;

    if (!dbPool) {
      logger.error('[fortuneController] 数据库连接池不可用喵！');
      return res.status(500).json({ message: '数据库服务暂时不可用喵 T_T' });
    }

    const manualPassword = process.env.MANUAL_TRIGGER_PASSWORD;

    if (!manualPassword) {
        logger.error('[fortuneController] manualTrigger: 错误！未设置 MANUAL_TRIGGER_PASSWORD。');
        return res.status(500).json({ message: '服务器端手动触发功能未正确配置喵 T_T' });
    }

    // 使用常量时间比较密码（虽然不是核心安全功能，但这是良好习惯）
        if (password !== manualPassword) {
        logger.warn(`[fortuneController] manualTrigger: 用户 ${username} (ID: ${userId}) 提供了错误的触发密码`);
        return res.status(401).json({ message: '手动触发密码不正确喵' });
    }

    // 检查用户角色 (如果启用了角色检查)
    if (process.env.REQUIRE_ADMIN_FOR_MANUAL_TRIGGER === 'true' && userRole !== 'admin') {
        logger.warn(`[fortuneController] manualTrigger: 用户 ${username} (ID: ${userId}) 尝试手动触发，但不是管理员`);
        return res.status(403).json({ message: '需要管理员权限才能手动触发喵！' });
    }

    try {
        // 获取当前周期开始时间和格式化日期
        const cycleStartTimeUTC = getFortuneCycleStartCST();
        const formattedDate = formatDateForDB(cycleStartTimeUTC);
        
        // 创建新的喵语记录
        const fortuneId = uuidv4();
        
        // 创建任务
        const taskId = await createTask(dbPool, userId, 'fortune', fortuneId);
        
        // 先检查是否已存在当天的记录
        const [existingRecords] = await dbPool.query(
            'SELECT id FROM daily_fortunes WHERE user_id = ? AND DATE(generated_at) = ?',
            [userId, formattedDate]
        );
        
        if (existingRecords.length > 0) {
            // 存在记录，则更新
            await dbPool.query(
                'UPDATE daily_fortunes SET id = ?, content = ?, status = ?, task_id = ? WHERE user_id = ? AND DATE(generated_at) = ?',
                [fortuneId, '', 'pending', taskId, userId, formattedDate]
            );
            logger.info(`[fortuneController] manualTrigger: 已更新用户 ${username} 的喵语记录`);
        } else {
            // 不存在记录，则插入新记录
            await dbPool.query(
                'INSERT INTO daily_fortunes (id, user_id, content, generated_at, status, task_id) VALUES (?, ?, ?, ?, ?, ?)',
                [fortuneId, userId, '', formattedDate, 'pending', taskId]
            );
            logger.info(`[fortuneController] manualTrigger: 已为用户 ${username} 创建新的喵语任务`);
        }
        
        // 返回占位内容
        res.status(202).json({
            message: '已开始生成新的喵语，请稍后查看',
            content: '',
            status: 'pending',
            fortuneId,
            taskId
        });

    } catch (error) {
        logger.error('[fortuneController] 处理 manualTriggerFortune 时发生错误喵:', error, {
            userId,
            username,
            errorMessage: error.message, 
            errorStack: error.stack,
            sqlErrorCode: error.code, 
            sqlErrorNo: error.errno,
            sqlMessage: error.sqlMessage
        });
        
        res.status(500).json({ message: '手动触发喵语失败，请稍后再试' });
    }
};

// --- 手动触发功能占位 --- 
// exports.manualTriggerFortune = async (req, res, next) => { ... }; 