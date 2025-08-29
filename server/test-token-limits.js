// 测试不同token限制的API调用
require('dotenv').config();
const openai = require('./config/openaiConfig');
const logger = require('./utils/logger');
const { callChatCompletion } = require('./utils/aiUtils');

async function testTokenLimits() {
  console.log("\n===== Token 限制测试 =====\n");
  
  if (!openai) {
    console.log("❌ 错误: OpenAI 客户端未正确配置");
    console.log("   请检查环境变量和API密钥设置。");
    return;
  }
  
  const testModel = "deepseek-ai/DeepSeek-R1";
  const testMessage = { role: 'user', content: '请生成一个简短的回复' };
  
  // 测试不同的token限制值
  const tokenValues = [
    null,       // 使用默认值
    1000,       // 正常值
    4000,       // 临界值
    5000,       // 超过最大值
    10000,      // 远超最大值
    "invalid",  // 无效字符串
    -100,       // 负数
    0,          // 零
  ];
  
  for (const tokenValue of tokenValues) {
    console.log(`\n----- 测试 max_tokens = ${tokenValue} -----`);
    
    try {
      // 构建选项
      const options = {
        model: testModel,
        temperature: 0.7
      };
      
      // 仅当值非null时添加max_tokens
      if (tokenValue !== null) {
        options.max_tokens = tokenValue;
      }
      
      // 调用API
      console.log(`🔄 发送请求 (max_tokens = ${options.max_tokens || 'default'})...`);
      const response = await callChatCompletion([testMessage], options, 'test-token-limits');
      
      console.log("✅ API调用成功!");
      console.log(`   使用模型: ${response.model}`);
      console.log(`   响应内容: ${response.choices[0].message.content.substring(0, 50)}...`);
      console.log(`   使用令牌: ${response.usage?.total_tokens || 'unknown'}`);
      
    } catch (error) {
      console.log("❌ API调用失败");
      console.log(`   错误信息: ${error.message}`);
      console.log(`   状态码: ${error.status || 'unknown'}`);
      
      // 尝试提取更详细的错误信息
      if (error.response) {
        try {
          console.log(`   详细错误: ${JSON.stringify(error.response.data)}`);
        } catch (e) {
          console.log(`   无法获取详细错误信息: ${e.message}`);
        }
      }
    }
  }
  
  console.log("\n===== 测试完成 =====\n");
}

// 执行测试
testTokenLimits().catch(error => {
  console.error("运行测试时发生错误:", error);
}); 