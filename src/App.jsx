import React, { lazy, Suspense, useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useTheme } from './context/ThemeContext';
import { PageTransition, Loader } from './components/ui';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import ToastContainer from './components/ToastContainer';

// 预加载关键页面组件
const BlogPage = lazy(() => import('./pages/BlogPage'));
// 使用ChatPage代替ChatInterface
const ChatPage = lazy(() => import('./pages/ChatPage'));

// Loader component shown during lazy loading
const PageLoader = () => (
  <div className="flex justify-center items-center min-h-[60vh]">
    <Loader size="lg" message="页面加载中..." />
  </div>
);

// Lazy load non-critical pages
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const PostDetailPage = lazy(() => import('./pages/PostDetailPage'));
const NewPostForm = lazy(() => import('./pages/NewPost'));
const NewsPage = lazy(() => import('./pages/NewsPage'));

// 添加全局样式，确保所有文本元素的颜色过渡一致
const GlobalStyles = () => {
  useEffect(() => {
    // 创建一个样式元素
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      * {
        transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
        transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        transition-duration: 300ms;
      }
    `;
    
    // 将样式元素添加到文档头部
    document.head.appendChild(styleElement);
    
    // 组件卸载时移除样式
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);
  
  return null;
};

const App = () => {
  const { isDark, toggleDarkMode } = useTheme();
  
  return (
    <div className={`min-h-screen flex flex-col relative ${isDark ? 'dark' : ''} transition-colors duration-300`}>
      {/* 固定背景 - 确保完全覆盖 */}
      <div className="fixed inset-0 w-full h-full z-[-100] bg-gradient-to-br transition-colors duration-300 from-white to-slate-50 dark:from-slate-900 dark:to-slate-800"></div>
      
      <GlobalStyles />
      
      <ToastContainer />
      <ErrorBoundary>
        <Navbar />
        <MainContent />
        <Footer />
      </ErrorBoundary>
    </div>
  );
};

// MainContent component with route configuration
function MainContent() {
  const location = useLocation();

  return (
    <main className="flex-grow">
      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <Routes location={location} key={location.pathname}>
            {/* 默认重定向到博客页面 */}
            <Route path="/" element={<Navigate to="/blog" replace />} />
            
            {/* 认证页面 */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* 内容页面 */}
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/:postId" element={<PostDetailPage />} />
            <Route path="/new-post" element={<NewPostForm />} />
            <Route path="/news" element={<NewsPage />} />
            
            {/* 聊天相关页面 - 使用新的ChatPage */}
            <Route path="/chat" element={<ChatPage />} />
            
            {/* 404页面 */}
            <Route path="*" element={
              <div className="flex justify-center items-center min-h-[60vh] text-center">
                <div>
                  <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 mb-4">
                    404 - 页面不存在
                  </h1>
                  <p className="text-slate-600 dark:text-slate-300 mb-6">
                    找不到您要访问的页面，可能是链接已更新
                  </p>
                </div>
              </div>
            } />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </main>
  );
}

export default App; 