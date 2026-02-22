# Railway 专用 Dockerfile
FROM node:18-alpine

WORKDIR /app

# 安装系统依赖
RUN apk add --no-cache python3 make g++

# 复制 package 文件
COPY backend/package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制后端代码
COPY backend/ ./

# 创建必要的目录
RUN mkdir -p /app/data /app/logs /app/uploads

# 暴露端口
EXPOSE 3001

# 启动命令
CMD ["node", "server.js"]