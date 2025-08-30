// 性能监控系统 - 对标顶级LLM服务的可观测性
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      chatRequests: {
        total: 0,
        successful: 0,
        failed: 0,
        avgResponseTime: 0,
        responseTimes: []
      },
      polling: {
        requests: 0,
        successful: 0,
        failed: 0,
        avgInterval: 0,
        intervals: []
      },
      userActions: {
        messagesSent: 0,
        sessionsCreated: 0,
        sessionsSwitched: 0
      }
    };
    
    this.startTime = performance.now();
    this.isEnabled = process.env.NODE_ENV === 'development' || 
                     process.env.REACT_APP_ENABLE_METRICS === 'true' ||
                     typeof window !== 'undefined'; // 在浏览器环境下总是启用基础监控
  }

  // 记录聊天请求性能
  recordChatRequest(duration, success = true, error = null) {
    if (!this.isEnabled) return;
    
    this.metrics.chatRequests.total++;
    
    if (success) {
      this.metrics.chatRequests.successful++;
      this.metrics.chatRequests.responseTimes.push(duration);
      
      // 保持最近100个响应时间记录
      if (this.metrics.chatRequests.responseTimes.length > 100) {
        this.metrics.chatRequests.responseTimes.shift();
      }
      
      // 计算平均响应时间
      this.metrics.chatRequests.avgResponseTime = 
        this.metrics.chatRequests.responseTimes.reduce((a, b) => a + b, 0) / 
        this.metrics.chatRequests.responseTimes.length;
    } else {
      this.metrics.chatRequests.failed++;
      console.warn('[PerfMonitor] 聊天请求失败:', error?.message || 'Unknown error');
    }
    
    // 记录慢请求
    if (duration > 10000) { // 超过10秒
      console.warn(`[PerfMonitor] 检测到慢聊天请求: ${duration.toFixed(2)}ms`);
    }
  }

  // 记录轮询性能
  recordPollingRequest(interval, success = true) {
    if (!this.isEnabled) return;
    
    this.metrics.polling.requests++;
    
    if (success) {
      this.metrics.polling.successful++;
    } else {
      this.metrics.polling.failed++;
    }
    
    this.metrics.polling.intervals.push(interval);
    
    // 保持最近50个间隔记录
    if (this.metrics.polling.intervals.length > 50) {
      this.metrics.polling.intervals.shift();
    }
    
    // 计算平均间隔
    this.metrics.polling.avgInterval = 
      this.metrics.polling.intervals.reduce((a, b) => a + b, 0) / 
      this.metrics.polling.intervals.length;
  }

  // 记录用户行为
  recordUserAction(action, metadata = {}) {
    if (!this.isEnabled) return;
    
    switch (action) {
      case 'messageSent':
        this.metrics.userActions.messagesSent++;
        break;
      case 'sessionCreated':
        this.metrics.userActions.sessionsCreated++;
        break;
      case 'sessionSwitched':
        this.metrics.userActions.sessionsSwitched++;
        break;
    }
    
    // 记录详细行为日志
    console.log(`[PerfMonitor] 用户行为: ${action}`, metadata);
  }

  // 获取性能报告
  getPerformanceReport() {
    if (!this.isEnabled) return null;
    
    const sessionDuration = (performance.now() - this.startTime) / 1000 / 60; // 分钟
    
    return {
      sessionDuration: `${sessionDuration.toFixed(1)}分钟`,
      chat: {
        总请求数: this.metrics.chatRequests.total,
        成功率: this.metrics.chatRequests.total > 0 ? 
          `${((this.metrics.chatRequests.successful / this.metrics.chatRequests.total) * 100).toFixed(1)}%` : '0%',
        平均响应时间: `${this.metrics.chatRequests.avgResponseTime.toFixed(0)}ms`,
        失败次数: this.metrics.chatRequests.failed
      },
      polling: {
        轮询请求数: this.metrics.polling.requests,
        成功率: this.metrics.polling.requests > 0 ? 
          `${((this.metrics.polling.successful / this.metrics.polling.requests) * 100).toFixed(1)}%` : '0%',
        平均间隔: `${this.metrics.polling.avgInterval.toFixed(0)}ms`,
        失败次数: this.metrics.polling.failed
      },
      userActivity: {
        发送消息数: this.metrics.userActions.messagesSent,
        创建会话数: this.metrics.userActions.sessionsCreated,
        切换会话数: this.metrics.userActions.sessionsSwitched,
        平均每分钟消息: sessionDuration > 0 ? 
          `${(this.metrics.userActions.messagesSent / sessionDuration).toFixed(1)}条` : '0条'
      }
    };
  }

  // 获取实时性能状态
  getRealtimeStatus() {
    if (!this.isEnabled) return null;
    
    const recentRequests = this.metrics.chatRequests.responseTimes.slice(-10);
    const recentAvg = recentRequests.length > 0 ? 
      recentRequests.reduce((a, b) => a + b, 0) / recentRequests.length : 0;
    
    const status = {
      isHealthy: true,
      issues: []
    };
    
    // 健康检查
    if (recentAvg > 15000) {
      status.isHealthy = false;
      status.issues.push('响应时间过长');
    }
    
    if (this.metrics.chatRequests.failed > this.metrics.chatRequests.successful * 0.1) {
      status.isHealthy = false;
      status.issues.push('错误率过高');
    }
    
    if (this.metrics.polling.failed > this.metrics.polling.successful * 0.2) {
      status.isHealthy = false;
      status.issues.push('轮询失败率过高');
    }
    
    return {
      ...status,
      recentResponseTime: `${recentAvg.toFixed(0)}ms`,
      currentPollingInterval: `${this.metrics.polling.avgInterval.toFixed(0)}ms`
    };
  }

  // 打印性能报告到控制台
  printReport() {
    if (!this.isEnabled) return;
    
    const report = this.getPerformanceReport();
    console.group('🚀 Zcanic 聊天性能报告');
    console.table(report.chat);
    console.table(report.polling);
    console.table(report.userActivity);
    console.log(`会话时长: ${report.sessionDuration}`);
    console.groupEnd();
  }

  // 重置指标
  reset() {
    if (!this.isEnabled) return;
    
    this.metrics = {
      chatRequests: {
        total: 0,
        successful: 0,
        failed: 0,
        avgResponseTime: 0,
        responseTimes: []
      },
      polling: {
        requests: 0,
        successful: 0,
        failed: 0,
        avgInterval: 0,
        intervals: []
      },
      userActions: {
        messagesSent: 0,
        sessionsCreated: 0,
        sessionsSwitched: 0
      }
    };
    
    this.startTime = performance.now();
    console.log('[PerfMonitor] 性能指标已重置');
  }
}

// 创建全局实例
export const performanceMonitor = new PerformanceMonitor();

// 导出工具函数
export const recordChatPerformance = (startTime, success, error) => {
  const duration = performance.now() - startTime;
  performanceMonitor.recordChatRequest(duration, success, error);
};

export const recordPollingPerformance = (interval, success) => {
  performanceMonitor.recordPollingRequest(interval, success);
};

export const recordUserAction = (action, metadata) => {
  performanceMonitor.recordUserAction(action, metadata);
};

// 暴露到全局对象，方便调试和监控
if (typeof window !== 'undefined') {
  window.zcanic_performance = performanceMonitor;
  window.zcanic_perf_report = () => performanceMonitor.printReport();
  
  // 生产环境下也提供基础的状态检查
  window.zcanic_status = () => performanceMonitor.getRealtimeStatus();
  
  // 开发环境下提供更多调试功能
  if (process.env.NODE_ENV === 'development') {
    window.zcanic_reset_metrics = () => performanceMonitor.reset();
    console.log('🚀 Zcanic 性能监控已启动！');
    console.log('可用命令：');
    console.log('  - zcanic_perf_report() : 查看详细性能报告');
    console.log('  - zcanic_status() : 查看实时状态');
    console.log('  - zcanic_reset_metrics() : 重置性能指标');
  }
}