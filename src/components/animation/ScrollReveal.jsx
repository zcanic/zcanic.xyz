import React, { useRef, useEffect, useState } from 'react';
import PropTypes from 'prop-types';

/**
 * ScrollReveal组件 - 滚动时触发元素动画
 * 
 * 一个灵活的组件，当元素进入可视区域时自动应用动画效果
 * 支持多种动画类型和配置选项
 */
const ScrollReveal = ({
  children,
  animation = 'fade', // fade, slideUp, slideLeft, slideRight, scale, rotate
  duration = 800,
  delay = 0,
  distance = 50,
  easing = 'ease-out',
  cascade = false,
  cascadeDelay = 100,
  threshold = 0.2,
  once = true,
  disabled = false,
  className = '',
  rootMargin = '0px',
  style = {},
}) => {
  const containerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  
  // CSS动画对照表
  const animationMap = {
    fade: {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: `opacity ${duration}ms ${easing} ${delay}ms` }
    },
    slideUp: {
      hidden: { opacity: 0, transform: `translateY(${distance}px)` },
      visible: { 
        opacity: 1, 
        transform: 'translateY(0)', 
        transition: `opacity ${duration}ms ${easing} ${delay}ms, transform ${duration}ms ${easing} ${delay}ms` 
      }
    },
    slideDown: {
      hidden: { opacity: 0, transform: `translateY(-${distance}px)` },
      visible: { 
        opacity: 1, 
        transform: 'translateY(0)', 
        transition: `opacity ${duration}ms ${easing} ${delay}ms, transform ${duration}ms ${easing} ${delay}ms` 
      }
    },
    slideLeft: {
      hidden: { opacity: 0, transform: `translateX(${distance}px)` },
      visible: { 
        opacity: 1, 
        transform: 'translateX(0)', 
        transition: `opacity ${duration}ms ${easing} ${delay}ms, transform ${duration}ms ${easing} ${delay}ms` 
      }
    },
    slideRight: {
      hidden: { opacity: 0, transform: `translateX(-${distance}px)` },
      visible: { 
        opacity: 1, 
        transform: 'translateX(0)', 
        transition: `opacity ${duration}ms ${easing} ${delay}ms, transform ${duration}ms ${easing} ${delay}ms` 
      }
    },
    scale: {
      hidden: { opacity: 0, transform: 'scale(0.8)' },
      visible: { 
        opacity: 1, 
        transform: 'scale(1)', 
        transition: `opacity ${duration}ms ${easing} ${delay}ms, transform ${duration}ms ${easing} ${delay}ms` 
      }
    },
    rotate: {
      hidden: { opacity: 0, transform: 'rotate(-5deg) scale(0.95)' },
      visible: { 
        opacity: 1, 
        transform: 'rotate(0) scale(1)', 
        transition: `opacity ${duration}ms ${easing} ${delay}ms, transform ${duration}ms ${easing} ${delay}ms` 
      }
    },
    flip: {
      hidden: { opacity: 0, transform: 'perspective(400px) rotateX(90deg)' },
      visible: { 
        opacity: 1, 
        transform: 'perspective(400px) rotateX(0)', 
        transition: `opacity ${duration}ms ${easing} ${delay}ms, transform ${duration}ms ${easing} ${delay}ms` 
      }
    },
    zoom: {
      hidden: { opacity: 0, transform: 'scale(1.2)' },
      visible: { 
        opacity: 1, 
        transform: 'scale(1)', 
        transition: `opacity ${duration}ms ${easing} ${delay}ms, transform ${duration}ms ${easing} ${delay}ms` 
      }
    },
    skew: {
      hidden: { opacity: 0, transform: 'skewX(20deg) scale(0.9)' },
      visible: { 
        opacity: 1, 
        transform: 'skewX(0) scale(1)', 
        transition: `opacity ${duration}ms ${easing} ${delay}ms, transform ${duration}ms ${easing} ${delay}ms` 
      }
    },
    // 轻柔的曲线运动
    curve: {
      hidden: { 
        opacity: 0, 
        transform: `translate(${distance * 0.5}px, ${distance}px)` 
      },
      visible: { 
        opacity: 1, 
        transform: 'translate(0, 0)', 
        transition: `opacity ${duration}ms ${easing} ${delay}ms, transform ${duration}ms ${easing} ${delay}ms` 
      }
    }
  };
  
  // 获取当前选择的动画样式
  const getAnimationStyle = (state) => {
    if (disabled) return {};
    
    const selectedAnimation = animationMap[animation] || animationMap.fade;
    return state === 'hidden' ? selectedAnimation.hidden : selectedAnimation.visible;
  };
  
  // 处理元素可见性
  useEffect(() => {
    if (disabled || (once && hasAnimated)) return;
    
    const options = {
      root: null,
      rootMargin,
      threshold,
    };
    
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        if (once) {
          setHasAnimated(true);
          // 动画完成后可以取消观察
          observer.disconnect();
        }
      } else if (!once) {
        setIsVisible(false);
      }
    }, options);
    
    const currentRef = containerRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }
    
    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [disabled, once, rootMargin, threshold, hasAnimated]);
  
  // 处理级联动画
  const renderChildren = () => {
    if (!cascade) return children;
    
    // 为每个子元素添加级联延迟
    return React.Children.map(children, (child, index) => {
      if (!React.isValidElement(child)) return child;
      
      // 计算每个子元素的级联延迟
      const itemDelay = delay + (index * cascadeDelay);
      
      // 设置动画样式
      const animStyle = isVisible
        ? { ...animationMap[animation].visible, transition: `opacity ${duration}ms ${easing} ${itemDelay}ms, transform ${duration}ms ${easing} ${itemDelay}ms` }
        : animationMap[animation].hidden;
      
      // 合并原始样式与动画样式
      const combinedStyle = {
        ...child.props.style,
        ...animStyle,
      };
      
      // 克隆元素并附加新样式
      return React.cloneElement(child, {
        style: combinedStyle,
      });
    });
  };
  
  // 合并组件样式与动画样式
  const combinedStyle = {
    ...style,
    ...(cascade ? {} : getAnimationStyle(isVisible ? 'visible' : 'hidden')),
  };
  
  return (
    <div
      ref={containerRef}
      className={className}
      style={combinedStyle}
    >
      {cascade ? renderChildren() : children}
    </div>
  );
};

ScrollReveal.propTypes = {
  children: PropTypes.node.isRequired,
  animation: PropTypes.oneOf([
    'fade', 'slideUp', 'slideDown', 'slideLeft', 'slideRight', 'scale', 
    'rotate', 'flip', 'zoom', 'skew', 'curve'
  ]),
  duration: PropTypes.number,
  delay: PropTypes.number,
  distance: PropTypes.number,
  easing: PropTypes.string,
  cascade: PropTypes.bool,
  cascadeDelay: PropTypes.number,
  threshold: PropTypes.number,
  once: PropTypes.bool,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  rootMargin: PropTypes.string,
  style: PropTypes.object,
};

export default ScrollReveal; 