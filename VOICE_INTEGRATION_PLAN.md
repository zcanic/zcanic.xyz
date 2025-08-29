# 语音 AI 人格分支功能计划

## 架构设计

### 1. 独立功能模型

- 创建独立于主聊天功能的新分支功能
- 专门用于与特定 AI 人格进行语音对话
- 采用异步处理模式处理语音生成

### 2. 数据流设计

```
新UI界面 → 独立后端API → voice_app微服务 → Voicevox引擎
    ↑           ↑               |
    |           |               ↓
 音频播放 ← 音频URL缓存 ← 音频文件存储
```

## 前端实现

### 1. 新界面开发 (P1)

- [ ] 设计独立的语音 AI 对话界面(`src/pages/VoiceCompanion.jsx`)
- [ ] 创建语音播放器组件(`src/components/voice/AudioPlayer.jsx`)
- [ ] 实现语音对话输入方式（文本输入转语音）
- [ ] 添加人格切换功能（可选择不同语音角色）

### 2. 状态管理 (P1)

- [ ] 创建独立的状态管理逻辑(`src/context/VoiceCompanionContext.jsx`)
- [ ] 跟踪对话历史和语音生成状态
- [ ] 管理 AI 人格配置和用户偏好

### 3. API 客户端 (P1)

- [ ] 创建专用 API 客户端(`src/services/voiceCompanionService.js`)
- [ ] 实现错误处理和重试逻辑
- [ ] 添加语音缓存机制

## 后端实现

### 1. 独立接口开发 (P1)

- [ ] 创建新的语音对话控制器(`server/controllers/voiceCompanionController.js`)
- [ ] 实现 AI 人格系统提示词配置
- [ ] 设计语音请求和响应处理流程

### 2. 安全措施 (P2)

- [ ] 实现访问控制
- [ ] 添加请求速率限制
- [ ] 设置适当的权限系统

### 3. 缓存机制 (P2)

- [ ] 实现本地缓存，存储文本到音频 URL 的映射
- [ ] 设置合理的缓存过期策略
- [ ] 优化重复对话的响应速度

## 用户体验设计

### 1. AI 人格设计 (P1)

- [ ] 创建不同于 Zcanic 的新 AI 人格角色
- [ ] 设计角色背景、说话风格和个性特点
- [ ] 实现适合该角色的系统提示词

### 2. 交互体验 (P1)

- [ ] 设计直观的对话界面
- [ ] 实现语音播放/暂停控制
- [ ] 添加视觉反馈表示 AI 正在"说话"

### 3. 个性化设置 (P2)

- [ ] 允许用户选择不同的语音角色
- [ ] 提供语速和音量自定义选项
- [ ] 保存用户偏好设置

## 性能优化

### 1. 资源管理 (P2)

- [ ] 实现音频文件的自动清理
- [ ] 监控存储空间使用情况
- [ ] 优化音频质量和文件大小

### 2. 响应时间 (P2)

- [ ] 优化语音生成和加载速度
- [ ] 实现对话预缓存机制
- [ ] 优化首次加载体验

## 测试与部署

### 1. 组件测试 (P2)

- [ ] 测试语音播放组件
- [ ] 验证对话逻辑和状态管理
- [ ] 确保跨浏览器兼容性

### 2. 部署策略 (P1)

- [ ] 开发环境：本地 Voicevox 引擎
- [ ] 生产环境：独立部署的 voice_app 服务
- [ ] 实现简单的监控和错误报告

## 实施计划

### 1. 第一阶段 (P1)

- 基础 AI 人格设计和提示词工程（2 天）
- 对话界面 UI 开发（3 天）
- 语音播放器组件开发（2 天）
- 后端 API 实现（3 天）
- 基本功能测试（2 天）

### 2. 第二阶段 (P2)

- 人格细化和对话优化（3 天）
- 用户偏好设置实现（2 天）
- 性能优化和缓存实现（2 天）
- 全面测试和修复（2 天）
- 生产环境部署（1 天）

## 功能详细说明

### 1. 语音 AI 人格特点

- [ ] 定义独特的 AI 角色形象和设定
- [ ] 创建专门的对话风格和语言模式
- [ ] 设计适合语音交互的对话节奏和长度

### 2. 对话界面设计

- [ ] 创建简洁友好的对话页面，与主聊天分离
- [ ] 添加角色头像和视觉元素
- [ ] 实现打字动画和语音同步指示

### 3. 语音交互流程

- [ ] 用户输入文本 → AI 生成回复 → 转换为语音 → 播放
- [ ] 提供历史对话回顾和继续功能
- [ ] 支持对话主题切换和上下文保持

## 技术细节

### 后端 API 接口设计

```javascript
// POST /api/voice-companion/chat
// 发送消息并获取语音回复
{
  "message": "用户消息文本",
  "characterId": "voice_character_1",  // 可选，选择特定AI人格
  "voiceSettings": {
    "speakerId": 46,       // 可选，默认为配置中的角色
    "speed": 1.0,          // 可选，语速
    "pitch": 0.0           // 可选，音高
  }
}

// 响应
{
  "success": true,
  "reply": {
    "text": "AI回复的文本内容",
    "audioUrl": "/audio_storage/123456.wav",
    "duration": 3.5        // 音频时长（秒）
  },
  "character": {
    "name": "角色名称",
    "avatar": "/images/characters/voice_character_1.png"
  }
}
```

### 前端组件设计

```jsx
// VoiceCompanion.jsx 基本结构
const VoiceCompanion = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState("default");

  // 发送消息
  const sendMessage = async () => {
    if (!inputText.trim()) return;

    setIsLoading(true);
    // 添加用户消息
    const userMessage = { type: "user", text: inputText };
    setMessages((prev) => [...prev, userMessage]);
    setInputText("");

    try {
      // 请求AI响应
      const response = await voiceCompanionService.sendMessage(
        inputText,
        selectedCharacter
      );

      // 添加AI响应
      const aiMessage = {
        type: "ai",
        text: response.reply.text,
        audioUrl: response.reply.audioUrl,
        duration: response.reply.duration,
      };

      setMessages((prev) => [...prev, aiMessage]);

      // 自动播放音频（可选）
      // playAudio(response.reply.audioUrl);
    } catch (error) {
      // 处理错误
      console.error("获取AI响应失败", error);
      setMessages((prev) => [
        ...prev,
        {
          type: "error",
          text: "抱歉，我暂时无法回应。请稍后再试。",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="voice-companion-container">
      <div className="character-selection">
        <select
          value={selectedCharacter}
          onChange={(e) => setSelectedCharacter(e.target.value)}
        >
          <option value="default">默认角色</option>
          <option value="character1">角色1</option>
          <option value="character2">角色2</option>
        </select>
      </div>

      <div className="messages-container">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.type}`}>
            <div className="message-text">{msg.text}</div>
            {msg.audioUrl && <AudioPlayer url={msg.audioUrl} />}
          </div>
        ))}

        {isLoading && <div className="loading-indicator">AI正在思考...</div>}
      </div>

      <div className="input-container">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="输入消息..."
          disabled={isLoading}
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage} disabled={isLoading || !inputText.trim()}>
          发送
        </button>
      </div>
    </div>
  );
};
```

### 缓存策略

1. **本地存储缓存**

   ```javascript
   // 检查缓存
   const getCachedAudio = (text) => {
     const cache = JSON.parse(localStorage.getItem("voiceCache") || "{}");
     const hash = hashText(text);

     if (cache[hash] && Date.now() < cache[hash].expiry) {
       return cache[hash].url;
     }
     return null;
   };

   // 保存到缓存
   const cacheAudio = (text, url) => {
     const cache = JSON.parse(localStorage.getItem("voiceCache") || "{}");
     const hash = hashText(text);
     const expiry = Date.now() + 24 * 60 * 60 * 1000; // 24小时

     cache[hash] = { url, expiry };
     localStorage.setItem("voiceCache", JSON.stringify(cache));
   };
   ```

2. **服务器端缓存**
   - 使用 Redis 存储文本哈希到音频路径的映射
   - 实现定期清理过期缓存的任务
   - 在请求处理前检查缓存，避免重复生成
