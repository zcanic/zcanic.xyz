const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs-extra');
const { uploadDir } = require('../config/paths');

// 获取所有帖子 (公开 - 支持搜索)
exports.getAllPosts = async (req, res, next) => {
  const pool = req.app.locals.pool;
  const { search } = req.query;
  let queryParams = [];
  logger.info(`[PostCtrl] getAllPosts request received. Search term: '${search}'`);

  // Modified SQL to include comment count
  let sql = `
    SELECT 
      p.id, p.title, 
      p.user_id,
      SUBSTRING(p.content, 1, 150) AS content_preview, -- Only select a preview
      p.imageUrl, 
      p.created_at, p.updated_at, 
      u.username,
      COUNT(c.id) AS comment_count -- Count comments using LEFT JOIN
    FROM blog_posts p
    LEFT JOIN users u ON p.user_id = u.id
    LEFT JOIN comments c ON p.id = c.post_id -- Join with comments table
  `;

  let whereClauses = [];

  // Add search condition (Full-text search)
  if (search) {
    whereClauses.push(`MATCH(p.title, p.content) AGAINST(? IN BOOLEAN MODE)`);
    queryParams.push(search);
    logger.debug(`[PostCtrl] Adding search filter: ${search}`);
  }

  if (whereClauses.length > 0) {
    sql += ` WHERE ${whereClauses.join(' AND ')}`;
  }

  // Add GROUP BY clause to correctly count comments per post
  sql += ` GROUP BY p.id`;

  // Add ordering
  sql += ` ORDER BY p.created_at DESC`;

  try {
    logger.debug(`[PostCtrl] Executing getAllPosts query: ${sql} with params: [${queryParams.join(', ')}]`);
    const [posts] = await pool.query(sql, queryParams);
    logger.info(`[PostCtrl] Fetched ${posts.length} posts with comment counts.`);
    
    res.json(posts);
  } catch (error) {
    logger.error(`[PostCtrl] Error fetching posts: ${error.message}`, { stack: error.stack });
    next(error); // Pass to global error handler
  }
};

// 获取单个帖子详情 (公开)
exports.getPostById = async (req, res, next) => {
  const pool = req.app.locals.pool;
  const postId = req.params.id;
  logger.info(`[PostCtrl] getPostById request for post ID: ${postId}`);

  // 简化查询，不再需要 GROUP_CONCAT 和 JOIN tags
  const sql = `
    SELECT 
      p.id, p.title, p.content, p.imageUrl, p.created_at, p.updated_at, 
      u.username
    FROM blog_posts p
    LEFT JOIN users u ON p.user_id = u.id
    WHERE p.id = ?
  `;

  try {
    const [posts] = await pool.query(sql, [postId]);

    if (posts.length === 0) {
      logger.warn(`[PostCtrl] getPostById failed: Post ${postId} not found.`);
      return res.status(404).json({ message: '找不到该帖子喵！' });
    }
    
    const post = posts[0];
    // 不需要处理 tags 了

    logger.info(`[PostCtrl] Fetched post ${postId} successfully.`);
    res.json(post);

  } catch (error) {
    logger.error(`[PostCtrl] Error fetching post ${postId}: ${error.message}`, { stack: error.stack });
    next(error); // Pass to global error handler
  }
};

// 创建新帖子 (需要登录)
exports.createPost = async (req, res, next) => {
  console.log('[postController] Entering createPost, req.user:', req.user);
  const currentUser = req.user;

  // --- 增强日志 ---
  console.log(`[postController][createPost] BEFORE CHECK: currentUser.id = ${currentUser?.id}, TYPE = ${typeof currentUser?.id}`);
  // --- 结束增强日志 ---
  // --- 最严格的检查 ---
  const isValidUserId = typeof currentUser?.id === 'number' && currentUser.id > 0;
  if (!isValidUserId) { 
    logger.error('[postController] createPost failed STRICT CHECK for user ID!', { userIdRaw: currentUser?.id, type: typeof currentUser?.id, user: currentUser }); 
    return res.status(401).json({ message: '无法获取有效的用户信息，无法创建帖子喵！' });
  }
  // --- 检查结束 ---
  
  const pool = req.app.locals.pool;
  const { title, content, imageUrl } = req.body;
  const userId = currentUser.id;
  logger.info(`[PostCtrl] createPost attempt by user ${userId}, title: ${title}`);

  try {
    // 1. Insert the blog post
    const [result] = await pool.query(
      'INSERT INTO blog_posts (user_id, title, content, imageUrl) VALUES (?, ?, ?, ?)',
      [userId, title, content, imageUrl || null]
    );
    const postId = result.insertId;
    logger.info(`[PostCtrl] Post created with ID: ${postId} by user ${userId}.`);

    // 查询刚创建的包含用户名的帖子信息返回
    const [newPost] = await pool.query(
        `SELECT p.id, p.title, p.content, p.imageUrl, p.created_at, p.updated_at, u.username 
         FROM blog_posts p 
         JOIN users u ON p.user_id = u.id 
         WHERE p.id = ?`,
         [postId]
    );

    res.status(201).json(newPost[0]);

  } catch (error) {
    logger.error(`[PostCtrl] Error creating post for user ${userId}: ${error.message}`, { stack: error.stack });
    next(error); // Pass to global error handler
  }
};

// 删除帖子
exports.deletePost = async (req, res, next) => {
  const pool = req.app.locals.pool;
  const postId = req.params.id;
  const currentUser = req.user;
  console.log('[postController] Entering deletePost, currentUser:', currentUser);
  const requestingUserId = currentUser?.id;
  const requestingUserRole = currentUser?.role;

  // --- 增强日志 ---
  console.log(`[postController][deletePost] BEFORE CHECK: requestingUserId = ${requestingUserId}, TYPE = ${typeof requestingUserId}`);
  // --- 结束增强日志 ---
  logger.info(`删除帖子请求喵: PostID=${postId}, UserID=${requestingUserId}, Role=${requestingUserRole}`);

  // --- 最严格的检查 ---
  const isValidUserId = typeof requestingUserId === 'number' && requestingUserId > 0;
  if (!isValidUserId) {
    logger.error('[postController] deletePost failed STRICT CHECK for user ID!', { userIdRaw: requestingUserId, type: typeof requestingUserId, user: currentUser }); 
    return res.status(401).json({ message: '需要有效的登录信息才能删除帖子喵！' });
  }
  // --- 检查结束 ---

  if (!pool) {
      logger.error('[postController] deletePost: 数据库连接池不可用喵！');
      return res.status(500).json({ message: '数据库服务暂时不可用喵 T_T' });
  }

  try {
    // 1. 检查帖子是否存在，并获取帖子的 user_id 和 imageUrl
    logger.debug(`[deletePost] Checking existence for post ID: ${postId}`);
    const checkQuery = 'SELECT user_id, imageUrl FROM blog_posts WHERE id = ?';
    const [posts] = await pool.query(checkQuery, [postId]);

    if (posts.length === 0) {
      logger.warn(`[postController] deletePost: 尝试删除不存在的帖子 ID: ${postId}`);
      return res.status(404).json({ message: '找不到要删除的帖子喵！' });
    }

    const postUserId = posts[0].user_id;
    const postImageUrl = posts[0].imageUrl;

    // 2. 权限检查：是否是所有者 或 管理员
    if (postUserId !== requestingUserId && requestingUserRole !== 'admin') {
      logger.warn(`[postController] deletePost: Forbidden attempt by User ID ${requestingUserId} (Role: ${requestingUserRole}) to delete post ID ${postId} owned by User ID ${postUserId}`);
      return res.status(403).json({ message: '哼，这不是你的帖子，不能删喵！(除非你是管理员)' });
    }
    logger.debug(`[deletePost] Permission granted for user ${requestingUserId} on post ${postId}`);

    // --- Start Transaction ---
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      logger.info(`[postController] deletePost: Starting transaction for deleting post ${postId}`);

      // 3. 权限检查通过，执行删除 (within transaction)
    logger.info(`[postController] deletePost: User ID ${requestingUserId} (Role: ${requestingUserRole}) deleting post ID ${postId}`);
    const deleteQuery = 'DELETE FROM blog_posts WHERE id = ?';
      logger.debug(`[deletePost] Executing delete query for post ID: ${postId}`);
      const [result] = await connection.query(deleteQuery, [postId]);
      logger.debug(`[deletePost] Delete query result: affectedRows = ${result.affectedRows}`);

    if (result.affectedRows > 0) {
        logger.info(`帖子 ID ${postId} 从数据库删除成功喵！`);

        // 4. If deletion successful and there was an image URL, attempt to delete the image file
        if (postImageUrl) {
          // Basic check: assume URL like /uploads/imagename.jpg maps to uploadDir/imagename.jpg
          // This needs refinement based on actual URL structure and storage location!
          const imageName = path.basename(postImageUrl);
          const imagePath = path.join(uploadDir, imageName);
          logger.info(`[postController] deletePost: Attempting to delete associated image: ${imagePath}`);
          try {
            if (await fs.pathExists(imagePath)) { // Use fs-extra's pathExists
              await fs.remove(imagePath);
              logger.info(`[postController] deletePost: Successfully deleted image file: ${imagePath}`);
            } else {
              logger.warn(`[postController] deletePost: Image file not found, cannot delete: ${imagePath}`);
            }
          } catch (fileError) {
            logger.error(`[postController] deletePost: Error deleting image file ${imagePath}, but post ${postId} was deleted from DB.`, { error: fileError });
          }
        } else {
           logger.debug(`[deletePost] No image URL associated with post ${postId}. Skipping file deletion.`);
        }

        await connection.commit(); // Commit transaction
        logger.info(`[postController] deletePost: Transaction committed for post ${postId}`);
      res.status(200).json({ message: '帖子删除成功喵！' });

    } else {
        // Should not happen if the initial check found the post, but handle defensively
        await connection.rollback(); // Rollback transaction
        logger.warn(`[postController] deletePost: Delete query affected 0 rows for post ID: ${postId}. Rolling back.`);
      res.status(404).json({ message: '找不到要删除的帖子喵！(删除时再次检查)' });
    }

  } catch (error) {
        await connection.rollback(); // Rollback transaction on any error
        logger.error('删除帖子失败喵 (Transaction Rolled Back):', { postId: postId, userId: requestingUserId, error: error });
        next(error); // Pass to global error handler
    } finally {
        connection.release(); // Always release connection
    }
  } catch (outerError) {
    // Catch errors from getConnection itself or other setup before transaction
    logger.error('删除帖子过程中发生外部错误喵:', { postId: postId, userId: requestingUserId, error: outerError });
    next(outerError);
  }
};

// 更新帖子 (需要登录 + 权限检查) --- REMOVED
/*
exports.updatePost = async (req, res, next) => {
  const pool = req.app.locals.pool;
  const postId = req.params.id;
  const { title, content, imageUrl } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;
  logger.info(`[PostCtrl] updatePost attempt on post ${postId} by user ${userId} (role: ${userRole})`);

  try {
    // 1. Find the post and check ownership/admin permission
    const [posts] = await pool.query('SELECT user_id FROM blog_posts WHERE id = ?', [postId]);
    if (posts.length === 0) {
      logger.warn(`[PostCtrl] updatePost failed: Post ${postId} not found.`);
      return res.status(404).json({ message: '找不到要更新的帖子喵！' });
    }
    const postOwnerId = posts[0].user_id;

    if (postOwnerId !== userId && userRole !== 'admin') {
      logger.warn(`[PostCtrl] updatePost forbidden for user ${userId} on post ${postId} (owner: ${postOwnerId}).`);
      return res.status(403).json({ message: '没有权限更新这个帖子喵！' });
    }

    // 2. Update the blog post content
    const [updateResult] = await pool.query(
      'UPDATE blog_posts SET title = ?, content = ?, imageUrl = ? WHERE id = ?',
      [title, content, imageUrl || null, postId]
    );
    logger.info(`[PostCtrl] Post ${postId} content updated by user ${userId}. Affected rows: ${updateResult.affectedRows}`);

    // 查询更新后的包含用户名的帖子信息返回
    const [updatedPost] = await pool.query(
        `SELECT p.id, p.title, p.content, p.imageUrl, p.created_at, p.updated_at, u.username 
         FROM blog_posts p 
         JOIN users u ON p.user_id = u.id 
         WHERE p.id = ?`,
         [postId]
    );

    res.json(updatedPost[0]);

  } catch (error) {
    logger.error(`[PostCtrl] Error updating post ${postId} by user ${userId}: ${error.message}`, { stack: error.stack });
    next(error); // Pass to global error handler
  }
}; 
*/ 