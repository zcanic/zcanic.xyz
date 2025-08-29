import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api'; // 导入配置好的 axios 实例
import { toast } from 'react-hot-toast';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // 初始加载状态
  const [error, setError] = useState(null);

  // 检查认证状态 (应用加载时或刷新时调用)
  const checkAuthStatus = useCallback(async () => {
    console.info('[AuthContext] Checking auth status via /api/auth/me...');
    setIsLoading(true);
    try {
      // 尝试调用 /api/auth/me 获取用户信息
      // 如果 cookie 有效，后端会返回用户信息
      const response = await api.get('/auth/me');
      const userData = response.data.user; // 假设后端在 data.user 中返回用户信息

      if (userData) {
        setUser(userData);
        setIsAuthenticated(true);
        console.info(`[AuthContext] Auth status checked: User [${userData.username}] is authenticated.`);
      } else {
        // 虽然请求成功，但没有用户信息？(理论上不应发生，除非后端逻辑问题)
        setUser(null);
        setIsAuthenticated(false);
        console.warn('[AuthContext] /api/auth/me responded successfully but without user data.');
      }
    } catch (error) {
      // 如果请求失败 (例如 401), 说明 cookie 无效或不存在
      setUser(null);
      setIsAuthenticated(false);
      if (error.response && error.response.status === 401) {
        console.info('[AuthContext] Auth status checked: User is not authenticated (401 from /api/auth/me).');
      } else {
        console.error('[AuthContext] Error checking auth status:', error);
      }
      // 不需要清除 localStorage 了，因为 token 不在里面
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 组件挂载时检查认证状态
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // 登录函数
  const login = useCallback(async (username, password) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post('/auth/login', { username, password });
      const userData = response.data.user; // 从响应中获取用户信息

      if (userData) {
        setUser(userData);
        setIsAuthenticated(true);
        console.info(`[AuthContext] User [${userData.username}] logged in successfully.`);
        toast.success('登录成功喵！');
        
        return { success: true, message: '登录成功' };
      } else {
        // 登录成功但后端没返回用户信息？
        console.error('[AuthContext] Login successful but no user data received from backend.');
        setError('登录时发生未知错误：服务器未返回用户信息');
        toast.error('登录时发生未知错误喵');
        // 保持未登录状态
        setUser(null);
        setIsAuthenticated(false);
        
        return { success: false, message: '登录时发生未知错误：服务器未返回用户信息' };
      }
      // 不需要再手动保存 token 或 user 到 localStorage

    } catch (error) {
      const errorResponse = error.response?.data || {};
      const errorMessage = errorResponse.message || error.message || '登录失败，请检查用户名或密码';
      console.error('[AuthContext] Login failed:', error);
      setError(errorMessage);
      
      // 错误信息由 api.js 拦截器处理并显示 toast
      setUser(null);
      setIsAuthenticated(false);
      
      return { 
        success: errorResponse.success !== undefined ? errorResponse.success : false, 
        message: errorMessage 
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 注册函数
  const register = useCallback(async (userData) => {
    const username = userData?.username || 'unknown';
    console.log(`[AuthContext][register] Attempting registration for user: ${username}...`);
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/register', userData);
      console.log('[AuthContext][register] Received response from registerUser API:', response);
      // 假设注册成功只返回消息，不自动登录
      const { message } = response.data;
      console.log(`[AuthContext][register] Registration successful for ${username}:`, message);
      // 不设置 token 或 user 状态
      toast.success(message || '注册成功喵！请登录。');
      return { success: true, message: message || '注册成功喵！请登录。', requiresLogin: true };
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || '注册失败了喵 T_T';
      console.error(`[AuthContext][register] Registration failed for ${username}:`, errorMsg, err);
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setIsLoading(false);
      console.log(`[AuthContext][register] Registration attempt finished for ${username}. isLoading: false`);
    }
  }, []);

  // 登出函数
  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await api.post('/auth/logout'); // 调用后端登出接口，清除 cookie
      setUser(null);
      setIsAuthenticated(false);
      console.info('[AuthContext] User logged out successfully.');
      toast.success('已成功登出喵！');
      // 不需要清除 localStorage
    } catch (error) {
      console.error('[AuthContext] Logout failed:', error.response ? error.response.data : error);
      toast.error(error.response?.data?.message || '登出时发生错误喵！');
      // 即使登出失败，前端也应认为用户已登出
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 将状态和函数提供给子组件
  const value = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    checkAuthStatus,
  };

  // Log state changes (can be noisy, use judiciously or with conditional checks)
  // useEffect(() => {
  //   console.log('[AuthContext][StateChange]', { token: token ? 'Exists' : 'null', user, isAuthenticated, isLoading, error });
  // }, [token, user, isAuthenticated, isLoading, error]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// 自定义 Hook，方便消费 Context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 