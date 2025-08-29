module.exports = {
  apps : [{
    name   : "server", // 你的应用名 (保持和之前一致)
    script : "server.js", // 入口文件
    cwd    : "/www/wwwroot/www.zcanic.xyz/server/", // 确保这是你的后端项目目录
    env_production: { // 为生产环境设置环境变量
       NODE_ENV: "production" // 设置 NODE_ENV 为 production
    },
    // 你可以根据需要添加其他 PM2 配置，比如：
    // watch: true, // 是否监听文件变动自动重启 (生产环境慎用)
    // max_memory_restart: '1G', // 内存限制
    // exec_mode: 'cluster', // 如果需要集群模式 (需要代码支持)
    // instances: 'max',   // 集群实例数
  }]
}; 