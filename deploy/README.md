# OpenMatrix 部署配置

## 服务器信息

- **域名**: matrix.laofu.online
- **服务器**: ssh root@139.196.85.175
- **架构**: Caddy → frpc → WSL Docker Nginx

## 架构说明

```
用户请求
    ↓
matrix.laofu.online (DNS)
    ↓
云服务器 Caddy (139.196.85.175:443)
    ↓
frpc (反向代理)
    ↓
本地 WSL Docker Nginx
    ↓
OpenMatrix 网站
```

## 部署步骤

### 1. 本地准备 (当前机器)

```bash
# 构建网站 (如果需要)
cd openmatrix-docs/website

# 确保文件就绪
ls -la index.html styles.css main.js
```

### 2. 配置本地 Nginx (WSL Docker)

创建 Nginx 配置文件：

```nginx
# /etc/nginx/sites-available/openmatrix.conf
server {
    listen 80;
    server_name matrix.laofu.online localhost;

    root /var/www/openmatrix/website;
    index index.html;

    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # HTML 不缓存
    location ~* \.html$ {
        expires -1;
        add_header Cache-Control "no-store, no-cache, must-revalidate";
    }

    # 主路由
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 文档路由
    location /docs {
        try_files $uri $uri/ /docs/index.html;
    }
}
```

### 3. Docker Compose 配置

```yaml
# docker-compose.yml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    container_name: openmatrix-nginx
    ports:
      - "8080:80"  # frpc 会转发到这里
    volumes:
      - ../website:/var/www/openmatrix/website:ro
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
    restart: unless-stopped
```

### 4. frpc 配置 (本地机器)

```ini
# frpc.ini
[common]
server_addr = 139.196.85.175
server_port = 7000

[openmatrix-web]
type = http
local_ip = 127.0.0.1
local_port = 8080
custom_domains = matrix.laofu.online
```

### 5. 云服务器 Caddy 配置

```caddyfile
# /etc/caddy/Caddyfile
matrix.laofu.online {
    reverse_proxy 127.0.0.1:7001  # frps 端口

    encode gzip

    header {
        # 安全头
        Strict-Transport-Security "max-age=31536000; include-subdomains; preload"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "SAMEORIGIN"
        X-XSS-Protection "1; mode=block"
    }

    log {
        output file /var/log/caddy/matrix.laofu.online.log
    }
}
```

### 6. 启动服务

#### 本地 (WSL Docker)
```bash
# 启动 Nginx 容器
cd deploy
docker-compose up -d

# 启动 frpc
frpc -c frpc.ini
```

#### 云服务器
```bash
# 启动 frps (如果还没运行)
frps -c /etc/frp/frps.ini

# 重载 Caddy
sudo systemctl reload caddy
```

### 7. 验证部署

```bash
# 检查 DNS 解析
dig matrix.laofu.online

# 检查 HTTPS
curl -I https://matrix.laofu.online

# 检查网站
curl https://matrix.laofu.online
```

## 更新网站

```bash
# 1. 更新代码
git pull

# 2. 重新构建 (如果需要)
# npm run build

# 3. 重启 Nginx 容器
cd deploy
docker-compose restart nginx

# 或直接刷新 (如果使用 volume 映射)
# 不需要重启，文件自动更新
```

## 故障排查

### 网站无法访问
1. 检查 DNS 解析: `dig matrix.laofu.online`
2. 检查 frpc 连接: `frpc -c frpc.ini`
3. 检查 Nginx 状态: `docker logs openmatrix-nginx`

### 502 Bad Gateway
1. 检查 frps 是否运行
2. 检查 frpc 是否连接
3. 检查 Nginx 是否运行

### 静态资源 404
1. 检查文件路径映射
2. 检查 Nginx 配置中的 root 路径

## 相关文件

- `deploy/nginx.conf` - Nginx 配置
- `deploy/docker-compose.yml` - Docker 配置
- `deploy/frpc.ini` - frpc 客户端配置
