// 简单测试脚本，将系统提示写入文件
const fs = require('fs');
const path = require('path');
const { DEFAULT_SYSTEM_PROMPT } = require('./config/prompts');

// 在当前目录创建输出文件
const outputFile = path.join(__dirname, 'system-prompt-output.txt');

// 写入文件
fs.writeFileSync(outputFile, DEFAULT_SYSTEM_PROMPT, 'utf8');

console.log(`系统提示已写入文件: ${outputFile}`);
console.log(`文件长度: ${DEFAULT_SYSTEM_PROMPT.length} 字符`);
console.log(`前200个字符预览: ${DEFAULT_SYSTEM_PROMPT.substring(0, 200)}`); 