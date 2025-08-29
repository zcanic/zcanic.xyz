import React from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { cn } from '../../utils/cn';

/**
 * 现代加载器组件
 * 
 * @param {Object} props - 组件属性
 * @param {string} props.size - 加载器尺寸 ('sm', 'md', 'lg')
 * @param {string} props.variant - 加载器样式变体 ('default', 'primary', 'secondary')
 * @param {string} props.message - 可选的加载消息
 * @param {string} props.className - 额外CSS类
 */
const Loader = ({
  size = 'md',
  variant = 'primary',
  message = '',
  className = '',
}) => {
  // 尺寸映射
  const sizeMap = {
    sm: {
      container: 'w-4 h-4',
      text: 'text-xs'
    },
    md: {
      container: 'w-6 h-6',
      text: 'text-sm'
    },
    lg: {
      container: 'w-8 h-8', 
      text: 'text-base'
    }
  };

  // 变体映射
  const variantMap = {
    default: 'border-slate-300 border-t-slate-600',
    primary: 'border-indigo-200 border-t-indigo-600',
    secondary: 'border-slate-200 border-t-slate-600'
  };

  // 获取尺寸和变体类
  const sizeClass = sizeMap[size] || sizeMap.md;
  const variantClass = variantMap[variant] || variantMap.primary;

  return (
    <div className={cn('flex items-center', className)}>
      <motion.div
        className={cn(
          'rounded-full border-2 border-solid',
          variantClass,
          sizeClass.container
        )}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear'
        }}
      />
      
      {message && (
        <p className={cn('ml-3 text-slate-600 dark:text-slate-300', sizeClass.text)}>
          {message}
        </p>
      )}
    </div>
  );
};

Loader.propTypes = {
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  variant: PropTypes.oneOf(['default', 'primary', 'secondary']),
  message: PropTypes.string,
  className: PropTypes.string
};

export default Loader; 