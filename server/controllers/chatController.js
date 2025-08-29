const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const { createTask } = require('../utils/taskManager');

// 获取用户聊天会话列表
exports.getUserSessions = async (req, res) => {
  try {
    const userId = req.user.id;
    const pool = req.app.locals.pool;
    
    if (!pool) {
      logger.error('[chatController] 数据库连接池不可用');
      return res.status(500).json({ success: false, message: '服务器错误，请稍后再试' });
    }
    
    const [sessions] = await pool.query(
      `SELECT id, title, chat_mode, created_at, updated_at FROM chat_sessions 
       WHERE user_id = ? 
       ORDER BY updated_at DESC`,
      [userId]
    );
    
    res.status(200).json({
      success: true,
      sessions: sessions.map(session => ({
        id: session.id,
        title: session.title,
        mode: session.chat_mode || 'normal',
        createdAt: session.created_at,
        updatedAt: session.updated_at
      }))
    });
  } catch (error) {
    logger.error(`[chatController] 获取聊天会话列表失败: ${error.message}`, { userId: req.user.id });
    res.status(500).json({ success: false, message: '获取聊天会话列表失败' });
  }
};

// 创建新的聊天会话
exports.createSession = async (req, res) => {
  try {
    const { title, mode } = req.body;
    const userId = req.user.id;
    const pool = req.app.locals.pool;
    
    if (!pool) {
      logger.error('[chatController] 数据库连接池不可用');
      return res.status(500).json({ success: false, message: '服务器错误，请稍后再试' });
    }
    
    const sessionId = uuidv4();
    const sessionTitle = title || `${mode === 'voice' ? '语音' : ''}聊天会话 ${new Date().toLocaleString('zh-CN')}`;
    const chatMode = mode || 'normal';
    
    logger.info(`[chatController] 创建${chatMode === 'voice' ? '语音' : '普通'}聊天会话`);
    
    await pool.query(
      'INSERT INTO chat_sessions (id, user_id, title, chat_mode) VALUES (?, ?, ?, ?)',
      [sessionId, userId, sessionTitle, chatMode]
    );
    
    res.status(201).json({
      success: true,
      session: {
        id: sessionId,
        title: sessionTitle,
        mode: chatMode,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  } catch (error) {
    logger.error(`[chatController] 创建聊天会话失败: ${error.message}`, { userId: req.user.id });
    res.status(500).json({ success: false, message: '创建聊天会话失败' });
  }
};

// 获取会话消息历史
exports.getSessionMessages = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;
    const pool = req.app.locals.pool;
    
    if (!pool) {
      logger.error('[chatController] 数据库连接池不可用');
      return res.status(500).json({ success: false, message: '服务器错误，请稍后再试' });
    }
    
    // 验证用户对此会话的访问权限
    const [sessions] = await pool.query(
      'SELECT * FROM chat_sessions WHERE id = ? AND user_id = ?',
      [sessionId, userId]
    );
    
    if (sessions.length === 0) {
      return res.status(404).json({ success: false, message: '会话不存在' });
    }
    
    // 获取消息，包括待处理消息
    const [messages] = await pool.query(
      `SELECT id, role, content, status, created_at, task_id, voice_url, translated_text 
       FROM chat_messages 
       WHERE session_id = ? 
       ORDER BY created_at ASC`,
      [sessionId]
    );
    
    res.status(200).json({
      success: true,
      messages: messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        status: msg.status || 'completed',
        createdAt: msg.created_at,
        taskId: msg.task_id,
        voiceUrl: msg.voice_url || null,
        translatedText: msg.translated_text || null
      }))
    });
  } catch (error) {
    logger.error(`[chatController] 获取聊天历史失败: ${error.message}`, { sessionId: req.params.sessionId });
    res.status(500).json({ success: false, message: '获取聊天历史失败' });
  }
};

// 发送聊天消息 - 异步处理
exports.sendMessage = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { message, model, temperature, maxTokens, systemPrompt } = req.body;
    const userId = req.user.id;
    const pool = req.app.locals.pool;
    
    // 验证必要参数
    if (!pool) {
      logger.error('[chatController] 数据库连接池不可用');
      return res.status(500).json({ success: false, message: '服务器错误，请稍后再试' });
    }
    
    if (!message || typeof message !== 'string' || message.trim() === '') {
      logger.warn('[chatController] 收到空消息请求');
      return res.status(400).json({ success: false, message: '消息不能为空' });
    }
    
    // 验证会话存在并属于当前用户
    const [sessions] = await pool.query(
      'SELECT id, user_id, title, chat_mode FROM chat_sessions WHERE id = ? AND user_id = ?',
      [sessionId, userId]
    );
    
    if (sessions.length === 0) {
      logger.warn(`[chatController] 用户(${userId})尝试访问不存在的会话(${sessionId})`);
      return res.status(404).json({ success: false, message: '会话不存在' });
    }
    
    // 获取会话模式
    const chatMode = sessions[0].chat_mode || 'normal';
    
    // 记录接收到的AI设置
    logger.info(`[chatController] 接收到聊天设置:`, {
      sessionId,
      userId,
      chatMode,
      hasModel: !!model,
      hasTemperature: temperature !== undefined,
      hasMaxTokens: maxTokens !== undefined,
      hasSystemPrompt: !!systemPrompt,
      messageLength: message.length
    });
    
    // 1. 保存用户消息
    const userMessageId = uuidv4();
    await pool.query(
      'INSERT INTO chat_messages (id, session_id, role, content) VALUES (?, ?, ?, ?)',
      [userMessageId, sessionId, 'user', message]
    );
    
    // 2. 创建助手消息占位符
    const assistantMessageId = uuidv4();
    
    // 3. 创建异步任务
    const taskId = await createTask(pool, userId, 'chat', assistantMessageId);
    
    // 4. 准备并保存任务的附加数据 (AI设置 + 会话模式)
    const currentSessionChatMode = sessions[0].chat_mode || 'normal'; // 获取当前会话模式
    const taskExtraData = {
        ...formatAiSettings(model, temperature, maxTokens, systemPrompt), // 已有的AI设置
        chatMode: currentSessionChatMode // 添加会话模式
    };
    
    // 只在 taskExtraData 非空时（例如至少有 chatMode）才尝试更新 extra_data
    // 通常 chatMode 总会存在，但保持检查是个好习惯
    if (Object.keys(taskExtraData).length > 0 && (taskExtraData.chatMode || Object.keys(formatAiSettings(model, temperature, maxTokens, systemPrompt)).length > 0) ) {
      const extraDataJson = JSON.stringify(taskExtraData);
      
      await pool.query(
        'UPDATE async_tasks SET extra_data = ? WHERE id = ?',
        [extraDataJson, taskId]
      );
      
      logger.info(`[chatController] 已保存任务附加数据到任务(${taskId})`, taskExtraData);
    } else {
      logger.info(`[chatController] 任务(${taskId})没有附加数据需要保存。`);
    }
    
    // 5. 保存助手消息占位符
    await pool.query(
      'INSERT INTO chat_messages (id, session_id, role, content, status, task_id) VALUES (?, ?, ?, ?, ?, ?)',
      [assistantMessageId, sessionId, 'assistant', '正在思考...', 'pending', taskId]
    );
    
    // 6. 更新会话的最后活动时间
    await pool.query(
      'UPDATE chat_sessions SET updated_at = NOW() WHERE id = ?',
      [sessionId]
    );
    
    // 7. 返回响应
    res.status(202).json({
      success: true,
      message: '消息已接收，正在处理',
      userMessageId,
      assistantMessageId,
      taskId,
      chatMode
    });
    
  } catch (error) {
    logger.error(`[chatController] 发送消息失败: ${error.message}`, { 
      sessionId: req.params.sessionId, 
      userId: req.user?.id,
      stack: error.stack
    });
    res.status(500).json({ success: false, message: '发送消息失败，请稍后再试' });
  }
};

// 格式化AI设置，移除undefined和无效值
function formatAiSettings(model, temperature, maxTokens, systemPrompt) {
  const settings = {};
  
  // 仅当有效时添加模型
  if (model && typeof model === 'string' && model.trim()) {
    settings.model = model.trim();
  }
  
  // 温度必须是0到1之间的数字
  if (temperature !== undefined) {
    const tempFloat = parseFloat(temperature);
    if (!isNaN(tempFloat) && tempFloat >= 0 && tempFloat <= 1) {
      settings.temperature = tempFloat;
    }
  }
  
  // 处理maxTokens (null值保留表示无限制)
  if (maxTokens !== undefined) {
    // 直接存储null值，表示使用API默认值
    if (maxTokens === null) {
      settings.maxTokens = null;
      logger.info('[chatController] maxTokens设置为null，将使用API默认值');
    } else {
      // 尝试转换为整数
      const tokens = parseInt(maxTokens, 10);
      if (!isNaN(tokens)) {
        if (tokens > 0) {
          // 添加上限验证，和aiUtils.js中保持一致
          const MAX_ALLOWED_TOKENS = 4000;
          if (tokens > MAX_ALLOWED_TOKENS) {
            logger.warn(`[chatController] maxTokens值(${tokens})超过API最大限制，自动调整为${MAX_ALLOWED_TOKENS}`);
            settings.maxTokens = MAX_ALLOWED_TOKENS;
          } else {
            settings.maxTokens = tokens;
          }
          logger.info(`[chatController] maxTokens设置为: ${settings.maxTokens}`);
        } else {
          logger.warn(`[chatController] 忽略非正数的maxTokens值: ${maxTokens}`);
        }
      } else {
        logger.warn(`[chatController] 忽略无效的maxTokens值: ${maxTokens}`);
      }
    }
  }
  
  // 系统提示词
  if (systemPrompt !== undefined) {
    if (systemPrompt === null) {
      // null表示使用默认系统提示词
      logger.info('[chatController] systemPrompt为null，将使用默认系统提示词');
    } else if (typeof systemPrompt === 'string' && systemPrompt.trim()) {
      settings.systemPrompt = systemPrompt.trim();
      logger.info(`[chatController] 使用自定义systemPrompt: ${systemPrompt.length}个字符`);
    } else {
      logger.warn(`[chatController] 忽略无效的systemPrompt: ${systemPrompt}`);
    }
  }
  
  return settings;
}

// 删除聊天会话
exports.deleteSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;
    const pool = req.app.locals.pool;
    
    if (!pool) {
      logger.error('[chatController] 数据库连接池不可用');
      return res.status(500).json({ success: false, message: '服务器错误，请稍后再试' });
    }
    
    // 验证用户对此会话的访问权限
    const [sessions] = await pool.query(
      'SELECT * FROM chat_sessions WHERE id = ? AND user_id = ?',
      [sessionId, userId]
    );
    
    if (sessions.length === 0) {
      return res.status(404).json({ success: false, message: '会话不存在' });
    }
    
    // 删除关联的消息
    await pool.query('DELETE FROM chat_messages WHERE session_id = ?', [sessionId]);
    
    // 删除会话
    await pool.query('DELETE FROM chat_sessions WHERE id = ?', [sessionId]);
    
    res.status(200).json({
      success: true,
      message: '会话已删除'
    });
  } catch (error) {
    logger.error(`[chatController] 删除会话失败: ${error.message}`, { sessionId: req.params.sessionId });
    res.status(500).json({ success: false, message: '删除会话失败' });
  }
}; 