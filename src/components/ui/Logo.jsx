import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { cn } from '../../utils/cn';
import { motion } from 'framer-motion';

/**
 * 现代几何风格Logo组件
 * 
 * @param {Object} props - 组件属性
 * @param {string} props.to - 链接地址，默认为首页
 * @param {string} props.size - 尺寸 ('sm', 'md', 'lg')
 * @param {boolean} props.animated - 是否启用动画
 * @param {string} props.className - 额外样式类
 */
const Logo = ({
  to = '/',
  size = 'md',
  animated = true,
  className,
  ...props
}) => {
  // 尺寸映射
  const sizeMap = {
    sm: {
      container: 'h-8 w-8',
      text: 'text-lg'
    },
    md: {
      container: 'h-10 w-10',
      text: 'text-xl'
    },
    lg: {
      container: 'h-16 w-16',
      text: 'text-2xl'
    }
  };
  
  const selectedSize = sizeMap[size] || sizeMap.md;
  
  // Logo几何形状的动画变体
  const shapeVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1],
        staggerChildren: 0.1
      }
    }
  };
  
  // 各个形状的动画变体
  const itemVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };
  
  // 几何Logo形状
  const LogoShape = () => (
    <motion.div 
      className={cn(
        "relative flex items-center justify-center rounded-xl overflow-hidden bg-gradient-to-r from-indigo-500 to-blue-500 shadow-lg",
        selectedSize.container
      )}
      variants={animated ? shapeVariants : undefined}
      initial={animated ? "hidden" : undefined}
      animate={animated ? "visible" : undefined}
    >
      {/* 背景几何形状 */}
      <motion.div 
        className="absolute left-0 bottom-0 w-2/3 h-2/3 bg-pink-400/40" 
        style={{ clipPath: 'polygon(0 100%, 0 0, 100% 100%)' }}
        variants={animated ? itemVariants : undefined}
      />
      <motion.div 
        className="absolute top-0 right-0 w-2/3 h-2/3 bg-amber-300/30"
        style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }}
        variants={animated ? itemVariants : undefined}
      />
      <motion.div 
        className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-sky-300/40 rounded-tl-xl"
        variants={animated ? itemVariants : undefined}
      />
      
      {/* 字母 */}
      <span className={cn("relative font-bold text-white", selectedSize.text)}>
        Z
      </span>
    </motion.div>
  );
  
  return (
    <Link 
      to={to}
      className={cn(
        "flex items-center space-x-2 group",
        className
      )}
      {...props}
    >
      <LogoShape />
      <div className="font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-400 dark:to-blue-400">
        <span className={size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl'}>
          Zcanic
        </span>
      </div>
    </Link>
  );
};

Logo.propTypes = {
  to: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  animated: PropTypes.bool,
  className: PropTypes.string
};

export default Logo; 