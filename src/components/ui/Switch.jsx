import React from 'react';

/**
 * 开关组件
 *
 * @param {Object} props
 * @param {boolean} props.checked - 开关是否开启
 * @param {Function} props.onChange - 开关状态变化处理函数
 * @param {string} props.label - 开关描述文本 (用于a11y)
 * @param {string} props.className - 自定义样式类
 * @param {boolean} props.disabled - 是否禁用
 */
const Switch = ({ 
  checked = false, 
  onChange,
  label = '',
  className = '',
  disabled = false,
  ...props
}) => {
  return (
    <label className={`relative inline-flex items-center cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
      <input 
        type="checkbox" 
        className="sr-only peer"
        checked={checked}
        onChange={(e) => onChange && onChange(e.target.checked)}
        disabled={disabled}
        {...props}
      />
      <div 
        className={`
          relative w-11 h-6 bg-gray-200 rounded-full 
          peer peer-focus:ring-4 peer-focus:ring-blue-300 
          dark:peer-focus:ring-blue-800 
          peer-checked:after:translate-x-full 
          peer-checked:after:border-white 
          after:content-[''] 
          after:absolute 
          after:top-0.5 
          after:left-[2px] 
          after:bg-white 
          after:border-gray-300 
          after:border 
          after:rounded-full 
          after:h-5 
          after:w-5 
          after:transition-all 
          peer-checked:bg-blue-600
        `}
      ></div>
      {label && (
        <span className="sr-only">{label}</span>
      )}
    </label>
  );
};

export default Switch; 