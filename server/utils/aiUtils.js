const openai = require('../config/openaiConfig');
const logger = require('./logger');

/**
 * 调用AI聊天接口并处理响应
 * 
 * @param {Array<object>} messages - 聊天消息数组
 * @param {object} options - API调用选项
 * @param {string} callingFunction - 调用此函数的函数名(用于日志)
 * @returns {Promise<object>} - API响应对象
 */
async function callChatCompletion(messages, options = {}, callingFunction = 'unknown') {
    try {
        // 检查OpenAI实例
        if (!openai) {
            logger.error(`[aiUtils/${callingFunction}] OpenAI客户端未配置或不可用`);
            throw new Error('AI服务配置不可用，请检查API密钥设置');
        }

        // 记录原始选项(用于调试)
        logger.debug(`[aiUtils/${callingFunction}] 原始options:`, {
            model: options.model,
            temperature: options.temperature,
            max_tokens: options.max_tokens,
            max_tokens_type: typeof options.max_tokens
        });

        // 准备请求参数 - 深度克隆防止修改原始对象
        const requestOptions = JSON.parse(JSON.stringify({
            model: options.model || 'deepseek-ai/DeepSeek-R1',
            temperature: typeof options.temperature === 'number' ? options.temperature : 0.7,
            messages: messages || []
        }));

        // 特殊处理max_tokens参数
        // 1. 如果为null或undefined，不传此参数让API使用默认值
        // 2. 如果是数字，确保为正整数
        // 3. 如果是字符串，尝试转换为数字
        if (options.max_tokens !== null && options.max_tokens !== undefined) {
            const tokenLimit = parseInt(options.max_tokens, 10);
            if (!isNaN(tokenLimit) && tokenLimit > 0) {
                // 添加上限验证：确保max_tokens不超过API的限制
                // DeepSeek模型通常最大支持4096tokens，为安全起见设置一个略小的上限
                const MAX_ALLOWED_TOKENS = 4000; 
                if (tokenLimit > MAX_ALLOWED_TOKENS) {
                    logger.warn(`[aiUtils/${callingFunction}] max_tokens值(${tokenLimit})超过API最大限制，自动调整为${MAX_ALLOWED_TOKENS}`);
                    requestOptions.max_tokens = MAX_ALLOWED_TOKENS;
                } else {
                    requestOptions.max_tokens = tokenLimit;
                }
                logger.debug(`[aiUtils/${callingFunction}] 设置max_tokens=${requestOptions.max_tokens}`);
            } else {
                logger.warn(`[aiUtils/${callingFunction}] 无效的max_tokens值: ${options.max_tokens}，将使用API默认值`);
            }
        } else {
            logger.debug(`[aiUtils/${callingFunction}] 未设置max_tokens，将使用API默认值`);
        }

        // 打印详细日志
        logger.info(`[aiUtils/${callingFunction}] 发送AI请求`, {
            model: requestOptions.model,
            temperature: requestOptions.temperature,
            max_tokens: requestOptions.max_tokens,
            has_max_tokens: requestOptions.hasOwnProperty('max_tokens'),
            messagesCount: requestOptions.messages.length,
            systemPrompt: messages[0]?.role === 'system' ? '已设置' : '未设置'
        });

        // 调用OpenAI API
        const response = await openai.chat.completions.create(requestOptions);
        
        // 验证响应
        if (!response || typeof response !== 'object') {
            throw new Error('AI服务返回了无效的响应格式');
        }

        // 记录成功日志
        logger.info(`[aiUtils/${callingFunction}] 收到AI响应`, {
            model: response.model || requestOptions.model,
            status: 'success',
            tokensUsed: response.usage?.total_tokens || 'unknown',
            completionTokens: response.usage?.completion_tokens || 'unknown',
            promptTokens: response.usage?.prompt_tokens || 'unknown',
            content_length: response.choices[0]?.message?.content?.length || 0
        });

        return response;
    } catch (error) {
        // 记录错误日志
        logger.error(`[aiUtils/${callingFunction}] AI调用失败: ${error.message}`, {
            errorName: error.name,
            errorCode: error.code,
            statusCode: error.status || error.statusCode,
            options: JSON.stringify({
                model: options.model,
                temperature: options.temperature,
                max_tokens: options.max_tokens
            })
        });
        
        // 重新抛出带有详细信息的错误
        throw new Error(`AI服务调用失败: ${error.message}`);
    }
}

module.exports = {
    callChatCompletion
}; 