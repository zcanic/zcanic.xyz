const multer = require('multer');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger'); // <-- 引入 Winston logger
const { uploadDir } = require('./paths'); // <-- 添加这一行!

// --- Multer 配置 (用于图片上传) ---
// const uploadDir = path.join(__dirname, '../public/uploads'); // <-- 不再需要

// 确保上传目录存在 (此逻辑移至 server.js)
/*
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
    logger.info(`创建上传目录喵 (来自 multerConfig.js): ${uploadDir}`); // <-- 使用 logger
    // console.log(`创建上传目录喵 (来自 multerConfig.js): ${uploadDir}`);
}
*/

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // 文件存储路径
  },
  filename: function (req, file, cb) {
    // 生成唯一文件名: 时间戳-随机数.扩展名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// 文件过滤器，只允许图片
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('只允许上传图片文件喵!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 限制文件大小为 5MB
}); 

module.exports = upload; // 导出 upload 实例 