#!/bin/bash
# 短剧翻译服务部署脚本

set -e

echo "🚀 开始部署短剧翻译服务..."

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，正在安装 Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    echo "✅ Docker 安装完成"
fi

# 检查 Docker Compose 是否安装
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose 未安装，正在安装..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose 安装完成"
fi

# 创建必要的目录
echo "📁 创建数据目录..."
sudo mkdir -p /data/short-drama-translator/{uploads,logs,data}
sudo chmod -R 777 /data/short-drama-translator

# 复制项目文件
echo "📦 复制项目文件..."
if [ -d "/opt/short-drama-translator" ]; then
    echo "🔄 更新现有项目..."
    cd /opt/short-drama-translator
    git pull origin main || echo "⚠️  无法更新，使用现有文件"
else
    echo "📥 克隆项目..."
    sudo git clone https://github.com/your-repo/short-drama-translator.git /opt/short-drama-translator || {
        echo "⚠️  无法克隆，使用本地文件"
        # 这里需要手动上传项目文件
    }
fi

cd /opt/short-drama-translator

# 创建生产环境配置文件
echo "⚙️  创建生产环境配置..."
cat > .env << EOF
NODE_ENV=production
DB_PATH=/app/data/app.db
REDIS_HOST=redis
REDIS_PORT=6379
LOG_LEVEL=info
MAX_FILE_SIZE=524288000
UPLOAD_DIR=/app/uploads
LOG_DIR=/app/logs
EOF

# 启动服务
echo "🚀 启动 Docker 服务..."
sudo docker-compose down || true
sudo docker-compose build --no-cache
sudo docker-compose up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
echo "🔍 检查服务状态..."
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ 后端服务运行正常"
else
    echo "❌ 后端服务启动失败"
    sudo docker-compose logs backend
    exit 1
fi

if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ 前端服务运行正常"
else
    echo "❌ 前端服务启动失败"
    sudo docker-compose logs frontend
    exit 1
fi

echo ""
echo "🎉 部署完成！"
echo ""
echo "📊 服务信息："
echo "   前端访问：http://服务器IP:3000"
echo "   后端API：http://服务器IP:3001"
echo "   健康检查：http://服务器IP:3001/health"
echo ""
echo "📝 常用命令："
echo "   查看日志：sudo docker-compose logs -f"
echo "   停止服务：sudo docker-compose down"
echo "   重启服务：sudo docker-compose restart"
echo "   更新服务：sudo docker-compose pull && sudo docker-compose up -d"