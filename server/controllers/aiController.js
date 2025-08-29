const openai = require('../config/openaiConfig'); // 导入配置好的 OpenAI 实例
const logger = require('../utils/logger'); // <-- 引入 Winston logger
const { callChatCompletion } = require('../utils/aiUtils'); // <-- Import callChatCompletion
const { encoding_for_model } = require('tiktoken'); // <-- Import tokenizer
const memoryController = require('./memoryController'); // <-- Import memory controller

// --- Constants --- 
const MAX_CONTEXT_TOKENS = 4000; // Max tokens allowed for messages part of the prompt
const DEFAULT_MODEL = 'deepseek-ai/DeepSeek-R1'; // Default model

// Helper function to estimate token count for a message
// Note: This is an approximation, actual tokenization might differ slightly by model/API
function estimateMessageTokens(message, encoder) {
    // Rough estimate: tokens for content + ~4 tokens per message for role/metadata
    return encoder.encode(message.content || '').length + 4;
}

// Helper function to format memories for the prompt
function formatMemoriesForPrompt(memories) {
    if (!memories || memories.length === 0) {
        return '';
    }
    // 只取 content，类型可以在 prompt 里说明
    const memoryStrings = memories.map(mem => `- ${mem.memory_content}`);
    // 使用特殊标记符和清晰的说明
    return `\n\n--- Zcanic 的记忆碎片 (关于主人 '${memories[0]?.user_id}' 的信息，请参考) ---\n${memoryStrings.join('\n')}\n------------------------------------------`;
}

// 处理聊天请求
exports.chatCompletion = async (req, res, next) => {
    logger.info('聊天请求处理喵 (aiController) with context trimming and memory injection...');
    const pool = req.app.locals.pool; // <-- Get pool here

    // 检查 OpenAI 客户端 - aiUtils 内部会检查，但这里保留一层快速失败逻辑也可以
    if (!openai) {
        logger.error('[aiController] 错误：OpenAI 服务未配置或不可用喵。');
        // console.error('aiController 错误：OpenAI 服务未配置或不可用喵。');
        return res.status(503).json({ message: 'AI 服务当前不可用喵 T_T' });
    }

    // 从请求体获取参数
    let { messages, model = DEFAULT_MODEL, temperature = 0.7, max_tokens = 2000 } = req.body;

    // 基本验证 (已在路由层处理，但可保留作为双重检查)
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        logger.warn('[aiController] 无效的消息格式喵！', { body: req.body });
        return res.status(400).json({ message: '无效的消息格式喵！需要提供 messages 数组。' });
    }

    // --- 获取记忆 --- 
    let userMemories = [];
    if (req.user?.id && pool) { // <-- Check if pool exists before calling
        try {
            // Pass the pool to the memory controller function
            userMemories = await memoryController.getMemoriesForUser(pool, req.user.id, 5); 
            logger.info(`[aiController] Fetched ${userMemories.length} memories for user ${req.user.id}`);
        } catch (memError) {
            logger.error(`[aiController] Failed to fetch memories for user ${req.user.id}:`, memError);
            // Don't fail the request, just proceed without memories
        }
    } else if (req.user?.id && !pool) {
        logger.error(`[aiController] Cannot fetch memories for user ${req.user.id}: Database pool is not available.`);
        // Proceed without memories
    }

    // --- 注入用户名 & 分离 System Prompt --- 
    const username = req.user?.username;
    let systemPromptContent = '';
    const conversationMessages = []; // Store non-system messages here

    // Find existing system prompt or prepare to prepend
    const systemMessageIndex = messages.findIndex(msg => msg.role === 'system');
    if (systemMessageIndex !== -1) {
        systemPromptContent = messages[systemMessageIndex].content;
        // Add other messages to conversationMessages
        conversationMessages.push(...messages.slice(0, systemMessageIndex), ...messages.slice(systemMessageIndex + 1));
    } else {
        // No explicit system message found in input, use default from context if needed (though usually front-end handles this)
        // For now, assume system prompt is handled or empty if not provided.
        conversationMessages.push(...messages);
    }

    // --- 注入记忆和用户名到 System Prompt --- 
    const systemMessagePrefix = username ? `(你正在和主人 '${username}' 对话。)\n` : '';
    const memoryString = formatMemoriesForPrompt(userMemories); // Format fetched memories

    // Combine prefix, original system content, and memory string
    systemPromptContent = systemMessagePrefix + systemPromptContent + memoryString;

    // Create the final system message object if content exists
    const systemMessage = systemPromptContent.trim() ? { role: 'system', content: systemPromptContent } : null;
    if (memoryString) logger.info(`[aiController] Injected formatted memories into system prompt for user ${req.user?.id}.`);

    // --- Token-based Context Truncation --- 
    let contextToSend = [];
    let currentTokenCount = 0;
    let encoder;

    try {
        // Get the appropriate encoder for the model (or a fallback)
        // Using gpt-4 encoder as a reasonable default if model-specific is unavailable
        encoder = encoding_for_model(model.includes('gpt') ? model : 'gpt-4');
    } catch (e) {
        logger.warn(`[aiController] Could not get specific tokenizer for model ${model}, using gpt-4 default. Error: ${e.message}`);
        encoder = encoding_for_model('gpt-4');
    }

    // Calculate system prompt tokens if it exists
    if (systemMessage) {
        currentTokenCount += estimateMessageTokens(systemMessage, encoder);
    }

    // Iterate messages backwards (newest to oldest)
    for (let i = conversationMessages.length - 1; i >= 0; i--) {
        const message = conversationMessages[i];
        const messageTokens = estimateMessageTokens(message, encoder);

        // Check if adding this message exceeds the budget
        if (currentTokenCount + messageTokens <= MAX_CONTEXT_TOKENS) {
            contextToSend.push(message);
            currentTokenCount += messageTokens;
        } else {
            logger.warn(`[aiController] Context limit reached. Truncating older messages. Total tokens approx: ${currentTokenCount}`, { userId: req.user?.id });
            break; // Stop adding messages
        }
    }

    // Reverse the context to maintain chronological order
    contextToSend.reverse();

    // Prepend the system message if it exists
    if (systemMessage) {
        contextToSend.unshift(systemMessage);
    }

    // Free the encoder memory
    try { encoder.free(); } catch (e) { logger.error("Error freeing tokenizer", e); }

    // --- End Context Truncation --- 

    let completion; // Keep completion defined for potential use in catch block logging

    try {
        // logger.info(...); // Logging inside callChatCompletion is generally sufficient

        // 记录发送给 AI 的消息 (截断)
        const messagesToSendLog = contextToSend.map(m => ({
            role: m.role,
            content: m.content.substring(0, 100) + (m.content.length > 100 ? '...' : '')
        }));
        logger.debug('准备发送给 AI Service 的截断后消息 (via aiUtils):', {
            messageCount: contextToSend.length,
            messages: messagesToSendLog,
            estimatedTokens: currentTokenCount,
            userId: req.user?.id,
            username
        });

        const options = {
            model: model,
            temperature: temperature,
            max_tokens: max_tokens,
            // stream: false, // Keep this comment if streaming is a future possibility
        };

        // Use the utility function with the truncated context
        completion = await callChatCompletion(contextToSend, options, 'aiController.chatCompletion.Trimmed.Memory');

        logger.info('从 AI Service 收到响应喵 (aiController)~', { userId: req.user?.id, username: username });
        // console.log('从 OpenAI 收到响应喵 (aiController)~');

        // 检查响应结构 - callChatCompletion already validates base structure
        if (completion.choices && completion.choices.length > 0 && completion.choices[0].message && completion.choices[0].message.content) {
            const responseContent = completion.choices[0].message.content;
            logger.debug('AI Service 响应内容 (截断):', { contentStart: responseContent.substring(0, 100) });
            res.json({ completion: responseContent });
        } else {
            // This case should ideally be caught by callChatCompletion, but log just in case
            logger.error('AI Service 返回了无效或空的 choices 结构喵 (aiController)', {
                completionResponse: completion,
                userId: req.user?.id,
                username
            });
            throw new Error('AI 服务返回了无效的响应喵');
        }

    } catch (error) {
        // Error logging is handled in callChatCompletion for API errors.
        // Log additional context if needed.
        logger.error('处理聊天请求时发生错误喵 (aiController):', {
            userId: req.user?.id,
            username: username,
            // Error message from callChatCompletion is usually sufficient
            errorMessage: error.message,
            errorStack: error.stack,
            // completionSnapshot might be helpful if error happens AFTER the call
            completionSnapshot: completion,
            // Include original error data if available and useful
            // responseData: error.response?.data 
        });
        // console.error('调用 OpenAI API 出错喵 (aiController):', error.response ? error.response.data : error.message);
        // 可以根据 error.response.status 等返回更具体的错误码给前端
        next(error); // Pass to the global error handler
    }
};

// 未来可以添加其他 AI 相关控制器函数，比如：
// exports.summarizeText = async (req, res, next) => { ... };
// exports.suggestTitle = async (req, res, next) => { ... };

// 