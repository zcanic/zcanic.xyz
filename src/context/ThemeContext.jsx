import React, { createContext, useContext, useState, useEffect } from 'react';

// 主题上下文
const ThemeContext = createContext();

// 主题提供者组件
export const ThemeProvider = ({ children }) => {
  // 从本地存储或系统偏好初始化主题
  const [isDark, setIsDark] = useState(() => {
    // 首先检查本地存储
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    // 否则检查系统偏好
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return true;
    }
    return false;
  });

  // 监听系统主题变化
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      if (localStorage.getItem('theme') === null) {
        setIsDark(e.matches);
      }
    };
    
    // 添加事件监听器，兼容不同浏览器
    try {
      mediaQuery.addEventListener('change', handleChange);
    } catch (error) {
      // 兼容旧版浏览器
      mediaQuery.addListener(handleChange);
    }
    
    // 清理监听器
    return () => {
      try {
        mediaQuery.removeEventListener('change', handleChange);
      } catch (error) {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  // 当主题变化时更新文档和本地存储
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  // 切换主题函数
  const toggleDarkMode = () => {
    setIsDark(!isDark);
  };

  // 主题上下文值
  const contextValue = {
    isDark,
    isDarkMode: isDark, // 为兼容性保留
    toggleDarkMode
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// 自定义钩子，方便访问主题上下文
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext; 