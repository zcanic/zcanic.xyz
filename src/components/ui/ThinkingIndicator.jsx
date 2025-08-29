import React from 'react';

/**
 * 思考中指示器组件
 * 显示一个动画效果，表示AI正在思考中
 */
const ThinkingIndicator = ({ text = "正在思考..." }) => {
  return (
    <div className="flex items-center">
      <span>{text}</span>
      <div className="ml-2 flex space-x-1">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </div>
    </div>
  );
};

export default ThinkingIndicator; 