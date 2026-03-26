#!/bin/bash
# OpenMatrix WSL 部署脚本
# 在 WSL 中运行: bash deploy-wsl.sh

set -e

# 颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════╗"
echo "║     OpenMatrix 网站部署脚本               ║"
echo "╚═══════════════════════════════════════════╝"
echo -e "${NC}"

# 检测项目路径
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${YELLOW}项目目录: $PROJECT_DIR${NC}"

# 检查 Docker
echo -e "${YELLOW}检查 Docker...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker 未安装${NC}"
    echo "请先在 WSL 中安装 Docker"
    exit 1
fi

if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker 未运行${NC}"
    echo "请启动 Docker 服务"
    exit 1
fi

echo -e "${GREEN}✓ Docker 已就绪${NC}"

# 进入 deploy 目录
cd "$SCRIPT_DIR"

# 停止旧容器
echo -e "${YELLOW}停止旧容器...${NC}"
docker compose down 2>/dev/null || true

# 构建并启动
echo -e "${YELLOW}启动 Nginx 容器...${NC}"
docker compose up -d --build

# 等待启动
echo -e "${YELLOW}等待服务启动...${NC}"
sleep 3

# 检查状态
echo -e "${YELLOW}容器状态:${NC}"
docker compose ps

# 测试本地访问
echo -e "${YELLOW}测试本地访问...${NC}"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080 | grep -q "200\|304"; then
    echo -e "${GREEN}✓ 网站已在 localhost:8080 运行${NC}"
else
    echo -e "${YELLOW}⚠ 请检查容器日志:${NC}"
    docker compose logs nginx --tail 20
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}部署完成！${NC}"
echo ""
echo -e "本地访问: ${BLUE}http://localhost:8080${NC}"
echo ""
echo -e "${YELLOW}下一步:${NC}"
echo "1. 确保 frpc 已连接到云服务器"
echo "2. 访问 ${BLUE}https://matrix.laofu.online${NC}"
echo ""
echo -e "查看日志: ${YELLOW}docker compose logs -f${NC}"
echo -e "停止服务: ${YELLOW}docker compose down${NC}"
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
