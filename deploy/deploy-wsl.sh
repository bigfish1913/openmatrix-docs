#!/bin/bash
# OpenMatrix WSL 部署脚本
# 在 WSL 中运行此脚本

set -e

echo "🚀 OpenMatrix 部署脚本 (WSL)"
echo "================================"

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker 未安装${NC}"
    echo "请先安装 Docker: https://docs.docker.com/docker-for-windows/install/"
    exit 1
fi

# 检查 docker compose
if ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose 未安装${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker 已安装${NC}"

# 进入 deploy 目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "${YELLOW}当前目录: $(pwd)${NC}"

# 停止旧容器
echo -e "${YELLOW}停止旧容器...${NC}"
docker compose down 2>/dev/null || true

# 构建并启动
echo -e "${YELLOW}启动 Nginx 容器...${NC}"
docker compose up -d --build

# 检查状态
echo -e "${YELLOW}检查容器状态...${NC}"
docker compose ps

# 测试本地访问
echo -e "${YELLOW}测试本地访问...${NC}"
sleep 2
if curl -s http://localhost:8080/health > /dev/null; then
    echo -e "${GREEN}✓ 网站已在 localhost:8080 运行${NC}"
else
    echo -e "${YELLOW}⚠ 健康检查失败，请检查日志${NC}"
    docker compose logs nginx
fi

echo ""
echo "================================"
echo -e "${GREEN}部署完成！${NC}"
echo ""
echo "本地访问: http://localhost:8080"
echo ""
echo "下一步:"
echo "1. 确保 frpc 连接到云服务器"
echo "2. 访问 https://matrix.laofu.online"
echo ""
