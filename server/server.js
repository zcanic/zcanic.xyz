const express = require('express');
const cors = require('cors');
const helmet = require('helmet'); // <-- 引入 helmet
const path = require('path');
const cron = require('node-cron'); // Import node-cron
// const { fetchAndSummarizeNews } = require('./newsService'); // <-- REMOVE News Service
// const { getNewsConfig, setNewsConfig } = require('./newsConfigService'); // <-- REMOVE News Config Service
require('dotenv').config({ path: path.resolve(__dirname, '../.env') }); // <-- 添加 dotenv 支持，读取 .env 文件
// const fortuneRoutes = require('./routes/fortuneRoutes'); // <-- Remove this duplicate declaration
const { initializeDatabase, pool } = require('./db/database'); // <-- Import pool along with initializer
const logger = require('./utils/logger'); // <-- 引入 Winston logger
const { startTaskProcessor } = require('./utils/taskManager'); // <-- 引入任务处理器
const upload = require('./config/multerConfig'); // <-- 导入 multer 配置
const authRoutes = require('./routes/authRoutes'); // <-- 导入认证路由
const postRoutes = require('./routes/postRoutes'); // <-- 导入帖子路由
const uploadRoutes = require('./routes/uploadRoutes'); // <-- 导入上传路由
const aiRoutes = require('./routes/aiRoutes'); // <-- 导入 AI 路由
// const newsRoutes = require('./routes/newsRoutes'); // <-- REMOVE News Routes
const fortuneRoutes = require('./routes/fortuneRoutes'); // <-- Keep one declaration
const memoryRoutes = require('./routes/memoryRoutes'); // <-- Import memory routes
const commentRoutes = require('./routes/commentRoutes'); // <-- Import comment routes
const chatRoutes = require('./routes/chatRoutes'); // <-- 导入聊天路由
const taskRoutes = require('./routes/taskRoutes'); // <-- 导入任务路由
const voiceRoutes = require('./routes/voiceRoutes'); // <-- 导入语音路由
const { uploadDir, uploadUrlPath } = require('./config/paths'); // <-- 导入统一路径
const openai = require('./config/openaiConfig'); // <-- 导入 OpenAI 实例 (可能为 null)
const rateLimit = require('express-rate-limit'); // <-- Import rateLimit
const globalErrorHandler = require('./middleware/globalErrorHandler'); // <-- UNCOMMENT this require
const fs = require('fs'); // <-- Import fs here instead of inline require
const cookieParser = require('cookie-parser'); // <-- 导入 cookie-parser
const { DEFAULT_SYSTEM_PROMPT } = require('./config/prompts'); // 导入系统提示

// 日志显示系统提示前200个字符，确认加载
logger.info(`[Server] 加载的系统提示前200个字符: ${DEFAULT_SYSTEM_PROMPT ? DEFAULT_SYSTEM_PROMPT.substring(0, 200) + '...' : 'undefined'}`);

// --- Early Environment Variable Check --- 
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_DATABASE', 'JWT_SECRET'];
if (process.env.NODE_ENV === 'production') {
  requiredEnvVars.push('CORS_ORIGIN');
}
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  logger.error(`启动失败喵！缺少必要的环境变量: ${missingVars.join(', ')}`);
  process.exit(1);
}
logger.info('必要的环境变量检查通过喵！');
// --- End Check --- 

const app = express();
const PORT = process.env.PORT || 3001;

// --- Trust Proxy --- 
// Trust the first proxy hop (e.g., Nginx in front of the app)
// Required for express-rate-limit to correctly identify client IP behind proxy
app.set('trust proxy', 1);
logger.info('已配置信任代理喵 (trust proxy = 1)');

// --- 数据库配置和初始化已移至 db/database.js ---

// --- OpenAI 配置已移至 config/openaiConfig.js ---

// --- Multer 配置已移至 config/multerConfig.js ---

// --- 中间件 ---
// !! 安全相关中间件建议放在前面 !!
app.use(helmet()); // <-- 使用 helmet 设置安全头

// CORS 配置 (开发环境宽松，生产环境应指定来源)
const corsOptions = {
  // origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : '*', // 生产环境使用环境变量指定前端 URL
  // credentials: true, // 如果需要 cookie
};
// 提醒：生产部署时务必在 .env 配置 FRONTEND_URL 并取消注释上面的 origin 设置！
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true }));

app.use(express.json()); // 解析 JSON 请求体
app.use(cookieParser()); // <-- 使用 cookie-parser
app.use('/api/fortune', fortuneRoutes);
// --- 添加早期请求日志中间件 ---
app.use((req, res, next) => {
  // 使用 logger 记录请求信息，级别为 'http' 或 'info'
  logger.http(`收到请求喵: ${req.method} ${req.originalUrl}`, { // 使用 http 级别更合适
    ip: req.ip, // 记录 IP 地址
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('User-Agent') // 记录 User-Agent
  });
  next(); // 继续处理下一个中间件或路由
});
// --- 结束添加早期日志 ---

// --- 配置静态文件服务 ---
// const staticUploadDir = path.join(__dirname, 'public/uploads'); // <-- 不再需要
// 确保目录存在 (使用导入的 uploadDir)
if (!fs.existsSync(uploadDir)) {
  logger.warn(`[Server] Upload directory ${uploadDir} does not exist. Attempting to create...`);
  try {
      fs.mkdirSync(uploadDir, { recursive: true });
      logger.info(`[Server] Successfully created upload directory: ${uploadDir}`);
  } catch (err) {
       logger.error(`[Server] CRITICAL: Failed to create upload directory ${uploadDir}. File uploads will likely fail. Error:`, err);
       // Consider whether to exit the process if uploads are critical
       // process.exit(1);
  }
}
app.use(uploadUrlPath, express.static(uploadDir)); // <-- 使用导入的 URL 路径和目录路径
logger.info(`提供静态文件服务于 ${uploadUrlPath} 路径，源自 ${uploadDir} 喵~`); // 使用 logger

// --- 挂载路由 --- 
app.use('/api/auth', authRoutes); // <-- 使用认证路由，挂载在 /api/auth 下
app.use('/api/posts', postRoutes); // <-- 使用帖子路由，挂载在 /api/posts 下
// Mount comment routes nested under posts
app.use('/api/posts/:postId/comments', commentRoutes); // <-- ADDED this line
app.use('/api/upload', uploadRoutes); // <-- 使用上传路由，挂载在 /api/upload 下
app.use('/api/ai', aiRoutes); // <-- 使用 AI 路由，挂载在 /api/ai 下
// app.use('/api/news', newsRoutes); // <-- REMOVE News Routes usage
app.use('/api/fortune', fortuneRoutes); // <-- ADD Fortune Routes usage
app.use('/api/memory', memoryRoutes); // <-- Use memory routes
app.use('/api/chat', chatRoutes); // <-- 使用聊天路由
app.use('/api/tasks', taskRoutes); // <-- 使用任务路由
app.use('/api/voice', voiceRoutes); // <-- 使用语音路由
// app.use('/api/comments', commentRoutes); // <-- REMOVE this top-level mounting if it exists

// --- 旧的 apiRouter 可以移除了 (如果还有的话) ---
// const apiRouter = express.Router(); 
// apiRouter.use(...); 
// app.use('/api', apiRouter);

// --- 全局错误处理中间件 (改进) ---
app.use(globalErrorHandler); // Use the global error handler

// --- 定时任务 (Cron Job) --- 
// !! REMOVE the old news summary cron job !!
/*
cron.schedule('0 1 * * *', async () => { 
  logger.info('Running daily news summary cron job 喵...');
  const pool = app.locals.pool; 
  if (pool && openai) {
    try {
      await fetchAndSummarizeNews(pool, openai);
      logger.info('Daily news summary cron job finished successfully 喵.');
    } catch (err) {
      logger.error('Daily news summary cron job failed 喵:', { error: err });
    }
  } else {
    logger.warn('数据库或 OpenAI 未初始化，跳过本次定时 News 摘要任务喵。')
  }
}, {
  scheduled: true,
  timezone: "Asia/Shanghai" 
});
logger.info("News 摘要定时任务已设置 (每天凌晨 1 点) 喵~");
*/
logger.info("不再设置 News 定时任务喵~"); // Log removal

// --- Rate Limiting (Example, apply before routes) ---
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: '请求太频繁了喵，请稍后再试！',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
// Apply the rate limiting middleware to all requests or specific APIs
// app.use(limiter); // Apply globally - BE CAREFUL, might block legitimate bursts
app.use('/api/auth', limiter); // Example: Apply only to auth routes
app.use('/api/posts', limiter); // Example: Apply to posts
app.use('/api/ai', limiter); // Example: Apply to AI routes
logger.info('速率限制中间件已配置喵 (针对部分 API)');

// --- 全局变量，用于存储任务处理器的清理函数 ---
let taskProcessorCleanup = null;

// --- Initialize DB and Start Server --- 
const start = async () => {
  try {
    // 确保 pool 确实存在 (虽然理论上 require 时已处理)
    if (!pool) {
        logger.error('[Server] CRITICAL: Database pool is not available on startup!');
        process.exit(1);
    }

    // Attach pool to app.locals 
    app.locals.pool = pool;
    logger.info('[Server] Database pool attached to app.locals.pool');

    // --- Initialize Database Schema ---
    logger.info('[Server] Initializing database schema...');
    await initializeDatabase(pool); // <-- 添加数据库初始化调用
    logger.info('[Server] Database schema initialization complete.');
    // --- End Initialize Database Schema ---
    
    // --- 启动任务处理器 ---
    taskProcessorCleanup = startTaskProcessor(pool);
    logger.info('[Server] 异步任务处理器已启动');
    
    app.listen(PORT, () => {
      logger.info(`Server listening on port ${PORT} 喵!`); // <-- 我们期待看到这条日志！
    });
  } catch (error) {
     // 这个 catch 块现在主要捕获 app.locals 赋值或 app.listen 的同步错误 (虽然很少见)
     logger.error('[Server] Failed to attach pool or start listening:', error);
     process.exit(1);
  }
};

start(); // Call the start function directly

// --- 处理进程关闭前的清理工作 ---
process.on('SIGTERM', () => {
  logger.info('[Server] SIGTERM received, shutting down gracefully');
  cleanup();
});

process.on('SIGINT', () => {
  logger.info('[Server] SIGINT received, shutting down gracefully');
  cleanup();
});

// 清理函数
function cleanup() {
  try {
    // 停止任务处理器
    if (taskProcessorCleanup) {
      taskProcessorCleanup();
      taskProcessorCleanup = null;
    }
    
    // 关闭数据库连接池
    if (pool) {
      pool.end();
      logger.info('[Server] Database connection pool closed');
    }
    
    logger.info('[Server] Cleanup complete, exiting');
    process.exit(0);
  } catch (error) {
    logger.error('[Server] Error during cleanup:', error);
    process.exit(1);
  }
}

// Removed app export
// module.exports = app; 