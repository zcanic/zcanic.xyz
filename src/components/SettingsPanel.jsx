import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui';
import { X, RotateCcw } from 'lucide-react';
import { CHAT_SYSTEM_PROMPT } from '../config/prompts';
import { useToast } from '../hooks/useToast';
import { useChat } from '../context/ChatContext';
import { getSystemPrompt } from '../services/api';

// Define default settings structure focused on Chat AI
const defaultPanelSettings = {
  model: 'deepseek-ai/DeepSeek-R1',
  temperature: 0.7,
  maxTokens: 2000,
  systemPrompt: ''
};

function SettingsPanel({
  settings,
  onSettingsChange,
  isVisible,
  onClose,
  sessionId = null,
}) {
  console.log('[SettingsPanel] Render. isVisible:', isVisible);
  const { addToast } = useToast();
  const { saveSessionSettings, getCurrentSessionSettings } = useChat();

  // 添加移动设备检测
  const [isMobile, setIsMobile] = useState(false);
  
  // 检测设备屏幕尺寸
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 640); // 640px是tailwind的sm断点
    };
    
    checkIsMobile(); // 初始检查
    window.addEventListener('resize', checkIsMobile); // 监听窗口大小变化
    
    return () => {
      window.removeEventListener('resize', checkIsMobile); // 清除监听器
    };
  }, []);

  // 新增：从API获取系统提示的状态
  const [defaultSystemPrompt, setDefaultSystemPrompt] = useState(CHAT_SYSTEM_PROMPT);
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(false);
  const [promptError, setPromptError] = useState('');

  // 新增：从API获取默认系统提示
  useEffect(() => {
    if (isVisible) {
      setIsLoadingPrompt(true);
      setPromptError('');
      
      const fetchSystemPrompt = async () => {
        try {
          const response = await getSystemPrompt();
          if (response.data && response.data.systemPrompt) {
            console.log('[SettingsPanel] 成功从API获取系统提示');
            setDefaultSystemPrompt(response.data.systemPrompt);
          } else {
            console.warn('[SettingsPanel] API返回的系统提示格式不正确');
            setPromptError('获取系统提示失败：格式不正确');
          }
        } catch (error) {
          console.error('[SettingsPanel] 从API获取系统提示失败:', error);
          setPromptError('获取系统提示失败，使用默认值');
          // 失败时保留使用默认的本地提示
        } finally {
          setIsLoadingPrompt(false);
        }
      };
      
      fetchSystemPrompt();
    }
  }, [isVisible]);

  // Initialize internal state for Chat AI settings
  const [tempSettings, setTempSettings] = useState(() => {
    const initial = {
      ...defaultPanelSettings,
      ...(settings?.model !== undefined && { model: settings.model }),
      ...(settings?.temperature !== undefined && { temperature: settings.temperature }),
      ...(settings?.maxTokens !== undefined && { maxTokens: settings.maxTokens }),
      ...(settings?.systemPrompt !== undefined && { systemPrompt: settings.systemPrompt }),
    };
    console.log('[SettingsPanel] Initializing tempSettings state:', initial);
    return initial;
  });

  const [isMaxTokensInfinite, setIsMaxTokensInfinite] = useState(() => {
    const initial = (tempSettings.maxTokens === null) || (tempSettings.maxTokens === undefined);
    console.log('[SettingsPanel] Initializing isMaxTokensInfinite state:', initial);
    return initial;
  });
  
  // State only for chat settings feedback
  const [isSavingChatSettings, setIsSavingChatSettings] = useState(false);
  const [saveStatus, setSaveStatus] = useState({ message: '', type: '' });
  
  // 是否为会话特定设置
  const [isSessionSpecific, setIsSessionSpecific] = useState(!!sessionId);

  // Effect to sync internal state if props change (especially when opening)
  useEffect(() => {
    console.log('[SettingsPanel][useEffect Sync] Running. isVisible:', isVisible);
    if (isVisible && settings) {
      const { model, temperature, maxTokens, systemPrompt } = settings;
      const mergedSettings = {
         ...defaultPanelSettings,
         ...(model !== undefined && { model }),
         ...(temperature !== undefined && { temperature }),
         ...(maxTokens !== undefined && { maxTokens }),
         ...(systemPrompt !== undefined && { systemPrompt }),
      };
      console.log('[SettingsPanel][useEffect Sync] Syncing tempSettings with received settings:', mergedSettings);
      setTempSettings(mergedSettings);
      const infinite = (mergedSettings.maxTokens === null) || (mergedSettings.maxTokens === undefined);
      console.log('[SettingsPanel][useEffect Sync] Syncing isMaxTokensInfinite:', infinite);
      setIsMaxTokensInfinite(infinite);
      console.log('[SettingsPanel][useEffect Sync] Clearing save status.');
      setSaveStatus({ message: '', type: '' });
      
      // 设置是否为会话特定设置
      setIsSessionSpecific(!!sessionId);
    }
  }, [isVisible, settings, sessionId]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    console.log(`[SettingsPanel] Input change: name=${name}, value=${value}, type=${type}, checked=${checked}`);

    if (name === 'isMaxTokensInfinite') {
      const isInfinite = checked;
      console.log(`[SettingsPanel] Updating isMaxTokensInfinite to: ${isInfinite}`);
      setIsMaxTokensInfinite(isInfinite);
      setTempSettings(prev => {
        const newMaxTokens = isInfinite 
            ? null 
            : ((prev.maxTokens === null || prev.maxTokens === undefined) ? defaultPanelSettings.maxTokens : prev.maxTokens);
        console.log(`[SettingsPanel] Updating tempSettings.maxTokens based on checkbox: ${newMaxTokens}`);
        return { ...prev, maxTokens: newMaxTokens };
      });
    } else if (name === 'isSessionSpecific') {
      setIsSessionSpecific(checked);
    } else {
      let processedValue = value;
      if (type === 'number' && name === 'maxTokens') { 
          processedValue = value === '' ? '' : parseInt(value, 10);
          if (processedValue !== '' && (isNaN(processedValue) || processedValue <= 0)) {
              processedValue = defaultPanelSettings.maxTokens; 
          }
          if (processedValue !== '') {
              console.log('[SettingsPanel] Max Tokens input changed, setting isMaxTokensInfinite to false.');
              setIsMaxTokensInfinite(false);
          }
      } else if (type === 'number') {
        processedValue = value === '' ? '' : parseInt(value, 10);
      } else if (type === 'range') {
        processedValue = parseFloat(value);
      }
      console.log(`[SettingsPanel] Updating tempSettings.${name} to:`, processedValue);
      setTempSettings(prev => ({ ...prev, [name]: processedValue }));
    }
  };

  // Save Handler for Chat Settings
  const handleSave = () => {
    console.log('[SettingsPanel] handleSave triggered.');
    setSaveStatus({ message: '', type: '' });
    console.log('[SettingsPanel] Setting isSavingChatSettings to true.');
    setIsSavingChatSettings(true);
    
    const chatSettingsToSave = { ...tempSettings };
    if (isMaxTokensInfinite || chatSettingsToSave.maxTokens === '') {
      chatSettingsToSave.maxTokens = null;
    } else {
      const mt = parseInt(chatSettingsToSave.maxTokens, 10);
      chatSettingsToSave.maxTokens = isNaN(mt) || mt <= 0 ? null : mt; 
    }
    const finalChatSettings = {
        model: chatSettingsToSave.model,
        temperature: chatSettingsToSave.temperature,
        maxTokens: chatSettingsToSave.maxTokens,
        systemPrompt: chatSettingsToSave.systemPrompt,
    }
    console.log('[SettingsPanel] Processed settings to save:', finalChatSettings);
    
    try {
      console.log('[SettingsPanel] Calling onSettingsChange callback...');
      onSettingsChange(finalChatSettings);
      
      // 如果启用了会话特定设置并且有会话ID，保存到会话特定设置
      if (isSessionSpecific && sessionId) {
        saveSessionSettings(sessionId, finalChatSettings);
        console.log(`[SettingsPanel] Saved session-specific settings for session: ${sessionId}`);
      }
      
      console.log('[SettingsPanel] onSettingsChange callback finished. Setting success status.');
      setSaveStatus({ message: 'AI助手设置已保存！', type: 'success' });
      console.log('[SettingsPanel] Scheduling panel close.');
      setTimeout(() => {
        console.log('[SettingsPanel] Closing panel via onClose callback.');
        onClose();
      }, 1000);
    } catch (error) {
      console.error('[SettingsPanel] Error during onSettingsChange callback:', error);
      setSaveStatus({ message: `保存设置失败: ${error?.message || '未知错误'}`, type: 'error' });
    }
    
    console.log('[SettingsPanel] Setting isSavingChatSettings to false.');
    setIsSavingChatSettings(false);
  };

  // Handler to reset the system prompt to default
  const handleResetPrompt = () => {
    setTempSettings(prev => ({
        ...prev,
        systemPrompt: defaultSystemPrompt
    }));
    addToast('系统提示已恢复为默认设置', 'success');
  };

  const handleClose = () => {
    console.log('[SettingsPanel] Close button clicked, calling onClose.');
    onClose();
  }

  // Animation variants
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { 
        duration: 0.2
      } 
    }
  };
  
  const panelVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.3
      }
    },
    exit: {
      opacity: 0,
      transition: { 
        duration: 0.2
      }
    }
  };

  if (!isVisible) return null;

  const displayTemp = tempSettings?.temperature ?? defaultPanelSettings.temperature;
  const displayMaxTokens = tempSettings?.maxTokens ?? '';

  // 在组件的最后部分，在现有UI中添加会话特定设置选项
  const renderSessionSpecificOption = () => {
    if (!sessionId) return null;
    
    return (
      <div className="mt-4 flex items-center">
        <input
          type="checkbox"
          id="isSessionSpecific"
          name="isSessionSpecific"
          className="mr-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          checked={isSessionSpecific}
          onChange={handleInputChange}
        />
        <label htmlFor="isSessionSpecific" className="text-sm font-medium text-slate-700 dark:text-slate-300">
          仅为当前会话保存这些设置
        </label>
      </div>
    );
  };

  return (
    <AnimatePresence mode="sync">
      <motion.div 
        className="fixed inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
      >
        <motion.div 
          className="w-full max-w-md bg-white/40 dark:bg-slate-800/40 backdrop-blur-2xl rounded-2xl shadow-xl border border-white/40 dark:border-slate-700/40 overflow-hidden"
          variants={panelVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Panel header */}
          <div className="flex justify-between items-center px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10 dark:border-slate-700/30 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">设置</h2>
            <button 
              onClick={onClose}
              className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 focus:outline-none"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-4 sm:p-6">
            {/* Save Status */}
            {saveStatus.message && (
              <div className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl text-xs sm:text-sm backdrop-blur-sm ${
                saveStatus.type === 'error' 
                  ? 'bg-red-100/80 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/30' 
                  : 'bg-green-100/80 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800/30'
              }`}>
                {saveStatus.message}
              </div>
            )}

            <div className="space-y-6">
              {/* Model Input */}
              <div className="space-y-2">
                <label htmlFor="model" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  AI 模型
                </label>
                <input
                  type="text"
                  id="model"
                  name="model"
                  value={tempSettings?.model ?? ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl bg-white/70 dark:bg-slate-700/70 backdrop-blur-sm 
                            text-slate-900 dark:text-white border-2 border-slate-200 dark:border-slate-600 
                            focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30
                            focus:outline-none transition-all"
                  placeholder="例如: deepseek-ai/DeepSeek-R1"
                />
              </div>

              {/* Temperature Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="temperature" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    随机性 (Temperature)
                  </label>
                  <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                    {displayTemp.toFixed(1)}
                  </span>
                </div>
                <input
                  type="range"
                  id="temperature"
                  name="temperature"
                  min="0"
                  max="1"
                  step="0.1"
                  value={displayTemp}
                  onChange={handleInputChange}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer 
                             [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4
                             [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-600 [&::-webkit-slider-thumb]:dark:bg-indigo-500"
                />
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
                  <span>精确</span>
                  <span>创意</span>
                </div>
              </div>

              {/* Max Tokens */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="maxTokens" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    最大令牌数 (Max Tokens)
                  </label>
                  <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                    {isMaxTokensInfinite ? '无限制' : (displayMaxTokens || '默认')}
                  </span>
                </div>
                
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    id="maxTokens"
                    name="maxTokens"
                    value={isMaxTokensInfinite ? '' : displayMaxTokens}
                    onChange={handleInputChange}
                    disabled={isMaxTokensInfinite}
                    className="w-full px-4 py-3 rounded-xl bg-white/70 dark:bg-slate-700/70 backdrop-blur-sm 
                              text-slate-900 dark:text-white border-2 border-slate-200 dark:border-slate-600 
                              focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30
                              focus:outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    placeholder="例如: 2000"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isMaxTokensInfinite"
                      name="isMaxTokensInfinite"
                      checked={isMaxTokensInfinite}
                      onChange={handleInputChange}
                      className="h-5 w-5 rounded-md border-2 border-slate-300 dark:border-slate-600 text-indigo-600
                                focus:ring-2 focus:ring-indigo-500/30 focus:ring-offset-0"
                    />
                    <label htmlFor="isMaxTokensInfinite" className="text-sm text-slate-600 dark:text-slate-400">
                      无限制
                    </label>
                  </div>
                </div>
              </div>

              {/* System Prompt Field - Special treatment with full width and reset */}
              <div className="space-y-2 col-span-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="systemPrompt" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    系统提示词
                  </label>
                  
                  <div className="flex items-center space-x-2">
                    {isLoadingPrompt && (
                      <span className="hidden xs:inline text-xs text-slate-500 dark:text-slate-400">加载中...</span>
                    )}
                    {promptError && (
                      <span className="text-xs text-red-500 max-w-[100px] sm:max-w-none truncate">{promptError}</span>
                    )}
                    <button
                      onClick={handleResetPrompt}
                      className="flex items-center space-x-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
                      type="button"
                      disabled={isLoadingPrompt}
                    >
                      <RotateCcw className={`h-3 w-3 ${isLoadingPrompt ? 'animate-spin' : ''}`} />
                      <span className="hidden xs:inline">重置</span>
                    </button>
                  </div>
                </div>
                <textarea
                  id="systemPrompt"
                  name="systemPrompt"
                  rows={isMobile ? 4 : 6}
                  value={tempSettings?.systemPrompt ?? ''}
                  onChange={handleInputChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl bg-white/70 dark:bg-slate-700/70 backdrop-blur-sm 
                            text-slate-900 dark:text-white border-2 border-slate-200 dark:border-slate-600 
                            focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30
                            focus:outline-none transition-all text-xs sm:text-sm font-mono"
                  placeholder="输入系统提示词以控制AI助手的行为..."
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  系统提示词用于定义AI助手的行为、知识和限制。
                </p>
              </div>
            </div>
            
            {/* 会话特定设置选项 */}
            {renderSessionSpecificOption()}

            {/* Footer with Actions */}
            <div className="mt-8 flex justify-end gap-4">
              <Button 
                variant="ghost" 
                onClick={handleClose}
              >
                取消
              </Button>
              <Button 
                variant="gradient" 
                onClick={handleSave}
                isLoading={isSavingChatSettings}
              >
                保存设置
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default SettingsPanel; 