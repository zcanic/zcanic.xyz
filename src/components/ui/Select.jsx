import React from 'react';

/**
 * 下拉选择组件
 * 
 * @param {Object} props
 * @param {any} props.value - 当前选中的值
 * @param {Function} props.onChange - 值变化处理函数
 * @param {Array} props.options - 选项数组 [{value: any, label: string}]
 * @param {string} props.placeholder - 占位文本
 * @param {boolean} props.disabled - 是否禁用
 * @param {string} props.className - 自定义样式类
 */
const Select = ({
  value,
  onChange,
  options = [],
  placeholder = '请选择',
  disabled = false,
  className = '',
  ...props
}) => {
  // 处理选择变化
  const handleChange = (e) => {
    const selectedValue = e.target.value;
    
    // 尝试转换为数字（如果可能）
    const parsedValue = !isNaN(selectedValue) && !isNaN(parseFloat(selectedValue))
      ? Number(selectedValue)
      : selectedValue;
    
    onChange && onChange(parsedValue);
  };
  
  return (
    <div className="relative">
      <select
        value={value || ''}
        onChange={handleChange}
        disabled={disabled}
        className={`
          block w-full rounded-md border-gray-300 shadow-sm
          focus:border-blue-500 focus:ring-blue-500
          disabled:bg-gray-100 disabled:cursor-not-allowed
          py-2 pl-3 pr-10 text-base
          ${className}
        `}
        {...props}
      >
        {/* 占位选项 */}
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        
        {/* 渲染选项列表 */}
        {options.map((option, index) => (
          <option key={index} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {/* 下拉箭头 */}
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
        <svg
          className="h-4 w-4 fill-current"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    </div>
  );
};

export default Select; 