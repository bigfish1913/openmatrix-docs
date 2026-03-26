# OpenMatrix 部署指南

## 架构概览

```
用户请求
    ↓
matrix.laofu.online (DNS)
    ↓
云服务器 Caddy (139.196.85.175:443)
    ↓
frps → frpc (反向代理隧道)
    ↓
WSL Docker Nginx (localhost:8080)
    ↓
OpenMatrix 静态网站
```

## 部署步骤

### 步骤 1: 在 WSL 中启动 Docker

```bash
# 进入项目目录 (根据您的实际路径调整)
cd /mnt/c/Users/bigfish/Projects/openmatrix-docs/deploy

# 运行部署脚本
chmod +x deploy-wsl.sh
./deploy-wsl.sh

# 或手动启动
docker compose up -d
```

### 步骤 2: 确保 frpc 连接

在 WSL 中运行 frpc：

```bash
# 检查 frpc 配置
cat frpc.ini

# 启动 frpc (根据您的 frpc 安装位置)
./frpc -c frpc.ini

# 或如果 frpc 在系统路径中
frpc -c frpc.ini
```

### 步骤 3: 验证云服务器 Caddy

SSH 到云服务器：

```bash
ssh root@139.196.85.175
```

检查 Caddy 配置：

```bash
# 查看 Caddy 配置
cat /etc/caddy/Caddyfile

# 应该包含:
# matrix.laofu.online {
#     reverse_proxy 127.0.0.1:8080
# }

# 重载 Caddy
systemctl reload caddy
```

### 步骤 4: 验证访问

打开浏览器访问：https://matrix.laofu.online

## 快速命令参考

### 本地 (WSL)

```bash
# 启动服务
cd deploy && docker compose up -d

# 查看日志
docker compose logs -f

# 停止服务
docker compose down

# 重启服务
docker compose restart

# 更新网站 (如果使用 volume 映射，自动更新)
# 如果需要手动更新:
docker compose restart nginx
```

### 云服务器

```bash
# SSH 连接
ssh root@139.196.85.175

# 检查 Caddy 状态
systemctl status caddy

# 检查 frps 状态
systemctl status frps

# 查看 Caddy 日志
journalctl -u caddy -f
```

## 故障排查

### 网站无法访问

1. **检查 DNS**:
   ```bash
   dig matrix.laofu.online
   # 应该返回 139.196.85.175
   ```

2. **检查本地 Nginx**:
   ```bash
   curl http://localhost:8080
   ```

3. **检查 frpc 连接**:
   ```bash
   # 查看 frpc 日志
   frpc -c frpc.ini
   ```

4. **检查云服务器 Caddy**:
   ```bash
   ssh root@139.196.85.175
   systemctl status caddy
   ```

### 502 Bad Gateway

1. frpc 未连接到 frps
2. 本地 Nginx 未运行
3. 端口配置不匹配

### 静态资源 404

1. 检查 volume 映射路径
2. 检查 Nginx 配置中的 root 路径

## 文件清单

```
deploy/
├── docker-compose.yml  # Docker 配置
├── nginx.conf          # Nginx 配置
├── frpc.ini            # frpc 客户端配置
├── Caddyfile           # 云服务器 Caddy 配置
├── deploy-wsl.sh       # WSL 部署脚本
└── README.md           # 本文件
```

## GitHub 推送 (稍后执行)

```bash
# 添加远程仓库
git remote add origin https://github.com/YOUR_USERNAME/openmatrix-docs.git

# 推送代码
git push -u origin master
```
