# 🚀 部署短剧翻译平台到 Vercel + GitHub Pages

## 📋 部署概览
- **后端 API**: Vercel Serverless Functions (免费)
- **前端界面**: GitHub Pages (免费)
- **数据库**: 内存数据库 (Demo 用)
- **总成本**: 0元/月

## 第一步：部署后端到 Vercel

### 方法一：网页部署（推荐）

1. **访问 Vercel**: https://vercel.com
2. **注册账号** (支持 GitHub 登录)
3. **创建新项目**:
   - 点击 "New Project"
   - 导入 GitHub 仓库 `wyp99999/short-drama-translator`
   - 选择 `vercel-serverless` 目录
   - 点击 "Deploy"

4. **配置项目**:
   - 项目名称: `short-drama-translator-api` (或自定义)
   - 框架预设: 选择 "Other"
   - 构建命令: (留空，Vercel 会自动检测)
   - 输出目录: (留空)

5. **环境变量** (可选):
   ```
   NODE_ENV=production
   ```

6. **点击 "Deploy"** (约1-2分钟完成)

### 方法二：使用 Vercel CLI

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 进入项目目录
cd vercel-serverless

# 部署
vercel --prod
```

## 第二步：获取 Vercel 部署地址

部署完成后，Vercel 会提供：
- **生产地址**: `https://your-app-name.vercel.app`
- **API 地址**: `https://your-app-name.vercel.app/api`

## 第三步：部署前端到 GitHub Pages

### 1. 修改前端配置

在 `frontend/.env.production` 中设置 Vercel API 地址：
```
VITE_API_URL=https://your-app-name.vercel.app/api
VITE_APP_NAME=短剧翻译平台
VITE_APP_VERSION=1.0.0
```

### 2. 构建前端

```bash
cd frontend
npm install
npm run build
```

### 3. 部署到 GitHub Pages

**方法一：通过 GitHub Actions (推荐)**

1. 在仓库根目录创建 `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: |
          cd frontend
          npm ci
          
      - name: Build
        run: |
          cd frontend
          npm run build
          
      - name: Setup Pages
        uses: actions/configure-pages@v4
        
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './frontend/dist'
          
      - name: Deploy to GitHub Pages
        uses: actions/deploy-pages@v4
```

**方法二：手动部署**

1. 将 `frontend/dist` 目录推送到 `gh-pages` 分支
2. 在 GitHub 仓库设置中启用 Pages:
   - Settings → Pages
   - Source: Deploy from a branch
   - Branch: `gh-pages` (或 `main` 的 `/docs` 目录)

## 第四步：配置自定义域名 (可选)

### Vercel 域名配置
1. 在 Vercel 项目设置中点击 "Domains"
2. 添加您的域名 (如: api.short-drama.yourname.com)
3. 按照提示配置 DNS 记录

### GitHub Pages 域名配置
1. 在仓库 Settings → Pages → Custom domain
2. 添加域名 (如: short-drama.yourname.com)
3. 配置 DNS CNAME 记录指向 `username.github.io`

## 📊 部署完成后的访问地址

### 开发环境
- 前端本地: `http://localhost:3002`
- 后端本地: `http://localhost:3001`

### 生产环境
- 前端: `https://wyp99999.github.io/short-drama-translator/`
- 后端 API: `https://your-app-name.vercel.app/api`
- 健康检查: `https://your-app-name.vercel.app/health`

## 🔧 API 接口文档

部署后可用接口:

```
GET    /health                    # 健康检查
GET    /api/projects              # 获取项目列表
POST   /api/projects              # 创建项目
GET    /api/projects/:id          # 获取项目详情
PUT    /api/projects/:id          # 更新项目
DELETE /api/projects/:id          # 删除项目
GET    /api/projects/:id/status   # 获取任务状态
GET    /api/tasks/poll            # 任务轮询 (AI服务)
POST   /api/tasks/:id/complete    # 任务完成 (AI服务)
```

## 💡 功能特性

### ✅ 已实现功能
- 项目创建和管理界面
- 10种语言选择 (中文、英文、日文、韩文等)
- 实时任务状态跟踪
- 模拟翻译进度显示
- 响应式设计 (支持手机和电脑)

### ⚠️ Demo 限制
- 使用内存数据库 (重启后数据丢失)
- 模拟视频翻译 (无实际AI处理)
- 无用户认证系统
- 无实际文件上传 (使用URL代替)

## 🔄 更新部署

### 更新后端 API
```bash
cd vercel-serverless
# 修改代码后
vercel --prod
```

### 更新前端
修改代码后推送到 GitHub，GitHub Actions 会自动部署。

## 📞 技术支持

### 常见问题

1. **CORS 错误**
   - 检查前端 `.env.production` 中的 API 地址
   - 确保 Vercel 允许跨域请求

2. **GitHub Pages 404**
   - 检查仓库 Settings → Pages 配置
   - 确保构建产物在正确目录

3. **Vercel 部署失败**
   - 检查 `vercel.json` 配置
   - 查看部署日志中的错误信息

4. **API 无法访问**
   - 检查 Vercel 项目是否运行正常
   - 访问 `/health` 端点验证服务状态

### 获取帮助
- Vercel 文档: https://vercel.com/docs
- GitHub Pages 文档: https://docs.github.com/pages
- Vue3 文档: https://vuejs.org

## 🎉 开始使用

1. 访问前端地址
2. 点击 "创建新项目"
3. 填写项目信息
4. 选择目标语言
5. 查看模拟翻译进度
6. 完成 Demo 演示！

---

**注意**: 这是 Demo 版本，适合演示和测试。生产环境需要添加数据库、文件存储、用户认证等功能。