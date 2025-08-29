// 参数传递测试脚本
require('dotenv').config();
const { testParameterPassing } = require('./utils/parameterTest');

// 模拟不同类型的参数
function runTests() {
  console.log('\n===== 开始测试参数传递 =====\n');
  
  // 1. 测试 maxTokens 为 null (无限制)
  console.log('\n>> 测试场景 1: maxTokens 为 null (无限制)\n');
  const nullMaxTokensTest = {
    model: 'deepseek-ai/DeepSeek-R1',
    temperature: 0.7,
    maxTokens: null,
    systemPrompt: '你是一个助手'
  };
  testParameterPassing([{role: 'user', content: '测试消息'}], 
    formatSettingsForAPI(nullMaxTokensTest), 'test-script');
  
  // 2. 测试 maxTokens 为数字
  console.log('\n>> 测试场景 2: maxTokens 为数字\n');
  const numberMaxTokensTest = {
    model: 'deepseek-ai/DeepSeek-R1',
    temperature: 0.7,
    maxTokens: 2000,
    systemPrompt: '你是一个助手'
  };
  testParameterPassing([{role: 'user', content: '测试消息'}], 
    formatSettingsForAPI(numberMaxTokensTest), 'test-script');
  
  // 3. 测试 maxTokens 未设置
  console.log('\n>> 测试场景 3: maxTokens 未设置\n');
  const undefinedMaxTokensTest = {
    model: 'deepseek-ai/DeepSeek-R1',
    temperature: 0.7,
    systemPrompt: '你是一个助手'
  };
  testParameterPassing([{role: 'user', content: '测试消息'}], 
    formatSettingsForAPI(undefinedMaxTokensTest), 'test-script');
    
  // 4. 测试值类型转换 (字符串转数字)
  console.log('\n>> 测试场景 4: 字符串转数字\n');
  const stringToNumberTest = {
    model: 'deepseek-ai/DeepSeek-R1',
    temperature: '0.5', // 字符串温度
    maxTokens: '1500',  // 字符串令牌数
    systemPrompt: '你是一个助手'
  };
  testParameterPassing([{role: 'user', content: '测试消息'}], 
    formatSettingsForAPI(stringToNumberTest), 'test-script');
  
  console.log('\n===== 测试结束 =====\n');
}

// 模拟从ChatContext到API的参数格式转换
function formatSettingsForAPI(settings) {
  // 模拟settings转为具体API调用参数的过程
  const apiOptions = {
    model: settings.model,
    temperature: settings.temperature !== undefined ? parseFloat(settings.temperature) : undefined
  };
  
  // 特殊处理maxTokens
  if (settings.maxTokens !== undefined) {
    apiOptions.max_tokens = settings.maxTokens === null ? null : 
      (typeof settings.maxTokens === 'string' ? parseInt(settings.maxTokens, 10) : settings.maxTokens);
  }
  
  return apiOptions;
}

// 运行测试
runTests(); 