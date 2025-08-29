// 测试chatController中的参数处理
require('dotenv').config();

// 复制自chatController.js的formatAiSettings函数
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

// 测试案例
function runControllerTests() {
  console.log('\n===== 测试chatController参数处理 =====\n');
  
  const testCases = [
    {
      name: '正常完整参数',
      params: {
        model: 'deepseek-ai/DeepSeek-R1', 
        temperature: 0.7, 
        maxTokens: 2000, 
        systemPrompt: '你是一个助手'
      }
    },
    {
      name: 'maxTokens为null',
      params: {
        model: 'deepseek-ai/DeepSeek-R1', 
        temperature: 0.7, 
        maxTokens: null, 
        systemPrompt: '你是一个助手'
      }
    },
    {
      name: '字符串数值',
      params: {
        model: 'deepseek-ai/DeepSeek-R1', 
        temperature: '0.5', 
        maxTokens: '1500', 
        systemPrompt: '你是一个助手'
      }
    },
    {
      name: '无效数值',
      params: {
        model: 'deepseek-ai/DeepSeek-R1', 
        temperature: 'invalid', 
        maxTokens: 'not-a-number', 
        systemPrompt: '你是一个助手'
      }
    },
    {
      name: '空字符串和边界值',
      params: {
        model: '', 
        temperature: 1.5, 
        maxTokens: -100, 
        systemPrompt: ''
      }
    },
    {
      name: '未定义的参数',
      params: {
        model: 'deepseek-ai/DeepSeek-R1'
        // 其他参数未定义
      }
    }
  ];
  
  // 运行测试
  testCases.forEach(testCase => {
    console.log(`\n>> 测试: ${testCase.name}`);
    console.log('输入:', JSON.stringify(testCase.params, null, 2));
    
    const p = testCase.params;
    const result = formatAiSettings(p.model, p.temperature, p.maxTokens, p.systemPrompt);
    
    console.log('结果:', JSON.stringify(result, null, 2));
    
    // 验证特定参数
    if (result.maxTokens !== undefined) {
      console.log(`maxTokens处理: 类型=${typeof result.maxTokens}, 值=${result.maxTokens === null ? 'null' : result.maxTokens}`);
    } else {
      console.log('maxTokens: 未设置');
    }
    
    if (result.temperature !== undefined) {
      console.log(`temperature处理: 类型=${typeof result.temperature}, 值=${result.temperature}`);
    } else {
      console.log('temperature: 未设置');
    }
  });
  
  console.log('\n===== 测试结束 =====\n');
}

// 运行测试
runControllerTests(); 