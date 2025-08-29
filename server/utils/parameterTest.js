const logger = require('./logger');

/**
 * 仿真aiUtils中的callChatCompletion函数逻辑来验证参数传递
 */
function testParameterPassing(messages, options, callerName) {
  console.log('========== 参数传递测试 ==========');
  
  // 打印原始参数
  console.log('【1】原始参数:');
  console.log('→ options类型:', typeof options);
  console.log('→ options:', JSON.stringify(options, null, 2));
  
  // 记录特定参数
  console.log('【2】关键参数检查:');
  console.log('→ model:', options.model);
  console.log('→ temperature:', options.temperature, '(类型:', typeof options.temperature, ')');
  console.log('→ max_tokens:', options.max_tokens, '(类型:', typeof options.max_tokens, ')');
  
  // 测试解析和处理逻辑
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
  
  // 打印处理后的请求参数
  console.log('【3】处理后的API请求参数:');
  console.log('→ 最终请求选项:', JSON.stringify(requestOptions, null, 2));
  console.log('→ max_tokens是否存在:', requestOptions.hasOwnProperty('max_tokens'));
  console.log('→ 消息数量:', requestOptions.messages.length);

  // 测试null值处理
  console.log('【4】null值处理测试:');
  testNullHandling();
  
  console.log('========== 测试完成 ==========');
  return requestOptions;
}

/**
 * 专门测试null值处理
 */
function testNullHandling() {
  const testCases = [
    { desc: '1. undefined值', value: undefined },
    { desc: '2. null值', value: null },
    { desc: '3. 数字0', value: 0 },
    { desc: '4. 正数', value: 1000 },
    { desc: '5. 字符串数字', value: '2000' }
  ];

  console.log('max_tokens不同值的处理结果:');
  testCases.forEach(test => {
    const options = { max_tokens: test.value };
    const requestOptions = {};
    
    if (options.max_tokens !== null && options.max_tokens !== undefined) {
      const tokenLimit = parseInt(options.max_tokens, 10);
      if (!isNaN(tokenLimit) && tokenLimit > 0) {
        requestOptions.max_tokens = tokenLimit;
      }
    }
    
    console.log(`${test.desc}: 输入=${String(test.value)}, 输出=${requestOptions.max_tokens || '未设置'}`);
  });
}

module.exports = {
  testParameterPassing
}; 