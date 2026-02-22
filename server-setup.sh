#!/bin/bash
# 云服务器初始化脚本

set -e

echo "🛠️  开始初始化云服务器..."

# 更新系统
echo "🔄 更新系统包..."
sudo apt update && sudo apt upgrade -y

# 安装基础工具
echo "📦 安装基础工具..."
sudo apt install -y \
    curl \
    wget \
    git \
    vim \
    htop \
    net-tools \
    ufw \
    fail2ban \
    unattended-upgrades

# 配置防火墙
echo "🔥 配置防火墙..."
sudo ufw --force enable
sudo ufw allow 22/tcp        # SSH
sudo ufw allow 80/tcp        # HTTP
sudo ufw allow 443/tcp       # HTTPS
sudo ufw allow 3000/tcp      # 前端服务
sudo ufw allow 3001/tcp      # 后端服务
sudo ufw reload

# 配置 SSH 安全
echo "🔐 配置 SSH 安全..."
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin no/' /etc/ssh/sshd_config
sudo systemctl restart sshd

# 配置时区
echo "⏰ 配置时区..."
sudo timedatectl set-timezone Asia/Shanghai

# 配置自动安全更新
echo "🛡️  配置自动安全更新..."
sudo dpkg-reconfigure -plow unattended-upgrades

# 安装 Docker
echo "🐳 安装 Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 安装 Docker Compose
echo "📦 安装 Docker Compose..."
DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep tag_name | cut -d'"' -f4)
sudo curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 安装 Nginx (用于反向代理)
echo "🌐 安装 Nginx..."
sudo apt install -y nginx

# 安装 Certbot (用于 SSL 证书)
echo "🔐 安装 Certbot..."
sudo apt install -y certbot python3-certbot-nginx

# 创建应用目录
echo "📁 创建应用目录..."
sudo mkdir -p /opt/apps
sudo chown -R $USER:$USER /opt/apps

# 配置系统优化
echo "⚡ 配置系统优化..."

# 增加文件描述符限制
echo "* soft nofile 65536" | sudo tee -a /etc/security/limits.conf
echo "* hard nofile 65536" | sudo tee -a /etc/security/limits.conf

# 增加系统连接数
echo "net.core.somaxconn = 65535" | sudo tee -a /etc/sysctl.conf
echo "net.ipv4.tcp_max_syn_backlog = 65535" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# 创建监控脚本
echo "📊 创建监控脚本..."
cat > /opt/scripts/monitor.sh << 'EOF'
#!/bin/bash
echo "=== 系统监控报告 ==="
echo "时间: $(date)"
echo ""
echo "CPU 使用率:"
top -bn1 | grep "Cpu(s)" | awk '{print $2 "%"}'
echo ""
echo "内存使用:"
free -h
echo ""
echo "磁盘使用:"
df -h
echo ""
echo "Docker 容器状态:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "服务健康检查:"
curl -s http://localhost:3001/health || echo "后端服务不可用"
EOF

chmod +x /opt/scripts/monitor.sh

# 创建备份脚本
echo "💾 创建备份脚本..."
cat > /opt/scripts/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backup/short-drama-translator"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

echo "开始备份..."
docker exec $(docker ps -q -f name=short-drama-translator-backend) tar czf /tmp/backup.tar.gz /app/data /app/uploads 2>/dev/null || true
docker cp $(docker ps -q -f name=short-drama-translator-backend):/tmp/backup.tar.gz $BACKUP_DIR/backup_$DATE.tar.gz

# 备份数据库
docker exec $(docker ps -q -f name=short-drama-translator-redis) redis-cli SAVE 2>/dev/null || true
docker cp $(docker ps -q -f name=short-drama-translator-redis):/data/dump.rdb $BACKUP_DIR/redis_$DATE.rdb 2>/dev/null || true

echo "备份完成: $BACKUP_DIR/backup_$DATE.tar.gz"
EOF

chmod +x /opt/scripts/backup.sh

# 配置定时任务
echo "⏰ 配置定时任务..."
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/scripts/backup.sh") | crontab -
(crontab -l 2>/dev/null; echo "*/5 * * * * /opt/scripts/monitor.sh > /var/log/monitor.log 2>&1") | crontab -

echo ""
echo "🎉 服务器初始化完成！"
echo ""
echo "📋 下一步操作："
echo "1. 重启服务器: sudo reboot"
echo "2. 上传项目文件到 /opt/apps/short-drama-translator"
echo "3. 运行部署脚本: bash deploy.sh"
echo "4. 配置域名和 SSL 证书"
echo ""
echo "🔧 已安装的服务："
echo "   ✅ Docker & Docker Compose"
echo "   ✅ Nginx"
echo "   ✅ Certbot (SSL)"
echo "   ✅ UFW 防火墙"
echo "   ✅ Fail2ban"
echo "   ✅ 监控和备份脚本"