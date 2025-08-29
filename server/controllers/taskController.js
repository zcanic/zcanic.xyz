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

// 批量获取任务状态
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
    
    // 获取任务状态
    const tasks = await getTasksStatus(pool, taskIds);
    
    // 过滤出属于当前用户的任务
    const userTasks = tasks.filter(task => task.user_id === userId);
    
    res.status(200).json({
      success: true,
      tasks: userTasks.map(task => ({
        id: task.id,
        status: task.status,
        relatedId: task.related_id,
        result: task.result,
        error: task.error
      }))
    });
    
  } catch (error) {
    logger.error(`[taskController] 批量获取任务状态失败: ${error.message}`);
    res.status(500).json({ success: false, message: '批量获取任务状态失败' });
  }
}; 