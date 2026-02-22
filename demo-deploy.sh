#!/bin/bash
# Demo 演示部署脚本 - 简化版

echo "🚀 开始部署短剧翻译 Demo 服务..."

# 创建临时目录
DEMO_DIR="/tmp/short-drama-demo"
rm -rf $DEMO_DIR
mkdir -p $DEMO_DIR

echo "📦 准备项目文件..."

# 复制后端文件
cp -r backend $DEMO_DIR/
cp -r frontend $DEMO_DIR/

# 创建简化版 docker-compose
cat > $DEMO_DIR/docker-compose.yml << 'EOF'
version: '3.8'

services:
  backend:
    build: 
      context: ./backend
      dockerfile: Dockerfile.demo
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=demo
      - DB_PATH=/app/data/app.db
      - REDIS_HOST=localhost
      - REDIS_PORT=6379
      - LOG_LEVEL=info
    volumes:
      - backend-data:/app/data
      - backend-uploads:/app/uploads
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.demo
    ports:
      - "3000:80"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  backend-data:
  backend-uploads:
EOF

# 创建 Demo 版后端 Dockerfile
cat > $DEMO_DIR/backend/Dockerfile.demo << 'EOF'
FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN mkdir -p /app/data /app/uploads

# 修改配置使用内存 Redis
RUN sed -i "s/host: process.env.REDIS_HOST || 'localhost'/host: 'localhost'/g" config/index.js
RUN sed -i "s/port: parseInt(process.env.REDIS_PORT) || 6379/port: 6379/g" config/index.js

EXPOSE 3001

CMD ["node", "server.js"]
EOF

# 创建 Demo 版前端 Dockerfile
cat > $DEMO_DIR/frontend/Dockerfile.demo << 'EOF'
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
EOF

echo "✅ 项目文件准备完成"
echo ""
echo "📋 部署选项："
echo ""
echo "1. Railway 部署 (推荐)"
echo "   前端: Vercel"
echo "   后端: Railway"
echo "   数据库: Railway PostgreSQL"
echo ""
echo "2. Render 部署"
echo "   全栈: Render"
echo "   数据库: Render PostgreSQL"
echo ""
echo "3. 本地 Docker 运行"
echo "   需要本地安装 Docker"
echo ""
echo "请选择部署方式 (1/2/3): "
read choice

case $choice in
  1)
    echo "🚀 开始 Railway 部署..."
    echo ""
    echo "请按以下步骤操作："
    echo ""
    echo "1. 访问 https://railway.app 注册账号"
    echo "2. 创建新项目"
    echo "3. 选择 'Deploy from GitHub repo'"
    echo "4. 选择您的仓库"
    echo "5. Railway 会自动部署"
    echo ""
    echo "前端部署到 Vercel："
    echo "1. 访问 https://vercel.com"
    echo "2. 导入前端项目"
    echo "3. 配置环境变量："
    echo "   VITE_API_URL=https://您的-railway-域名.railway.app"
    ;;
  2)
    echo "🚀 开始 Render 部署..."
    echo ""
    echo "请按以下步骤操作："
    echo ""
    echo "1. 访问 https://render.com 注册账号"
    echo "2. 点击 'New +' -> 'Web Service'"
    echo "3. 连接您的 GitHub 仓库"
    echo "4. 配置："
    echo "   - Name: short-drama-translator"
    echo "   - Environment: Docker"
    echo "   - Plan: Free"
    echo "5. 点击 'Create Web Service'"
    ;;
  3)
    echo "🐳 本地 Docker 运行..."
    cd $DEMO_DIR
    if ! command -v docker &> /dev/null; then
      echo "❌ Docker 未安装"
      exit 1
    fi
    docker-compose up -d
    echo ""
    echo "✅ 服务已启动："
    echo "   前端: http://localhost:3000"
    echo "   后端: http://localhost:3001"
    ;;
  *)
    echo "❌ 无效选择"
    exit 1
    ;;
esac

echo ""
echo "🎉 部署指南完成！"
echo ""
echo "📞 如果需要我直接帮您操作部署，请提供："
echo "   1. GitHub 账号（用于连接仓库）"
echo "   2. Railway/Vercel/Render 账号"