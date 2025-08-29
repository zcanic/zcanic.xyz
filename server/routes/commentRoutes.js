const express = require('express');
const router = express.Router({ mergeParams: true });
const { body, param } = require('express-validator');
const commentController = require('../controllers/commentController');
const { verifyToken } = require('../middleware/authMiddleware');
const { handleValidationErrors } = require('../middleware/validationErrorHandler'); // Assuming you have this
const logger = require('../utils/logger');

// --- Validation Rules ---
const createCommentValidation = [
  body('content', '评论内容不能为空喵！').trim().notEmpty(),
  body('parentCommentId').optional({ nullable: true }).isInt({ min: 1 }).withMessage('无效的父评论 ID 格式喵！')
];

const commentIdValidation = [
  param('commentId', '无效的评论 ID 格式喵！').isInt({ min: 1 })
];

const postIdValidation = [
   param('postId', '无效的帖子 ID 格式喵！').isInt({ min: 1 })
]

// --- Routes --- 

// GET /api/posts/:postId/comments - Get all comments for a specific post
router.get('/', commentController.getCommentsForPost);

// POST /api/posts/:postId/comments - Add a new comment to a specific post (requires authentication)
router.post('/', verifyToken, commentController.addCommentToPost);

// GET /api/comments/post/:postId - 获取帖子的评论 (Public)
router.get(
  '/post/:postId', 
  postIdValidation,
  handleValidationErrors,
  async (req, res, next) => {
    logger.info(`[Route /comments/post/:postId GET] Request received for post ${req.params.postId}`);
    try {
      const comments = await commentController.getCommentsByPostId(req, req.params.postId);
      res.json(comments);
    } catch (error) {
      logger.error(`[Route /comments/post/:postId GET] Error fetching comments:`, error);
      next(error);
    }
  }
);

// POST /api/comments/post/:postId - 创建新评论 (Requires Auth)
router.post(
  '/post/:postId', 
  verifyToken, 
  postIdValidation, 
  createCommentValidation, 
  handleValidationErrors, 
  async (req, res, next) => {
    const postId = req.params.postId;
    const userId = req.user.id;
    const { content, parentCommentId } = req.body;
    logger.info(`[Route /comments/post/:postId POST] User ${userId} creating comment on post ${postId}`);
    try {
      const newComment = await commentController.createComment(req, userId, postId, content, parentCommentId);
      res.status(201).json(newComment);
    } catch (error) {
      logger.error(`[Route /comments/post/:postId POST] Error creating comment:`, error);
      if (error.message.startsWith('无法关联')) {
          error.statusCode = 400;
      }
      next(error);
    }
  }
);

// DELETE /api/comments/:commentId - 删除评论 (Requires Auth + Permission)
router.delete(
  '/:commentId', 
  verifyToken, 
  commentIdValidation, 
  handleValidationErrors, 
  async (req, res, next) => {
    const commentId = req.params.commentId;
    const userId = req.user.id;
    const userRole = req.user.role;
    logger.info(`[Route /comments/:commentId DELETE] User ${userId} attempting delete`);
    try {
      const result = await commentController.deleteComment(req, commentId, userId, userRole);
      res.json(result);
    } catch (error) {
      logger.error(`[Route /comments/:commentId DELETE] Error deleting comment:`, error);
      if (error.message.startsWith('找不到')) {
          error.statusCode = 404;
      } else if (error.message.startsWith('没有权限')) {
          error.statusCode = 403;
      }
      next(error);
    }
  }
);

module.exports = router; 