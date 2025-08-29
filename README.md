# Zcanic.xyz - 现代几何风格全栈博客项目

一个包含 React 前端、Express 后端、MySQL 数据库以及 AI 集成的个人全栈博客项目，采用现代几何与磨砂玻璃设计风格。

## 重大更新说明（2023-10-28）

为了提高系统提示管理的一致性，我们进行了以下升级：

1. **统一的提示管理**: 前端现在从后端 API 获取系统提示，确保前后端使用相同的提示文本
2. **性能优化**: 添加了服务器端缓存，减少不必要的请求
3. **错误处理增强**: 添加了完善的错误处理和回退机制，确保即使在 API 失败的情况下系统也能正常工作
4. **多端适配**: 确保在手机、平板和 PC 上都有良好的用户体验

这些改进使得只需在后端配置文件中修改系统提示，就能同时更新前后端，大大简化了维护工作。

## 重大更新说明（2023-09-25）

为了进一步优化性能和减小前端体积，我们进行了彻底的动画系统重构：

1. **去除重型动画库依赖**：完全移除了 anime.js 和 Three.js 依赖，替换为原生 Web Animation API 和 CSS 动画
2. **轻量化背景实现**：将原来的 3D WebGL 背景替换为纯 CSS 实现的动态背景，大幅减少渲染性能消耗
3. **兼容性接口**：保留了兼容的动画 API 接口，确保现有组件不需要大规模重构
4. **包体积优化**：移除大型依赖后，前端构建包体积减少约 800KB

详细的重构说明请查看 [ANIMATION_REFACTOR.md](./ANIMATION_REFACTOR.md)。

## 重大更新说明（2023-09-15）

为了提高用户体验和系统稳定性，我们进行了以下重大改进：

1. **异步聊天处理系统**：聊天请求现在将在后端异步处理，用户不再需要等待 AI 响应，可以在请求发出后继续浏览网站或关闭浏览器
2. **异步每日喵语**：每日喵语生成也采用异步处理，大幅提高了前端响应速度
3. **可靠的任务追踪**：新增任务跟踪系统，允许前端随时查询后台任务状态
4. **数据持久化**：新增多个数据表支持聊天会话和消息的存储，即使服务器重启也不会丢失数据
5. **优雅的错误处理**：任务失败时会记录详细错误信息，便于调试和修复

这些改进不仅提高了系统的可靠性和用户体验，还解决了网络波动导致的请求失败问题。

## 重大变更说明（2023-09-05）

为了解决严重的性能问题和错误，我们进行了以下重大改进：

1. **移除 Three.js 背景**：取代原复杂的 3D 背景，我们改用简单的 CSS 渐变实现更流畅的体验
2. **简化动画系统**：移除了自定义的 anime.js 实现，改用更轻量的 CSS 过渡和 Framer Motion
3. **精简主题切换**：重写了主题上下文，改善了黑暗/光明模式切换的性能
4. **删除不必要组件**：移除了动画展示页面和相关组件，专注于核心功能

这些改动大幅提高了网站性能和稳定性，减少了加载时间，并修复了之前的错误。

## 主要功能

- 用户认证 (注册、登录、登出，使用 JWT + HttpOnly Cookie)
- 博客/日记系统 (创建、查看列表、查看详情、删除，支持 Markdown，图片上传)
- AI 聊天机器人 (基于 OpenAI API 或兼容接口，支持上下文记忆)
- 定制化内容推荐
- 评论系统 (支持对博客文章进行评论)
- 记忆系统 (AI 长期记忆 - 结构化数据库)
- 每日喵语 (AI 生成的每日内容，超时设为 600 秒)
- 管理功能 (部分接口需要管理员权限)
- 文件上传 (图片)

## 最新更新 🚀

- **动画系统重构**: 使用 Web Animation API 和 CSS 动画替代 anime.js 和 Three.js
- **性能优化**: 通过移除重型库显著提高了性能和减小了包体积
- **每日猫语优化**: 将请求超时时间延长至 600 秒，避免前端过快报错无法连接服务器
- **界面一致性增强**: 解决了背景闪烁问题和毛玻璃效果延迟出现的问题
- **组件复用改进**: 抽取 `GeometricBackground` 和 `backdropBlurClass` 为可复用组件
- **页面转场优化**: 改进了页面切换体验，提供更流畅的过渡效果
- **错误处理增强**: 改进了 API 错误处理，提供更友好的用户提示

## 现代几何与磨砂玻璃 UI 设计系统

Zcanic.xyz 采用了时尚的几何与磨砂玻璃风格设计系统，以创造视觉冲击力和专业感：

### 设计特点

- **色彩系统**:

  - 主色调: 渐变的靛蓝色 (indigo) 和蓝色 (blue)
  - 辅助色: 粉色 (pink)、黄色 (amber)、天蓝色 (sky)
  - 装饰性几何图形: 使用半透明的彩色几何形状创造层次感
  - 亮暗模式适配: 自动根据用户偏好切换亮暗色彩方案
  - 渐变配色: 大量使用渐变增强视觉效果

- **视觉层次**:

  - 磨砂玻璃效果 (backdrop-blur-xl) 营造深度感
  - 大胆的圆角设计 (rounded-xl, rounded-2xl)
  - 半透明层叠效果
  - 轻量阴影增强立体感
  - 几何形状作为背景和装饰元素

- **动画效果**:

  - 精心设计的微交互动画
  - 使用 Framer Motion 实现平滑过渡
  - 页面元素的交错动画
  - 按钮和卡片的反馈动画
  - 优化性能的轻量级动画

- **专业体验**:

  - 现代化的组件设计
  - 统一的视觉语言
  - 一致的间距和尺寸系统
  - 高对比度文本提升可读性
  - 高品质视觉呈现

- **响应式设计**:
  - 完美适配桌面、平板和移动设备
  - 针对不同设备的布局优化
  - 触摸友好的交互元素尺寸

### 主题组件库

项目包含一系列采用几何和磨砂玻璃风格的现代 UI 组件:

#### 基础组件

- `Logo`: 现代几何风格的品牌标识
- `Card`: 磨砂玻璃效果卡片组件，支持多种变体
- `Input`: 增强型输入框组件，提供清晰的交互反馈
- `Button`: 渐变风格按钮组件
- `MessageList`: 几何风格的聊天消息组件
- `Navbar`: 磨砂玻璃效果导航栏组件
- `Footer`: 现代页脚组件

#### 布局组件

- `PageLayout`: 带有几何背景的页面布局组件
- `PageTransition`: 优化的页面转场动画组件
- `AuthLayout`: 登录/注册专用布局，带有几何背景
- `LoadingContent`: 加载状态显示，保持背景一致性

#### 表单组件

- `FormField`: 表单字段组件，带有标签和错误提示
- `Checkbox`: 现代复选框组件
- `RadioGroup`: 单选组件
- `Select`: 下拉选择框
- `Switch`: 开关组件

#### 反馈组件

- `Toast`: 轻量级提示组件
- `Modal`: 磨砂玻璃风格模态对话框
- `Alert`: 提示条组件，多种类型（信息、成功、警告、错误）

### 设计元素

- **磨砂玻璃效果**:

```jsx
className =
  "backdrop-blur-md bg-white/70 dark:bg-slate-800/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg";
```

- **渐变色彩**:

```jsx
className = "bg-gradient-to-r from-indigo-500 to-blue-500";
```

- **几何装饰**:

```jsx
<div
  className="absolute left-0 bottom-0 w-2/3 h-2/3 bg-pink-400/40"
  style={{ clipPath: "polygon(0 100%, 0 0, 100% 100%)" }}
/>
```

- **精细阴影**:

```jsx
className = "shadow-md hover:shadow-lg transition-all";
```

## 技术栈

### 前端

- **核心**: React, Vite, Tailwind CSS
- **状态管理**: React Context API
- **路由**: React Router v7
- **请求处理**: Axios
- **动画**: Framer Motion
- **组件库**: shadcn/ui (部分组件)
- **Markdown**: react-markdown, remark-gfm
- **代码高亮**: react-syntax-highlighter
- **图标**: Lucide React
- **通知**: react-hot-toast

### 后端

- **服务器**: Node.js, Express
- **数据库**: MySQL (mysql2/promise)
- **认证**: JWT (存储于 HttpOnly Cookie)
- **密码加密**: bcrypt
- **验证**: express-validator
- **文件上传**: multer
- **安全**: helmet, cors, express-rate-limit
- **日志**: Winston
- **定时任务**: node-cron
- **AI 集成**: OpenAI Node.js SDK

## 项目结构 (概述)

```
/dist          # 前端构建输出目录
/public        # 前端静态资源和上传文件存储
  /uploads     # 上传文件存储目录
/server         # 后端代码
  /config       # 配置文件 (数据库, Multer, OpenAI)
  /controllers  # Express 控制器 (业务逻辑)
  /db           # 数据库连接与初始化
  /logs         # 日志文件
  /middleware   # Express 中间件 (认证, 错误处理, 验证)
  /models       # 数据库 schema 定义
  /public/uploads # 后端处理的上传文件存储
  /routes       # Express 路由定义
  /utils        # 工具函数 (日志, AI 交互)
  server.js     # 后端入口文件
/src            # 前端 React 源代码
  /animations   # 动画相关组件、钩子和工具
  /components   # React 组件
    /ui         # UI 组件库
    /common     # 通用组件
    /layout     # 布局组件
    /sections   # 页面分区组件
  /context      # React Context (Auth, Theme, Blog, Chat)
  /hooks        # 自定义 Hooks
  /lib          # shadcn/ui 组件库相关
  /pages        # 页面级组件
  /services     # API 调用封装 (api.js)
  /styles       # 全局样式
  /utils        # 前端工具函数
  App.jsx       # 前端主应用组件与路由
  main.jsx      # 前端入口文件
```

## 环境准备与运行

**后端:**

1.  **Node.js**: 确保安装了 Node.js (推荐 LTS 版本)。
2.  **MySQL**: 确保 MySQL 服务器正在运行，并已创建数据库。
3.  **环境变量**: 在 `server` 目录下创建 `.env` 文件，主要包含以下必要配置:
    - `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_DATABASE`: 数据库配置
    - `JWT_SECRET`: 一个足够长且随机的安全密钥
    - `PORT`: 后端监听端口，默认 3001
    - `OPENAI_API_KEY`: 用于 AI 功能的 OpenAI API 密钥
    - `UPLOAD_DIR`: 文件上传的绝对或相对路径
    - `CORS_ORIGIN`: 部署时应设为前端的访问地址
4.  **安装依赖**: `cd server && npm install`
5.  **运行**: `cd server && node server.js` (或使用 `pm2 start ecosystem.config.js` 部署)

**前端:**

1.  **Node.js**: 确保安装了 Node.js (推荐 LTS 版本)。
2.  **安装依赖**: 在项目根目录运行 `npm install`
3.  **开发模式**: `npm run dev`
4.  **构建生产包**: `npm run build` (输出到 `dist` 目录)
5.  **预览生产包**: `npm run preview`

## API 端点 (主要)

(所有路径基于后端的 `/api` 前缀)

- **认证 (`/auth`)**
  - `POST /register`: 用户注册
  - `POST /login`: 用户登录 (设置 HttpOnly Cookie)
  - `POST /logout`: 用户登出 (清除 Cookie)
  - `GET /me`: 获取当前用户信息 (通过 Cookie 验证)
- **博客 (`/posts`)**
  - `GET /`: 获取博客列表 (支持 `?search=` 查询参数)
  - `GET /:id`: 获取单篇博客详情
  - `POST /`: 创建新博客 (需认证)
  - `DELETE /:id`: 删除博客 (需认证和权限)
- **评论 (`/posts/:postId/comments`)**
  - `GET /`: 获取某篇博客的所有评论
  - `POST /`: 为某篇博客添加评论 (需认证)
  - `DELETE /:commentId`: 删除评论 (需认证和权限)
- **AI (`/ai`)**
  - `POST /chat`: 发送聊天消息，进行 AI 对话 (需认证)
- **记忆 (`/memory`)**
  - `GET /`: 获取当前用户的记忆 (需认证)
  - `POST /`: 添加记忆 (计划中)
- **喵语 (`/fortune`)**
  - `GET /`: 获取当前用户的每日喵语 (需认证，每日 4am CST 更新周期)
  - `POST /manual-trigger`: 手动触发喵语更新 (需认证和密码，或管理员权限)
- **上传 (`/upload`)**
  - `POST /image`: 上传图片文件 (需认证)

## 性能与安全优化

- **前端优化**:

  - 代码分割与懒加载 (React.lazy, Suspense)
  - 组件记忆化 (useMemo, React.memo)
  - 静态资源优化
  - 动画性能优化

- **后端优化**:

  - 数据库索引优化
  - 连接池管理
  - 请求超时动态调整
  - 错误处理增强

- **安全措施**:
  - JWT 存储在 HttpOnly Cookie
  - 输入验证与净化
  - 安全 HTTP 头 (helmet)
  - 密码哈希存储 (bcrypt)
  - CORS 保护
  - 请求速率限制

## 注意事项

- **安全**: JWT 密钥、数据库密码等敏感信息务必通过 `.env` 文件管理，切勿硬编码或提交到版本控制。
- **部署**: 部署时注意配置 `CORS_ORIGIN` 环境变量，允许前端域名访问。使用 PM2 管理后端进程，配置 Nginx 等反向代理将请求正确转发到前后端。
- **数据库初始化**: 后端服务启动时会自动检查并创建所需的数据库表结构。确保已创建数据库本身，表结构会自动初始化。
- **Cookie 认证**: 本项目使用 HttpOnly Cookie 进行身份验证，确保前端请求设置了 `withCredentials: true` 选项。
- **主题切换**: 支持亮色/暗色主题切换，并与系统主题偏好同步。

## 已知问题和下一步计划

详见 [TODO.md](./TODO.md) 文件，包含当前已知问题、计划功能和优先级排序。

## 设计灵感与致谢

- 现代几何风格和磨砂玻璃效果灵感来自当代 UI 设计趋势
- 感谢所有开源库和组件的贡献者
- UI 配色灵感源自现代数码产品的色彩美学
- 特别感谢 Framer Motion 提供流畅的动画解决方案
- 感谢 Tailwind CSS 提供灵活的样式系统

## 技术文档

查看 [TECHNICAL_SPEC.md](./TECHNICAL_SPEC.md) 了解项目的详细技术规格和实现细节。

# Zcanic Voice Service

中文文本到日语语音转换服务，整合 AI 翻译和 Voicevox 语音合成引擎。

这是 Zcanic.xyz 网站的语音生成服务，可以将中文文本转换为日语语音，通过 RESTful API 提供服务。

## 功能特点

- ✅ 中文到日语的高质量翻译 (使用 OpenAI API)
- ✅ 日语语音合成 (使用 Voicevox 引擎)
- ✅ 简单易用的 RESTful API
- ✅ 内置缓存系统提高性能和减少资源消耗
- ✅ 灵活配置 (YAML 文件 + 环境变量)
- ✅ 完整的日志系统

## 系统要求

- Python 3.8+
- Voicevox Engine (需要单独安装)
- OpenAI API 密钥 (用于翻译)

## 快速开始

1. 安装依赖：

```bash
pip install -r voice_app/requirements.txt
```

2. 配置服务：

   - 复制示例环境变量文件：
     ```bash
     cp voice_app/config.example.env .env
     ```
   - 编辑`.env`文件，填入 OpenAI API 密钥和其他设置

3. 启动服务：

```bash
python run_voice_service.py
```

4. 测试服务：

```bash
# 列出所有可用的说话人
python voice_app/test_client.py --list-speakers

# 测试文本到语音功能
python voice_app/test_client.py --text "你好，这是一段测试文本"
```

5. 打开浏览器访问 API 文档：

```
http://localhost:8000/docs
```

## 项目结构

```
voice_app/
├── api/                # API相关代码
│   ├── models.py       # 请求/响应模型
│   └── routes.py       # API路由
├── config/             # 配置文件
│   └── default_config.yaml
├── services/           # 核心服务
│   ├── translator.py   # 翻译服务
│   ├── voicevox.py     # Voicevox集成
│   └── tts_service.py  # TTS服务协调器
├── utils/              # 工具函数
│   ├── config.py       # 配置管理
│   └── logger.py       # 日志配置
├── main.py             # 应用入口
├── run_service.py      # 命令行入口
└── test_client.py      # 测试客户端
```

更多详细文档请查看 [voice_app/README.md](voice_app/README.md)

```

```
