import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { KeyIcon, UserIcon, ArrowRightIcon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  const { login, isAuthenticated } = useAuth();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const containerRef = useRef(null);

  // 如果用户已登录，重定向到首页
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setLocalError('');
    setIsLoggingIn(true);

    if (!username || !password) {
      setLocalError('请输入用户名和密码');
      setIsLoggingIn(false);
      return;
    }

    try {
      // Pass username and password as separate parameters to match the login function's signature
      const result = await login(username, password);
      
      // 确保result存在并且有success属性，避免undefined访问错误
      if (result && result.success === false) {
        setLocalError(result.message || '登录失败，请重试');
      }
      // 登录成功会由 useEffect 处理重定向
    } catch (err) {
      console.error('Login error:', err);
      setLocalError(err.message || '登录失败，请检查用户名或密码');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <AnimatePresence mode="wait">
      <div 
        ref={containerRef}
        className="min-h-screen w-full flex items-center justify-center overflow-hidden"
      >
        {/* Improved gradient background with smoother transition */}
        <div className="fixed inset-0 bg-gradient-to-br from-blue-100 via-indigo-50 to-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 z-0 transition-colors duration-500" />
        
        {/* Login Form */}
        <div className="relative z-10 w-full max-w-md px-5">
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-white/20 dark:border-slate-700/20 rounded-2xl shadow-xl overflow-hidden">
            {/* Card header with logo */}
            <div className="px-8 pt-8 pb-6 text-center">
              <motion.div 
                className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ 
                  duration: 0.6, 
                  ease: [0.22, 1.1, 0.36, 1],
                  delay: 0.1
                }}
              >
                <span className="text-white text-2xl font-bold">Z</span>
              </motion.div>
              
              <motion.h2 
                className="text-2xl font-bold text-gray-900 dark:text-white"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.5, 
                  ease: [0.25, 0.1, 0.25, 1], 
                  delay: 0.2 
                }}
              >
                欢迎回来
              </motion.h2>
              
              <motion.p 
                className="mt-2 text-sm text-gray-600 dark:text-gray-300"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.5, 
                  ease: [0.25, 0.1, 0.25, 1], 
                  delay: 0.3 
                }}
              >
                登录您的账号以继续
              </motion.p>
            </div>
            
            {/* Form section */}
            <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-5">
              {/* Username field */}
              <motion.div 
                className="relative"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <UserIcon className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="用户名"
                  className="w-full pl-10 pr-4 py-3 bg-white/60 dark:bg-slate-700/60 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  required
                />
              </motion.div>
              
              {/* Password field */}
              <motion.div 
                className="relative"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <KeyIcon className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="密码"
                  className="w-full pl-10 pr-4 py-3 bg-white/60 dark:bg-slate-700/60 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  required
                />
              </motion.div>
              
              {/* Error message */}
              {localError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 text-red-600 dark:text-red-400 text-sm rounded-lg">
                  {localError}
                </div>
              )}
              
              {/* Submit button */}
              <motion.button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-70"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                {isLoggingIn ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    登录中...
                  </>
                ) : (
                  <>
                    登录
                    <ArrowRightIcon className="w-4 h-4" />
                  </>
                )}
              </motion.button>
              
              {/* Register link */}
              <motion.div 
                className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                还没有账号？ 
                <Link to="/register" className="ml-1 font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300">
                  注册账户
                </Link>
              </motion.div>
            </form>
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
}

export default LoginPage; 