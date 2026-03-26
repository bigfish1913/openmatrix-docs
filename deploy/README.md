# OpenMatrix 部署配置

## 服务器要求

- Ubuntu 20.04+ 或 CentOS 8+
- 2GB+ RAM
- 20GB+ 磁盘空间
- 公网 IP 地址

## 部署步骤

### 1. 服务器准备

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装依赖
sudo apt install -y nginx certbot python3-certbot-nginx

# 创建网站目录
sudo mkdir -p /var/www/openmatrix/website
```

### 2. 配置 Nginx

```bash
# 生成配置
./deploy.sh nginx your-domain.com

# 启用站点
sudo ln -s /etc/nginx/sites-available/openmatrix /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重载 Nginx
sudo systemctl reload nginx
```

### 3. 配置 SSL

```bash
# 使用 Let's Encrypt
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 自动续期
sudo systemctl enable certbot.timer
```

### 4. 部署网站

```bash
# 从本地部署
./deploy.sh deploy user@your-server your-domain.com
```

## 环境变量

创建 `.env` 文件：

```env
DOMAIN=your-domain.com
SERVER=user@your-server
SSL_EMAIL=admin@your-domain.com
```

## CI/CD 集成

项目包含 GitHub Actions 配置，推送到 main 分支会自动部署。

## 监控

推荐配置：
- Uptime monitoring: UptimeRobot / Pingdom
- Error tracking: Sentry
- Analytics: Plausible / Umami

## 需要的信息

在部署之前，请提供：

1. **域名**: 您的域名是什么？
2. **服务器**: 服务器的 SSH 地址是什么？(格式: user@ip 或 user@domain)
3. **SSL 邮箱**: 用于 Let's Encrypt 证书通知的邮箱地址？
