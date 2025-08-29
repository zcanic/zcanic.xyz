/**
 * helpers.js - 通用辅助函数
 */

/**
 * 格式化日期
 * @param {string|Date} date 需要格式化的日期
 * @param {Object} options 格式化选项
 * @returns {string} 格式化后的日期字符串
 */
export const formatDate = (date, options = {}) => {
  const dateObj = date instanceof Date ? date : new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return '无效日期';
  }
  
  // 默认选项
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options
  };
  
  try {
    return new Intl.DateTimeFormat('zh-CN', defaultOptions).format(dateObj);
  } catch (error) {
    console.error('日期格式化错误:', error);
    return dateObj.toLocaleString();
  }
};

/**
 * 生成随机ID
 * @param {number} length ID长度
 * @returns {string} 随机ID
 */
export const generateId = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
};

/**
 * 截断文本
 * @param {string} text 原始文本
 * @param {number} length 截断长度
 * @param {string} suffix 后缀
 * @returns {string} 截断后的文本
 */
export const truncateText = (text, length = 100, suffix = '...') => {
  if (!text) return '';
  if (text.length <= length) return text;
  
  return text.substring(0, length).trim() + suffix;
};

/**
 * 检查页面是否可见
 * @returns {boolean} 页面是否可见
 */
export const isPageVisible = () => {
  return document.visibilityState === 'visible';
};

/**
 * 防抖函数
 * @param {Function} func 需要防抖的函数
 * @param {number} wait 等待时间(毫秒)
 * @returns {Function} 防抖后的函数
 */
export const debounce = (func, wait = 300) => {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * 节流函数
 * @param {Function} func 需要节流的函数
 * @param {number} limit 限制时间(毫秒)
 * @returns {Function} 节流后的函数
 */
export const throttle = (func, limit = 300) => {
  let inThrottle;
  
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
};

/**
 * 检测是否为触摸设备
 * @returns {boolean} 是否为触摸设备
 */
export const isTouchDevice = () => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

/**
 * 获取设备类型
 * @returns {string} 设备类型 ('mobile', 'tablet', 'desktop')
 */
export const getDeviceType = () => {
  const width = window.innerWidth;
  
  if (width < 768) {
    return 'mobile';
  } else if (width < 1024) {
    return 'tablet';
  } else {
    return 'desktop';
  }
};

/**
 * 检测浏览器是否支持某个CSS属性
 * @param {string} property CSS属性名
 * @returns {boolean} 是否支持该属性
 */
export function isCSSPropertySupported(property) {
  return property in document.documentElement.style;
}

/**
 * 安全地解析JSON
 * @param {string} str 要解析的JSON字符串
 * @param {*} fallback 解析失败时的返回值
 * @returns {*} 解析结果或fallback
 */
export function safeJSONParse(str, fallback = {}) {
  try {
    return JSON.parse(str);
  } catch (e) {
    console.error('JSON解析错误:', e);
    return fallback;
  }
}

/**
 * 获取当前浏览器名称和版本
 * @returns {Object} 浏览器信息对象 {name, version}
 */
export function getBrowserInfo() {
  const userAgent = navigator.userAgent;
  let browser = {
    name: 'Unknown',
    version: 'Unknown'
  };
  
  // Edge 和 Chrome 有相似的用户代理，所以先检测 Edge
  if (userAgent.indexOf('Edg') > -1) {
    browser.name = 'Edge';
    browser.version = userAgent.match(/Edg\/([\d.]+)/)[1];
  } else if (userAgent.indexOf('Chrome') > -1) {
    browser.name = 'Chrome';
    browser.version = userAgent.match(/Chrome\/([\d.]+)/)[1];
  } else if (userAgent.indexOf('Firefox') > -1) {
    browser.name = 'Firefox';
    browser.version = userAgent.match(/Firefox\/([\d.]+)/)[1];
  } else if (userAgent.indexOf('Safari') > -1) {
    browser.name = 'Safari';
    browser.version = userAgent.match(/Version\/([\d.]+)/)[1];
  } else if (userAgent.indexOf('MSIE') > -1 || userAgent.indexOf('Trident/') > -1) {
    browser.name = 'Internet Explorer';
    browser.version = userAgent.match(/(?:MSIE |rv:)([\d.]+)/)[1];
  }
  
  return browser;
}

/**
 * 创建可取消的Promise
 * @param {Promise} promise 原始Promise
 * @returns {Object} 带有cancel方法的Promise对象
 */
export function createCancelablePromise(promise) {
  let isCanceled = false;
  
  const wrappedPromise = new Promise((resolve, reject) => {
    promise
      .then(val => isCanceled ? reject({isCanceled: true}) : resolve(val))
      .catch(error => isCanceled ? reject({isCanceled: true}) : reject(error));
  });
  
  return {
    promise: wrappedPromise,
    cancel: () => {
      isCanceled = true;
    }
  };
}

/**
 * 检测设备是否具有高性能GPU
 * @returns {boolean} 是否有高性能GPU
 */
export function hasHighPerformanceGPU() {
  try {
    // 创建一个临时Canvas元素来获取WebGL上下文
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) return false;
    
    // 获取渲染器信息
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    
    if (!debugInfo) return false;
    
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    
    // 检查是否包含高性能GPU关键词
    const highEndGPUKeywords = [
      'nvidia', 'amd', 'radeon', 'geforce',
      'intel iris', 'intel uhd graphics 6', 'intel uhd graphics 7',
      'apple m1', 'apple m2', 'metal'
    ];
    
    const rendererLower = renderer.toLowerCase();
    return highEndGPUKeywords.some(keyword => rendererLower.includes(keyword));
  } catch (e) {
    console.error('GPU检测错误:', e);
    return false;
  }
}

/**
 * 创建一个仅执行一次的函数
 * @param {Function} func 要执行的函数
 * @returns {Function} 只会执行一次的函数
 */
export function once(func) {
  let called = false;
  let result;
  
  return function(...args) {
    if (!called) {
      called = true;
      result = func.apply(this, args);
    }
    return result;
  };
}

/**
 * 测量函数执行时间
 * @param {Function} fn 要测量的函数
 * @param {...any} args 函数参数
 * @returns {Object} 执行结果和耗时
 */
export function measureExecutionTime(fn, ...args) {
  const start = performance.now();
  const result = fn(...args);
  const end = performance.now();
  
  return {
    result,
    executionTime: end - start
  };
}

/**
 * 监听网络状态变化
 * @param {Function} onOnline 网络连接时的回调
 * @param {Function} onOffline 网络断开时的回调
 * @returns {Function} 清理函数
 */
export function listenToNetworkChanges(onOnline, onOffline) {
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
  
  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
}

/**
 * 估算当前设备的内存和CPU限制
 * @returns {Object} 设备性能估计
 */
export function estimateDeviceCapabilities() {
  const memory = navigator.deviceMemory || 4; // 默认假设4GB
  const cpuCores = navigator.hardwareConcurrency || 2;
  const deviceType = getDeviceType();
  const isTouch = isTouchDevice();
  
  // 估算处理能力分数
  const cpuScore = cpuCores * 0.5;
  const memoryScore = memory * 0.25;
  const deviceScore = deviceType === 'desktop' ? 1 : 
                     (deviceType === 'tablet' ? 0.6 : 0.3);
  const touchPenalty = isTouch ? 0.8 : 1;
  
  // 综合分数 (0-10)
  const finalScore = Math.min(10, (cpuScore + memoryScore) * deviceScore * touchPenalty);
  
  return {
    memory,
    cpuCores,
    deviceType,
    isTouch,
    performanceScore: finalScore,
    performanceLevel: finalScore < 3 ? 'low' : (finalScore < 7 ? 'medium' : 'high')
  };
}

/**
 * 创建自适应帧率的RAF循环
 * @param {Function} callback 每帧执行的回调
 * @param {Object} options 配置选项
 * @returns {Object} 控制对象
 */
export function createAdaptiveLoop(callback, options = {}) {
  const {
    targetFPS = 60,
    lowPerformanceThreshold = 45,
    highPerformanceThreshold = 55
  } = options;
  
  let isRunning = false;
  let rafId = null;
  let lastTimestamp = 0;
  let frameCounter = 0;
  let fpsUpdateInterval = null;
  let currentFPS = targetFPS;
  let performanceMode = 'normal'; // low, normal, high
  
  const calculateFPS = (timestamp) => {
    if (!lastTimestamp) {
      lastTimestamp = timestamp;
      return targetFPS;
    }
    
    const elapsed = timestamp - lastTimestamp;
    return Math.floor(1000 / elapsed);
  };
  
  const update = (timestamp) => {
    if (!isRunning) return;
    
    const fps = calculateFPS(timestamp);
    frameCounter++;
    lastTimestamp = timestamp;
    
    // 自适应性能模式
    callback({
      timestamp,
      fps,
      performanceMode,
      deltaTime: 1 / fps
    });
    
    rafId = requestAnimationFrame(update);
  };
  
  // 每秒更新FPS和性能模式
  const updatePerformanceMode = () => {
    if (currentFPS < lowPerformanceThreshold && performanceMode !== 'low') {
      performanceMode = 'low';
    } else if (currentFPS > highPerformanceThreshold && performanceMode !== 'high') {
      performanceMode = 'high';
    } else if (currentFPS >= lowPerformanceThreshold && currentFPS <= highPerformanceThreshold && performanceMode !== 'normal') {
      performanceMode = 'normal';
    }
  };
  
  return {
    start: () => {
      if (isRunning) return;
      isRunning = true;
      lastTimestamp = 0;
      
      // 定期更新FPS
      fpsUpdateInterval = setInterval(() => {
        currentFPS = frameCounter;
        frameCounter = 0;
        updatePerformanceMode();
      }, 1000);
      
      rafId = requestAnimationFrame(update);
    },
    stop: () => {
      isRunning = false;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (fpsUpdateInterval !== null) {
        clearInterval(fpsUpdateInterval);
        fpsUpdateInterval = null;
      }
    },
    getStatus: () => ({
      isRunning,
      fps: currentFPS,
      performanceMode
    })
  };
} 