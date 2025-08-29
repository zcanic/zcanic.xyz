const { pool } = require('../db/database');
const logger = require('../utils/logger');

/**
 * 获取指定帖子的评论列表 (包含用户名)
 * v1: 返回扁平列表，按创建时间排序
 * @param {object} req - Express request object (for accessing pool)
 * @param {number|string} postId - The ID of the post.
 */
exports.getCommentsByPostId = async (req, postId) => {
  const pool = req.app.locals.pool;
  logger.info(`[CommentCtrl] Fetching comments for post ${postId}`);
  try {
    const sql = `
      SELECT c.id, c.post_id, c.user_id, c.parent_comment_id, c.content, c.created_at, c.updated_at, u.username 
      FROM comments c 
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC 
    `; // Sort by oldest first for display
    const [comments] = await pool.query(sql, [postId]);
    logger.info(`[CommentCtrl] Found ${comments.length} comments for post ${postId}`);
    return comments;
  } catch (error) {
    logger.error(`[CommentCtrl] Error fetching comments for post ${postId}:`, error);
    throw new Error('获取评论失败喵 T_T');
  }
};

/**
 * 创建新评论
 * @param {object} req - Express request object (for accessing pool)
 * @param {number|string} userId - The ID of the user creating the comment.
 * @param {number|string} postId - The ID of the post being commented on.
 * @param {string} content - The comment content.
 * @param {number|string|null} [parentCommentId=null] - The ID of the parent comment, if any.
 */
exports.createComment = async (req, userId, postId, content, parentCommentId = null) => {
  const pool = req.app.locals.pool;
  logger.info(`[CommentCtrl] User ${userId} creating comment on post ${postId}`);
  if (!content || String(content).trim() === '') {
    throw new Error('评论内容不能为空喵！');
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO comments (post_id, user_id, content, parent_comment_id) VALUES (?, ?, ?, ?)',
      [postId, userId, content, parentCommentId]
    );
    const commentId = result.insertId;
    logger.info(`[CommentCtrl] Comment ${commentId} created successfully by user ${userId} on post ${postId}`);
    
    // Fetch the newly created comment with username to return
    const [newComment] = await pool.query(
      `SELECT c.id, c.post_id, c.user_id, c.parent_comment_id, c.content, c.created_at, c.updated_at, u.username 
       FROM comments c 
       JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`, 
      [commentId]
    );
    return newComment[0];
  } catch (error) {
    logger.error(`[CommentCtrl] Error creating comment for user ${userId} on post ${postId}:`, error);
    // Check for foreign key constraint errors specifically
    if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.message.includes('foreign key constraint fails')) {
      // Could be invalid postId or parentCommentId
       throw new Error('无法关联到帖子或父评论喵，请检查 ID 是否正确。');
    }
    throw new Error('创建评论失败喵 T_T');
  }
};

/**
 * 删除评论 (需要权限检查)
 * @param {object} req - Express request object (for accessing pool)
 * @param {number|string} commentId - The ID of the comment to delete.
 * @param {number|string} requestingUserId - The ID of the user attempting deletion.
 * @param {string} requestingUserRole - The role of the user attempting deletion.
 */
exports.deleteComment = async (req, commentId, requestingUserId, requestingUserRole) => {
  const pool = req.app.locals.pool;
  logger.info(`[CommentCtrl] User ${requestingUserId} (Role: ${requestingUserRole}) attempting to delete comment ${commentId}`);
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Find the comment and its owner
    const [comments] = await connection.query('SELECT user_id FROM comments WHERE id = ?', [commentId]);
    if (comments.length === 0) {
      await connection.rollback();
      connection.release();
      logger.warn(`[CommentCtrl] Delete failed: Comment ${commentId} not found.`);
      throw new Error('找不到要删除的评论喵！');
    }
    const commentOwnerId = comments[0].user_id;

    // 2. Authorization Check: Owner or Admin?
    if (commentOwnerId !== requestingUserId && requestingUserRole !== 'admin') {
      await connection.rollback();
      connection.release();
      logger.warn(`[CommentCtrl] Delete forbidden: User ${requestingUserId} cannot delete comment ${commentId} owned by ${commentOwnerId}.`);
      throw new Error('没有权限删除这条评论喵！');
    }

    // 3. Delete the comment (and potentially children due to FK constraint ON DELETE CASCADE)
    const [result] = await connection.query('DELETE FROM comments WHERE id = ?', [commentId]);
    
    if (result.affectedRows > 0) {
      await connection.commit();
      connection.release();
      logger.info(`[CommentCtrl] Comment ${commentId} deleted successfully by user ${requestingUserId}.`);
      return { message: '评论删除成功喵！' };
    } else {
      // Should not happen if found earlier, but good practice
      await connection.rollback();
      connection.release();
      logger.warn(`[CommentCtrl] Delete failed: Comment ${commentId} found but delete affected 0 rows.`);
      throw new Error('删除评论时发生意外错误喵！');
    }

  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    logger.error(`[CommentCtrl] Error deleting comment ${commentId} by user ${requestingUserId}:`, error);
    // Rethrow specific errors if needed, otherwise a generic one
    if (error.message.startsWith('找不到') || error.message.startsWith('没有权限')) {
        throw error; 
    }
    throw new Error('删除评论失败喵 T_T');
  }
};

// Controller to get all comments for a specific post
exports.getCommentsForPost = async (req, res, next) => {
    const { postId } = req.params; // Get postId from URL parameter
    logger.info(`[CommentCtrl] Fetching comments for post ID: ${postId}`);

    if (!postId || isNaN(parseInt(postId))) { // Basic validation
        logger.warn('[CommentCtrl] Invalid post ID received for fetching comments.');
        return res.status(400).json({ message: '无效的帖子 ID 喵！' });
    }

    try {
        const [comments] = await pool.query(
            'SELECT c.*, u.username FROM comments c JOIN users u ON c.user_id = u.id WHERE c.post_id = ? ORDER BY c.created_at ASC',
            [postId]
        );
        logger.info(`[CommentCtrl] Found ${comments.length} comments for post ID: ${postId}`);
        res.status(200).json(comments);
    } catch (error) {
        logger.error(`[CommentCtrl] Error fetching comments for post ${postId}:`, error);
        next(error); // Pass error to global error handler
    }
};

// Controller to add a new comment to a specific post
exports.addCommentToPost = async (req, res, next) => {
    const { postId } = req.params; // Get postId from URL parameter
    const { content, parent_comment_id = null } = req.body; // Get content and optional parent_comment_id from request body
    const userId = req.user.id; // Get user ID from authenticated user (provided by verifyToken middleware)

    logger.info(`[CommentCtrl] Attempting to add comment for post ID: ${postId} by user ID: ${userId}`);

    // Basic Validation
    if (!postId || isNaN(parseInt(postId))) {
        logger.warn('[CommentCtrl] Invalid post ID received for adding comment.');
        return res.status(400).json({ message: '无效的帖子 ID 喵！' });
    }
    if (!content || typeof content !== 'string' || content.trim() === '') {
        logger.warn('[CommentCtrl] Invalid comment content received.');
        return res.status(400).json({ message: '评论内容不能为空喵！' });
    }
    // Optional: Validate parent_comment_id if provided
    if (parent_comment_id !== null && (isNaN(parseInt(parent_comment_id)) || parseInt(parent_comment_id) <= 0)) {
        logger.warn('[CommentCtrl] Invalid parent comment ID received.');
        return res.status(400).json({ message: '无效的父评论 ID 喵！' });
    }

    try {
        // Insert the new comment into the database
        const [result] = await pool.query(
            'INSERT INTO comments (post_id, user_id, content, parent_comment_id) VALUES (?, ?, ?, ?)',
            [postId, userId, content.trim(), parent_comment_id]
        );

        const insertId = result.insertId;
        logger.info(`[CommentCtrl] Successfully added comment with ID: ${insertId} to post ID: ${postId}`);

        // Fetch the newly created comment along with the username to return to the client
        const [newComment] = await pool.query(
            'SELECT c.*, u.username FROM comments c JOIN users u ON c.user_id = u.id WHERE c.id = ?',
            [insertId]
        );

        if (newComment.length === 0) {
            // This should technically not happen if insert succeeded, but handle defensively
            logger.error(`[CommentCtrl] Failed to fetch newly created comment with ID: ${insertId}`);
            return res.status(500).json({ message: '评论已添加，但获取评论详情失败了喵'});
        }

        res.status(201).json(newComment[0]); // Return the newly created comment object
    } catch (error) {
        logger.error(`[CommentCtrl] Error adding comment to post ${postId}:`, error);
        // Check for specific errors, e.g., foreign key constraint violation for parent_comment_id
        if (error.code === 'ER_NO_REFERENCED_ROW_2' && error.message.includes('parent_comment_id')) {
             logger.warn(`[CommentCtrl] Attempted to reply to a non-existent parent comment ID for post ${postId}.`);
            return res.status(400).json({ message: '回复的父评论不存在喵！' });
        }
        next(error); // Pass other errors to global error handler
    }
}; 