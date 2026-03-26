#!/bin/bash
# OpenMatrix 部署脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 OpenMatrix 部署脚本${NC}"

# 检查环境
check_environment() {
    echo -e "${YELLOW}检查环境...${NC}"

    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js 未安装${NC}"
        exit 1
    fi

    # 检查 npm
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm 未安装${NC}"
        exit 1
    fi

    echo -e "${GREEN}✓ 环境检查通过${NC}"
}

# 构建网站
build_website() {
    echo -e "${YELLOW}构建网站...${NC}"

    cd website

    # 如果有构建步骤，在这里执行
    # npm run build

    echo -e "${GREEN}✓ 网站构建完成${NC}"
}

# 配置 Nginx
configure_nginx() {
    echo -e "${YELLOW}配置 Nginx...${NC}"

    local DOMAIN=$1

    cat > /tmp/openmatrix-nginx.conf << EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} www.${DOMAIN};

    root /var/www/openmatrix/website;
    index index.html;

    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

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
        try_files \$uri \$uri/ /index.html;
    }

    # 文档路由
    location /docs {
        try_files \$uri \$uri/ /docs/index.html;
    }
}
EOF

    echo -e "${GREEN}✓ Nginx 配置生成完成${NC}"
    echo -e "${YELLOW}请手动执行:${NC}"
    echo -e "  sudo mv /tmp/openmatrix-nginx.conf /etc/nginx/sites-available/openmatrix"
    echo -e "  sudo ln -sf /etc/nginx/sites-available/openmatrix /etc/nginx/sites-enabled/"
    echo -e "  sudo nginx -t && sudo systemctl reload nginx"
}

# 配置 SSL
configure_ssl() {
    echo -e "${YELLOW}配置 SSL 证书...${NC}"

    local DOMAIN=$1

    echo -e "${YELLOW}请手动执行:${NC}"
    echo -e "  sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
}

# 部署到服务器
deploy() {
    echo -e "${YELLOW}部署到服务器...${NC}"

    local SERVER=$1
    local DOMAIN=$2

    # 创建远程目录
    ssh ${SERVER} "mkdir -p /var/www/openmatrix"

    # 同步文件
    rsync -avz --delete website/ ${SERVER}:/var/www/openmatrix/website/

    echo -e "${GREEN}✓ 部署完成${NC}"
}

# 主函数
main() {
    local ACTION=$1

    case $ACTION in
        "build")
            check_environment
            build_website
            ;;
        "deploy")
            check_environment
            build_website
            deploy $2 $3
            configure_nginx $3
            configure_ssl $3
            ;;
        "nginx")
            configure_nginx $2
            ;;
        "ssl")
            configure_ssl $2
            ;;
        *)
            echo "用法: $0 {build|deploy|nginx|ssl} [server] [domain]"
            echo ""
            echo "命令:"
            echo "  build       - 构建网站"
            echo "  deploy      - 完整部署 (需要 server 和 domain 参数)"
            echo "  nginx       - 仅生成 Nginx 配置"
            echo "  ssl         - 配置 SSL 证书"
            echo ""
            echo "示例:"
            echo "  $0 build"
            echo "  $0 deploy user@server.com openmatrix.ai"
            echo "  $0 nginx openmatrix.ai"
            exit 1
            ;;
    esac
}

main "$@"
