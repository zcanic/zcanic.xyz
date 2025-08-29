/**
 * animationUtils.js - 纯CSS动画工具库
 * 
 * 这是一个轻量级动画工具库，使用CSS和Web Animation API
 * 替代了之前对anime.js的依赖
 */

/**
 * 性能级别检测
 * @returns {string} 'low', 'medium', or 'high'
 */
export function getPerformanceLevel() {
  // 简化的性能检测
  const cores = navigator.hardwareConcurrency || 2;
  const memory = navigator.deviceMemory || 4; // 默认为中等
  
  if (cores <= 2 || memory <= 2) {
    return 'low';
  } else if (cores <= 4 || memory <= 4) {
    return 'medium';
  } else {
    return 'high';
  }
}

/**
 * 创建CSS关键帧动画
 * @param {string} name - 动画名称
 * @param {Object} keyframes - CSS关键帧定义
 * @returns {string} - 生成的动画名称
 */
export function createCSSKeyframes(name, keyframes) {
  // 检查关键帧是否已存在
  if (document.querySelector(`style[data-animation="${name}"]`)) {
    return name;
  }
  
  const keyframeRules = Object.entries(keyframes)
    .map(([key, value]) => {
      // 将百分比或from/to转换为选择器
      const selector = key.match(/^\d+$/) ? `${key}%` : key;
      
      // 从值对象创建CSS规则
      const rules = Object.entries(value)
        .map(([prop, val]) => `${prop}: ${val};`)
        .join(' ');
      
      return `${selector} { ${rules} }`;
    })
    .join('\n');
    
  // 创建并附加样式元素
  const style = document.createElement('style');
  style.dataset.animation = name;
  style.textContent = `@keyframes ${name} { ${keyframeRules} }`;
  document.head.appendChild(style);
  
  return name;
}

/**
 * 使用Web Animation API创建动画时间线
 * @param {Object} options - 时间线选项
 * @returns {Object} - 带有play, pause方法的时间线控制器
 */
export function createTimeline(options = {}) {
  const animations = [];
  const timelineOptions = {
    easing: options.easing || 'ease',
    autoplay: options.autoplay !== false,
    ...options
  };
  
  // 时间线控制器
  const timeline = {
    // 添加动画到时间线
    add: (animDef, offset = 0) => {
      const { targets, ...animOptions } = animDef;
      const targetElements = Array.isArray(targets) ? targets : [targets];
      
      const start = offset < 0 ? animations.length + offset : offset;
      
      targetElements.forEach((target) => {
        if (!target) return;
        
        const keyframes = createKeyframesFromAnimOptions(animOptions);
        const duration = animOptions.duration || 1000;
        const delay = typeof animOptions.delay === 'function' 
          ? animOptions.delay(target, targetElements.indexOf(target)) 
          : (animOptions.delay || 0);
        
        const anim = target.animate(keyframes, {
          duration,
          delay: start + delay,
          fill: 'forwards',
          easing: animOptions.easing || timelineOptions.easing
        });
        
        if (!timelineOptions.autoplay) {
          anim.pause();
        }
        
        animations.push({
          animation: anim,
          target,
          duration,
          delay
        });
      });
      
      return timeline;
    },
    
    // 播放时间线
    play: () => {
      animations.forEach(({ animation }) => {
        if (animation.playState === 'paused') {
          animation.play();
        }
      });
      return timeline;
    },
    
    // 暂停时间线
    pause: () => {
      animations.forEach(({ animation }) => {
        animation.pause();
      });
      return timeline;
    },
    
    // 重启时间线
    restart: () => {
      animations.forEach(({ animation }) => {
        animation.cancel();
        animation.play();
      });
      return timeline;
    }
  };
  
  return timeline;
}

/**
 * 从动画选项创建关键帧
 * @param {Object} options - 动画选项
 * @returns {Array} - Web Animation API的关键帧对象
 */
function createKeyframesFromAnimOptions(options) {
  if (options.keyframes) {
    return options.keyframes;
  }
  
  // 处理数组值（从->到）
  const props = Object.keys(options).filter(key => 
    Array.isArray(options[key]) && 
    !['easing', 'duration', 'delay'].includes(key)
  );
  
  if (props.length > 0) {
    const [from, to] = [0, 1].map(i => {
      const frame = {};
      props.forEach(prop => {
        const values = options[prop];
        frame[prop] = values[Math.min(i, values.length - 1)];
      });
      return frame;
    });
    
    return [from, to];
  }
  
  // 如果没有指定关键帧，则默认使用简单的淡入动画
  return [
    { opacity: 0 },
    { opacity: 1 }
  ];
}

/**
 * 预设动画 - 淡入效果
 * @param {HTMLElement} element - 目标元素
 * @param {Object} options - 动画选项
 * @returns {Animation} - Web Animation实例
 */
export function fadeAnimation(element, options = {}) {
  const { duration = 500, delay = 0, easing = 'ease-out' } = options;
  const direction = options.direction || 'in';
  
  const keyframes = direction === 'in' 
    ? [{ opacity: 0 }, { opacity: 1 }]
    : [{ opacity: 1 }, { opacity: 0 }];
  
  return element.animate(keyframes, {
    duration,
    delay,
    easing,
    fill: 'forwards'
  });
}

/**
 * 预设动画 - 滑动效果
 * @param {HTMLElement} element - 目标元素
 * @param {Object} options - 动画选项
 * @returns {Animation} - Web Animation实例
 */
export function slideAnimation(element, options = {}) {
  const { 
    direction = 'up', 
    distance = 30, 
    duration = 600, 
    delay = 0, 
    easing = 'ease-out' 
  } = options;
  
  let transform1, transform2;
  
  switch (direction) {
    case 'up':
      transform1 = `translateY(${distance}px)`;
      transform2 = 'translateY(0)';
      break;
    case 'down':
      transform1 = `translateY(-${distance}px)`;
      transform2 = 'translateY(0)';
      break;
    case 'left':
      transform1 = `translateX(${distance}px)`;
      transform2 = 'translateX(0)';
      break;
    case 'right':
      transform1 = `translateX(-${distance}px)`;
      transform2 = 'translateX(0)';
      break;
    default:
      transform1 = `translateY(${distance}px)`;
      transform2 = 'translateY(0)';
  }
  
  return element.animate([
    { opacity: 0, transform: transform1 },
    { opacity: 1, transform: transform2 }
  ], {
    duration,
    delay,
    easing,
    fill: 'forwards'
  });
}

/**
 * 简化的动画控制器单例
 */
export const animationController = {
  animations: new Map(),
  
  /**
   * 注册动画
   * @param {Object} animation - 带有play, pause方法的动画对象
   * @param {Object} options - 注册选项
   * @returns {string} - 动画ID
   */
  register: (animation, options = {}) => {
    const id = `anim-${Math.random().toString(36).substring(2, 9)}`;
    animationController.animations.set(id, { animation, options });
    return id;
  },
  
  /**
   * 注销动画
   * @param {string} id - 动画ID
   */
  unregister: (id) => {
    animationController.animations.delete(id);
  },
  
  /**
   * 暂停所有动画
   */
  pauseAll: () => {
    animationController.animations.forEach(({ animation }) => {
      if (animation && typeof animation.pause === 'function') {
        animation.pause();
      }
    });
  },
  
  /**
   * 恢复所有动画
   */
  resumeAll: () => {
    animationController.animations.forEach(({ animation }) => {
      if (animation && typeof animation.play === 'function') {
        animation.play();
      }
    });
  },
  
  /**
   * 获取性能级别
   * @returns {string} - 'low', 'medium', 或 'high'
   */
  getPerformanceLevel: () => getPerformanceLevel()
};

// 导出默认的动画控制器
export default animationController; 