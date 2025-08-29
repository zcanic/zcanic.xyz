const { uploadUrlPath } = require('../config/paths'); // 导入统一的 URL 路径
const logger = require('../utils/logger'); // <-- 引入 Winston logger
require('dotenv').config(); // <-- 确保能读取 .env 文件

// 处理图片上传请求
exports.uploadImage = (req, res, next) => {
  logger.info('图片上传请求处理喵 (uploadController)...');
  // console.log('图片上传请求处理喵 (uploadController)...');

  // 检查文件是否由 multer 处理并上传成功
  if (!req.file) {
    logger.error('UploadController 错误：未找到上传的文件喵！', { requestDetails: req });
    // console.error('UploadController 错误：未找到上传的文件喵！');
    // Multer 错误通常由其自身处理，但以防万一
    return res.status(400).json({ message: '没有文件被上传，或者文件类型不符合要求喵！' });
  }

  // 文件上传成功，req.file 包含文件信息
  logger.info('文件上传成功喵:', { fileInfo: req.file });
  // console.log('文件上传成功喵:', req.file);

  // 构建文件的可访问 URL
  // 优先使用环境变量中定义的 BASE_URL
  const baseUrl = process.env.BASE_URL || ''; // 如果未定义，则为空字符串
  const imageUrl = `${baseUrl}${uploadUrlPath}/${req.file.filename}`;

  logger.info(`生成的图片 URL: ${imageUrl}`); // <-- Log the potentially full URL

  // 返回文件的 URL
  res.status(200).json({ 
    message: '图片上传成功喵！',
    imageUrl: imageUrl // 前端将使用这个 URL (现在是完整的或相对的)
  });

  // 注意：这里没有错误处理块 (try/catch)，因为主要的文件处理和验证
  // 是由 multer 中间件完成的。如果 multer 出错，它会调用 next(error)
  // 并被全局错误处理器捕获。如果需要更精细的错误处理，可以在这里添加。
}; 