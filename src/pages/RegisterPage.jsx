import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { UserIcon, KeyIcon, CheckIcon, ArrowRightIcon, ArrowLeftIcon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [localSuccess, setLocalSuccess] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [formStep, setFormStep] = useState(0); // 0: 用户名和邮箱, 1: 密码
  
  const { register } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 如果是第一步，验证用户名后进入第二步
    if (formStep === 0) {
      if (!username) {
        setLocalError('请输入用户名');
        return;
      }
      
      // 检查用户名格式
      const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
      if (!usernameRegex.test(username)) {
        setLocalError('用户名格式不正确 (3-20位字母、数字或下划线)');
        return;
      }
      
      setLocalError('');
      setFormStep(1); // 进入密码输入步骤
      return;
    }

    // 第二步，验证并提交
    setLocalError('');
    setLocalSuccess('');

    // 客户端基本验证
    if (!username || !password || !confirmPassword) {
      setLocalError('所有字段都不能为空');
      return;
    }
    
    if (password.length < 6) {
      setLocalError('密码长度至少需要 6 位');
      return;
    }
    
    if (password !== confirmPassword) {
      setLocalError('两次输入的密码不一致');
      return;
    }

    setIsRegistering(true);

    try {
      const result = await register({ username, password });

      if (result.success) {
        console.log('注册成功！', result.message);
        setLocalSuccess(result.message || '注册成功！请前往登录页面登录。');
        
        // 清空表单
        setUsername('');
        setPassword('');
        setConfirmPassword('');
        
        // 几秒后自动跳转到登录页
        setTimeout(() => {
          navigate('/login');
        }, 2500);
      } else {
        setLocalError(result.message || '注册失败，请稍后再试。');
      }
    } catch (err) {
      setLocalError(err.message || '注册时发生未知错误。'); 
    } finally {
      setIsRegistering(false);
    }
  };

  // 返回第一步
  const handleBack = () => {
    setFormStep(0);
    setLocalError('');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center overflow-hidden">
      {/* Registration Form */}
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
              创建新账号
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
              {formStep === 0 ? '填写您的基本信息' : '设置您的安全密码'}
            </motion.p>
          </div>
          
          {/* Form section */}
          <form onSubmit={handleSubmit} className="px-8 pb-8">
            {/* Step indicator */}
            <div className="flex items-center justify-center mb-6 gap-1">
              <div className={`w-2 h-2 rounded-full ${formStep === 0 ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
              <div className={`w-2 h-2 rounded-full ${formStep === 1 ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
            </div>
            
            {/* Form Step 1: Username */}
            {formStep === 0 && (
              <div className="space-y-5">
                {/* Username field */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <UserIcon className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="用户名 (3-20字符)"
                    className="w-full pl-10 pr-4 py-3 bg-white/60 dark:bg-slate-700/60 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    required
                  />
                </div>
                
                {/* Next button */}
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-all"
                >
                  继续
                  <ArrowRightIcon className="w-4 h-4" />
                </button>
              </div>
            )}
            
            {/* Form Step 2: Password */}
            {formStep === 1 && (
              <div className="space-y-5">
                {/* Password field */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <KeyIcon className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="密码 (至少6位)"
                    className="w-full pl-10 pr-4 py-3 bg-white/60 dark:bg-slate-700/60 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    required
                  />
                </div>
                
                {/* Confirm Password field */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <CheckIcon className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="确认密码"
                    className="w-full pl-10 pr-4 py-3 bg-white/60 dark:bg-slate-700/60 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    required
                  />
                </div>
                
                {/* Button Group */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="py-3 px-4 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <ArrowLeftIcon className="w-4 h-4" />
                    返回
                  </button>
                  
                  <button
                    type="submit"
                    disabled={isRegistering}
                    className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
                  >
                    {isRegistering ? (
                      <>
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        注册中...
                      </>
                    ) : (
                      <>
                        完成注册
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
            
            {/* Error and Success Messages */}
            {localError && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 text-red-600 dark:text-red-400 text-sm rounded-lg">
                {localError}
              </div>
            )}
            
            {localSuccess && (
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30 text-green-600 dark:text-green-400 text-sm rounded-lg">
                {localSuccess}
              </div>
            )}
            
            {/* Login link */}
            <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
              已有账号? 
              <Link to="/login" className="ml-1 font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300">
                登录
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage; 