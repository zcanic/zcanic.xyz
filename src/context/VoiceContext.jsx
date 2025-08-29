import React, { createContext, useState, useContext, useEffect } from 'react';
import { voice } from '../services/api';

// 创建上下文
const VoiceContext = createContext();

// 默认设置
const DEFAULT_SETTINGS = {
  enabled: true,           // 是否启用语音
  speakerId: 46,           // 默认说话人ID
  autoplay: false,         // 是否自动播放
  volume: 0.8,             // 音量 (0-1)
};

// 本地存储键
const STORAGE_KEY = 'zcanic_voice_settings';

/**
 * 语音设置提供者组件
 */
export const VoiceProvider = ({ children }) => {
  // 状态
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [speakers, setSpeakers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [serviceStatus, setServiceStatus] = useState({ 
    available: false, 
    lastChecked: null 
  });

  // 初始化 - 从本地存储加载设置
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem(STORAGE_KEY);
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(prevSettings => ({
          ...prevSettings,
          ...parsedSettings
        }));
      }
    } catch (error) {
      console.error('加载语音设置失败:', error);
    }
  }, []);

  // 保存设置到本地存储
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('保存语音设置失败:', error);
    }
  }, [settings]);

  // 更新设置
  const updateSettings = (newSettings) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      ...newSettings
    }));
  };

  // 检查语音服务可用性
  const checkServiceAvailability = async () => {
    try {
      setIsLoading(true);
      const response = await voice.healthCheck();
      
      // 服务状态更新
      setServiceStatus({
        available: response.data.status === 'healthy',
        lastChecked: new Date(),
        details: response.data
      });
      
      return response.data.status === 'healthy';
    } catch (error) {
      console.error('语音服务检查失败:', error);
      setServiceStatus({
        available: false,
        lastChecked: new Date(),
        error: error.message
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // 加载说话人列表
  const loadSpeakers = async () => {
    try {
      setIsLoading(true);
      const response = await voice.getSpeakers();
      
      if (response.data.success && response.data.speakers) {
        setSpeakers(response.data.speakers);
      }
    } catch (error) {
      console.error('获取说话人列表失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 初始化时检查服务可用性和加载说话人列表
  useEffect(() => {
    const initialize = async () => {
      const isAvailable = await checkServiceAvailability();
      if (isAvailable) {
        await loadSpeakers();
      }
    };
    
    initialize();
    
    // 每小时检查一次服务可用性
    const interval = setInterval(checkServiceAvailability, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // 导出上下文值
  const contextValue = {
    settings,
    updateSettings,
    speakers,
    loadSpeakers,
    isLoading,
    serviceStatus,
    checkServiceAvailability
  };

  return (
    <VoiceContext.Provider value={contextValue}>
      {children}
    </VoiceContext.Provider>
  );
};

// 自定义钩子，用于在组件中访问上下文
export const useVoice = () => {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error('useVoice必须在VoiceProvider内使用');
  }
  return context;
};

export default VoiceContext; 