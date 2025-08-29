import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ThinkingIndicator from '../ui/ThinkingIndicator';
import VoiceChatMessage from './VoiceChatMessage';

/**
 * 消息列表组件 - 使用现代几何风格与磨砂玻璃效果
 */
function MessageList({ messages, isLoading, containerRef, chatMode }) {
  const messagesEndRef = useRef(null);
  const prevMessagesCountRef = useRef(messages.length);
  
  // 滚动到底部的函数
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // 当消息更新或加载状态变化时滚动到底部
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);
  
  // 当容器大小改变时也滚动到底部
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      scrollToBottom();
    });
    
    if (containerRef && containerRef.current) {
      observer.observe(containerRef.current);
    }
    
    return () => {
      if (containerRef && containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [containerRef]);
  
  // 基于消息的颜色和背景
  const getMessageStyles = (role, status) => {
    // 处理中的消息使用特殊样式
    if (status === 'pending' || status === 'processing') {
      return {
        container: 'justify-start',
        bubble: 'bg-white/60 dark:bg-slate-700/60 backdrop-blur-sm text-slate-500 dark:text-slate-400 rounded-2xl rounded-tl-sm shadow-sm border border-slate-200/50 dark:border-slate-600/30',
      };
    }
    
    switch (role) {
      case 'user':
        return {
          container: 'justify-end',
          bubble: 'bg-indigo-500/90 text-white backdrop-blur-sm rounded-2xl rounded-tr-sm shadow-md border border-indigo-400/30',
        };
      case 'assistant':
        return {
          container: 'justify-start',
          bubble: 'bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm text-slate-900 dark:text-white rounded-2xl rounded-tl-sm shadow-md border border-slate-200/50 dark:border-slate-600/30',
        };
      case 'system':
        return {
          container: 'justify-center',
          bubble: 'bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-sm text-slate-700 dark:text-slate-300 rounded-xl shadow-sm border border-slate-200/50 dark:border-slate-700/30',
        };
      default:
        return {
          container: 'justify-start',
          bubble: 'bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm text-slate-900 dark:text-white rounded-2xl rounded-tl-sm shadow-md border border-slate-200/50 dark:border-slate-600/30',
        };
    }
  };

  // 处理消息内容的渲染，添加加载动画
  const renderMessageContent = (message) => {
    if (message.status === 'pending' || message.status === 'processing') {
      return <ThinkingIndicator />;
    }
    
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
    
    // 检查消息内容是否包含Markdown语法或思考标签
    const hasMarkdown = /(\*\*|__|~~|```|\[.*\]\(.*\)|#+ |>|<think>|💭|\*思考过程|\`)/g.test(message.content);
    
    if (hasMarkdown) {
      // 使用ReactMarkdown渲染含有Markdown的内容
      return (
        <div className="markdown-content prose dark:prose-invert prose-sm sm:prose-base max-w-none">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              code: renderCodeBlock,
              // 自定义思考过程块样式
              p(props) {
                const text = props.children?.toString() || '';
                if (text.startsWith('💭') || text.includes('*思考过程*')) {
                  return (
                    <div className="thinking-block bg-indigo-50 dark:bg-indigo-900/30 border-l-4 border-indigo-400 dark:border-indigo-600 p-3 my-3 rounded">
                      {props.children}
                    </div>
                  );
                }
                return <p {...props} />;
              }
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      );
    }
    
    // 处理普通文本消息，为每个段落添加margin
    return message.content.split('\n').map((paragraph, i) => (
      <p key={i} className={i > 0 ? 'mt-2' : ''}>
        {paragraph}
      </p>
    ));
  };
  
  // 判断是否是语音聊天消息
  const isVoiceMessage = (message) => {
    return (
      chatMode === 'voice' && 
      message.role === 'assistant' && 
      (message.voiceUrl || message.translatedText)
    );
  };

  return (
    <div className="space-y-3 sm:space-y-5 w-full">
      {messages.length === 0 ? (
        <div className="flex justify-center items-center min-h-[40vh] sm:min-h-[50vh]">
          <div className="text-center p-4 sm:p-6 bg-white/30 dark:bg-slate-700/30 rounded-xl backdrop-blur-md">
            <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center shadow-md">
              <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <h3 className="text-base sm:text-lg font-medium text-slate-800 dark:text-slate-200 mb-2">开始一次对话</h3>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">输入您的问题，Zcanic 将帮助您找到答案。</p>
          </div>
        </div>
      ) : (
        messages.map((message, index) => {
          const styles = getMessageStyles(message.role, message.status);
          
          return (
            <div 
              key={message.id || index}
              className={`flex ${styles.container}`}
            >
              <div className={`${message.role === 'system' ? 'max-w-[95%] sm:max-w-[90%] mx-auto' : message.role === 'user' ? 'max-w-[85%] sm:max-w-[95%] ml-auto' : 'max-w-[85%] sm:max-w-[95%]'}`}>
                <div 
                  className={`px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base ${styles.bubble} ${
                    (message.status === 'pending' || message.status === 'processing') ? 'animate-pulse' : ''
                  }`}
                >
                  {isVoiceMessage(message) ? (
                    <VoiceChatMessage message={message} styles={styles} />
                  ) : (
                    renderMessageContent(message)
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
      <div ref={messagesEndRef} className="h-4" /> {/* Add extra space at bottom for better scrolling */}
    </div>
  );
}

MessageList.propTypes = {
  messages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      role: PropTypes.oneOf(['user', 'assistant', 'system']).isRequired,
      content: PropTypes.string.isRequired,
      status: PropTypes.oneOf(['pending', 'processing', 'completed', 'failed']),
      voiceUrl: PropTypes.string,
      translatedText: PropTypes.string
    })
  ).isRequired,
  isLoading: PropTypes.bool,
  containerRef: PropTypes.object,
  chatMode: PropTypes.oneOf(['normal', 'voice'])
};

MessageList.defaultProps = {
  isLoading: false,
  chatMode: 'normal'
};

export default MessageList; 