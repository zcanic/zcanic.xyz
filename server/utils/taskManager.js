const { v4: uuidv4 } = require('uuid');
const logger = require('./logger');
const { callChatCompletion } = require('./aiUtils');
const { getFortunePrompt, DEFAULT_SYSTEM_PROMPT } = require('../config/prompts');
const openai = require('../config/openaiConfig');
const axios = require('axios');

// 获取语音服务URL和API密钥
const VOICE_SERVICE_URL = process.env.VOICE_SERVICE_URL || 'http://123.57.182.94:8000';
const VOICE_API_KEY = process.env.VOICE_API_KEY || '';

// 创建新任务
async function createTask(pool, userId, type, relatedId) {
  const taskId = uuidv4();
  
  try {
    await pool.query(
      'INSERT INTO async_tasks (id, user_id, type, related_id, status) VALUES (?, ?, ?, ?, ?)',
      [taskId, userId, type, relatedId, 'pending']
    );
    
    logger.info(`[taskManager] 创建了新的${type}任务: ${taskId}, 用户ID: ${userId}, 关联ID: ${relatedId}`);
    return taskId;
  } catch (error) {
    logger.error(`[taskManager] 创建任务失败: ${error.message}`, { userId, type, relatedId });
    throw error;
  }
}

// 更新任务状态
async function updateTaskStatus(pool, taskId, status, result = null, error = null) {
  try {
    await pool.query(
      'UPDATE async_tasks SET status = ?, result = ?, error = ?, updated_at = NOW() WHERE id = ?',
      [status, result, error, taskId]
    );
    logger.info(`[taskManager] 更新任务状态: ${taskId} -> ${status}`);
  } catch (error) {
    logger.error(`[taskManager] 更新任务状态失败: ${error.message}`, { taskId, status });
    throw error;
  }
}

// 获取任务详情
async function getTask(pool, taskId) {
  try {
    const [tasks] = await pool.query('SELECT * FROM async_tasks WHERE id = ?', [taskId]);
    return tasks.length > 0 ? tasks[0] : null;
  } catch (error) {
    logger.error(`[taskManager] 获取任务失败: ${error.message}`, { taskId });
    throw error;
  }
}

// 获取多个任务状态
async function getTasksStatus(pool, taskIds) {
  try {
    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return [];
    }
    
    const [tasks] = await pool.query(
      'SELECT id, status, related_id, result, error, user_id FROM async_tasks WHERE id IN (?)',
      [taskIds]
    );
    return tasks;
  } catch (error) {
    logger.error(`[taskManager] 获取多个任务状态失败: ${error.message}`, { taskIds });
    throw error;
  }
}

// 处理聊天任务
async function processChatTask(pool, taskId, userId, messageId, sessionId) {
  try {
    // 1. 基本检查
    if (!openai) {
      logger.error(`[taskManager] 无法处理聊天任务，OpenAI实例不可用，请检查API密钥配置`);
      await updateMessageAndTaskStatus(
        pool, 
        messageId, 
        taskId, 
        'AI服务暂时不可用，无法处理聊天，请联系管理员检查API配置。', 
        'failed', 
        'OpenAI API配置不可用'
      );
      return false;
    }

    // 2. 更新任务状态为处理中
    await updateTaskStatus(pool, taskId, 'processing');
    
    // 3. 获取任务设置
    let customSettings = await getTaskSettings(pool, taskId);
    
    // 4. 构建会话历史和系统提示
    const { messages, username } = await buildConversationHistory(pool, sessionId, userId, customSettings);
    
    // 5. 准备API调用选项
    const options = buildApiOptions(customSettings);

    // 6. 记录详细日志
    logger.info(`[taskManager] 正在处理聊天任务`, {
      taskId,
      sessionId,
      model: options.model,
      temperature: options.temperature,
      maxTokens: options.max_tokens,
      systemPrompt: customSettings.systemPrompt ? '已自定义' : '使用默认值',
      messagesCount: messages.length,
      chatMode: customSettings.chatMode || 'normal'
    });
    
    // 7. 调用AI服务
    const completion = await callChatCompletion(messages, options, 'taskManager.processChatTask');
    
    // 8. 处理响应
    const aiResponse = extractAiResponse(completion);
    if (!aiResponse) {
      throw new Error('AI服务返回了空的响应内容');
    }
    
    // 9. 更新消息和任务状态
    await updateMessageAndTaskStatus(pool, messageId, taskId, aiResponse, 'completed');
    
    // 10. 如果是语音模式，生成语音内容
    if (customSettings.chatMode === 'voice') {
      try {
        logger.info(`[taskManager] 语音模式聊天，开始生成语音内容`);
        
        // 调用语音服务
        const voiceResponse = await generateVoiceForMessage(pool, messageId, aiResponse);
        
        if (voiceResponse.success) {
          logger.info(`[taskManager] 语音生成成功: ${messageId}, URL: ${voiceResponse.voiceUrl}`);
        } else {
          logger.error(`[taskManager] 语音生成失败: ${voiceResponse.message || '未知错误'}`);
        }
      } catch (voiceError) {
        logger.error(`[taskManager] 语音处理异常: ${voiceError.message}`, { messageId });
        // 这里我们不让语音错误影响整个聊天流程，所以继续执行
      }
    }
    
    logger.info(`[taskManager] 聊天任务处理完成: ${taskId}`);
    return true;
  } catch (error) {
    logger.error(`[taskManager] 处理聊天任务失败: ${error.message}`, { taskId, userId, messageId });
    
    // 更新消息和任务状态为失败
    await updateMessageAndTaskStatus(
      pool, 
      messageId, 
      taskId, 
      '处理回复时发生错误，请稍后再试。', 
      'failed', 
      error.message
    );
    
    return false;
  }
}

// 为消息生成语音
async function generateVoiceForMessage(pool, messageId, content) {
  const MAX_RETRIES = 2;
  let retries = 0;
  
  while (retries <= MAX_RETRIES) {
    try {
      if (!content || !messageId) {
        logger.error('[taskManager] 处理语音消息失败: 缺少内容或消息ID');
        return { success: false, message: '缺少内容或消息ID' };
      }

      logger.info(`[taskManager] 正在为消息生成语音: ${messageId}, 重试次数: ${retries}`);
      
      // 调用语音服务的TTS API，设置超时
      const response = await axios.post(`${VOICE_SERVICE_URL}/api/v1/tts`, {
        text: content,
        message_id: messageId,
        bypass_cache: retries > 0 // 重试时绕过缓存
      }, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': VOICE_API_KEY
        },
        timeout: 30000 // 30秒超时
      });

      if (response.data.success && response.data.audio_url) {
        // 修改音频URL，使其指向我们的代理
        const originalUrl = response.data.audio_url;
        const filename = originalUrl.substring(originalUrl.lastIndexOf('/') + 1);
        const proxyUrl = `/api/voice/audio/${filename}`;
        
        // 更新消息记录，添加语音URL和翻译文本
        await pool.query(
          'UPDATE chat_messages SET voice_url = ?, translated_text = ? WHERE id = ?',
          [proxyUrl, response.data.translated_text || null, messageId]
        );
        
        return { 
          success: true, 
          voiceUrl: proxyUrl,
          translatedText: response.data.translated_text || null
        };
      } else {
        logger.error(`[taskManager] 语音生成失败: ${response.data.message || '未知错误'}`);
        
        // 服务端错误才重试，客户端错误（如内容不合规）不重试
        if (response.status >= 500) {
          retries++;
          if (retries <= MAX_RETRIES) {
            // 指数退避策略
            const delay = Math.pow(2, retries) * 1000;
            logger.info(`[taskManager] 等待${delay}毫秒后重试语音生成(${retries}/${MAX_RETRIES})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }
        
        return { success: false, message: response.data.message || '语音生成失败' };
      }
    } catch (error) {
      const isNetworkError = error.code === 'ECONNABORTED' || 
                            error.code === 'ECONNREFUSED' || 
                            error.code === 'ECONNRESET' ||
                            error.message.includes('timeout');
      logger.error(`[taskManager] 语音处理异常: ${error.message}`, {
        url: error.config?.url,
        code: error.code,
        response: error.response?.data,
        stack: error.stack,
        isNetworkError,
        retryCount: retries
      });
      // 只对网络错误进行重试
      if (isNetworkError && retries < MAX_RETRIES) {
        retries++;
        // 指数退避策略
        const delay = Math.pow(2, retries) * 1000;
        logger.info(`[taskManager] 网络错误，等待${delay}毫秒后重试(${retries}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      return { success: false, message: error.message };
    }
  }
  
  // 所有重试都失败
  return { 
    success: false, 
    message: `尝试${MAX_RETRIES+1}次后仍然失败，语音生成服务可能暂时不可用`
  };
}

// 获取任务设置
async function getTaskSettings(pool, taskId) {
  const [taskData] = await pool.query(
    'SELECT extra_data FROM async_tasks WHERE id = ?',
    [taskId]
  );
  
  let customSettings = {};
  if (taskData && taskData.length > 0 && taskData[0].extra_data) {
    try {
      customSettings = JSON.parse(taskData[0].extra_data);
      logger.info(`[taskManager] 获取到任务设置: ${JSON.stringify(customSettings)}`);
    } catch (parseError) {
      logger.error(`[taskManager] 解析任务设置失败: ${parseError.message}`);
    }
  }
  
  return customSettings;
}

// 构建会话历史
async function buildConversationHistory(pool, sessionId, userId, customSettings) {
  // 获取会话消息历史
  const [messagesResult] = await pool.query(
    'SELECT role, content FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC',
    [sessionId]
  );
  
  // 获取用户信息
  const [users] = await pool.query('SELECT username FROM users WHERE id = ?', [userId]);
  const username = users.length > 0 ? users[0].username : '用户';
  
  // 转换消息格式并确保角色正确
  const messageHistory = messagesResult.map(msg => {
    // 规范化角色，确保只有合法的角色值
    let role = msg.role;
    if (!['user', 'assistant', 'system'].includes(role)) {
      role = 'user'; // 默认处理为用户消息
      logger.warn(`[taskManager] 检测到无效的消息角色: ${msg.role}，已修正为'user'`);
    }
    
    return {
      role: role,
      content: msg.content
    };
  });
  
  // 记录消息历史的角色分布情况，用于调试
  const roleCounts = messageHistory.reduce((count, msg) => {
    count[msg.role] = (count[msg.role] || 0) + 1;
    return count;
  }, {});
  
  logger.info(`[taskManager] 构建会话历史 - 消息统计: ${JSON.stringify(roleCounts)}`);
  
  // 构建系统提示 - 使用导入的DEFAULT_SYSTEM_PROMPT常量
  let systemContent = customSettings.systemPrompt || 
    // 在默认提示中替换用户名
    DEFAULT_SYSTEM_PROMPT.replace(/\$\{username\}/g, username);
  
  // 添加关于<think>标签的明确说明 - 确保这不会修改原始提示的意图
  if (!systemContent.includes('<think>')) {
    systemContent += `\n\n【重要提示】请在思考复杂问题时使用<think>标签。例如：<think>这是我的思考过程...</think>`;
  }
  
  // 构建最终消息数组，系统提示放在最前面
  const messages = [
    { role: 'system', content: systemContent },
    ...messageHistory
  ];
  
  // 记录最终发送的消息数量
  logger.info(`[taskManager] 最终构建的会话历史包含${messages.length}条消息`);
  
  return { messages, username };
}

// 构建API调用选项
function buildApiOptions(customSettings) {
  // 创建基本选项
  const options = {
    model: customSettings.model || 'deepseek-ai/DeepSeek-R1',
    temperature: customSettings.temperature !== undefined ? 
      parseFloat(customSettings.temperature) : 0.7
  };
  
  // 特殊处理max_tokens参数 (保持字段一致性，避免重命名导致的值丢失)
  if (customSettings.maxTokens !== undefined) {
    // 直接赋值，后续由aiUtils中的callChatCompletion函数进行类型验证和处理
    options.max_tokens = customSettings.maxTokens;
    
    // 记录token限制的设置
    if (logger && logger.debug) {
      logger.debug(`[taskManager] max_tokens设置为: ${customSettings.maxTokens} (${typeof customSettings.maxTokens})`);
    }
  }
  
  return options;
}

// 提取AI响应内容
function extractAiResponse(completion) {
  if (!completion || !completion.choices || !Array.isArray(completion.choices) || completion.choices.length === 0) {
    return null;
  }
  
  const responseMessage = completion.choices[0].message;
  let content = responseMessage && responseMessage.content ? responseMessage.content.trim() : null;
  
  // 如果没有内容，直接返回null
  if (!content) return null;
  
  // 处理<think>标签
  content = processThinkingTags(content);
  
  return content;
}

// 处理思考标签函数
function processThinkingTags(content) {
  if (!content || !content.includes('<think>')) return content;
  
  // 日志记录，用于调试
  logger.info('[taskManager] 检测到响应中含有<think>标签');
  
  try {
    // 使用正则表达式标识并处理所有<think>标签部分
    // 将<think>部分转换为格式化的思考区块
    const processedContent = content.replace(/<think>([\s\S]*?)<\/think>/g, (match, thinkContent) => {
      return `\n\n💭 *思考过程:*\n\`\`\`\n${thinkContent.trim()}\n\`\`\`\n\n`;
    });
    
    return processedContent;
  } catch (error) {
    logger.error(`[taskManager] 处理思考标签时出错: ${error.message}`);
    // 出错时返回原始内容
    return content;
  }
}

// 更新消息和任务状态
async function updateMessageAndTaskStatus(pool, messageId, taskId, content, status, errorMessage = null) {
  try {
    // 更新消息内容和状态
    await pool.query(
      'UPDATE chat_messages SET content = ?, status = ? WHERE id = ?',
      [content, status, messageId]
    );
    
    // 更新任务状态
    await updateTaskStatus(pool, taskId, status, status === 'completed' ? content : null, errorMessage);
  } catch (updateError) {
    logger.error(`[taskManager] 更新消息或任务状态失败: ${updateError.message}`);
  }
}

// 处理每日喵语任务
async function processFortuneTask(pool, taskId, userId, fortuneId) {
  try {
    // 检查OpenAI实例是否可用
    if (!openai) {
      logger.error(`[taskManager] 无法处理喵语任务，OpenAI实例不可用，请检查API密钥配置`);
      await pool.query(
        'UPDATE daily_fortunes SET content = ?, status = ? WHERE id = ?',
        ['AI服务暂时不可用，无法生成喵语，请联系管理员检查配置。', 'failed', fortuneId]
      );
      await updateTaskStatus(pool, taskId, 'failed', null, 'OpenAI API配置不可用');
      return false;
    }

    // 更新任务状态为处理中
    await updateTaskStatus(pool, taskId, 'processing');
    
    // 获取用户信息
    const [users] = await pool.query('SELECT username FROM users WHERE id = ?', [userId]);
    const username = users.length > 0 ? users[0].username : '用户';
    
    // 先检查这个 fortuneId 是否仍然存在
    const [fortunes] = await pool.query('SELECT id, generated_at FROM daily_fortunes WHERE id = ?', [fortuneId]);
    if (fortunes.length === 0) {
      logger.error(`[taskManager] 找不到喵语记录 ID: ${fortuneId}, 可能已被删除`);
      await updateTaskStatus(pool, taskId, 'failed', null, '找不到对应的喵语记录');
      return false;
    }
    
    // 构建提示词
    const prompt = getFortunePrompt(username);
    
    // 调用AI API
    const messages = [{ role: 'user', content: prompt }];
    const options = {
      model: 'deepseek-ai/DeepSeek-R1',
      temperature: 0.9,
      max_tokens: 3000  // 确保不超过4000的上限
    };
    
    const completion = await callChatCompletion(messages, options, 'taskManager.processFortuneTask');
    
    let fortuneContent = '';
    if (completion.choices && completion.choices.length > 0 && completion.choices[0].message) {
      fortuneContent = completion.choices[0].message.content?.trim();
    }
    
    if (!fortuneContent) {
      throw new Error('AI服务返回了空的喵语内容');
    }
    
    // 更新每日喵语内容和状态
    await pool.query(
      'UPDATE daily_fortunes SET content = ?, status = ? WHERE id = ?',
      [fortuneContent, 'completed', fortuneId]
    );
    
    // 更新任务状态为完成
    await updateTaskStatus(pool, taskId, 'completed', fortuneContent);
    
    logger.info(`[taskManager] 每日喵语任务处理完成: ${taskId}`);
    return true;
  } catch (error) {
    logger.error(`[taskManager] 处理每日喵语任务失败: ${error.message}`, { taskId, userId, fortuneId });
    
    // 更新喵语和任务状态为失败
    try {
      await pool.query(
        'UPDATE daily_fortunes SET content = ?, status = ? WHERE id = ?',
        ['生成每日喵语时发生错误，请稍后再试。', 'failed', fortuneId]
      );
      
      await updateTaskStatus(pool, taskId, 'failed', null, error.message);
    } catch (updateError) {
      logger.error(`[taskManager] 更新失败状态时出错: ${updateError.message}`);
    }
    
    return false;
  }
}

// 启动任务处理（定期检查未处理的任务）
function startTaskProcessor(pool) {
  logger.info('[taskManager] 启动异步任务处理器');
  
  // 每10秒处理一批未完成的任务
  const processorInterval = setInterval(async () => {
    try {
      // 获取状态为pending的任务
      const [pendingTasks] = await pool.query(
        'SELECT * FROM async_tasks WHERE status = ? LIMIT 5',
        ['pending']
      );
      
      if (pendingTasks.length === 0) {
        return; // 没有待处理的任务
      }
      
      logger.info(`[taskManager] 发现 ${pendingTasks.length} 个待处理任务`);
      
      // 按顺序处理每个任务
      for (const task of pendingTasks) {
        logger.info(`[taskManager] 开始处理任务: ${task.id}, 类型: ${task.type}`);
        
        try {
          if (task.type === 'chat') {
            // 获取消息详情
            const [messages] = await pool.query(
              'SELECT * FROM chat_messages WHERE id = ?',
              [task.related_id]
            );
            
            if (messages.length === 0) {
              logger.error(`[taskManager] 未找到关联的聊天消息: ${task.related_id}`);
              await updateTaskStatus(pool, task.id, 'failed', null, '未找到关联的聊天消息');
              continue;
            }
            
            const message = messages[0];
            
            // 处理聊天任务 - 顺序执行
            await processChatTask(
              pool,
              task.id,
              task.user_id,
              task.related_id,
              message.session_id
            );
            
          } else if (task.type === 'fortune') {
            // 处理每日喵语任务 - 顺序执行
            await processFortuneTask(
              pool,
              task.id,
              task.user_id,
              task.related_id
            );
            
          } else {
            logger.warn(`[taskManager] 未知的任务类型: ${task.type}`, { taskId: task.id });
            await updateTaskStatus(pool, task.id, 'failed', null, `未知的任务类型: ${task.type}`);
          }
        } catch (taskError) {
          logger.error(`[taskManager] 任务处理异常: ${taskError.message}`, { 
            taskId: task.id,
            taskType: task.type,
            error: taskError
          });
          
          // 更新任务状态为失败
          try {
            await updateTaskStatus(pool, task.id, 'failed', null, taskError.message);
          } catch (updateError) {
            logger.error(`[taskManager] 更新失败状态时出错: ${updateError.message}`);
          }
        }
      }
    } catch (error) {
      logger.error(`[taskManager] 任务处理器循环错误: ${error.message}`);
    }
  }, 10000);
  
  // 返回清理函数
  return () => {
    clearInterval(processorInterval);
    logger.info('[taskManager] 已停止异步任务处理器');
  };
}

// 导出函数
module.exports = {
  createTask,
  updateTaskStatus,
  getTask,
  getTasksStatus,
  processChatTask,
  processFortuneTask,
  startTaskProcessor,
  buildConversationHistory, // 添加此函数用于测试
  generateVoiceForMessage // 添加语音生成函数
}; 