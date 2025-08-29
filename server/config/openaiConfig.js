const { OpenAI } = require('openai');
require('dotenv').config(); // 确保能读取 .env
const logger = require('../utils/logger'); // <-- 引入 Winston logger

const openaiApiKey = process.env.OPENAI_API_KEY;
const openaiBaseUrl = process.env.OPENAI_BASE_URL || 'https://api.siliconflow.cn/v1'; // 默认值

let openai = null;

if (!openaiApiKey) {
    logger.warn('(openaiConfig.js) 警告：未配置 OPENAI_API_KEY 环境变量喵！AI 功能将不可用。');
    // console.warn('(openaiConfig.js) 警告：未配置 OPENAI_API_KEY 环境变量喵！AI 功能将不可用。');
} else {
    try {
        openai = new OpenAI({
            apiKey: openaiApiKey,
            baseURL: openaiBaseUrl,
        });
        logger.info(`(openaiConfig.js) OpenAI 客户端已配置喵~`, { baseURL: openaiBaseUrl }); // <-- 使用 logger
        // console.log(`(openaiConfig.js) OpenAI 客户端已配置，baseURL: ${openaiBaseUrl} 喵~`);
    } catch (error) {
        logger.error('(openaiConfig.js) 创建 OpenAI 客户端时出错喵:', { error: error }); // <-- 使用 logger
        // console.error('(openaiConfig.js) 创建 OpenAI 客户端时出错喵:', error);
        openai = null; // 确保出错时实例为 null
    }
}

module.exports = openai; // 直接导出实例 (可能是 null) 