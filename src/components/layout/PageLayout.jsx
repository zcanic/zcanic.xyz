import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';

/**
 * 页面布局组件
 * 
 * 提供一致的页面布局和过渡动画
 * 
 * @param {Object} props - 组件属性
 * @param {React.ReactNode} props.children - 页面内容
 * @param {string} props.bgColor - 背景颜色样式
 * @param {boolean} props.withDecoration - 是否显示装饰元素
 * @param {string} props.className - 额外的CSS类
 */
const PageLayout = ({ 
  children, 
  bgColor = 'bg-gradient',
  withDecoration = false,
  className = '' 
}) => {
  const location = useLocation();
  
  // 滚动到顶部
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // 页面变体
  const pageVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  return (
    <motion.div
      className={`relative flex flex-col ${className}`}
      initial="initial"
      animate="animate"
      variants={pageVariants}
    >
      {/* 固定背景 - 确保覆盖所有内容 */}
      <div className={`fixed inset-0 ${bgColor} -z-10`} />

      {/* 装饰性元素 - 只在启用装饰模式时显示 */}
      {withDecoration && (
        <>
          {/* 左上角装饰 */}
          <div className="fixed top-0 left-0 w-32 h-32 md:w-48 md:h-48 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-br-full -z-5" />
          
          {/* 右下角装饰 */}
          <div className="fixed bottom-0 right-0 w-24 h-24 md:w-40 md:h-40 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-tl-full -z-5" />
          
          {/* 中心点缀 */}
          <div className="fixed top-1/3 right-1/4 w-8 h-8 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-xl -z-5" />
          <div className="fixed bottom-1/4 left-1/3 w-12 h-12 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-xl -z-5" />
        </>
      )}

      {/* 无障碍跳转链接 */}
      <a href="#main-content" className="skip-to-content">
        跳转到主要内容
      </a>

      {/* 主页面内容 */}
      <main id="main-content" className="flex-grow min-h-screen">
        {children}
      </main>
    </motion.div>
  );
};

PageLayout.propTypes = {
  children: PropTypes.node.isRequired,
  bgColor: PropTypes.string,
  withDecoration: PropTypes.bool,
  className: PropTypes.string
};

export default PageLayout; 