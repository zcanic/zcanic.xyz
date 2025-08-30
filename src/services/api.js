import axios from 'axios';
import { toast } from 'react-hot-toast'; // 导入 toast
import { defaultRetry, chatRetry, batchQueryRetry } from '../utils/retryMechanism'; // 导入重试机制

// 定义一个空的 clearAuthData 函数，因为我们不再需要清除 localStorage 了
const clearAuthData = () => {
  console.log('[AuthService Stub] clearAuthData called (no action needed for HttpOnly cookies).');
  // 不需要做任何事
};

// 创建 axios 实例 - 优化超时和重试配置
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api', // 从环境变量读取或使用默认值
  timeout: 30000, // 聊天请求超时时间 (30秒) - 对标OpenAI响应时间
  withCredentials: true, // <--- 关键！允许跨域请求携带 Cookie
  headers: {
    'Content-Type': 'application/json',
  },
  // 增强连接配置
  maxRedirects: 3,
  maxContentLength: 50 * 1024 * 1024, // 50MB
  maxBodyLength: 50 * 1024 * 1024 // 50MB
});

// --- 请求拦截器 --- 
// 在每个请求发送前执行
apiClient.interceptors.request.use(
  config => {
    // console.log(`[API Interceptor Request] Initial config URL: ${config.url}`);
    
    // --- 移除复杂的 URL 修正逻辑 ---
    // let finalUrl = config.url;
    // ... (删除所有 finalUrl 相关的判断和赋值) ...
    // console.log(`[API Interceptor Request] FINAL URL before sending: ${config.baseURL ? config.baseURL + config.url : config.url}`);
    // --- 结束移除 ---

    // 因为使用了 HttpOnly Cookie，浏览器会自动发送 Cookie，前端不需要手动附加 Token
    // console.log('[API Interceptor Request] Assuming browser will send HttpOnly authToken cookie if available.');
    
    // 特殊处理：如果是 FormData (用于文件上传)，让浏览器自动设置 Content-Type
    if (config.data instanceof FormData) {
       // console.log('[API Interceptor Request] Request data is FormData, deleting default Content-Type header.');
       delete config.headers['Content-Type']; // 删除我们默认设置的 application/json
    } else {
       // 对于非 FormData 请求，可以保持默认的 Content-Type 或根据需要设置
       // config.headers['Content-Type'] = 'application/json';
    }

    return config; // 返回修改后的配置
  },
  error => {
    console.error('[API Interceptor Request] Error configuring request:', error);
    // 处理请求配置时的错误
    toast.error('请求发送失败喵 T_T');
    return Promise.reject(error);
  }
);

// --- 响应拦截器 (增强错误处理与 Toast 通知) ---
apiClient.interceptors.response.use(
  response => {
    // 处理可能的 JSON 解析错误（虽然通常不会发生在成功响应中）
    try {
      if (typeof response.data === 'string' && response.data.trim()) {
        try {
          response.data = JSON.parse(response.data);
        } catch (e) {
          console.warn('[API Interceptor Response] Response data is a string but not valid JSON:', response.data);
          // 继续使用原始字符串
        }
      }
      
      // 确保response.data总是包含success属性
      if (response.data && response.status >= 200 && response.status < 300 && response.data.success === undefined) {
        response.data.success = true;
        console.log('[API Interceptor Response] Added missing success: true property to response data');
      }
      
      return response; // 成功的响应直接返回
    } catch (error) {
      console.error('[API Interceptor Response] Error parsing successful response:', error);
      return response; // 如果解析出错，仍然返回原始响应
    }
  },
  error => {
    // 处理错误响应
    try {
      const config = error.config || {};
      const requestInfo = config.method ? `${config.method.toUpperCase()} ${config.url}` : 'Unknown Request';
      let friendlyErrorMessage = '发生了一个未知错误喵，请稍后再试 T_T'; // 默认错误消息

      // 错误响应解析
      if (error.response) {
        // 服务器响应了错误状态码
        const { status } = error.response;
        let data = error.response.data;

        // 尝试解析响应数据，处理可能的字符串响应
        if (typeof data === 'string' && data.trim()) {
          try {
            data = JSON.parse(data);
            error.response.data = data; // 更新为解析后的对象
          } catch (e) {
            console.warn(`[API Interceptor Response] Response data is a string but not valid JSON: ${data}`);
            // 使用原始字符串作为错误消息
            friendlyErrorMessage = data;
          }
        }
        
        // 确保error.response.data总是包含success属性
        if (data && data.success === undefined) {
          data.success = false;
          error.response.data = data;
          console.log('[API Interceptor Response] Added missing success: false property to error response data');
        }

        console.error(`[API Interceptor Response] Error ${status} from ${requestInfo}:`, data || error.message);

        // 从解析后的数据中提取错误信息
        if (data) {
          if (typeof data === 'string') {
            friendlyErrorMessage = data; // 如果 data 是纯字符串
          } else if (data.message) {
            friendlyErrorMessage = data.message; // 优先使用 message 字段
          } else if (data.error) {
            friendlyErrorMessage = data.error; // 其次使用 error 字段
          } else if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
            // 处理 express-validator 返回的数组错误
            friendlyErrorMessage = data.errors.map(e => e.msg || JSON.stringify(e)).join(', ');
          } else {
            friendlyErrorMessage = `服务器错误 ${status}，请稍后再试。`; // 提取失败时的通用服务器错误
          }
        }

        if (status === 401) {
          // 检查是否是来自 /auth/me 的 401 错误
          if (config.url === '/auth/me') {
            console.info('[API Interceptor Response] Silent 401 for /auth/me (handled by AuthContext).');
            // 对于 /auth/me 的 401，不显示 toast，不跳转，让 AuthContext 处理
          } else {
            // 对于其他接口的 401，认为是会话过期或无效
            friendlyErrorMessage = '会话已过期或认证失败，请重新登录喵！';
            console.warn(`[API Interceptor Response] Received 401 Unauthorized for ${requestInfo}. Clearing auth and redirecting...`);
            clearAuthData(); // 确认清除认证信息（虽然现在是HttpOnly，这步可能冗余）
            toast.error(friendlyErrorMessage);
            setTimeout(() => {
              if (window.location.pathname !== '/login') {
                window.location.href = '/login';
              }
            }, 1500); 
            // 阻止后续 Promise 链
            return new Promise(() => {});
          }
        } else if (status === 403) {
          friendlyErrorMessage = data?.message || data?.error || '权限不足，无法执行此操作喵！';
          toast.error(friendlyErrorMessage);
        } else if (status === 400) {
          // 对于 400 Bad Request，后端通常会在 data.message 或 data.errors 中提供具体原因
          toast.error(`请求无效喵: ${friendlyErrorMessage}`);
        } else if (status >= 500) {
          friendlyErrorMessage = data?.message || data?.error || `服务器内部错误 (${status})，请联系管理员或稍后再试喵！`;
          toast.error(friendlyErrorMessage);
        } else {
          // 其他 4xx 错误 (e.g., 404 Not Found, 429 Too Many Requests)
          toast.error(friendlyErrorMessage || `请求出错 (${status})`);
        }

      } else if (error.request) {
        // 请求已发出，但没有收到响应 (网络错误)
        friendlyErrorMessage = '网络连接失败喵，请检查你的网络连接 T_T';
        console.error(`[API Interceptor Response] No response received for ${requestInfo}:`, error.request);
        toast.error(friendlyErrorMessage);
      } else {
        // 设置请求时发生错误
        friendlyErrorMessage = `请求设置失败: ${error.message}`; 
        console.error(`[API Interceptor Response] Error setting up request for ${requestInfo}:`, error.message);
        toast.error(friendlyErrorMessage);
      }
      
      // 除非是401强制跳转，否则仍然 reject 错误，以便调用处可以进行特定处理
      if (error.response?.status !== 401) {
        return Promise.reject(new Error(friendlyErrorMessage)); // Reject with the user-friendly message
      } else {
        // For 401, we returned a pending promise earlier to stop the chain
        return error; // Or return the original error if needed elsewhere, though unlikely after redirect
      }
    } catch (parseError) {
      // 捕获处理错误过程中的任何异常，确保代码不会抛出未处理的异常
      console.error('[API Interceptor Response] Error in error handling:', parseError);
      toast.error('处理请求时发生错误喵！');
      return Promise.reject(new Error('处理请求时发生错误')); 
    }
  }
);

// Helper function to wrap API calls with logging
const callApi = async (func, functionName, ...args) => {
  console.log(`[API Call] ${functionName}: Starting...`, args);
  try {
    const response = await func(...args);
    console.log(`[API Call] ${functionName}: Success! Status: ${response.status}`);
    return response; // Return the original axios response object
  } catch (error) {
    // Error is already processed and logged by the interceptor
    console.error(`[API Call] ${functionName}: Failed! Error:`, error.message || error);
    // Re-throw the processed error from the interceptor or the original if interceptor failed
    throw error; 
  }
};

// --- API 调用函数封装 (使用包装器) ---

// 认证相关
export const registerUser = (userData) => callApi(apiClient.post, 'registerUser', '/auth/register', userData);
export const loginUser = (credentials) => callApi(apiClient.post, 'loginUser', '/auth/login', credentials);

// 新增：检查当前登录状态并获取用户信息 (假设后端提供此接口)
export const checkAuthStatus = () => callApi(apiClient.get, 'checkAuthStatus', '/auth/me');

// 新增：调用登出接口
export const logoutUser = () => callApi(apiClient.post, 'logoutUser', '/auth/logout');

// 博客文章相关
export const fetchPosts = async (searchTerm = '') => {
  // 使用相对路径，依赖 baseURL ('/api')
  let url = '/posts'; // <--- 修改为相对路径
  if (searchTerm && String(searchTerm).trim()) {
    // 将搜索词附加为查询参数
    url += `?search=${encodeURIComponent(String(searchTerm).trim())}`;
  }
  console.log(`[API Service] Fetching posts with relative URL: ${url}`); // Log the relative URL
  // 注意：这里调用 apiClient.get 时，Axios 会自动拼接 baseURL
  return callApi(() => apiClient.get(url), 'fetchPosts'); // <--- 使用相对路径 url
};

export const fetchPostById = (id) => {
  // 对于 ID 查询，也用相对路径
  const url = `/posts/${id}`; // <--- 修改为相对路径
  console.log(`[API Service] Fetching post by ID with relative URL: ${url}`);
  return callApi(() => apiClient.get(url), 'fetchPostById'); // <--- 使用相对路径 url
};

export const createPost = (postData) => {
  console.log(`[API Service] Creating new post...`);
  // createPost 路径已经是相对的 ('/posts')，不需要修改，依赖 baseURL
  return callApi(() => apiClient.post('/posts', postData), 'createPost'); // 确认是相对路径
};

export const deletePost = (id) => {
  console.log(`[API Service] Deleting post ID: ${id}`);
  // deletePost 路径也应是相对的，依赖 baseURL
  const url = `/posts/${id}`; // <--- 确认是相对路径
  return callApi(() => apiClient.delete(url), 'deletePost'); // <--- 使用相对路径 url
};

// 图片上传
// 注意: formData 应该在调用此函数之前构建好
// uploadImage 路径已经是相对的 ('/upload/image')，不需要修改，依赖 baseURL
export const uploadImage = (formData) => callApi(apiClient.post, 'uploadImage', '/upload/image', formData);

// AI 相关
// chatCompletion 路径已经是相对的 ('/ai/chat')，不需要修改，依赖 baseURL
export const chatCompletion = (payload) => {
  // 添加日志并确认格式
  console.log(`[API Service] Sending chat completion request:`, payload);
  return callApi(() => apiClient.post('/ai/chat', payload), 'chatCompletion');
};

// 新增：获取系统提示
export const getSystemPrompt = () => callApi(apiClient.get, 'getSystemPrompt', '/ai/system-prompt');

// 每日喵语相关
export const getDailyFortune = () => {
  console.log(`[API Service] Fetching daily fortune...`);
  return callApi(() => apiClient.get('/fortune'), 'getDailyFortune');
};

// triggerManualFortune 路径已经是相对的 ('/fortune/manual-trigger')，不需要修改，依赖 baseURL
export const triggerManualFortune = (password) => {
  const functionName = 'triggerManualFortune';
  const url = '/fortune/manual-trigger';
  const data = { password };
  // 定义包含超时的配置对象
  const config = { timeout: 1000000 }; // 60 秒超时

  // 将 apiClient.post(url, data, config) 整体作为一个函数传递给 callApi
  return callApi(() => apiClient.post(url, data, config), functionName);
};

// News 相关 (如果需要的话)
// fetchNewsSummaries 路径已经是相对的 ('/news')，不需要修改，依赖 baseURL
export const fetchNewsSummaries = () => callApi(apiClient.get, 'fetchNewsSummaries', '/news');
// export const getNewsConfig = () => apiClient.get('/news/config');
// export const updateNewsConfig = (config) => apiClient.post('/news/config', config);
// export const triggerNewsFetch = (password) => apiClient.post('/news/trigger', { password });

// --- 评论相关 API ---

// 获取指定帖子的评论
export const getComments = (postId) => {
  const functionName = 'getComments';
  const url = `/posts/${postId}/comments`; // Use the nested route defined in server.js
  console.log(`[API Service] Fetching comments for post ID: ${postId} using URL: ${url}`);
  return callApi(() => apiClient.get(url), functionName);
};

// 为指定帖子添加评论
export const addComment = (postId, commentData) => {
  const functionName = 'addComment';
  const url = `/posts/${postId}/comments`; // Use the nested route
  // commentData should be an object like { content: "...", parent_comment_id: ... (optional) }
  console.log(`[API Service] Adding comment to post ID: ${postId} with data:`, commentData);
  return callApi(() => apiClient.post(url, commentData), functionName);
};

// --- 现有评论 API (旧的，已注释掉) ---
/*
// Comment API calls (Old?)
// fetchComments 路径已经是相对的 ('/comments/post/:postId')，不需要修改，依赖 baseURL
export const fetchComments = (postId) => {
  console.log(`[API Service] Fetching comments for post ID: ${postId}`);
  const url = `/comments/post/${postId}`; // <--- 确认是相对路径
  return callApi(() => apiClient.get(url), 'fetchComments'); // <--- 使用相对路径 url
};

// addComment 路径已经是相对的 ('/comments/post/:postId')，不需要修改，依赖 baseURL
export const addComment = (postId, commentData) => {
  console.log(`[API Service] Adding comment to post ID: ${postId}...`);
  const url = `/comments/post/${postId}`; // <--- 确认是相对路径
  return callApi(() => apiClient.post(url, commentData), 'addComment'); // <--- 使用相对路径 url
};

// deleteComment 路径已经是相对的 ('/comments/:commentId')，不需要修改，依赖 baseURL
export const deleteComment = (commentId) => {
  console.log(`[API Service] Deleting comment ID: ${commentId}`);
  const url = `/comments/${commentId}`; // <--- 确认是相对路径
  return callApi(() => apiClient.delete(url), 'deleteComment'); // <--- 使用相对路径 url
};
*/

// --- 聊天会话相关 API ---

// 获取用户的聊天会话列表
export const getUserChatSessions = () => callApi(apiClient.get, 'getUserChatSessions', '/chat/sessions');

// 创建新的聊天会话
export const createChatSession = (data) => callApi(apiClient.post, 'createChatSession', '/chat/sessions', data);

// 获取会话的消息历史
export const getChatSessionMessages = (sessionId) => callApi(apiClient.get, 'getChatSessionMessages', `/chat/sessions/${sessionId}/messages`);

// 发送消息到会话 - 关键API使用聊天专用重试机制
export const sendChatMessage = async (sessionId, message, settings = {}) => {
  return await chatRetry.executeWithRetry(async () => {
    return callApi(apiClient.post, 'sendChatMessage', `/chat/sessions/${sessionId}/messages`, { 
      message,
      ...settings, // Include model, temperature, maxTokens, systemPrompt 
    });
  }, '发送聊天消息');
};

// 删除聊天会话
export const deleteChatSession = (sessionId) => callApi(apiClient.delete, 'deleteChatSession', `/chat/sessions/${sessionId}`);

// --- 任务状态相关 API (重试优化) ---

// 获取单个任务状态 - 使用默认重试
export const getTaskStatus = async (taskId) => {
  return await defaultRetry.executeWithRetry(async () => {
    return callApi(apiClient.get, 'getTaskStatus', `/tasks/${taskId}`);
  }, '获取任务状态');
};

// 批量获取任务状态 - 使用批量查询专用重试机制
export const batchGetTasksStatus = async (taskIds) => {
  return await batchQueryRetry.executeWithRetry(async () => {
    return callApi(apiClient.post, 'batchGetTasksStatus', '/tasks/batch', { taskIds });
  }, '批量查询任务状态');
};

// 语音服务API
export const voice = {
  // 文本到语音转换
  tts: (text, speakerId = 46, messageId = '') => {
    return callApi(apiClient.post, 'voice.tts', '/voice/tts', {
      text,
      speaker_id: speakerId,
      message_id: messageId || `msg-${Date.now()}`,
      bypass_cache: false
    });
  },
  
  // 文本翻译
  translate: (text, messageId = '') => {
    return callApi(apiClient.post, 'voice.translate', '/voice/translate', {
      text,
      message_id: messageId || `msg-${Date.now()}`,
      bypass_cache: false
    });
  },
  
  // 获取说话人列表
  getSpeakers: () => {
    return callApi(apiClient.get, 'voice.getSpeakers', '/voice/speakers');
  },
  
  // 语音服务健康检查
  healthCheck: () => {
    return callApi(apiClient.get, 'voice.healthCheck', '/voice/health');
  }
};

export default apiClient; // 也可以默认导出实例，方便直接使用 