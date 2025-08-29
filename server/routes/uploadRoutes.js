const express = require('express');
const uploadController = require('../controllers/uploadController');
const authMiddleware = require('../middleware/authMiddleware');
const { verifyToken } = require('../middleware/authMiddleware'); // 添加解构引用，以备将来可能的重构
const upload = require('../config/multerConfig'); // 导入 Multer 配置
const multer = require('multer'); // <-- 导入 multer 自身以检查错误类型
const logger = require('../utils/logger'); // <-- 导入 logger

const router = express.Router();

// POST /api/upload/image
// 1. authMiddleware.verifyToken: 验证用户 JWT
// 2. upload.single('image'): 处理名为 'image' 的单个文件上传，增加错误处理
// 3. uploadController.uploadImage: 处理请求，返回 URL
router.post(
    '/image', 
    authMiddleware.verifyToken,
    // 添加 Multer 错误处理中间件
    (req, res, next) => { 
        upload.single('image')(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                // Multer 自身的错误 (例如文件过大)
                logger.warn('Multer upload error:', { error: err });
                if (err.code === 'LIMIT_FILE_SIZE') {
                    // 返回 413 Payload Too Large
                    return res.status(413).json({ message: '文件太大了喵 (最大 5MB)！' });
                }
                // 其他 Multer 错误可以返回 400
                return res.status(400).json({ message: `上传出错喵: ${err.message}` });
            } else if (err) {
                // 由 fileFilter 抛出的错误 (例如文件类型不对)
                 logger.warn('Non-Multer upload error (likely fileFilter): ', { error: err });
                // 返回 400 Bad Request，使用 fileFilter 传入的错误消息
                return res.status(400).json({ message: err.message }); // 使用 fileFilter 里的消息
            }
            // 没有错误，继续下一个中间件 (uploadController.uploadImage)
            next();
        });
    },
    uploadController.uploadImage
);

module.exports = router; 