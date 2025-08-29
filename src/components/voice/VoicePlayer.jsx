import React, { useState, useRef, useEffect } from 'react';
import { voice } from '../../services/api';
import { toast } from 'react-hot-toast';

// 按钮样式常量
const BUTTON_STYLES = {
  base: 'inline-flex items-center justify-center rounded-full p-2 transition-colors',
  ready: 'text-blue-500 hover:bg-blue-100',
  loading: 'text-gray-400 cursor-wait',
  playing: 'text-green-500 hover:bg-green-100 animate-pulse',
  error: 'text-red-500 hover:bg-red-100'
};

/**
 * 语音播放组件
 * @param {Object} props
 * @param {string} props.text - 要转换为语音的文本
 * @param {number} props.speakerId - 说话人ID (默认46)
 * @param {string} props.messageId - 唯一消息ID，用于缓存
 * @param {boolean} props.autoplay - 是否自动播放
 * @param {Object} props.className - 自定义样式类
 */
const VoicePlayer = ({ 
  text, 
  speakerId = 46, 
  messageId = '', 
  autoplay = false,
  className = '' 
}) => {
  // 状态
  const [status, setStatus] = useState('idle'); // idle, loading, ready, playing, error
  const [audioUrl, setAudioUrl] = useState('');
  const [volume, setVolume] = useState(0.8);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 2;
  
  // 引用
  const audioRef = useRef(null);
  
  // 缓存使用的消息ID (如果未提供)
  const actualMessageId = messageId || `msg-${text.slice(0, 20).replace(/\s+/g, '-')}-${Date.now()}`;
  
  // 加载和播放语音
  const loadAndPlayVoice = async () => {
    if (status === 'loading' || status === 'playing') return;
    
    // 如果已经加载了音频，直接播放
    if (status === 'ready' && audioUrl) {
      audioRef.current.play().catch(error => {
        console.error('播放失败:', error);
        setStatus('error');
        toast.error('音频播放失败，请点击重试');
      });
      return;
    }
    
    // 检查重试次数
    if (status === 'error' && retryCount >= MAX_RETRIES) {
      toast.error('多次尝试失败，请稍后再试');
      return;
    }
    
    // 否则请求新的语音
    try {
      setStatus('loading');
      
      const response = await voice.tts(text, speakerId, actualMessageId);
      
      if (response.data.success && response.data.audio_url) {
        setAudioUrl(response.data.audio_url);
        setStatus('ready');
        
        // 设置音频元素并播放
        if (audioRef.current) {
          audioRef.current.src = response.data.audio_url;
          audioRef.current.volume = volume;
          audioRef.current.play().catch(error => {
            console.error('自动播放失败:', error);
            // 自动播放通常由于浏览器策略限制而失败，这里不显示错误
          });
        }
      } else {
        throw new Error(response.data.message || '语音生成失败');
      }
    } catch (error) {
      console.error('语音生成错误:', error);
      setStatus('error');
      setRetryCount(prev => prev + 1);
      toast.error('语音生成失败，请点击重试');
    }
  };
  
  // 暂停播放
  const pauseVoice = () => {
    if (audioRef.current && status === 'playing') {
      audioRef.current.pause();
    }
  };
  
  // 处理音频事件
  useEffect(() => {
    if (!audioRef.current) return;
    
    const audio = audioRef.current;
    
    const handlePlay = () => setStatus('playing');
    const handlePause = () => setStatus('ready');
    const handleEnded = () => setStatus('ready');
    const handleError = (e) => {
      console.error('音频播放错误:', e);
      setStatus('error');
      setRetryCount(prev => prev + 1);
      toast.error('音频播放失败');
    };
    
    // 添加事件监听
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    
    // 自动播放
    if (autoplay && audioUrl) {
      audio.play().catch(error => {
        console.error('自动播放失败:', error);
        // 自动播放失败通常是因为浏览器策略，这里不显示错误
      });
    }
    
    // 清理函数
    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [audioUrl, autoplay]);
  
  // 处理音量变化
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);
  
  // 检测设备类型，调整UI大小
  const isMobile = window.innerWidth < 768;
  const buttonSize = isMobile ? "w-4 h-4" : "w-5 h-5";
  
  // 渲染播放按钮
  const renderButton = () => {
    // 根据状态确定按钮样式
    let buttonClass = `${BUTTON_STYLES.base} `;
    let buttonIcon = null;
    let buttonAction = loadAndPlayVoice;
    
    switch (status) {
      case 'idle':
      case 'ready':
        buttonClass += BUTTON_STYLES.ready;
        buttonIcon = (
          <svg xmlns="http://www.w3.org/2000/svg" className={buttonSize} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
        );
        break;
        
      case 'loading':
        buttonClass += BUTTON_STYLES.loading;
        buttonIcon = (
          <svg className={`animate-spin ${buttonSize}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        );
        buttonAction = null; // 加载中禁用点击
        break;
        
      case 'playing':
        buttonClass += BUTTON_STYLES.playing;
        buttonIcon = (
          <svg xmlns="http://www.w3.org/2000/svg" className={buttonSize} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
        buttonAction = pauseVoice;
        break;
        
      case 'error':
        buttonClass += BUTTON_STYLES.error;
        buttonIcon = (
          <svg xmlns="http://www.w3.org/2000/svg" className={buttonSize} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
        buttonAction = retryCount >= MAX_RETRIES ? null : loadAndPlayVoice; // 超过重试次数后禁用
        break;
        
      default:
        buttonClass += BUTTON_STYLES.ready;
        buttonIcon = (
          <svg xmlns="http://www.w3.org/2000/svg" className={buttonSize} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
        );
    }
    
    return (
      <button 
        className={`${buttonClass} ${className}`}
        onClick={buttonAction}
        disabled={status === 'loading' || (status === 'error' && retryCount >= MAX_RETRIES)}
        aria-label={status === 'playing' ? '暂停语音' : '播放语音'}
        title={status === 'playing' ? '暂停语音' : '播放语音'}
      >
        {buttonIcon}
      </button>
    );
  };
  
  return (
    <div className="voice-player">
      {renderButton()}
      <audio ref={audioRef} src={audioUrl} preload="none" />
    </div>
  );
};

export default VoicePlayer; 