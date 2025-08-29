import React, { useState, useEffect, useRef } from 'react';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import SettingsPanel from '../SettingsPanel';
import { useChat } from '../../context/ChatContext';
import { useTheme } from '../../context/ThemeContext';
import { Settings, MessageSquare, Mic } from 'lucide-react';

function ChatInterface({ messages, onSendMessage, isLoading, sessionId }) {
  const { settings, saveSettings, getCurrentSessionSettings } = useChat();
  const { isDarkMode } = useTheme();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [chatMode, setChatMode] = useState('normal');
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const prevMessagesLengthRef = useRef(messages.length);
  const isKeyboardVisible = useRef(false);

  // 获取当前会话的设置（如果有特定设置则使用，否则使用全局设置）
  const currentSettings = getCurrentSessionSettings ? getCurrentSessionSettings() : settings;
  
  // 记录当前使用的设置，便于调试
  useEffect(() => {
    if (sessionId && currentSettings) {
      console.log(`[ChatInterface] 当前会话(${sessionId})使用的设置:`, {
        model: currentSettings.model,
        temperature: currentSettings.temperature,
        maxTokens: currentSettings.maxTokens !== undefined ? 
          (currentSettings.maxTokens === null ? '无限制' : currentSettings.maxTokens) : '未设置',
        systemPromptLength: currentSettings.systemPrompt?.length || 0
      });
    }
  }, [sessionId, currentSettings]);

  // 获取会话模式
  useEffect(() => {
    if (messages.length > 0 && messages[0]?.sessionMode) {
      setChatMode(messages[0].sessionMode);
    }
  }, [messages]);

  // 设置面板处理
  const handleSaveSettingsPanel = (newSettingsFromPanel) => {
    console.log('[ChatInterface] 保存设置:', newSettingsFromPanel);
    saveSettings(newSettingsFromPanel);
    setIsSettingsOpen(false);
  };

  const handleInputChange = (e) => {
    setUserInput(e.target.value);
  };

  const handleSend = (message) => {
    if (!message.trim() || isLoading || !sessionId) {
      return;
    }

    onSendMessage(message);
    setUserInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(userInput);
    }
  };

  // 只在新消息添加时或者虚拟键盘出现时滚动到底部
  useEffect(() => {
    const handleResize = () => {
      // 检测可能的虚拟键盘事件 - 使用视口高度变化作为指示
      const isKeyboardNowVisible = window.innerHeight < window.outerHeight * 0.8;
      
      // 只有当键盘状态变化时才滚动
      if (isKeyboardNowVisible !== isKeyboardVisible.current) {
        isKeyboardVisible.current = isKeyboardNowVisible;
        
        // 当键盘出现时滚动到底部
        if (isKeyboardNowVisible && messagesContainerRef.current) {
          setTimeout(() => {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
          }, 300); // 给键盘一点时间完全打开
        }
      }
    };

    // 当消息数量变化时，滚动到底部
    if (messages.length > prevMessagesLengthRef.current && messagesContainerRef.current) {
      setTimeout(() => {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }, 100);
    }
    
    prevMessagesLengthRef.current = messages.length;

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [messages]);

  // Calculate background styles based on theme
  const headerBgClass = isDarkMode 
    ? 'bg-slate-800/95' 
    : 'bg-white/95';
    
  const contentBgClass = isDarkMode 
    ? 'bg-slate-900/90' 
    : 'bg-white/90';
    
  const inputBgClass = isDarkMode 
    ? 'bg-slate-800/95' 
    : 'bg-white/95';

  return (
    <div className="relative h-full w-full max-w-7xl mx-auto flex flex-col px-2 sm:px-4 py-2 sm:py-6">
      <div className="z-10 flex flex-col h-full rounded-2xl overflow-hidden shadow-xl border bg-white/80 dark:bg-slate-800/90 border-white/20 dark:border-slate-700/50 backdrop-blur-sm">
        {/* Chat header - Fixed at top with z-index */}
        <div className={`sticky top-0 flex justify-between items-center px-3 sm:px-6 py-2.5 sm:py-4 border-b border-slate-200/50 dark:border-slate-700/70 ${headerBgClass} backdrop-blur-md z-30`}>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center shadow-md">
              {chatMode === 'voice' ? (
                <Mic className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              ) : (
                <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              )}
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {chatMode === 'voice' ? 'zcanic 语音模式' : 'zcanic'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {chatMode === 'voice' ? '中文输入 + 日语语音回复' : 'customized ai catgirl'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-xl text-slate-500 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400 focus:outline-none transition-colors"
              title="设置"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages container - Flex grow and scrollable */}
        <div 
          ref={messagesContainerRef}
          className={`flex-grow overflow-y-auto overscroll-contain p-2 sm:p-4 md:p-6 ${contentBgClass} backdrop-blur-md min-h-[50vh] sm:min-h-[60vh] z-10 pb-4 sm:pb-6`}
        >
          {sessionId ? (
            <MessageList 
              messages={messages} 
              isLoading={isLoading}
              containerRef={messagesContainerRef}
              chatMode={chatMode}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-slate-500 dark:text-slate-400">请选择一个会话或创建新会话</p>
            </div>
          )}
        </div>

        {/* Input area - Fixed at bottom with z-index */}
        <div className={`sticky bottom-0 p-2 sm:p-4 border-t border-slate-200/70 dark:border-slate-700/70 ${inputBgClass} backdrop-blur-md z-20`}>
          <ChatInput 
            ref={inputRef}
            onSend={handleSend} 
            isLoading={isLoading || !sessionId}
            value={userInput}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={!sessionId}
            isVoiceMode={chatMode === 'voice'}
          />
        </div>
      </div>

      {/* Settings Panel - 去掉动画, 直接显示或隐藏 */}
      {isSettingsOpen && (
        <SettingsPanel
          isVisible={isSettingsOpen}
          settings={currentSettings}
          onSettingsChange={handleSaveSettingsPanel}
          onClose={() => setIsSettingsOpen(false)}
          sessionId={sessionId}
        />
      )}
    </div>
  );
}

export default ChatInterface;