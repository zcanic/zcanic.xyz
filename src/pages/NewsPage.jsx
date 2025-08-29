import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios'; // 使用 axios 获取数据
import ReactMarkdown from 'react-markdown'; // <-- 引入 ReactMarkdown
import remarkGfm from 'remark-gfm'; // <-- 引入 GFM 插件
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton'; 
import 'react-loading-skeleton/dist/skeleton.css'; 
// import AnimateOnReveal from '../components/AnimateOnReveal'; // <-- REMOVE import
import ErrorBoundary from '../components/ErrorBoundary';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext'; // <-- Import useAuth
import { PawPrint, BrainCircuit, RefreshCw } from 'lucide-react'; // <-- Import RefreshCw icon
import { getDailyFortune, triggerManualFortune, getTaskStatus } from '../services/api'; // <-- Import API functions
import { useToast } from '../hooks/useToast'; // <-- Import useToast hook (assuming it exists or create it)

function DailyMeowPage() { // <-- 重命名组件更清晰
  const { isDarkMode } = useTheme(); 
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth(); 
  const [fortuneContent, setFortuneContent] = useState('');
  const [isLoading, setIsLoading] = useState(true); // 这个是页面自身加载状态
  const [error, setError] = useState(null);
  const [taskId, setTaskId] = useState(null); // 存储当前任务ID
  const [taskStatus, setTaskStatus] = useState(null); // 存储任务状态
  const pollingIntervalRef = useRef(null); // 用于存储轮询interval的引用
  const { addToast } = useToast(); // <-- Use toast for feedback

  // 添加组件渲染日志
  console.log('[DailyMeowPage] Component rendered. isAuthLoading:', isAuthLoading, 'isAuthenticated:', isAuthenticated);

  // 清理轮询函数
  const clearPollingInterval = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
      console.log('[DailyMeowPage] Polling interval cleared');
    }
  };

  // 轮询任务状态的函数
  const pollTaskStatus = useCallback(async (taskId) => {
    if (!taskId) return;
    
    try {
      console.log(`[DailyMeowPage] Polling task status for task ID: ${taskId}`);
      const response = await getTaskStatus(taskId);
      const status = response.data?.task?.status;
      const content = response.data?.task?.result;
      
      setTaskStatus(status);
      console.log(`[DailyMeowPage] Task status: ${status}`);
      
      if (status === 'completed' && content) {
        // 任务完成，更新内容
        setFortuneContent(content);
        setIsLoading(false);
        clearPollingInterval(); // 停止轮询
        console.log('[DailyMeowPage] Task completed, content updated.');
      } else if (status === 'failed') {
        // 任务失败
        setError('喵语生成失败了，请稍后再试 (>﹏<)');
        setIsLoading(false);
        clearPollingInterval(); // 停止轮询
        console.log('[DailyMeowPage] Task failed.');
      }
      // 如果还是 pending 或 processing，继续轮询
    } catch (err) {
      console.error('[DailyMeowPage] Error polling task status:', err);
      // 轮询出错不终止轮询，让它继续尝试
    }
  }, []);

  // 开始轮询任务状态
  const startPolling = useCallback((taskId) => {
    if (!taskId) return;
    
    // 先清除可能存在的轮询
    clearPollingInterval();
    
    // 立即执行一次
    pollTaskStatus(taskId);
    
    // 然后设置定期轮询（每3秒一次）
    pollingIntervalRef.current = setInterval(() => {
      pollTaskStatus(taskId);
    }, 3000);
    
    console.log(`[DailyMeowPage] Started polling for task ID: ${taskId}`);
  }, [pollTaskStatus]);

  // 获取喵语的函数，可能触发轮询
  const fetchFortune = useCallback(async () => {
    console.log('[DailyMeowPage] fetchFortune called. isAuthLoading:', isAuthLoading, 'isAuthenticated:', isAuthenticated);

    // 在 Auth 加载完成之前，不执行获取逻辑
    if (isAuthLoading) {
      console.log('[DailyMeowPage] Auth loading, skipping fetch.');
      return; 
    }
    
    // 使用 isAuthenticated 判断
    if (!isAuthenticated) { 
      setError('需要先登录才能看到今日喵语哦！');
      setIsLoading(false);
      console.log('[DailyMeowPage] User not authenticated, showing login prompt.');
      return;
    }
    
    console.log('[DailyMeowPage] User authenticated, fetching fortune...');
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await getDailyFortune();
      const status = response.data?.status;
      const content = response.data?.content;
      const responseTaskId = response.data?.taskId;
      
      // 根据状态处理不同情况
      if (status === 'pending' && responseTaskId) {
        // 任务处于等待状态，需要开始轮询
        setTaskId(responseTaskId);
        startPolling(responseTaskId);
        console.log(`[DailyMeowPage] Fortune pending, started polling for task: ${responseTaskId}`);
        // 保持加载状态
      } else if (status === 'completed' && content) {
        // 已完成的任务，直接显示内容
        setFortuneContent(content);
        setIsLoading(false);
        console.log('[DailyMeowPage] Fortune already completed, displaying content');
      } else {
        // 意外情况
        setIsLoading(false);
        console.warn('[DailyMeowPage] Received unexpected data:', response.data);
        setError('收到了奇怪的数据喵，请稍后再试');
      }
    } catch (err) {
      let errorMessage = '获取今日喵语失败了 T_T';
      // 错误处理
      if (err?.message) {
        errorMessage = err.message;
      } else if (err.response) {
        errorMessage = err.response.data?.message || `服务器错误喵 (${err.response.status})`;
      }
      console.error('[DailyMeowPage] API Error:', err);
      setError(errorMessage);
      setIsLoading(false);
    }
  }, [isAuthenticated, isAuthLoading, startPolling]);

  useEffect(() => {
    console.log('[DailyMeowPage] useEffect triggered.');
    fetchFortune();
    
    // 清理函数，组件卸载时停止轮询
    return () => {
      clearPollingInterval();
    };
  }, [fetchFortune]); 

  // Handler for the manual trigger button
  const handleManualTrigger = async () => {
    const password = window.prompt("请输入手动触发密码喵：");
    if (password === null) {
      addToast('取消手动触发喵。_(:з」∠)_', 'info');
      return;
    }
    if (!password) {
      addToast('密码不能为空喵！(｀Д´*)ﾉ', 'warning');
      return;
    }

    setIsLoading(true);
    setError(null);
    clearPollingInterval(); // 清除现有轮询
    
    try {
      const response = await triggerManualFortune(password);
      const status = response.data?.status;
      const content = response.data?.content;
      const responseTaskId = response.data?.taskId;
      
      addToast(response.data?.message || '手动触发成功喵！🎉', 'success');
      
      // 处理响应状态
      if (status === 'pending' && responseTaskId) {
        // 需要轮询新任务
        setTaskId(responseTaskId);
        startPolling(responseTaskId);
      } else if (content) {
        // 有内容直接显示
        setFortuneContent(content);
        setIsLoading(false);
      } else {
        // 重新获取
        fetchFortune();
      }
    } catch (error) {
      const errorMsg = error?.message || '手动触发失败了喵 T_T';
      setError(errorMsg);
      setIsLoading(false);
      addToast(errorMsg, 'error');
    }
  };

  return (
    <SkeletonTheme baseColor={isDarkMode ? "#2D3748" : "#E2E8F0"} highlightColor={isDarkMode ? "#4A5568" : "#F7FAFC"}>
      <div className="w-full container mx-auto py-8 px-4 flex flex-col items-center"> 
        <ErrorBoundary>
          {/* 页面标题 - Add button here */}
            <div className="relative w-full max-w-2xl flex justify-center mb-8"> {/* Wrap title for relative positioning */} 
              <h1 className="text-4xl font-bold text-center text-gray-900 dark:text-white flex items-center justify-center">
                <PawPrint className="w-8 h-8 mr-3 text-pink-500" />
                每日喵语~
                <PawPrint className="w-8 h-8 ml-3 text-pink-500" />
              </h1>
              {/* Manual Trigger Button - Positioned absolutely to the right with padding */}
              <button 
                onClick={handleManualTrigger} 
                title="手动触发喵语更新"
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading} // Disable button while loading/triggering
              >
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

          {/* 内容区域 - 增加最小高度确保 loading 时布局稳定 */}
          <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden p-6 min-h-[250px] flex justify-center items-center">
            {isLoading && (
              <div className="w-full flex flex-col items-center text-center"> {/* Center loading content */}
                 {/* Loading Icon */}
                <BrainCircuit className="w-10 h-10 mb-4 text-blue-500 animate-pulse" /> 
                {/* Loading Text */}
                <p className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-3">Zcanic 正在努力思考今日喵语...</p>
                 {/* Skeleton remains for structure indication */}
                <div className="w-4/5"> {/* Limit skeleton width slightly */}
                  <Skeleton height={20} width="50%" className="mb-3 mx-auto" /> {/* Center skeleton lines */}
                  <Skeleton count={2} className="mb-2" />
                </div>
              </div>
            )}

            {!isLoading && error && (
              /* <AnimateOnReveal preset="scaleIn" className="w-full"> */
                <div className="w-full text-center py-8 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 px-4 py-3 rounded relative" role="alert">
                  <strong className="font-bold text-red-800 dark:text-red-200">喵呜! 出错了!</strong>
                  <span className="block sm:inline text-red-700 dark:text-red-300 mt-1"> {error}</span>
                </div>
              /* </AnimateOnReveal> */
            )}

            {!isLoading && !error && fortuneContent && (
              // Remove prose classes from the wrapping div
              // <div className="prose prose-lg dark:prose-invert max-w-none w-full ...">
              <div> {/* Keep the div for structure if needed, but without prose classes */} 
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]} 
                  // Add prose classes directly to ReactMarkdown component
                  className="prose prose-lg dark:prose-invert max-w-none w-full text-gray-700 dark:text-gray-300 break-words 
                             // Keep spacing modifiers if desired
                             prose-headings:my-4 prose-p:my-3 prose-ul:my-3 prose-li:my-1 prose-blockquote:my-4"
                >
                  {fortuneContent}
                </ReactMarkdown>
              </div>
            )}

            {!isLoading && !error && !fortuneContent && (
              /* <AnimateOnReveal preset="fadeInUp" className="w-full"> */
                 <p className="w-full text-gray-500 dark:text-gray-400 text-lg text-center">
                   Zcanic 正在打盹，还没想好今天说什么喵... (∪｡∪)｡｡｡zzz
                 </p>
              /* </AnimateOnReveal> */
            )}
          </div>

        </ErrorBoundary>
      </div>
    </SkeletonTheme>
  );
}

export default DailyMeowPage; // <-- 导出新名称 