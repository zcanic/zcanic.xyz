// 综合参数传递追踪工具
// 用于模拟整个聊天流程中的参数传递，确保设置正确传递到OpenAI API

require('dotenv').config();
const logger = require('./utils/logger');
const { v4: uuidv4 } = require('uuid');

// 模拟前端到后端的请求体
const simulateRequest = {
  message: "这是测试消息",
  model: "deepseek-ai/DeepSeek-R1",
  temperature: 0.5,
  maxTokens: 2000,
  systemPrompt: "简短系统提示"
};

// 模拟会话和用户ID
const SESSION_ID = "test-session-" + Date.now();
const USER_ID = 1;

// 运行完整测试
async function runFullTest() {
  console.log("\n===== 开始全流程参数传递测试 =====\n");
  
  // 步骤1: 从前端传递到chatController
  console.log("步骤1: 前端 -> chatController");
  console.log("前端发送的参数:", JSON.stringify(simulateRequest, null, 2));
  
  // 步骤2: chatController处理并保存设置
  console.log("\n步骤2: chatController处理");
  const formattedSettings = formatAiSettings(
    simulateRequest.model,
    simulateRequest.temperature,
    simulateRequest.maxTokens,
    simulateRequest.systemPrompt
  );
  
  console.log("处理后的设置:", JSON.stringify(formattedSettings, null, 2));
  
  // 步骤3: 模拟任务创建和设置存储
  console.log("\n步骤3: 任务创建和设置存储");
  const taskId = uuidv4();
  const taskSettings = JSON.stringify(formattedSettings);
  console.log(`任务ID: ${taskId}`);
  console.log(`存储的设置JSON: ${taskSettings}`);
  
  // 步骤4: 任务管理器获取设置
  console.log("\n步骤4: 任务管理器获取设置");
  const retrievedSettings = JSON.parse(taskSettings);
  console.log("提取的设置:", JSON.stringify(retrievedSettings, null, 2));
  
  // 步骤5: 构建消息历史
  console.log("\n步骤5: 构建消息历史和系统提示");
  const messages = buildTestConversation(retrievedSettings);
  console.log(`消息总数: ${messages.length}`);
  console.log("系统提示:", messages[0].content);
  
  // 步骤6: 构建API选项
  console.log("\n步骤6: 构建API调用选项");
  const apiOptions = buildApiOptions(retrievedSettings);
  console.log("API选项:", JSON.stringify(apiOptions, null, 2));
  
  // 步骤7: 准备最终的API请求
  console.log("\n步骤7: 准备最终的OpenAI API请求");
  const finalApiRequest = prepareApiRequest(messages, apiOptions);
  console.log("最终API请求参数:", JSON.stringify(finalApiRequest, null, 2));
  
  // 检查max_tokens是否正确传递
  checkMaxTokens(
    simulateRequest.maxTokens,
    formattedSettings.maxTokens,
    apiOptions.max_tokens,
    finalApiRequest.max_tokens
  );
  
  console.log("\n===== 测试结束 =====\n");
}

// 从chatController.js复制的格式化AI设置函数
function formatAiSettings(model, temperature, maxTokens, systemPrompt) {
  const settings = {};
  
  // 仅当有效时添加模型
  if (model && typeof model === 'string' && model.trim()) {
    settings.model = model.trim();
  }
  
  // 温度必须是0到1之间的数字
  if (temperature !== undefined) {
    const tempFloat = parseFloat(temperature);
    if (!isNaN(tempFloat) && tempFloat >= 0 && tempFloat <= 1) {
      settings.temperature = tempFloat;
    }
  }
  
  // 处理maxTokens (null值保留表示无限制)
  if (maxTokens !== undefined) {
    if (maxTokens === null) {
      settings.maxTokens = null;
    } else {
      const tokens = parseInt(maxTokens, 10);
      if (!isNaN(tokens) && tokens > 0) {
        settings.maxTokens = tokens;
      }
    }
  }
  
  // 系统提示词
  if (systemPrompt && typeof systemPrompt === 'string' && systemPrompt.trim()) {
    settings.systemPrompt = systemPrompt.trim();
  }
  
  return settings;
}

// 模拟构建会话历史
function buildTestConversation(settings) {
  // 构建系统提示
  const systemContent = settings.systemPrompt || `默认系统提示`;
  
  // 构建简短示例消息
  const messageHistory = [
    { role: 'user', content: '你好' },
    { role: 'assistant', content: '你好!' },
    { role: 'user', content: simulateRequest.message }
  ];
  
  // 构建最终消息数组
  const messages = [
    { role: 'system', content: systemContent },
    ...messageHistory
  ];
  
  return messages;
}

// 从taskManager.js复制的构建API选项函数
function buildApiOptions(customSettings) {
  return {
    model: customSettings.model || 'deepseek-ai/DeepSeek-R1',
    temperature: customSettings.temperature !== undefined ? 
      parseFloat(customSettings.temperature) : 0.7,
    max_tokens: customSettings.maxTokens
  };
}

// 模拟aiUtils.js中的准备API请求参数过程
function prepareApiRequest(messages, options) {
  // 准备请求参数 - 深度克隆防止修改原始对象
  const requestOptions = JSON.parse(JSON.stringify({
    model: options.model || 'deepseek-ai/DeepSeek-R1',
    temperature: typeof options.temperature === 'number' ? options.temperature : 0.7,
    messages: messages || []
  }));

  // 特殊处理max_tokens参数
  if (options.max_tokens !== null && options.max_tokens !== undefined) {
    const tokenLimit = parseInt(options.max_tokens, 10);
    if (!isNaN(tokenLimit) && tokenLimit > 0) {
      requestOptions.max_tokens = tokenLimit;
    }
  }
  
  return requestOptions;
}

// 特别检查maxTokens的传递
function checkMaxTokens(originalValue, controllerValue, apiOptionsValue, finalValue) {
  console.log("\n==== maxTokens参数传递检查 ====");
  console.log(`1. 前端原始值: ${originalValue} (${typeof originalValue})`);
  console.log(`2. Controller处理后: ${controllerValue} (${typeof controllerValue})`);
  console.log(`3. API选项中值: ${apiOptionsValue} (${typeof apiOptionsValue})`);
  console.log(`4. 最终请求中值: ${finalValue} (${typeof finalValue})`);
  
  // 判断是否正确传递
  const isCorrect = 
    (originalValue === controllerValue) && 
    (controllerValue === apiOptionsValue) &&
    (typeof finalValue === 'number' && finalValue === originalValue);
  
  if (isCorrect) {
    console.log("✓ maxTokens参数正确传递");
  } else {
    console.log("✗ maxTokens参数传递过程中发生改变");
    
    // 详细分析问题
    if (originalValue !== controllerValue) {
      console.log(`  问题1: Controller处理改变了值 ${originalValue} -> ${controllerValue}`);
    }
    
    if (controllerValue !== apiOptionsValue) {
      console.log(`  问题2: API选项构建改变了值 ${controllerValue} -> ${apiOptionsValue}`);
    }
    
    if (apiOptionsValue !== finalValue && finalValue !== undefined) {
      console.log(`  问题3: 最终API请求构建改变了值 ${apiOptionsValue} -> ${finalValue}`);
    }
    
    if (finalValue === undefined) {
      console.log(`  问题4: 最终API请求中参数丢失`);
    }
  }
}

// 运行测试
runFullTest(); 