# 语音服务部署指南

本文档提供在宝塔面板环境下部署 Zcanic Voice Service 的详细步骤和配置说明。

## 1. 系统要求

- **操作系统**: CentOS 7+ / Ubuntu 18.04+ / Windows Server 2016+
- **Python**: 3.8 或更高版本
- **内存**: 最低 2GB RAM
- **存储**: 最低 10GB 可用空间
- **宝塔面板**: 7.9.0 或更高版本

## 2. 部署流程概述

语音服务部署包含两个主要部分：

1. 配置并启动 Voicevox 引擎
2. 部署 Zcanic Voice Service 微服务
3. 配置 Web 应用连接语音服务

## 3. Voicevox 引擎安装

### 3.1 Windows 服务器

1. 下载 Voicevox 引擎: https://github.com/VOICEVOX/voicevox_engine/releases/latest
2. 解压到服务器上的目录(例如: `C:\voicevox_engine`)
3. 运行 `run.exe` 启动引擎服务

### 3.2 Linux 服务器

使用 Docker 安装（推荐）:

```bash
# 拉取镜像
docker pull voicevox/voicevox_engine:CPU-ubuntu20.04-latest

# 运行容器
docker run -d --name voicevox -p 50021:50021 voicevox/voicevox_engine:CPU-ubuntu20.04-latest
```

## 4. 宝塔面板配置 Python 项目

### 4.1 上传项目文件

1. 登录宝塔面板
2. 创建站点(例如: `voice.zcanic.xyz`)
3. 使用 SFTP 工具上传 `voice_app` 目录到站点根目录

### 4.2 安装 Python 环境

1. 在宝塔面板中，进入【软件商店】
2. 安装 Python 项目管理器
3. 添加新的 Python 项目:
   - 项目路径: `/www/wwwroot/voice.zcanic.xyz/voice_app`
   - Python 版本: 3.8+
   - 启动方式: `python -m voice_app.run_service`
   - 端口: 8000

### 4.3 配置项目环境

1. 进入项目管理，点击【设置】，添加项目环境变量:

```
VOICEVOX_ENGINE_URL=http://localhost:50021  # 本地Voicevox引擎地址
SERVER_HOST=0.0.0.0
SERVER_PORT=8000
API_KEY=your_secure_random_key   # 设置一个安全的API密钥
AI_API_KEY=your_openai_api_key   # OpenAI API密钥
```

2. 在项目目录下创建配置文件:

```bash
cd /www/wwwroot/voice.zcanic.xyz/voice_app
cp config.example.env .env
```

3. 安装依赖包:

```bash
pip install -r requirements.txt
```

### 4.4 配置反向代理

1. 在宝塔面板中，进入【网站】，点击语音服务站点的【设置】
2. 选择【反向代理】，添加新的代理规则:

```
代理名称: voice-api
目标URL: http://127.0.0.1:8000
代理目录: /api
```

3. 添加音频文件访问代理:

```
代理名称: voice-audio
目标URL: http://127.0.0.1:8000/audio_storage/
代理目录: /audio_storage
```

### 4.5 配置 HTTPS (推荐)

1. 在宝塔面板中，进入【网站】，点击语音服务站点
2. 点击【SSL】，申请或上传 SSL 证书
3. 开启【强制 HTTPS】选项

## 5. 主网站配置

在主网站的后端服务中配置环境变量以连接语音服务:

### 5.1 修改 .env 文件

在主网站的 `.env` 文件中添加:

```
# 语音服务配置
VOICE_SERVICE_URL=https://voice.zcanic.xyz  # 语音服务URL，使用您的实际域名
VOICE_API_KEY=your_secure_random_key        # 与上面设置的API_KEY相同
```

### 5.2 重启后端服务

```bash
# 重启Node.js服务
pm2 restart app_name  # 替换为您的应用名称
```

## 6. 多端适配注意事项

语音服务已经针对不同设备（PC、平板、手机）进行了响应式设计适配。以下是确保良好用户体验的额外配置:

### 6.1 移动设备优化

1. 在宝塔面板中，进入【网站】，点击语音服务站点的【设置】
2. 在【性能】选项卡中，开启【Gzip 压缩】，减少音频文件传输大小
3. 开启【页面缓存】，提高静态资源加载速度

### 6.2 音频文件缓存策略

在 Nginx 配置中添加以下内容:

```nginx
location /audio_storage/ {
    add_header Cache-Control "public, max-age=604800";  # 一周缓存
    proxy_cache nginx_cache;
    proxy_cache_valid 200 7d;
    proxy_pass http://127.0.0.1:8000/audio_storage/;
}
```

## 7. 故障排除

### 7.1 常见问题

#### Voicevox 引擎无法连接

检查 Voicevox 引擎是否正在运行，并确认端口是否正确:

```bash
# 检查端口是否打开
netstat -tulpn | grep 50021

# Docker版本检查容器状态
docker ps | grep voicevox
```

#### 语音服务启动失败

检查日志文件:

```bash
cat /www/wwwroot/voice.zcanic.xyz/voice_app/logs/app.log
```

#### 音频无法播放

1. 检查浏览器控制台错误
2. 确认反向代理配置正确
3. 验证音频文件是否存在于存储目录中

### 7.2 健康检查

添加一个定时任务定期检查语音服务健康状态:

1. 在宝塔面板中，进入【计划任务】，添加 Shell 脚本任务
2. 设置执行周期为每 5 分钟
3. 添加以下脚本内容:

```bash
#!/bin/bash
response=$(curl -s https://voice.zcanic.xyz/api/health)
status=$(echo $response | grep -o '"status":"[^"]*"' | cut -d'"' -f4)

if [ "$status" != "healthy" ]; then
    echo "语音服务异常，正在重启..."
    cd /www/wwwroot/voice.zcanic.xyz/voice_app
    pip install -r requirements.txt  # 确保依赖完整
    python -m voice_app.run_service &
fi
```

## 8. 性能优化

### 8.1 内存使用优化

如果服务器内存有限，可以调整 Voicevox 引擎的启动参数:

```bash
# Docker模式下限制内存使用
docker run -d --name voicevox -p 50021:50021 --memory=1g voicevox/voicevox_engine:CPU-ubuntu20.04-latest
```

### 8.2 并发请求优化

在 `voice_app/config/config_local.yaml` 文件中添加:

```yaml
server:
  max_concurrent_requests: 5 # 根据服务器性能调整
  request_timeout_seconds: 60
```

## 9. 监控与维护

### 9.1 设置监控告警

1. 在宝塔面板中，进入【监控】
2. 添加新的监控项，监控语音服务的 CPU 和内存使用情况
3. 设置当 CPU 使用率超过 80% 或内存使用超过 90% 时发送告警

### 9.2 日志轮转

确保日志不会占用过多磁盘空间:

```bash
# 创建logrotate配置
cat > /etc/logrotate.d/voice_service << EOF
/www/wwwroot/voice.zcanic.xyz/voice_app/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 644 root root
}
EOF
```

## 10. 安全措施

### 10.1 防火墙设置

1. 在宝塔面板中，进入【安全】，配置防火墙
2. 仅开放必要的端口(80, 443)，关闭内部服务端口(8000, 50021)的外部访问

### 10.2 API 密钥保护

确保 API 密钥足够复杂并定期更换。推荐使用随机生成的长密钥:

```bash
# 生成一个安全的随机密钥
openssl rand -base64 32
```

## 11. 定期备份

### 11.1 配置文件备份

在宝塔面板中设置备份任务，确保以下文件/目录定期备份:

```
/www/wwwroot/voice.zcanic.xyz/voice_app/config/
/www/wwwroot/voice.zcanic.xyz/voice_app/.env
```

### 11.2 声音缓存备份

设置定期备份音频文件目录:

```
/www/wwwroot/voice.zcanic.xyz/voice_app/audio_storage/
```

---

如有问题，请联系技术支持或提交 Issue 到项目仓库。
