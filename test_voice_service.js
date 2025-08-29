/**
 * Zcanic Voice Service 测试脚本
 * 用于测试语音服务的连通性和基本功能
 * 使用方法: node test_voice_service.js
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 配置参数
const config = {
  // 从环境变量或命令行参数中获取URL和API密钥
  voiceServiceUrl: process.env.VOICE_SERVICE_URL || 'http://localhost:8000',
  apiKey: process.env.VOICE_API_KEY || '',
  // 测试文本
  testText: '这是一个语音服务测试，请问一切正常吗？',
  messageId: `test-${Date.now()}`
};

// 彩色输出函数
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// 显示测试配置
function showConfig() {
  log('===== 语音服务测试 =====', colors.cyan);
  log(`语音服务URL: ${config.voiceServiceUrl}`, colors.yellow);
  log(`API密钥: ${config.apiKey ? '已设置' : '未设置'}`, colors.yellow);
  log(`测试文本: "${config.testText}"`, colors.yellow);
  log('------------------------', colors.cyan);
}

// 测试健康状态
async function testHealth() {
  try {
    log('\n1. 测试健康状态...', colors.blue);
    
    const response = await axios.get(`${config.voiceServiceUrl}/api/health`, {
      headers: config.apiKey ? { 'x-api-key': config.apiKey } : {}
    });
    
    if (response.data && response.data.status === 'healthy') {
      log('✓ 健康状态检查通过', colors.green);
      log(`  服务版本: ${response.data.version || '未知'}`);
      
      // 检查组件状态
      if (response.data.components) {
        log('  组件状态:');
        for (const [component, status] of Object.entries(response.data.components)) {
          const statusColor = status ? colors.green : colors.red;
          log(`    - ${component}: ${status ? '正常' : '异常'}`, statusColor);
        }
      }
      
      return true;
    } else {
      log('✗ 健康状态检查失败', colors.red);
      log(`  响应: ${JSON.stringify(response.data)}`);
      return false;
    }
  } catch (error) {
    log('✗ 健康状态检查出错', colors.red);
    log(`  错误: ${error.message}`);
    if (error.response) {
      log(`  状态码: ${error.response.status}`);
      log(`  响应: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

// 测试语音生成
async function testVoiceGeneration() {
  try {
    log('\n2. 测试语音生成...', colors.blue);
    
    const startTime = Date.now();
    const response = await axios.post(`${config.voiceServiceUrl}/api/tts`, {
      text: config.testText,
      message_id: config.messageId
    }, {
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey ? { 'x-api-key': config.apiKey } : {})
      }
    });
    
    const duration = Date.now() - startTime;
    
    if (response.data && response.data.success) {
      log('✓ 语音生成成功', colors.green);
      log(`  处理时间: ${duration}ms / 服务端报告: ${response.data.duration_ms}ms`);
      log(`  翻译结果: ${response.data.translated_text}`);
      log(`  音频URL: ${response.data.audio_url}`);
      
      // 尝试下载音频文件
      return await downloadAudio(response.data.audio_url);
    } else {
      log('✗ 语音生成失败', colors.red);
      log(`  响应: ${JSON.stringify(response.data)}`);
      return false;
    }
  } catch (error) {
    log('✗ 语音生成出错', colors.red);
    log(`  错误: ${error.message}`);
    if (error.response) {
      log(`  状态码: ${error.response.status}`);
      log(`  响应: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

// 下载音频文件
async function downloadAudio(audioUrl) {
  try {
    log('\n3. 下载音频文件...', colors.blue);
    
    // 构建完整URL
    const fullUrl = audioUrl.startsWith('http') 
      ? audioUrl 
      : `${config.voiceServiceUrl}${audioUrl}`;
    
    log(`  下载地址: ${fullUrl}`);
    
    // 创建输出目录
    const outputDir = path.join(__dirname, 'test_output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // 提取文件名
    const filename = path.basename(audioUrl);
    const outputPath = path.join(outputDir, filename);
    
    // 下载文件
    const response = await axios.get(fullUrl, {
      responseType: 'stream',
      headers: config.apiKey ? { 'x-api-key': config.apiKey } : {}
    });
    
    // 写入文件
    const writer = fs.createWriteStream(outputPath);
    response.data.pipe(writer);
    
    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        const stats = fs.statSync(outputPath);
        log('✓ 音频文件下载成功', colors.green);
        log(`  保存路径: ${outputPath}`);
        log(`  文件大小: ${(stats.size / 1024).toFixed(2)}KB`);
        resolve(true);
      });
      writer.on('error', (err) => {
        log('✗ 音频文件下载失败', colors.red);
        log(`  错误: ${err.message}`);
        reject(err);
      });
    });
  } catch (error) {
    log('✗ 音频文件下载出错', colors.red);
    log(`  错误: ${error.message}`);
    return false;
  }
}

// 主测试流程
async function runTests() {
  showConfig();
  
  // 测试健康状态
  const healthOk = await testHealth();
  if (!healthOk) {
    log('\n健康检查失败，跳过后续测试', colors.red);
    return;
  }
  
  // 测试语音生成和下载
  const voiceOk = await testVoiceGeneration();
  
  // 测试结果汇总
  log('\n===== 测试结果汇总 =====', colors.cyan);
  log(`健康状态检查: ${healthOk ? '通过 ✓' : '失败 ✗'}`, healthOk ? colors.green : colors.red);
  log(`语音生成测试: ${voiceOk ? '通过 ✓' : '失败 ✗'}`, voiceOk ? colors.green : colors.red);
  log('========================', colors.cyan);
  
  if (healthOk && voiceOk) {
    log('\n所有测试通过，语音服务工作正常! 🎉', colors.green);
  } else {
    log('\n部分测试失败，请检查配置和日志', colors.red);
    process.exit(1);
  }
}

// 执行测试
runTests().catch(error => {
  log(`\n测试过程中发生错误: ${error.message}`, colors.red);
  process.exit(1);
}); 