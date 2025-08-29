import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../utils/cn';

/**
 * 现代文本区域组件
 * 
 * @param {Object} props - 组件属性
 * @param {string} props.variant - 文本区域样式变体 ('default', 'outline', 'filled')
 * @param {string} props.label - 文本区域标签
 * @param {string} props.error - 错误信息
 * @param {number} props.rows - 文本区域行数
 * @param {string} props.className - 额外CSS类
 */
const Textarea = React.forwardRef(({
  variant = 'default',
  label = '',
  error = '',
  rows = 4,
  className = '',
  disabled = false,
  ...rest
}, ref) => {
  // 变体样式
  const variantClasses = {
    default: 'border border-slate-300 dark:border-slate-600 focus:border-indigo-500 dark:focus:border-indigo-400',
    outline: 'border-2 border-slate-200 dark:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-400',
    filled: 'bg-slate-100 dark:bg-slate-700 border-transparent focus:bg-white dark:focus:bg-slate-800',
  };

  // 生成类名
  const textareaClasses = cn(
    'w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-md',
    'transition-colors duration-200 placeholder:text-slate-400 dark:placeholder:text-slate-500',
    'focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-500/30',
    'px-3 py-2 text-sm',
    variantClasses[variant] || variantClasses.default,
    disabled && 'opacity-60 cursor-not-allowed bg-slate-50 dark:bg-slate-700',
    error && 'border-red-500 dark:border-red-500 focus:border-red-500 dark:focus:border-red-500',
    className
  );

  return (
    <div className="w-full">
      {label && (
        <label className="block mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        rows={rows}
        disabled={disabled}
        className={textareaClasses}
        {...rest}
      />
      {error && (
        <p className="mt-1 text-xs text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

Textarea.propTypes = {
  variant: PropTypes.oneOf(['default', 'outline', 'filled']),
  label: PropTypes.string,
  error: PropTypes.string,
  rows: PropTypes.number,
  className: PropTypes.string,
  disabled: PropTypes.bool
};

export default Textarea;
