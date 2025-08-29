const { body, param } = require('express-validator');

// 验证规则：获取单个帖子
const getPostById = [
  param('id', '无效的帖子 ID 格式喵！').isInt({ min: 1 })
];

// 验证规则：删除帖子
const deletePost = [
  param('id', '无效的帖子 ID 格式喵！').isInt({ min: 1 })
];

// 验证规则：创建帖子 (已在 postRoutes.js 定义，为保持一致性可移到此处)
const createPost = [
  body('title', '标题不能为空喵！').isString().trim().notEmpty().isLength({ max: 255 }).withMessage('标题太长了喵 (最多 255 字符)！'),
  body('content', '内容不能为空喵！').isString().trim().notEmpty(),
  body('imageUrl').optional({ nullable: true, checkFalsy: true }).isString().trim().isLength({ max: 1024 }).withMessage('图片 URL 太长了喵！')
];

// 注意：更新帖子的验证规则已被注释掉，因为功能已移除
/*
const updatePost = [
  param('id', '无效的帖子 ID 格式喵！').isInt({ min: 1 }),
  body('title', '标题不能为空喵！').isString().trim().notEmpty().isLength({ max: 255 }).withMessage('标题太长了喵 (最多 255 字符)！'),
  body('content', '内容不能为空喵！').isString().trim().notEmpty(),
  body('imageUrl').optional({ nullable: true, checkFalsy: true }).isString().trim().isLength({ max: 1024 }).withMessage('图片 URL 太长了喵！')
];
*/

module.exports = {
  getPostById,
  deletePost,
  createPost,
  // updatePost, // Keep commented out
}; 