import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../utils/cn';

/**
 * 现代输入框组件
 * 
 * @param {Object} props - 组件属性
 * @param {string} props.type - 输入框类型
 * @param {string} props.variant - 输入框样式变体 ('default', 'outline', 'filled')
 * @param {string} props.size - 输入框大小 ('sm', 'md', 'lg')
 * @param {string} props.label - 输入框标签
 * @param {string} props.error - 错误信息
 * @param {string} props.className - 额外CSS类
 */
const Input = React.forwardRef(({
  type = 'text',
  variant = 'default',
  size = 'md',
  label = '',
  error = '',
  className = '',
  disabled = false,
  ...rest
}, ref) => {
  // 变体样式 - 增强边框和视觉效果
  const variantClasses = {
    default: 'border-2 border-slate-300 dark:border-slate-600 focus:border-indigo-500 dark:focus:border-indigo-400',
    outline: 'border-2 border-slate-300 dark:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-400',
    filled: 'bg-slate-100 dark:bg-slate-700 border-2 border-transparent focus:bg-white dark:focus:bg-slate-800',
  };

  // 更实质的大小类
  const sizeClasses = {
    sm: 'text-sm px-3 py-1.5 rounded-md',
    md: 'text-base px-4 py-2.5 rounded-md',
    lg: 'text-lg px-5 py-3 rounded-md',
  };

  // 生成类名
  const inputClasses = cn(
    'w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100',
    'transition-all duration-200 placeholder:text-slate-400 dark:placeholder:text-slate-500',
    'shadow-sm focus:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:focus:ring-indigo-500/40',
    variantClasses[variant] || variantClasses.default,
    sizeClasses[size] || sizeClasses.md,
    disabled && 'opacity-60 cursor-not-allowed bg-slate-50 dark:bg-slate-700',
    error && 'border-red-500 dark:border-red-500 focus:border-red-500 dark:focus:border-red-500',
    className
  );

  return (
    <div className="w-full">
      {label && (
        <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        disabled={disabled}
        className={inputClasses}
        {...rest}
      />
      {error && (
        <p className="mt-1.5 text-sm text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

Input.propTypes = {
  type: PropTypes.string,
  variant: PropTypes.oneOf(['default', 'outline', 'filled']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  label: PropTypes.string,
  error: PropTypes.string,
  className: PropTypes.string,
  disabled: PropTypes.bool
};

export default Input;
