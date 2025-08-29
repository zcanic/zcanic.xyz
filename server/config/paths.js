const path = require('path');
require('dotenv').config(); // Ensure .env is loaded to read other potential variables
const logger = require('../utils/logger'); // Import logger

// 项目根目录下的 server 目录
const serverRoot = path.resolve(__dirname, '..'); 

// !! 直接使用指定的绝对上传路径 !!
const uploadDir = "/www/wwwroot/www.zcanic.xyz/uploads/"; // <-- Hardcoded absolute path

// 对外暴露的 URL 基础路径 (保持不变或也可配置)
const uploadUrlPath = process.env.UPLOAD_URL_PATH || '/uploads';

// Log the final paths being used
logger.info(`[Paths Config] Using HARDCODED uploadDir: ${uploadDir}`); // Log that it's hardcoded
logger.info(`[Paths Config] Using uploadUrlPath: ${uploadUrlPath}`);

// Note: The directory check/creation logic in server.js will now
// check/create this absolute path. Ensure Node has permissions!

module.exports = {
    serverRoot,
    uploadDir, // Export the hardcoded absolute path
    uploadUrlPath
}; 