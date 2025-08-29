// OpenAI API错误测试和分析工具
// 用于诊断API调用失败的常见原因
require('dotenv').config();
const openai = require('./config/openaiConfig');
const logger = require('./utils/logger');

const API_TEST_TIMEOUT = 15000; // 15秒超时

async function testApiConnection() {
  console.log("\n===== OpenAI API 连接测试 =====\n");
  
  if (!openai) {
    console.log("❌ 错误: OpenAI 客户端未正确配置");
    console.log("   请检查环境变量和API密钥设置。");
    return;
  }
  
  const testModel = "deepseek-ai/DeepSeek-R1";
  console.log(`🔄 测试连接到 ${testModel}...`);
  
  try {
    // 设置超时
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('请求超时')), API_TEST_TIMEOUT)
    );
    
    // API调用
    const apiPromise = openai.chat.completions.create({
      model: testModel,
      messages: [{ role: 'user', content: '简短测试' }],
      temperature: 0.7,
      max_tokens: 20
    });
    
    // 竞争Promise
    const response = await Promise.race([apiPromise, timeoutPromise]);
    
    console.log("✅ API连接成功!");
    console.log(`   使用模型: ${response.model}`);
    console.log(`   响应内容: ${response.choices[0].message.content.substring(0, 50)}...`);
    console.log(`   使用令牌: ${response.usage?.total_tokens || 'unknown'}`);
    
    // 测试默认值
    await testDefaultMaxTokens();
    
  } catch (error) {
    console.log("❌ API调用失败");
    analyzeApiError(error);
  }
  
  console.log("\n===== 测试完成 =====\n");
}

async function testDefaultMaxTokens() {
  console.log("\n----- API默认maxTokens测试 -----");
  try {
    console.log("🔄 测试不设置max_tokens参数...");
    
    const response = await openai.chat.completions.create({
      model: "deepseek-ai/DeepSeek-R1",
      messages: [{ 
        role: 'user', 
        content: '请生成一个非常详细的回答，至少500个字' 
      }],
      temperature: 0.7
      // 故意不设置max_tokens
    });
    
    console.log("✅ 测试成功");
    
    const responseLength = response.choices[0].message.content.length;
    const tokenCount = response.usage?.completion_tokens || 'unknown';
    
    console.log(`   响应长度: ${responseLength} 字符`);
    console.log(`   使用令牌: ${tokenCount} (completion tokens)`);
    
    if (tokenCount !== 'unknown' && tokenCount < 200) {
      console.log("⚠️ 警告: 响应令牌数较少，API可能内置了较小的默认max_tokens值");
    } else {
      console.log("✅ API使用了合理的默认max_tokens值");
    }
    
  } catch (error) {
    console.log("❌ 测试失败");
    analyzeApiError(error);
  }
}

function analyzeApiError(error) {
  console.log("\n----- 错误分析 -----");
  console.log(`错误类型: ${error.name}`);
  console.log(`错误信息: ${error.message}`);
  
  // 提取API错误码
  const errorCode = error.code || error.type || 'unknown';
  console.log(`错误码: ${errorCode}`);
  
  // HTTP状态码
  const statusCode = error.status || error.statusCode || 'unknown';
  console.log(`HTTP状态: ${statusCode}`);
  
  // 常见错误分析
  if (statusCode === 401) {
    console.log("🔑 认证错误 - API密钥无效或已过期");
    console.log("  建议: 检查OPENAI_API_KEY环境变量");
  } else if (statusCode === 429) {
    console.log("⏱️ 请求速率限制或配额超限");
    console.log("  建议: 检查账户余额或增加API调用间隔");
  } else if (statusCode === 404) {
    console.log("🔍 资源不存在 - 可能是模型名称错误");
    console.log("  建议: 验证模型名称是否正确");
  } else if (error.message.includes('timeout')) {
    console.log("⏲️ 请求超时");
    console.log("  建议: 检查网络连接或代理设置");
  } else if (error.message.includes('network')) {
    console.log("🌐 网络错误");
    console.log("  建议: 检查网络连接和代理设置");
  }
  
  // 输出建议
  console.log("\n----- 解决建议 -----");
  console.log("1. 验证API密钥是否正确");
  console.log("2. 确认环境变量OPENAI_API_KEY和OPENAI_API_BASE正确设置");
  console.log("3. 检查账户余额和使用限制");
  console.log("4. 验证所用模型名称");
  console.log("5. 检查网络连接和代理设置");
}

// 运行测试
testApiConnection(); 