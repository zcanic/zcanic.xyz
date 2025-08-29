import React from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { cn } from '../../utils/cn';

/**
 * 现代卡片组件
 * 
 * 提供干净的卡片布局，支持悬浮效果和多种风格
 * 
 * @param {Object} props - 组件属性
 * @param {React.ReactNode} props.children - 卡片内容
 * @param {string} props.variant - 卡片样式变体 ('default', 'accent', 'outline', 'glass')
 * @param {boolean} props.hasHoverEffect - 是否有悬浮效果
 * @param {string} props.className - 额外的CSS类名
 * @param {Object} props.rest - 其他HTML属性
 */
const Card = ({
  children,
  variant = 'default',
  hasHoverEffect = true,
  className = '',
  ...rest
}) => {
  // 基础卡片类名
  const baseClasses = 'rounded-lg overflow-hidden transition-all duration-300';
  
  // 变体样式
  const variantClasses = {
    default: 'bg-white dark:bg-dark-card border border-slate-200/50 dark:border-dark-border shadow-soft',
    accent: 'bg-white/95 dark:bg-dark-card border border-indigo-200/30 dark:border-indigo-500/20 shadow-accent dark:shadow-accent-dark backdrop-blur-sm',
    outline: 'bg-white/50 dark:bg-dark-bg/50 border-2 border-slate-300 dark:border-slate-600/50 backdrop-blur-sm',
    glass: 'bg-white/20 dark:bg-dark-card/30 backdrop-blur-md border border-white/30 dark:border-dark-border/30'
  };
  
  // 悬浮效果
  const hoverClasses = hasHoverEffect ? {
    default: 'hover:shadow-soft-lg hover:-translate-y-1',
    accent: 'hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] dark:hover:shadow-[0_0_20px_rgba(165,180,252,0.5)] hover:-translate-y-1',
    outline: 'hover:border-indigo-400 dark:hover:border-indigo-500/60 hover:-translate-y-1',
    glass: 'hover:bg-white/30 dark:hover:bg-dark-card/40 hover:-translate-y-1'
  } : {};
  
  // 生成最终类名
  const cardClasses = cn(
    baseClasses,
    variantClasses[variant] || variantClasses.default,
    hoverClasses[variant] || '',
    className
  );

  return (
    <motion.div 
      className={`relative ${cardClasses}`}
      whileHover={hasHoverEffect ? { y: -4 } : {}}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      {...rest}
    >
      {children}
    </motion.div>
  );
};

Card.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['default', 'accent', 'outline', 'glass']),
  hasHoverEffect: PropTypes.bool,
  className: PropTypes.string
};

export default Card; 