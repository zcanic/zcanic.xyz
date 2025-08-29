import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CHAT_SYSTEM_PROMPT } from '../config/prompts'; // <-- Import the constant
import { getSystemPrompt } from '../services/api'; // 新增：导入获取系统提示的API函数
// No direct API calls needed here for now, API calls happen in ChatInterface

// 更新聊天功能的默认 System Prompt
// const DEFAULT_SYSTEM_PROMPT = `... [Original long string removed for brevity] ...`; // <-- Remove the old definition

const ChatContext = createContext();

// 默认设置
const DEFAULT_SETTINGS = {
  model: 'deepseek-ai/DeepSeek-R1',
  temperature: 0.7,
  maxTokens: 2000,
  systemPrompt: CHAT_SYSTEM_PROMPT // 初始使用本地提示，后续从API获取
};

export function ChatProvider({ children }) {
  // 全局默认AI设置
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  
  // 按会话ID存储的设置
  const [sessionSettings, setSessionSettings] = useState({});
  
  // 当前会话ID
  const [currentSessionId, setCurrentSessionId] = useState(null);
  
  // 聊天消息状态
  const [messages, setMessages] = useState([]);

  // 新增：从API获取系统提示
  useEffect(() => {
    console.log('[ChatContext] 从API获取系统提示...');
    const fetchSystemPrompt = async () => {
      try {
        const response = await getSystemPrompt();
        if (response.data && response.data.systemPrompt) {
          console.log('[ChatContext] 成功从API获取系统提示');
          
          // 更新全局设置中的系统提示
          setSettings(prev => ({
            ...prev,
            systemPrompt: response.data.systemPrompt
          }));
          
          // 保存到localStorage
          localStorage.setItem('systemPrompt', response.data.systemPrompt);
        } else {
          // 添加：处理响应格式不正确的情况
          console.warn('[ChatContext] API返回的系统提示格式不正确，使用默认提示');
        }
      } catch (error) {
        console.error('[ChatContext] 从API获取系统提示失败:', error);
        // 增强错误处理：记录更详细的错误信息
        const errorMessage = error.response ? 
          `状态码: ${error.response.status}, 消息: ${error.response.data?.message || '未知错误'}` : 
          error.message || '网络错误';
        console.error(`[ChatContext] 详细错误: ${errorMessage}`);
        
        // 失败时保留使用默认的本地提示，并通知用户（可选）
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[ChatContext] 开发环境：使用本地默认提示作为回退');
        }
      }
    };
    
    fetchSystemPrompt();
  }, []);

  // 加载全局默认设置
  useEffect(() => {
    console.log('[ChatContext] Loading global chat settings...');
    try {
      const savedModel = localStorage.getItem('model');
      const savedTemperature = localStorage.getItem('temperature');
      const savedMaxTokens = localStorage.getItem('maxTokens');
      const savedSystemPrompt = localStorage.getItem('systemPrompt');
      
      setSettings(prev => ({
        ...prev,
        model: savedModel || prev.model,
        temperature: savedTemperature ? parseFloat(savedTemperature) : prev.temperature,
        maxTokens: savedMaxTokens === 'null' ? null : (savedMaxTokens ? parseInt(savedMaxTokens, 10) : prev.maxTokens),
        systemPrompt: savedSystemPrompt !== null ? savedSystemPrompt : prev.systemPrompt
      }));
      console.log('[ChatContext] Global chat settings loaded.');
    } catch (error) {
      console.error('[ChatContext] Error loading chat settings from localStorage:', error);
    }
  }, []);

  // 加载按会话存储的设置
  useEffect(() => {
    console.log('[ChatContext] Loading session-specific settings...');
    try {
      const savedSessionSettings = localStorage.getItem('sessionSettings');
      if (savedSessionSettings) {
        setSessionSettings(JSON.parse(savedSessionSettings));
        console.log('[ChatContext] Session-specific settings loaded.');
      }
    } catch (error) {
      console.error('[ChatContext] Error loading session settings from localStorage:', error);
    }
  }, []);

  // 保存全局默认设置
  useEffect(() => {
    try {
      localStorage.setItem('model', settings.model);
      localStorage.setItem('temperature', String(settings.temperature));
      localStorage.setItem('maxTokens', settings.maxTokens === null ? 'null' : String(settings.maxTokens));
      localStorage.setItem('systemPrompt', settings.systemPrompt);
      console.log('[ChatContext] Global chat settings saved to localStorage.');
    } catch (error) {
      console.error('[ChatContext] Error saving chat settings to localStorage:', error);
    }
  }, [settings]);

  // 保存按会话的设置
  useEffect(() => {
    try {
      localStorage.setItem('sessionSettings', JSON.stringify(sessionSettings));
      console.log('[ChatContext] Session-specific settings saved to localStorage.');
    } catch (error) {
      console.error('[ChatContext] Error saving session settings to localStorage:', error);
    }
  }, [sessionSettings]);

  // 获取当前会话的设置（如果有特定设置则使用，否则使用全局设置）
  const getCurrentSessionSettings = useCallback(() => {
    if (currentSessionId && sessionSettings[currentSessionId]) {
      return sessionSettings[currentSessionId];
    }
    return settings;
  }, [currentSessionId, sessionSettings, settings]);

  // 为指定会话保存设置
  const saveSessionSettings = useCallback((sessionId, newSettings) => {
    if (!sessionId) return;
    
    console.log(`[ChatContext] Saving settings for session ${sessionId}:`, newSettings);
    setSessionSettings(prev => ({
      ...prev,
      [sessionId]: { ...newSettings }
    }));
  }, []);

  // 设置当前活动会话
  const setActiveSession = useCallback((sessionId) => {
    console.log(`[ChatContext] Setting active session: ${sessionId}`);
    setCurrentSessionId(sessionId);
  }, []);

  // 保存全局默认设置
  const saveSettings = useCallback((settingsToSave) => {
    console.log('[ChatContext] Saving global settings:', settingsToSave);
    const { apiKey, ...rest } = settingsToSave; 
    setSettings(prev => ({ ...prev, ...rest }));
  }, []);

  const addMessage = useCallback((message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const clearChatHistory = useCallback(() => {
    setMessages([]);
    console.log('[ChatContext] Chat history cleared.');
  }, []);

  const value = {
    settings,                  // 全局默认设置
    saveSettings,              // 保存全局设置
    sessionSettings,           // 所有会话特定设置
    currentSessionId,          // 当前活动会话ID
    setActiveSession,          // 设置当前活动会话
    getCurrentSessionSettings, // 获取当前会话设置
    saveSessionSettings,       // 为特定会话保存设置
    messages,                  // 聊天消息数组
    addMessage,                // 添加消息
    clearChatHistory,          // 清除聊天历史
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

// Custom hook
export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
} 