// 智能重试机制 - 对标顶级LLM服务可靠性
export class RetryMechanism {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.baseDelay = options.baseDelay || 1000; // 1秒基础延迟
    this.maxDelay = options.maxDelay || 10000; // 最大10秒延迟
    this.backoffMultiplier = options.backoffMultiplier || 2;
    this.jitterFactor = options.jitterFactor || 0.1; // 10%的抖动
  }

  // 判断错误是否可重试
  isRetryableError(error) {
    if (!error.response) {
      // 网络错误通常可重试
      return true;
    }

    const status = error.response.status;
    
    // 可重试的状态码
    const retryableStatuses = [
      408, // Request Timeout
      429, // Too Many Requests
      500, // Internal Server Error
      502, // Bad Gateway
      503, // Service Unavailable
      504, // Gateway Timeout
      520, // CloudFlare Unknown Error
      521, // CloudFlare Web Server Down
      522, // CloudFlare Connection Timeout
      524  // CloudFlare Timeout
    ];

    return retryableStatuses.includes(status);
  }

  // 计算延迟时间（指数退避 + 抖动）
  calculateDelay(attemptNumber) {
    const exponentialDelay = this.baseDelay * Math.pow(this.backoffMultiplier, attemptNumber - 1);
    const jitter = exponentialDelay * this.jitterFactor * Math.random();
    const delay = Math.min(exponentialDelay + jitter, this.maxDelay);
    
    return Math.floor(delay);
  }

  // 执行重试逻辑
  async executeWithRetry(fn, context = 'API调用') {
    let lastError;
    
    for (let attempt = 1; attempt <= this.maxRetries + 1; attempt++) {
      try {
        const result = await fn();
        
        // 成功时记录性能指标
        if (attempt > 1) {
          console.log(`[RetryMechanism] ${context} 在第${attempt}次尝试成功`);
        }
        
        return result;
      } catch (error) {
        lastError = error;
        
        // 最后一次尝试失败
        if (attempt > this.maxRetries) {
          console.error(`[RetryMechanism] ${context} 在${this.maxRetries + 1}次尝试后最终失败:`, error.message);
          throw error;
        }
        
        // 检查是否可重试
        if (!this.isRetryableError(error)) {
          console.log(`[RetryMechanism] ${context} 遇到不可重试错误:`, error.message);
          throw error;
        }
        
        // 计算延迟并等待
        const delay = this.calculateDelay(attempt);
        console.warn(`[RetryMechanism] ${context} 第${attempt}次尝试失败，${delay}ms后重试:`, error.message);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }
}

// 创建默认重试实例
export const defaultRetry = new RetryMechanism({
  maxRetries: 2, // 最多重试2次
  baseDelay: 1000, // 1秒基础延迟
  maxDelay: 5000,  // 最大5秒延迟
  backoffMultiplier: 1.5 // 较温和的退避
});

// 创建聊天请求专用重试实例
export const chatRetry = new RetryMechanism({
  maxRetries: 1, // 聊天请求最多重试1次，避免重复对话
  baseDelay: 2000, // 2秒基础延迟
  maxDelay: 5000,  // 最大5秒延迟
  backoffMultiplier: 1.0 // 固定延迟
});

// 批量任务查询重试实例
export const batchQueryRetry = new RetryMechanism({
  maxRetries: 3, // 可以多重试几次
  baseDelay: 500, // 较快的重试
  maxDelay: 3000,
  backoffMultiplier: 2.0
});