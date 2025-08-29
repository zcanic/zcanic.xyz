import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import VoicePlayer from '../voice/VoicePlayer';

/**
 * 专用的语音聊天消息组件
 * 用于显示带翻译和语音功能的聊天消息
 */
const VoiceChatMessage = ({ message, styles }) => {
  const { content, voiceUrl, translatedText, id } = message;
  
  // 渲染代码块
  const renderCodeBlock = ({ node, inline, className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || '');
    
    return !inline && match ? (
      <SyntaxHighlighter
        style={oneDark}
        language={match[1]}
        PreTag="div"
        {...props}
      >
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
    ) : (
      <code className={className} {...props}>
        {children}
      </code>
    );
  };

  return (
    <div className={`voice-chat-message ${styles?.bubble}`}>
      {/* 原始消息内容 */}
      <div className="whitespace-pre-wrap break-words">
        <ReactMarkdown
          components={{
            code: renderCodeBlock,
            // 额外支持换行符
            p: ({ children }) => <p className="mb-2">{children}</p>
          }}
          linkTarget="_blank"
        >
          {content}
        </ReactMarkdown>
      </div>
      
      {/* 翻译内容（如果有） */}
      {translatedText && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-1">
            <span className="text-xs text-indigo-500 dark:text-indigo-400">
              日语翻译
            </span>
            
            {/* 语音播放按钮 */}
            {voiceUrl && (
              <div className="ml-2">
                <VoicePlayer 
                  text={content}
                  messageId={id}
                  autoplay={false}
                  className="bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/60"
                />
              </div>
            )}
          </div>
          
          <div className="text-sm text-gray-800 dark:text-gray-200 italic">
            {translatedText}
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceChatMessage; 