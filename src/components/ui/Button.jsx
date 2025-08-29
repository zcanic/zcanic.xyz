import React from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { cn } from '../../utils/cn';

/**
 * 现代几何风格按钮组件
 * 
 * @param {Object} props - 组件属性
 * @param {React.ReactNode} props.children - 按钮内容
 * @param {string} props.variant - 按钮样式变体 ('primary', 'secondary', 'outline', 'ghost', 'gradient', 'danger')
 * @param {string} props.size - 按钮大小 ('sm', 'md', 'lg')
 * @param {string} props.className - 额外CSS类
 * @param {boolean} props.disabled - 是否禁用
 * @param {boolean} props.isLoading - 是否显示加载状态
 * @param {React.ReactNode} props.leftIcon - 左侧图标
 * @param {React.ReactNode} props.rightIcon - 右侧图标
 */
const Button = React.forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  isLoading = false,
  leftIcon,
  rightIcon,
  ...rest
}, ref) => {
  // 变体样式
  const variantClasses = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm',
    secondary: 'bg-slate-600 hover:bg-slate-700 text-white shadow-sm',
    gradient: 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-sm',
    outline: 'border-2 border-indigo-300 dark:border-indigo-500/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 bg-transparent',
    ghost: 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/70 backdrop-blur-sm bg-transparent',
    frosted: 'backdrop-blur-md bg-white/70 dark:bg-slate-800/70 border border-white/20 dark:border-slate-700/30 text-slate-900 dark:text-white hover:bg-white/80 dark:hover:bg-slate-800/80 shadow-sm',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm',
  };

  // 大小类
  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 rounded-xl text-sm',
    md: 'text-sm px-4 py-2.5 rounded-xl',
    lg: 'text-base px-6 py-3 rounded-xl',
  };

  // 生成类名
  const buttonClasses = cn(
    'relative font-medium transition-all duration-200 flex items-center justify-center',
    variantClasses[variant] || variantClasses.primary,
    sizeClasses[size] || sizeClasses.md,
    disabled || isLoading ? 'opacity-60 cursor-not-allowed pointer-events-none' : 'focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500/50 focus:outline-none',
    className
  );

  return (
    <motion.button 
      ref={ref}
      className={buttonClasses}
      disabled={disabled || isLoading}
      whileHover={!disabled && !isLoading ? { scale: 1.01 } : {}}
      whileTap={!disabled && !isLoading ? { scale: 0.99 } : {}}
      {...rest}
    >
      {isLoading && (
        <div className="mr-2 h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
      )}
      {!isLoading && leftIcon && (
        <span className="mr-2 flex items-center">{leftIcon}</span>
      )}
      {children}
      {!isLoading && rightIcon && (
        <span className="ml-2 flex items-center">{rightIcon}</span>
      )}
    </motion.button>
  );
});

Button.displayName = 'Button';

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'outline', 'ghost', 'gradient', 'frosted', 'danger']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
  disabled: PropTypes.bool,
  isLoading: PropTypes.bool,
  leftIcon: PropTypes.node,
  rightIcon: PropTypes.node
};

export default Button;
