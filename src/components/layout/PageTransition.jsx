import React from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';

/**
 * 页面转场动画组件
 * 
 * 为页面切换提供流畅的过渡动画，增强用户体验
 * 基于 Framer Motion 实现
 * 
 * @param {Object} props - 组件属性
 * @param {React.ReactNode} props.children - 子组件
 * @param {string} props.mode - 动画模式 ('default', 'fade', 'slide')
 */
const PageTransition = ({ children, mode = 'default' }) => {
  const location = useLocation();

  // 不同转场动画变体
  const variants = {
    default: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: { 
        duration: 0.3,
        ease: [0.22, 1, 0.36, 1]
      }
    },
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: { 
        duration: 0.3,
        ease: "easeInOut"
      }
    },
    slide: {
      initial: { opacity: 0, x: 10 },
      animate: { opacity: 1, x: 0 },
      transition: { 
        type: 'tween',
        duration: 0.3,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  // 获取当前模式的动画变体
  const currentVariant = variants[mode] || variants.default;

  return (
    <motion.div
      key={location.pathname}
      initial={currentVariant.initial}
      animate={currentVariant.animate}
      transition={currentVariant.transition}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
};

PageTransition.propTypes = {
  children: PropTypes.node.isRequired,
  mode: PropTypes.oneOf(['default', 'fade', 'slide'])
};

export default PageTransition; 