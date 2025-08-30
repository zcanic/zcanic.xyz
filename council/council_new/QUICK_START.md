# Council AI 快速开始指南

## 🚀 统一部署管理器

使用统一的部署管理器，避免脚本碎片化：

```bash
# 完整部署（推荐）
./deploy-manager.sh deploy

# 仅构建
./deploy-manager.sh build

# 启动服务
./deploy-manager.sh start

# 查看状态
./deploy-manager.sh status

# 健康检查
./deploy-manager.sh health

# 查看帮助
./deploy-manager.sh help
```

## 📋 部署管理器功能

- `build` - 构建生产版本
- `deploy` - 完整部署（构建 + 配置 + 启动）
- `start` - 启动服务
- `stop` - 停止服务  
- `restart` - 重启服务
- `status` - 查看服务状态
- `check-db` - 检查数据库
- `reset-db` - 重置数据库
- `health` - 健康检查
- `logs` - 查看日志

## 🏭 生产环境部署

对于生产服务器，使用专用部署脚本：

```bash
# 生产环境一键部署
./production-deploy.sh

# 强制部署（非生产环境）
./production-deploy.sh --force
```

生产部署脚本会自动：
1. 停止现有服务
2. 安装依赖
3. 构建生产版本
4. 创建配置文件
5. 启动PM2服务
6. 验证部署

## 🔧 端口配置

- **前端**: 端口 3002 (http://council.zcanic.xyz:3002)
- **后端**: 端口 3001 (需要单独启动)
- **数据库**: 端口 3306

## ⚠️ 重要提醒

### 后端服务
确保原有后端服务运行在 **3001** 端口，提供以下API：
- `/api/health`
- `/api/topics`
- `/api/topics/:id/rounds`
- `/api/rounds/:id/comments`
- `/api/ai/summarize`
- WebSocket连接

### 启动后端示例
```bash
cd /path/to/original/backend
PORT=3001 npm start
# 或者
PORT=3001 pm2 start app.js --name council-backend
```

## 🆘 故障排除

### 常用命令
```bash
# 检查所有服务状态
./check-services.sh

# 查看日志
./view-logs.sh

# 重启服务
./restart-server.sh

# 测试部署
./test-deployment.sh

# 重置数据库
npm run db:reset
```

### 常见问题

1. **端口3000被占用**
   ```bash
   pm2 stop all
   kill -9 $(lsof -t -i:3000)
   ```

2. **数据库字段错误**
   ```bash
   npm run db:reset
   ```

3. **API连接失败**
   - 检查后端是否运行在3001端口
   - 检查防火墙设置

4. **WebSocket连接失败**
   - 确保后端支持WebSocket
   - 检查端口配置

## 📊 验证成功

部署成功后，应该可以：
- 访问 http://council.zcanic.xyz:3002
- API健康检查返回正常
- 数据库连接正常
- WebSocket连接正常

## 📁 重要文件

- `one-click-deploy.sh` - 一键部署脚本
- `deploy-production.sh` - 生产部署脚本
- `check-services.sh` - 服务状态检查
- `fix-websocket-config.sh` - 配置修复
- `test-deployment.sh` - 部署验证
- `.env.production` - 生产环境配置
- `PRODUCTION_DEPLOYMENT_GUIDE.md` - 详细部署指南

## 🎯 下一步

1. 确保后端服务运行在3001端口
2. 运行一键部署脚本
3. 访问应用验证功能
4. 根据需要调整配置