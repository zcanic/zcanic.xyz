import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  getUserChatSessions, 
  createChatSession,
  getChatSessionMessages, 
  sendChatMessage, 
  batchGetTasksStatus 
} from '../services/api';
import ChatSessionsList from '../components/chat/ChatSessionsList';
import ChatInterface from '../components/chat/ChatInterface';
import { Loader } from '../components/ui';
import { Menu, X } from 'lucide-react';

const ChatPage = () => {
  const { isAuthenticated, user } = useAuth();
  const { setActiveSession, getCurrentSessionSettings } = useChat();
  const navigate = useNavigate();
  
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pendingTasks, setPendingTasks] = useState({});
  const [initialLoad, setInitialLoad] = useState(true);
  const [pollInterval, setPollInterval] = useState(2000); // 初始轮询间隔 2 秒
  const [showSidebar, setShowSidebar] = useState(false); // 移动设备上侧边栏显示状态
  const chatContainerRef = useRef(null);

  // 认证检查
  useEffect(() => {
    if (!isAuthenticated && !loading) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate, loading]);

  // 检测窗口大小变化，在大屏幕上自动显示侧边栏
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) { // md breakpoint
        setShowSidebar(true);
      } else {
        setShowSidebar(false);
      }
    };

    // 初始调用一次
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 处理 closeChatSidebar 自定义事件
  useEffect(() => {
    const handleCloseSidebar = () => {
      if (window.innerWidth < 768) {
        setShowSidebar(false);
      }
    };

    document.addEventListener('closeChatSidebar', handleCloseSidebar);
    return () => {
      document.removeEventListener('closeChatSidebar', handleCloseSidebar);
    };
  }, []);

  // 处理API错误的通用方法
  const handleApiError = useCallback((error, message) => {
    console.error(`${message}:`, error);
    const errorMsg = error.message || '发生未知错误';
    toast.error(`${message}: ${errorMsg}`);
  }, []);

  // 加载会话列表
  useEffect(() => {
    if (isAuthenticated) {
      const loadSessions = async () => {
        try {
          setLoading(true);
          const response = await getUserChatSessions();
          const sessionsList = response.data.sessions || [];
          setSessions(sessionsList);
          
          // 如果有会话但未选择，自动选择第一个
          if (sessionsList.length > 0 && !currentSessionId) {
            setCurrentSessionId(sessionsList[0].id);
          } else if (sessionsList.length === 0) {
            // 如果没有会话，创建一个新会话
            handleCreateSession();
          }
          
          setInitialLoad(false);
        } catch (err) {
          handleApiError(err, '无法加载聊天会话');
          setInitialLoad(false);
        } finally {
          setLoading(false);
        }
      };
      
      loadSessions();
    }
  }, [isAuthenticated, currentSessionId, handleApiError]);

  // 选择会话时加载消息
  useEffect(() => {
    if (currentSessionId) {
      const loadMessages = async () => {
        try {
          setLoading(true);
          const response = await getChatSessionMessages(currentSessionId);
          
          // 确保消息按时间顺序排序并添加时间戳属性
          const processedMessages = (response.data.messages || []).map(msg => ({
            ...msg,
            timestamp: new Date(msg.createdAt).getTime() // 添加时间戳用于排序
          })).sort((a, b) => a.timestamp - b.timestamp);
          
          setMessages(processedMessages);
          
          // 检查是否有待处理的任务
          const pendingMessages = processedMessages.filter(msg => 
            msg.status === 'pending' || msg.status === 'processing'
          );
          
          // 记录需要轮询的任务
          const newPendingTasks = {};
          pendingMessages.forEach(msg => {
            if (msg.taskId) {
              newPendingTasks[msg.taskId] = msg.id;
            }
          });
          
          setPendingTasks(newPendingTasks);
          
          // 如果有待处理任务，重置轮询间隔为初始值
          if (Object.keys(newPendingTasks).length > 0) {
            setPollInterval(2000);
          }

          // 在移动设备上，选择会话后隐藏侧边栏
          if (window.innerWidth < 768) {
            setShowSidebar(false);
          }
        } catch (err) {
          handleApiError(err, '无法加载会话消息');
        } finally {
          setLoading(false);
        }
      };
      
      loadMessages();
    } else {
      setMessages([]);
    }
  }, [currentSessionId, handleApiError]);

  // 定期检查待处理任务并使用指数退避策略
  useEffect(() => {
    if (Object.keys(pendingTasks).length === 0) return;
    
    const checkTasks = async () => {
      const taskIds = Object.keys(pendingTasks);
      
      try {
        // 批量查询任务状态
        const response = await batchGetTasksStatus(taskIds);
        const completedTaskIds = [];
        
        // 处理任务状态更新
        response.data.tasks.forEach(task => {
          if (task.status === 'completed' || task.status === 'failed') {
            const messageId = pendingTasks[task.id];
            
            // 更新消息内容，保持顺序
            setMessages(prevMessages => {
              const updatedMessages = prevMessages.map(msg => {
                if (msg.id === messageId) {
                  return {
                    ...msg,
                    content: task.status === 'completed' ? task.result : '处理失败，请重试',
                    status: task.status
                  };
                }
                return msg;
              });
              
              // 保持消息按时间戳排序
              return updatedMessages.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
            });
            
            completedTaskIds.push(task.id);
          }
        });
        
        // 移除已完成任务
        if (completedTaskIds.length > 0) {
          setPendingTasks(prev => {
            const newTasks = { ...prev };
            completedTaskIds.forEach(id => delete newTasks[id]);
            return newTasks;
          });
          
          // 如果还有待处理任务，增加轮询间隔（最大10秒）
          if (Object.keys(pendingTasks).length - completedTaskIds.length > 0) {
            setPollInterval(prev => Math.min(prev * 1.5, 10000));
          }
          
          // 当有任务完成时提示用户
          if (completedTaskIds.length > 0) {
            toast.success('已收到新回复');
          }
        }
      } catch (err) {
        handleApiError(err, '检查任务状态失败');
        // 发生错误时，增加轮询间隔
        setPollInterval(prev => Math.min(prev * 2, 15000));
      }
    };
    
    // 设置轮询间隔
    const interval = setInterval(checkTasks, pollInterval);
    return () => clearInterval(interval);
  }, [pendingTasks, pollInterval, handleApiError]);

  // 创建新会话
  const handleCreateSession = async (mode = 'normal', title = null) => {
    try {
      setLoading(true);
      const sessionTitle = title || `${mode === 'voice' ? '语音' : ''}聊天会话 ${new Date().toLocaleString('zh-CN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`;
      
      const response = await createChatSession({ 
        title: sessionTitle,
        mode: mode 
      });
      
      const newSession = response.data.session;
      
      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
      
      toast.success(`已创建${mode === 'voice' ? '语音' : '新'}会话`);
      return newSession;
    } catch (err) {
      handleApiError(err, '创建新会话失败');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // 发送消息
  const handleSendMessage = async (message) => {
    if (!currentSessionId || !message.trim()) return;
    
    try {
      // 生成唯一ID用于跟踪消息
      const userMsgId = `temp-user-${Date.now()}`;
      const assistantMsgId = `temp-assistant-${Date.now()}`;
      
      // 乐观更新，立即添加用户消息
      const userMessageOptimistic = {
        id: userMsgId,
        role: 'user',
        content: message,
        status: 'completed',
        createdAt: new Date().toISOString(),
        timestamp: Date.now() // 添加时间戳用于排序
      };
      
      // 添加临时等待消息
      const assistantMessageOptimistic = {
        id: assistantMsgId,
        role: 'assistant',
        content: '正在思考...',
        status: 'pending',
        createdAt: new Date().toISOString(),
        timestamp: Date.now() + 1 // 确保助手消息排在用户消息后面
      };
      
      setMessages(prev => [...prev, userMessageOptimistic, assistantMessageOptimistic]);
      
      // 获取当前会话的AI设置
      const currentSettings = getCurrentSessionSettings();
      
      // 提取并格式化需要的设置属性
      const aiSettings = {
        // 仅发送必要的AI参数
        model: currentSettings.model,
        temperature: currentSettings.temperature,
        maxTokens: currentSettings.maxTokens,
        systemPrompt: currentSettings.systemPrompt
      };
      
      console.log('[ChatPage] 发送消息使用设置:', {
        model: aiSettings.model,
        temperature: aiSettings.temperature,
        maxTokens: aiSettings.maxTokens !== undefined ? 
          (aiSettings.maxTokens === null ? '无限制' : aiSettings.maxTokens) : '未设置',
        hasSystemPrompt: !!aiSettings.systemPrompt,
      });
      
      // 发送到服务器
      const response = await sendChatMessage(currentSessionId, message, aiSettings);
      
      // 更新真实消息ID和任务ID，保留原始消息顺序
      setMessages(prevMessages => {
        // 找到临时消息的索引，保证顺序正确
        const userMsgIndex = prevMessages.findIndex(m => m.id === userMsgId);
        const assistantMsgIndex = prevMessages.findIndex(m => m.id === assistantMsgId);
        
        if (userMsgIndex === -1 || assistantMsgIndex === -1) {
          // 如果找不到临时消息，可能切换界面了，创建新的消息列表
          // 先按照timestamp排序现有消息
          const sortedMsgs = [...prevMessages].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
          
          // 创建更新后的消息对象
          const updatedUserMsg = { 
            ...userMessageOptimistic, 
            id: response.data.userMessageId,
            timestamp: userMessageOptimistic.timestamp 
          };
          
          const updatedAssistantMsg = { 
            ...assistantMessageOptimistic, 
            id: response.data.assistantMessageId,
            taskId: response.data.taskId,
            timestamp: assistantMessageOptimistic.timestamp
          };
          
          // 将临时消息替换为更新后的消息
          const result = [...sortedMsgs];
          
          // 移除可能存在的旧临时消息
          const filtered = result.filter(m => m.id !== userMsgId && m.id !== assistantMsgId);
          
          // 添加新消息并保证顺序
          return [...filtered, updatedUserMsg, updatedAssistantMsg].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        }
        
        // 正常情况，替换消息ID
        return prevMessages.map(msg => {
          if (msg.id === userMsgId) {
            return { ...msg, id: response.data.userMessageId };
          }
          if (msg.id === assistantMsgId) {
            return { 
              ...msg, 
              id: response.data.assistantMessageId,
              taskId: response.data.taskId
            };
          }
          return msg;
        });
      });
      
      // 添加到待处理任务
      setPendingTasks(prev => ({
        ...prev,
        [response.data.taskId]: response.data.assistantMessageId
      }));
      
      // 有新的待处理任务，重置轮询间隔
      setPollInterval(2000);

      // 更新会话列表，将当前会话移到顶部
      setSessions(prev => {
        const updatedSessions = prev.filter(s => s.id !== currentSessionId);
        const currentSession = prev.find(s => s.id === currentSessionId);
        if (currentSession) {
          return [
            { ...currentSession, updatedAt: new Date().toISOString() },
            ...updatedSessions
          ];
        }
        return prev;
      });
      
    } catch (err) {
      handleApiError(err, '发送消息失败');
      
      // 移除乐观更新的消息
      setMessages(prevMessages => 
        prevMessages.filter(msg => 
          !msg.id.startsWith('temp-')
        )
      );
    }
  };

  // 会话切换处理
  const handleSelectSession = (sessionId) => {
    if (sessionId !== currentSessionId) {
      setCurrentSessionId(sessionId);
      
      // 设置为当前活动会话（用于设置上下文）
      if (setActiveSession) {
        setActiveSession(sessionId);
      }
    }
  };

  // 切换侧边栏显示
  const toggleSidebar = () => {
    setShowSidebar(prev => !prev);
  };

  if (initialLoad) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <Loader size="lg" message="加载聊天会话..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-2 md:py-6 h-[calc(100vh-4rem)] flex flex-col" ref={chatContainerRef}>
      {/* Mobile sidebar toggle button */}
      <div className="md:hidden fixed top-16 left-4 z-50">
        <button 
          onClick={toggleSidebar}
          className="p-2 rounded-full bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      <div className="flex flex-col md:flex-row h-full gap-2 md:gap-4 relative">
        {/* 会话列表侧边栏 - 移动设备下可折叠 */}
        {showSidebar && (
          <div 
            className="fixed md:relative inset-0 bg-black/50 dark:bg-black/60 z-40 md:z-auto md:bg-transparent overflow-hidden transition-opacity duration-300"
            onClick={(e) => {
              // 只在点击背景时关闭侧边栏
              if (e.target === e.currentTarget) {
                setShowSidebar(false);
              }
            }}
          >
            <div 
              className="absolute md:relative left-0 top-0 h-full max-h-[100vh] w-[85%] max-w-[300px] md:w-[280px] md:max-w-none md:flex-grow-0 md:flex-shrink-0 z-50 md:z-auto transition-all duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button for sidebar on mobile */}
              {window.innerWidth < 768 && (
                <button 
                  onClick={() => setShowSidebar(false)}
                  className="absolute top-4 right-4 z-50 p-1.5 rounded-full bg-slate-700/50 text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <div className="h-full overflow-hidden">
                <ChatSessionsList 
                  sessions={sessions}
                  setSessions={setSessions}
                  onSelectSession={handleSelectSession}
                  onCreateSession={handleCreateSession}
                  currentSessionId={currentSessionId}
                />
              </div>
            </div>
          </div>
        )}
        
        {/* 聊天界面 - 在移动设备上占据全屏 */}
        <div className="md:w-3/4 flex-1 h-full">
          <ChatInterface 
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={loading}
            sessionId={currentSessionId}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatPage;