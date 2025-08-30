const logger = require('../utils/logger');
const { getTask, getTasksStatus } = require('../utils/taskManager');

// 获取单个任务状态
exports.getTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;
    const pool = req.app.locals.pool;
    
    if (!pool) {
      logger.error('[taskController] 数据库连接池不可用');
      return res.status(500).json({ success: false, message: '服务器错误，请稍后再试' });
    }
    
    const task = await getTask(pool, taskId);
    
    if (!task) {
      return res.status(404).json({ success: false, message: '任务不存在' });
    }
    
    // 验证用户是否有权限查看该任务
    if (task.user_id !== userId) {
      logger.warn(`[taskController] 用户 ${userId} 尝试访问不属于他的任务 ${taskId}`);
      return res.status(403).json({ success: false, message: '无权访问此任务' });
    }
    
    res.status(200).json({
      success: true,
      task: {
        id: task.id,
        type: task.type,
        status: task.status,
        relatedId: task.related_id,
        createdAt: task.created_at,
        updatedAt: task.updated_at,
        result: task.result,
        error: task.error
      }
    });
    
  } catch (error) {
    logger.error(`[taskController] 获取任务状态失败: ${error.message}`, { taskId: req.params.taskId });
    res.status(500).json({ success: false, message: '获取任务状态失败' });
  }
};

// 批量获取任务状态 - 优化批量处理性能
exports.batchGetTasksStatus = async (req, res) => {
  try {
    const { taskIds } = req.body;
    const userId = req.user.id;
    const pool = req.app.locals.pool;
    
    if (!pool) {
      logger.error('[taskController] 数据库连接池不可用');
      return res.status(500).json({ success: false, message: '服务器错误，请稍后再试' });
    }
    
    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({ success: false, message: '请提供有效的任务ID列表' });
    }
    
    // 性能优化：限制批量查询数量，防止过大查询
    const MAX_BATCH_SIZE = 50;
    if (taskIds.length > MAX_BATCH_SIZE) {
      logger.warn(`[taskController] 批量查询数量过大: ${taskIds.length}, 用户: ${userId}`);
      return res.status(400).json({ 
        success: false, 
        message: `批量查询数量不能超过${MAX_BATCH_SIZE}个` 
      });
    }
    
    // 记录查询性能指标
    const startTime = process.hrtime.bigint();
    
    // 获取任务状态 - 已在getTasksStatus中优化SQL查询
    const tasks = await getTasksStatus(pool, taskIds);
    
    // 安全过滤：只返回属于当前用户的任务
    const userTasks = tasks.filter(task => task.user_id === userId);
    
    // 记录查询耗时
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // 转换为毫秒
    
    // 性能监控：记录慢查询
    if (duration > 100) { // 超过100ms记录警告
      logger.warn(`[taskController] 批量查询耗时过长: ${duration.toFixed(2)}ms, 任务数: ${taskIds.length}, 用户: ${userId}`);
    }
    
    // 优化响应格式，减少数据传输量
    const optimizedTasks = userTasks.map(task => ({
      id: task.id,
      status: task.status,
      relatedId: task.related_id,
      // 只在有结果时才传输result和error，减少响应体积
      ...(task.result && { result: task.result }),
      ...(task.error && { error: task.error })
    }));
    
    res.status(200).json({
      success: true,
      tasks: optimizedTasks,
      // 添加性能指标供前端优化参考
      ...(process.env.NODE_ENV === 'development' && { 
        _debug: { 
          queryTime: `${duration.toFixed(2)}ms`,
          requestedCount: taskIds.length,
          returnedCount: optimizedTasks.length 
        }
      })
    });
    
  } catch (error) {
    logger.error(`[taskController] 批量获取任务状态失败: ${error.message}`, {
      userId: req.user?.id,
      taskCount: req.body?.taskIds?.length || 0
    });
    res.status(500).json({ success: false, message: '批量获取任务状态失败' });
  }
}; 