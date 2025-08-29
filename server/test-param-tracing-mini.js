// 简化的maxTokens参数传递检测工具
require('dotenv').config();

// 输入测试参数
const maxTokensTestCases = [
  { name: '数字2000', value: 2000 },  
  { name: '字符串"2000"', value: '2000' },
  { name: 'null', value: null },
  { name: '0', value: 0 },
  { name: '无效字符串', value: 'not-a-number' }
];

// 测试函数
function runTokenTests() {
  console.log("\n===== maxTokens参数传递测试 =====\n");
  
  maxTokensTestCases.forEach(testCase => {
    console.log(`\n测试: ${testCase.name} (${typeof testCase.value})`);
    
    // 1. 从前端传递到chatController
    console.log(`1. 前端值: ${testCase.value}`);
    
    // 2. chatController处理
    const controllerValue = formatControllerValue(testCase.value);
    console.log(`2. Controller处理: ${controllerValue} (${typeof controllerValue})`);
    
    // 3. 转为JSON存储
    const jsonValue = JSON.stringify({ maxTokens: controllerValue });
    console.log(`3. JSON格式: ${jsonValue}`);
    
    // 4. 解析JSON
    const parsedSettings = JSON.parse(jsonValue);
    console.log(`4. 解析结果: ${parsedSettings.maxTokens} (${typeof parsedSettings.maxTokens})`);
    
    // 5. 构建API选项
    const apiOptions = buildApiOptions(parsedSettings);
    console.log(`5. API选项: ${apiOptions.max_tokens} (${typeof apiOptions.max_tokens})`);
    
    // 6. 准备最终请求
    const finalRequest = prepareApiRequest(apiOptions);
    console.log(`6. 最终请求: ${finalRequest.max_tokens === undefined ? 'undefined' : finalRequest.max_tokens} (${typeof finalRequest.max_tokens})`);
    
    // 判断传递结果
    const result = finalRequest.max_tokens !== undefined ? 
      `将被发送到API: ${finalRequest.max_tokens}` : 
      "将使用API默认值";
    console.log(`结果: ${result}`);
  });
  
  console.log("\n===== 测试结束 =====\n");
}

// 模拟chatController.js中的处理
function formatControllerValue(maxTokens) {
  if (maxTokens === undefined) return undefined;
  
  if (maxTokens === null) {
    return null;
  } else {
    const tokens = parseInt(maxTokens, 10);
    if (!isNaN(tokens) && tokens > 0) {
      return tokens;
    }
  }
  return undefined;
}

// 模拟taskManager.js中的buildApiOptions
function buildApiOptions(settings) {
  return {
    model: settings.model || 'deepseek-ai/DeepSeek-R1',
    temperature: settings.temperature !== undefined ? parseFloat(settings.temperature) : 0.7,
    max_tokens: settings.maxTokens
  };
}

// 模拟aiUtils.js中的API请求构建
function prepareApiRequest(options) {
  const requestOptions = {
    model: options.model || 'deepseek-ai/DeepSeek-R1',
    temperature: typeof options.temperature === 'number' ? options.temperature : 0.7,
    messages: [{ role: 'user', content: '测试' }]
  };

  if (options.max_tokens !== null && options.max_tokens !== undefined) {
    const tokenLimit = parseInt(options.max_tokens, 10);
    if (!isNaN(tokenLimit) && tokenLimit > 0) {
      requestOptions.max_tokens = tokenLimit;
    }
  }
  
  return requestOptions;
}

// 运行测试
runTokenTests(); 