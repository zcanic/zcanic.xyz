// 测试taskManager的buildConversationHistory函数
const fs = require('fs');
const path = require('path');
const logger = require('./utils/logger');
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

// 输出文件路径
const outputFile = path.join(__dirname, 'taskmanager-test-output.txt');

async function testBuildConversationHistory() {
  console.log("\n===== TaskManager测试 =====\n");
  
  try {
    console.log("正在构建会话历史...");
    const { messages, username } = await taskManager.buildConversationHistory(
      mockPool, 
      'test-session-id', 
      'test-user-id',
      {}
    );
    
    console.log(`\n测试结果:`);
    console.log(`- 用户名: ${username}`);
    console.log(`- 总消息数: ${messages.length}`);
    
    // 检查系统消息
    const systemMessage = messages.find(msg => msg.role === 'system');
    if (systemMessage) {
      console.log("\n系统消息内容已保存到文件");
      
      // 保存到文件
      fs.writeFileSync(outputFile, systemMessage.content, 'utf8');
      console.log(`文件路径: ${outputFile}`);
      console.log(`文件大小: ${systemMessage.content.length} 字符`);
      
      // 检查关键元素
      const keyPhrases = ['猫娘zcanic', '主人', '喵～', '<think>', '动作与情感'];
      console.log("\n关键元素检查:");
      keyPhrases.forEach(phrase => {
        const included = systemMessage.content.includes(phrase);
        console.log(`- "${phrase}": ${included ? '✓ 包含' : '✗ 未包含'}`);
      });
    } else {
      console.log("\n错误: 找不到系统消息");
    }
    
    console.log("\n✅ 测试完成");
  } catch (error) {
    console.error(`\n❌ 测试失败: ${error.message}`);
    console.error(error.stack);
  }
}

// 运行测试
testBuildConversationHistory(); 