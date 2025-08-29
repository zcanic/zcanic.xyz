// 测试系统提示配置
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const logger = require('./utils/logger');
const { DEFAULT_SYSTEM_PROMPT } = require('./config/prompts');
const taskManager = require('./utils/taskManager');

// 模拟数据库连接池
const mockPool = {
  query: async (sql, params) => {
    // 模拟查询结果
    if (sql.includes('chat_messages')) {
      return [[
        { role: 'user', content: '你好，你是谁？' },
        { role: 'assistant', content: '我是zcanic，主人的专属猫娘喵～有什么可以帮到你的吗？' }
      ]];
    } else if (sql.includes('users')) {
      return [[{ username: '测试用户' }]];
    }
    return [[]];
  }
};

// 生成输出文件路径
const outputDir = path.join(__dirname, 'logs');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}
const outputFile = path.join(outputDir, 'system_prompt_test.txt');

// 写入文件函数
function writeToFile(content) {
  fs.writeFileSync(outputFile, content, 'utf8');
  console.log(`\n已将完整内容写入文件: ${outputFile}`);
}

async function testSystemPrompt() {
  console.log("\n===== 系统提示测试 =====\n");
  
  const output = [];
  output.push("===== 系统提示测试结果 =====\n");
  
  try {
    // 测试默认系统提示
    console.log("默认系统提示内容预览 (前100字符):");
    console.log(DEFAULT_SYSTEM_PROMPT.substring(0, 100) + "...\n");
    
    output.push("默认系统提示原始内容:");
    output.push(DEFAULT_SYSTEM_PROMPT);
    output.push("\n");
    
    // 测试buildConversationHistory函数
    console.log("正在构建会话历史...");
    const { messages, username } = await taskManager.buildConversationHistory(
      mockPool, 
      'test-session-id', 
      'test-user-id',
      {}
    );
    
    // 打印详细信息
    console.log(`\n系统提示测试结果:`);
    console.log(`- 用户名: ${username}`);
    console.log(`- 总消息数: ${messages.length}`);
    
    output.push(`用户名: ${username}`);
    output.push(`总消息数: ${messages.length}`);
    
    // 检查角色分布
    const roles = messages.reduce((acc, msg) => {
      acc[msg.role] = (acc[msg.role] || 0) + 1;
      return acc;
    }, {});
    
    console.log("\n消息角色分布:");
    output.push("\n消息角色分布:");
    
    Object.entries(roles).forEach(([role, count]) => {
      console.log(`- ${role}: ${count} 条消息`);
      output.push(`- ${role}: ${count} 条消息`);
    });
    
    // 打印系统消息内容
    const systemMessage = messages.find(msg => msg.role === 'system');
    if (systemMessage) {
      console.log("\n系统消息预览 (前100字符):");
      console.log(systemMessage.content.substring(0, 100) + "...");
      
      output.push("\n处理后的系统消息内容:");
      output.push(systemMessage.content);
      
      // 检查关键元素是否包含在提示中
      const keyPhrases = ['猫娘zcanic', '主人', '喵～', '<think>', '动作与情感'];
      console.log("\n关键元素检查:");
      output.push("\n关键元素检查:");
      
      keyPhrases.forEach(phrase => {
        const included = systemMessage.content.includes(phrase);
        console.log(`- "${phrase}": ${included ? '✅ 包含' : '❌ 未包含'}`);
        output.push(`- "${phrase}": ${included ? '包含' : '未包含'}`);
      });
    } else {
      console.log("\n❌ 错误: 找不到系统消息");
      output.push("\n错误: 找不到系统消息");
    }
    
    // 写入文件
    writeToFile(output.join('\n'));
    
    console.log("\n✅ 测试完成");
  } catch (error) {
    console.error(`\n❌ 测试失败: ${error.message}`);
    console.error(error.stack);
    
    output.push("\n测试失败:");
    output.push(error.stack);
    writeToFile(output.join('\n'));
  }
}

// 运行测试
(async function() {
  await testSystemPrompt();
  console.log("测试结束。");
})(); 