import React, { useState, useEffect } from 'react';
import { useVoice } from '../../context/VoiceContext';
import { Switch, Select, Slider } from '../ui'; // 假设你有这些UI组件
import { toast } from 'react-hot-toast';

/**
 * 语音设置组件
 */
const VoiceSettings = () => {
  const { 
    settings, 
    updateSettings, 
    speakers, 
    isLoading, 
    serviceStatus,
    checkServiceAvailability, 
    loadSpeakers 
  } = useVoice();
  
  // 本地状态
  const [localSettings, setLocalSettings] = useState(settings);
  
  // 当全局设置变化时更新本地状态
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);
  
  // 保存设置
  const saveSettings = () => {
    updateSettings(localSettings);
    toast.success('语音设置已保存');
  };
  
  // 处理设置变更
  const handleSettingChange = (key, value) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // 刷新服务状态
  const refreshServiceStatus = async () => {
    try {
      const isAvailable = await checkServiceAvailability();
      if (isAvailable) {
        toast.success('语音服务正常运行');
        await loadSpeakers();
      } else {
        toast.error('语音服务不可用');
      }
    } catch (error) {
      toast.error(`检查语音服务失败: ${error.message}`);
    }
  };
  
  // 如果服务不可用，显示错误状态
  if (!serviceStatus.available) {
    return (
      <div className="p-4 bg-red-50 rounded-lg border border-red-200">
        <h3 className="text-lg font-medium text-red-800 mb-2">语音服务不可用</h3>
        <p className="text-sm text-red-600 mb-4">无法连接到语音服务器，语音功能将无法使用。</p>
        <button
          onClick={refreshServiceStatus}
          className="px-4 py-2 bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors"
          disabled={isLoading}
        >
          {isLoading ? '检查中...' : '重新检查'}
        </button>
        
        {serviceStatus.error && (
          <p className="mt-2 text-xs text-red-500">错误: {serviceStatus.error}</p>
        )}
      </div>
    );
  }
  
  return (
    <div className="space-y-6 p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900">语音设置</h3>
      
      {/* 启用/禁用语音 */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">启用语音</span>
        <Switch
          checked={localSettings.enabled}
          onChange={(checked) => handleSettingChange('enabled', checked)}
          label="启用语音功能"
        />
      </div>
      
      {/* 自动播放设置 */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">自动播放语音</span>
        <Switch
          checked={localSettings.autoplay}
          onChange={(checked) => handleSettingChange('autoplay', checked)}
          label="自动播放AI回复语音"
        />
      </div>
      
      {/* 说话人选择 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">选择说话人</label>
        <Select
          value={localSettings.speakerId}
          onChange={(value) => handleSettingChange('speakerId', value)}
          disabled={!speakers.length || isLoading}
          options={speakers.map(speaker => ({
            value: speaker.id,
            label: speaker.name
          }))}
          placeholder={isLoading ? "加载中..." : "选择说话人"}
        />
      </div>
      
      {/* 音量调节 */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <label className="block text-sm font-medium text-gray-700">音量</label>
          <span className="text-sm text-gray-500">{Math.round(localSettings.volume * 100)}%</span>
        </div>
        <Slider
          min={0}
          max={1}
          step={0.01}
          value={localSettings.volume}
          onChange={(value) => handleSettingChange('volume', value)}
        />
      </div>
      
      {/* 保存按钮 */}
      <div className="pt-2">
        <button
          onClick={saveSettings}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          保存设置
        </button>
      </div>
      
      {/* 服务状态 */}
      <div className="pt-2 text-center">
        <div className="flex items-center justify-center text-xs text-gray-500">
          <span className={`inline-block w-2 h-2 rounded-full mr-1 ${serviceStatus.available ? 'bg-green-500' : 'bg-red-500'}`}></span>
          <span>语音服务状态: {serviceStatus.available ? '正常' : '异常'}</span>
          <button 
            onClick={refreshServiceStatus} 
            className="ml-2 text-blue-500 hover:text-blue-700"
            disabled={isLoading}
          >
            刷新
          </button>
        </div>
        {serviceStatus.lastChecked && (
          <div className="text-xs text-gray-400 mt-1">
            上次检查: {new Date(serviceStatus.lastChecked).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceSettings; 