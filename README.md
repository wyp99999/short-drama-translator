# 短剧多语言智能翻译应用

## 项目介绍

星幕—多语言短剧出海平台，支持短剧视频的多语言智能翻译，提供项目管理、视频上传、实时翻译状态跟踪等功能。

## 项目结构

```
short-drama-translator/
├── backend/                 # Node.js 后端服务
│   ├── config/             # 配置管理
│   ├── controllers/        # 控制器
│   ├── database/           # SQLite数据库
│   ├── middleware/         # 中间件
│   ├── models/            # 数据模型
│   ├── routes/            # 路由
│   ├── services/          # 服务层
│   ├── utils/             # 工具函数
│   ├── uploads/           # 上传文件存储
│   ├── logs/              # 日志文件
│   ├── data/              # 数据库存储
│   ├── server.js          # 主入口
│   └── package.json
├── frontend/              # Vue3 前端应用
│   ├── src/
│   │   ├── api/          # API服务
│   │   ├── components/   # 组件
│   │   ├── views/        # 页面
│   │   └── router/       # 路由
│   ├── nginx.conf        # Nginx配置
│   ├── Dockerfile        # 前端Dockerfile
│   └── package.json
├── scripts/               # 启动脚本
├── docker-compose.yml     # Docker编排
└── README.md
```

## 架构说明

### 被动式任务处理架构

```
前端(Vue) ←→ 后端(Node) ←→ AI翻译服务
   ↑轮询        ↑主动请求      (主动拉取任务)
                ↑提交结果      (主动推送结果)
```

**工作流程：**
1. 用户创建项目 → 后端创建pending任务
2. AI服务定期轮询 `/api/tasks/poll` 获取任务
3. AI服务处理完成后调用 `/api/tasks/:id/complete` 提交结果
4. 前端每5秒轮询项目状态，更新UI

## 快速启动

### Docker部署（推荐）

```bash
# 1. 克隆项目后，进入目录
cd short-drama-translator

# 2. 启动所有服务
docker-compose up -d

# 3. 访问应用
# 前端: http://localhost:3000
# 后端: http://localhost:3001
# 健康检查: http://localhost:3001/health
```

### 本地开发

```bash
# 1. 安装后端依赖
cd backend
npm install
npm run db:init

# 2. 安装前端依赖
cd ../frontend
npm install

# 3. 启动后端（端口3001）
cd backend
npm run dev

# 4. 启动前端（端口3002）
cd frontend
npm run dev

# 5. 访问应用
# 打开浏览器访问: http://localhost:3002
```

## 生产环境配置

### 环境变量

在 `backend/.env` 中配置：

```bash
NODE_ENV=production
PORT=3001
DB_PATH=./data/app.db
REDIS_HOST=redis
REDIS_PORT=6379
LOG_LEVEL=info
MAX_FILE_SIZE=524288000
```

### Docker健康检查

```bash
# 检查服务状态
curl http://localhost:3001/health

# 检查详细指标
curl http://localhost:3001/health/metrics
```

## API接口

### 前端接口
- `GET /api/projects` - 获取项目列表
- `POST /api/projects` - 创建项目（含文件上传）
- `PUT /api/projects/:id` - 更新项目
- `DELETE /api/projects/:id` - 删除项目
- `GET /api/projects/:id/status` - 获取任务状态
- `GET /api/projects/:id/preview` - 获取预览信息

### AI服务接口
- `GET /api/tasks/poll` - 获取待处理任务
- `POST /api/tasks/:id/complete` - 提交翻译结果

### 健康检查
- `GET /health` - 服务健康状态
- `GET /health/metrics` - 系统指标

## 功能特性

✅ 项目CRUD管理  
✅ 视频文件上传（mp4/mkv）  
✅ 多语言选择（10种语言）  
✅ 实时任务状态轮询  
✅ 视频预览功能  
✅ 额度消耗计算  
✅ 已译制语言锁定  

### 生产级特性

✅ SQLite数据库持久化  
✅ Redis任务队列  
✅ 结构化日志（Winston）  
✅ Helmet安全头  
✅ API限流保护  
✅ Docker容器化部署  
✅ 健康检查端点  
✅ 标准化API响应  

## 技术栈

- **前端**: Vue 3 + Vite + Axios
- **后端**: Node.js + Express + Multer
- **数据库**: SQLite3 (better-sqlite3)
- **队列**: Redis + Bull
- **日志**: Winston + winston-daily-rotate-file
- **安全**: Helmet + express-rate-limit
- **部署**: Docker + Docker Compose

## 常用命令

```bash
# Docker
docker-compose up -d          # 启动
docker-compose down            # 停止
docker-compose logs -f         # 查看日志
docker-compose ps              # 查看状态

# 本地
cd backend && npm run dev      # 开发模式
cd backend && npm run db:init  # 初始化数据库
```

## 目录说明

| 目录 | 说明 |
|------|------|
| backend/data | SQLite数据库文件 |
| backend/logs | 日志文件（按天轮转） |
| backend/uploads | 用户上传的视频文件 |
| frontend/dist | 构建后的静态文件 |

## 许可证

MIT
