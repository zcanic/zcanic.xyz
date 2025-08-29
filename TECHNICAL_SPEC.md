# Zcanic.xyz 技术规格文档

本文档用于记录项目关键模块的技术设计、决策和实现细节。

## 1. 概述

Zcanic.xyz 是一个基于 React 和 Node.js 的全栈应用，提供 AI 聊天、博客（日记）管理、评论系统、AI 长期记忆、每日喵语和用户认证功能。强调安全、模块化和响应式设计。应用采用现代几何与磨砂玻璃设计风格，提供流畅的用户体验。

## 2. 架构

### 2.1 前端架构

- **框架**：React (使用 Vite 构建)
- **路由**：React Router DOM v7
- **样式**：Tailwind CSS + 自定义组件
- **动画**：Framer Motion
- **状态管理**：React Context API (分离为 AuthContext, ThemeContext, BlogContext, ChatContext)
- **API 集成**：Axios (通过 `src/services/api.js` 封装，含拦截器)
- **UI 框架**：shadcn/ui (部分组件)
- **组件库**：
  - **响应式设计**：适配桌面、平板和移动设备
  - **基础组件**：Button, Input, Card, Modal 等
  - **专用组件**：MessageList, ChatInput, LoadingContent 等
- **Markdown 渲染**：react-markdown, remark-gfm
- **代码高亮**：react-syntax-highlighter
- **图标库**：Lucide React
- **通知系统**：react-hot-toast

### 2.2 后端架构

- **框架**：Node.js, Express
- **数据库**：MySQL (通过 mysql2/promise 访问)
- **认证**：JWT (存储于 HttpOnly Cookie)
- **中间件**：
  - cors (限制请求来源)
  - helmet (设置安全 HTTP 头)
  - express-validator (输入验证)
  - express-rate-limit (API 请求限速)
  - multer (文件上传处理)
- **日志**：Winston
- **密码哈希**：bcrypt
- **定时任务**：node-cron
- **AI SDK**：openai Node.js Library
- **环境变量**：dotenv

### 2.3 通信流程

- 前端通过 Axios 发起 HTTP 请求到后端 API
- 认证基于 HttpOnly Cookie 中的 JWT
- API 请求动态设置超时，尤其对于 AI 相关操作（最长 600 秒）
- 错误处理在全局拦截器中统一处理
- 响应数据在前端 Context 中统一管理

## 3. 核心模块详解

### 3.1 认证模块

- **API 端点**：
  - `POST /api/auth/register` - 用户注册
  - `POST /api/auth/login` - 用户登录（设置 HttpOnly Cookie）
  - `POST /api/auth/logout` - 用户登出（清除 Cookie）
  - `GET /api/auth/me` - 获取当前用户信息（通过 Cookie 验证）
- **前端实现**：
  - `AuthContext` 管理认证状态 (user, isAuthenticated)
  - 组件挂载时通过 `checkAuthStatus()` 验证当前登录状态
  - 登录/登出操作通过 API 处理，状态在 Context 中更新
- **安全考量**：
  - 使用 HttpOnly Cookie 存储 JWT，缓解 XSS 攻击
  - Cookie 在生产环境中设置 secure 标志
  - 所有认证相关 API 使用 express-validator 验证输入

### 3.2 聊天模块 (AI)

- **API 端点**：`POST /api/ai/chat` (需要认证)
- **实现流程**：
  - 前端通过 `ChatContext` 管理消息历史和设置
  - 发送消息时调用 `api.js` 中的 `chatCompletion`
  - 后端 `aiController` 通过 OpenAI SDK 处理请求
  - 超时时间设置为 120 秒，避免长时间等待
- **集成记忆系统**：
  - 通过 `memoryController` 获取用户记忆
  - 将记忆注入到 AI 系统提示中，提供上下文
- **UI 组件**：
  - `ChatInterface` - 主聊天界面
  - `MessageList` - 消息展示组件
  - `ChatInput` - 用户输入组件
  - `SettingsPanel` - AI 设置面板

### 3.3 记忆模块

- **API 端点**：
  - `GET /api/memory` - 获取用户记忆
  - `POST /api/memory` - 添加记忆（计划中）
- **数据结构**：
  - 记忆类型：`fact`(事实), `preference`(偏好), `summary`(总结)
  - 每条记忆包含 content, type, 创建时间和最后访问时间
- **集成方式**：
  - 记忆在 AI 生成回复前获取并注入到系统提示
  - 使用 MySQL 存储，计划升级到向量数据库优化检索

### 3.4 博客模块

- **API 端点**：
  - `GET /api/posts` - 获取博客列表（支持搜索）
  - `GET /api/posts/:id` - 获取单篇博客
  - `POST /api/posts` - 创建博客（需认证）
  - `DELETE /api/posts/:id` - 删除博客（需认证和权限）
- **前端实现**：
  - `BlogContext` 管理博客状态和操作
  - 支持 Markdown 编辑和渲染
  - 支持图片上传和展示
- **数据结构**：
  - 标题、内容、图片 URL、作者信息、创建时间
  - 支持全文搜索（MySQL FULLTEXT 索引）

### 3.5 评论模块

- **API 端点**：
  - `GET /api/posts/:postId/comments` - 获取指定博客的评论
  - `POST /api/posts/:postId/comments` - 添加评论（需认证）
- **数据结构**：
  - 支持嵌套评论（通过 parent_comment_id）
  - 包含内容、作者、创建时间
- **前端组件**：
  - `CommentSection` - 评论区组件
  - `CommentForm` - 评论表单组件

### 3.6 每日喵语模块

- **API 端点**：
  - `GET /api/fortune` - 获取每日喵语（超时设置为 600 秒）
  - `POST /api/fortune/manual-trigger` - 手动触发生成（需密码或管理员权限）
- **实现细节**：
  - 使用 node-cron 每日自动生成新的喵语
  - 基于 OpenAI API 生成个性化内容
  - 针对每用户每天生成一条唯一喵语

### 3.7 图片上传功能

- **API 端点**：`POST /api/upload/image` (需要认证)
- **处理流程**：
  - 前端通过 FormData 构建上传请求
  - 后端 multer 中间件处理文件存储
  - 返回图片的相对 URL 供前端使用
- **安全考量**：
  - 验证文件类型和大小
  - 配置适当的访问权限
  - 生成唯一文件名避免覆盖

## 4. 设计系统

### 4.1 视觉风格

- **色彩系统**:
  - 主色调: 渐变的靛蓝色 (indigo) 和蓝色 (blue)
  - 辅助色: 粉色 (pink)、黄色 (amber)、天蓝色 (sky)
  - 暗色模式: 适应不同浏览环境的配色方案
- **视觉层次**:
  - 磨砂玻璃效果 (backdrop-blur-xl)
  - 圆角设计 (rounded-xl, rounded-2xl)
  - 半透明层叠效果增强深度感
  - 几何形状作为背景装饰元素
- **动画效果**:
  - 使用 Framer Motion 的流畅过渡动画
  - 页面转场动画优化用户体验
  - 微交互动画增强反馈感

### 4.2 组件复用

- **几何背景组件**:
  - `GeometricBackground` - 可配置的几何背景装饰
  - `backdropBlurClass` - 统一的磨砂玻璃效果类
- **布局组件**:
  - `PageTransition` - 页面过渡动画
  - `LoadingContent` - 加载状态显示
- **UI 组件**:
  - 基础按钮、输入框等采用一致的设计语言
  - 磨砂玻璃效果卡片和模态框

## 5. 项目结构

```
.
├── dist/                 # 前端构建输出
├── public/               # 静态资源
│   └── uploads/          # 上传文件存储目录
├── server/               # 后端代码
│   ├── config/           # 配置 (multer, openai, paths)
│   ├── controllers/      # 控制器 (auth, post, ai, upload, comment, memory, fortune)
│   ├── db/               # 数据库 (database.js - 连接与初始化)
│   ├── middleware/       # 中间件 (authMiddleware, validators)
│   ├── models/           # 数据库模型定义
│   ├── public/           # 静态文件根目录
│   │   └── uploads/      # 上传文件存储目录
│   ├── routes/           # 路由定义
│   ├── utils/            # 工具 (logger, aiUtils)
│   ├── .env              # 环境变量 (!! 不提交 !!)
│   ├── ecosystem.config.js # PM2 配置文件
│   ├── package.json      # 后端依赖
│   └── server.js         # Express 主文件
├── src/                  # 前端 React 源代码
│   ├── animations/       # 动画相关
│   ├── components/       # UI 组件
│   │   ├── common/       # 通用组件
│   │   ├── layout/       # 布局组件
│   │   ├── sections/     # 页面区块组件
│   │   └── ui/           # 基础 UI 组件
│   ├── context/          # React Context (Auth, Theme, Blog, Chat)
│   ├── hooks/            # 自定义 Hooks
│   ├── lib/              # shadcn/ui 相关
│   ├── pages/            # 页面级组件
│   ├── services/         # API 服务 (api.js)
│   ├── styles/           # CSS (globals.css)
│   ├── utils/            # 前端工具函数
│   ├── App.jsx           # 主应用组件和路由
│   └── main.jsx          # React 应用入口
├── .gitignore            # Git 忽略配置
├── index.html            # HTML 入口
├── vite.config.js        # Vite 配置
├── tailwind.config.js    # Tailwind 配置
├── postcss.config.js     # PostCSS 配置
├── components.json       # shadcn/ui 配置
├── jsconfig.json         # JavaScript 配置
├── package.json          # 前端依赖和脚本
├── README.md             # 项目说明文档
├── TECHNICAL_SPEC.md     # 技术规格文档
└── TODO.md               # 待办事项和问题记录
```

## 6. 数据库结构

系统使用 MySQL 数据库，包含以下主要表结构：

### 6.1 users

- `id`: INT, PRIMARY KEY, AUTO_INCREMENT
- `username`: VARCHAR(50), UNIQUE, NOT NULL
- `password_hash`: VARCHAR(255), NOT NULL
- `role`: ENUM('user', 'admin'), DEFAULT 'user'
- `created_at`: TIMESTAMP, DEFAULT CURRENT_TIMESTAMP

### 6.2 blog_posts

- `id`: INT, PRIMARY KEY, AUTO_INCREMENT
- `user_id`: INT, FOREIGN KEY (users.id), NOT NULL
- `title`: VARCHAR(255), NOT NULL
- `content`: TEXT, NOT NULL
- `imageUrl`: VARCHAR(255)
- `created_at`: TIMESTAMP, DEFAULT CURRENT_TIMESTAMP
- `updated_at`: TIMESTAMP, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
- 索引: `idx_blog_posts_user_id`, `FULLTEXT ft_title_content`

### 6.3 comments

- `id`: INT, PRIMARY KEY, AUTO_INCREMENT
- `post_id`: INT, FOREIGN KEY (blog_posts.id), NOT NULL
- `user_id`: INT, FOREIGN KEY (users.id), NOT NULL
- `parent_comment_id`: INT, FOREIGN KEY (comments.id), NULL
- `content`: TEXT, NOT NULL
- `created_at`: TIMESTAMP, DEFAULT CURRENT_TIMESTAMP
- `updated_at`: TIMESTAMP, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
- 索引: `idx_comments_post_id`, `idx_comments_user_id`

### 6.4 daily_fortunes

- `id`: INT, PRIMARY KEY, AUTO_INCREMENT
- `user_id`: INT, FOREIGN KEY (users.id), NOT NULL
- `content`: TEXT
- `generated_at`: DATE, NOT NULL
- `created_at`: TIMESTAMP, DEFAULT CURRENT_TIMESTAMP
- `updated_at`: TIMESTAMP, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
- 唯一约束: `unique_fortune_per_day` (user_id, generated_at)

### 6.5 user_memories

- `id`: INT, PRIMARY KEY, AUTO_INCREMENT
- `user_id`: INT, FOREIGN KEY (users.id), NOT NULL
- `memory_type`: ENUM('fact', 'preference', 'summary'), DEFAULT 'fact'
- `memory_content`: TEXT, NOT NULL
- `created_at`: TIMESTAMP, DEFAULT CURRENT_TIMESTAMP
- `last_accessed_at`: TIMESTAMP, NULL
- 索引: `idx_user_memories_user_id`

## 7. 性能优化

- **前端优化**:

  - 代码分割与懒加载 (React.lazy, Suspense)
  - 组件记忆化 (useMemo, React.memo)
  - 静态资源优化 (图片压缩, CDN)
  - 动画性能优化 (Framer Motion)

- **后端优化**:

  - 数据库索引优化
  - 连接池管理
  - 缓存机制 (计划实现)
  - 并发请求控制

- **API 请求优化**:
  - 动态超时设置 (针对不同类型请求)
  - 错误处理与重试机制
  - 请求拦截器统一管理

## 8. 安全性

- **认证**: 使用 JWT 存储在 HttpOnly Cookie 中，增强对 XSS 攻击的防护。
- **API 密钥**: OpenAI API Key 仅在后端使用，不在前端暴露。
- **输入验证**: 使用 `express-validator` 对所有用户输入进行验证。
- **HTTP 安全头**: 使用 `helmet` 设置安全相关的 HTTP 头。
- **密码存储**: 使用 `bcrypt` 对密码进行哈希存储。
- **CORS 保护**: 配置 CORS 限制来源。
- **速率限制**: 使用 `express-rate-limit` 防止暴力攻击。
- **权限检查**: 对关键操作进行用户权限验证。
- **错误处理**: 全局错误处理避免敏感信息泄露。

## 9. 部署注意事项

- **环境变量**: 后端部署时必须在服务器环境中设置必要的环境变量 (`DB_*`, `JWT_SECRET`, `OPENAI_API_KEY` 等)。
- **Nginx 配置**: 反向代理 `/api` 到 Node 后端，并配置 SPA 的 URL 重写规则。
- **CORS 配置**: 生产环境需配置 `cors` 限制来源 (通过 `CORS_ORIGIN` 环境变量)。
- **文件权限**: Node 进程需有上传目录的写权限。
- **PM2 管理**: 使用 PM2 管理 Node.js 进程，配置文件为 `ecosystem.config.js`。
- **数据库初始化**: 确保数据库已创建，表结构会在服务启动时自动初始化。
- **HTTPS**: 在生产环境使用 HTTPS 协议，确保数据传输安全。

## 10. 最新更新与改进

- **每日猫语优化**: 将请求超时时间延长至 600 秒，避免前端报错。
- **背景闪烁问题修复**: 通过 `LoadingContent` 组件解决界面切换时的背景闪烁问题。
- **毛玻璃效果优化**: 调整 blur 效果应用时机，确保界面一致性。
- **组件共享**: 抽取 `GeometricBackground` 和 `backdropBlurClass` 为可复用组件。
- **页面转场优化**: 改进 `PageTransition` 组件，提供更流畅的页面切换体验。
- **错误处理加强**: 细化 API 错误处理，提供更友好的用户提示。

## 11. 未来规划

详见 [TODO.md](./TODO.md) 文件，包含具体的优先级排序和实现计划。
