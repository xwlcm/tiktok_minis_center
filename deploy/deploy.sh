#!/bin/bash
# ============================================================
# Minis Data Center - 服务器部署脚本
# 功能: 安装 Nginx、申请 SSL 证书、部署前端项目
# 适用: CentOS 7/8, Ubuntu 18.04+, Debian 10+
# 用法: chmod +x deploy.sh && sudo ./deploy.sh
# ============================================================

set -e

# ==================== 配置区域 ====================
# 请修改以下变量为你的实际值
DOMAIN="minis.chromeforhearts.com"                    # 你的域名
EMAIL="zhangxinhui@hklspower.com"              # Let's Encrypt 通知邮箱
BACKEND_HOST="127.0.0.1"                   # 后端服务地址
BACKEND_PORT="8080"                        # 后端服务端口
DEPLOY_DIR="/data/minis"    # 前端部署目录
CERTBOT_WEBROOT="/var/www/certbot"         # Certbot 验证目录
# ==================================================

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 检查 root 权限
if [ "$EUID" -ne 0 ]; then
    log_error "请使用 root 权限运行此脚本: sudo ./deploy.sh"
    exit 1
fi

# 检测系统类型
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        OS_VERSION=$VERSION_ID
    elif [ -f /etc/redhat-release ]; then
        OS="centos"
    else
        log_error "不支持的操作系统"
        exit 1
    fi
    log_info "检测到系统: $OS $OS_VERSION"
}

# 安装 Nginx
install_nginx() {
    log_info "正在安装 Nginx..."

    case $OS in
        ubuntu|debian)
            apt-get update -y
            apt-get install -y nginx
            ;;
        centos|rhel|rocky|almalinux)
            yum install -y epel-release
            yum install -y nginx
            ;;
        *)
            log_error "不支持的系统: $OS"
            exit 1
            ;;
    esac

    # 隐藏 Nginx 版本号
    if grep -q "server_tokens" /etc/nginx/nginx.conf; then
        sed -i 's/server_tokens.*/server_tokens off;/' /etc/nginx/nginx.conf
    else
        sed -i '/http {/a\    server_tokens off;' /etc/nginx/nginx.conf
    fi

    systemctl enable nginx
    systemctl start nginx
    log_info "Nginx 安装完成（版本号已隐藏）"
}

# 安装 Certbot（Let's Encrypt 客户端）
install_certbot() {
    log_info "正在安装 Certbot..."

    case $OS in
        ubuntu|debian)
            apt-get install -y certbot python3-certbot-nginx
            ;;
        centos|rhel|rocky|almalinux)
            yum install -y certbot python3-certbot-nginx
            ;;
    esac

    log_info "Certbot 安装完成"
}

# 创建部署目录
setup_directories() {
    log_info "创建部署目录..."
    mkdir -p "$DEPLOY_DIR/dist"
    mkdir -p "$CERTBOT_WEBROOT"

    # 确保从根路径到 dist 每一级都有遍历权限
    # Nginx (www-data) 需要 x 权限才能进入目录
    current_path=""
    IFS='/' read -ra PARTS <<< "$DEPLOY_DIR"
    for part in "${PARTS[@]}"; do
        [ -z "$part" ] && continue
        current_path="/$part"
        chmod 755 "$current_path" 2>/dev/null || true
    done

    chown -R www-data:www-data "$DEPLOY_DIR" 2>/dev/null || chown -R nginx:nginx "$DEPLOY_DIR"
    chmod -R 755 "$DEPLOY_DIR"
    log_info "目录创建完成: $DEPLOY_DIR (权限已设置)"
}

# 生成 Nginx 配置（先用 HTTP，申请证书后再启用 HTTPS）
generate_nginx_conf_http() {
    log_info "生成 Nginx HTTP 配置（用于证书申请）..."

    cat > /etc/nginx/conf.d/minis-data-center.conf << EOF
server {
    listen 80;
    server_name ${DOMAIN};

    # Let's Encrypt 验证
    location /.well-known/acme-challenge/ {
        root ${CERTBOT_WEBROOT};
    }

    # 前端静态文件
    root ${DEPLOY_DIR}/dist;
    index index.html;

    location /api/ {
        proxy_pass http://${BACKEND_HOST}:${BACKEND_PORT}/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

    # 删除默认配置（避免冲突）
    rm -f /etc/nginx/sites-enabled/default 2>/dev/null
    rm -f /etc/nginx/conf.d/default.conf 2>/dev/null

    nginx -t && systemctl reload nginx
    log_info "HTTP 配置已生效"
}

# 申请 SSL 证书
obtain_ssl_certificate() {
    log_info "正在申请 SSL 证书..."
    log_warn "请确保域名 ${DOMAIN} 已解析到本服务器 IP"

    read -p "域名是否已解析到本服务器？(y/n): " confirm
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        log_warn "请先完成域名解析，然后重新运行脚本"
        log_info "你也可以稍后手动执行: certbot certonly --webroot -w ${CERTBOT_WEBROOT} -d ${DOMAIN} --email ${EMAIL} --agree-tos --no-eff-email"
        return 1
    fi

    certbot certonly \
        --webroot \
        -w "$CERTBOT_WEBROOT" \
        -d "$DOMAIN" \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        --non-interactive

    if [ $? -eq 0 ]; then
        log_info "SSL 证书申请成功！"
        return 0
    else
        log_error "SSL 证书申请失败，请检查域名解析是否正确"
        return 1
    fi
}

# 生成完整的 HTTPS Nginx 配置
generate_nginx_conf_https() {
    log_info "生成 Nginx HTTPS 配置..."

    cat > /etc/nginx/conf.d/minis-data-center.conf << EOF
# HTTP -> HTTPS 重定向
server {
    listen 80;
    server_name ${DOMAIN};

    location /.well-known/acme-challenge/ {
        root ${CERTBOT_WEBROOT};
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}

# HTTPS 主配置
server {
    listen 443 ssl http2;
    server_name ${DOMAIN};

    # SSL 证书
    ssl_certificate     /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;

    # SSL 安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;

    add_header Strict-Transport-Security "max-age=63072000" always;

    # 前端静态文件
    root ${DEPLOY_DIR}/dist;
    index index.html;

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/xml+rss application/atom+xml image/svg+xml;

    # 静态资源长期缓存
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API 反向代理
    location /api/ {
        proxy_pass http://${BACKEND_HOST}:${BACKEND_PORT}/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Vue Router history 模式
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # 禁止访问隐藏文件
    location ~ /\\. {
        deny all;
    }

    access_log /var/log/nginx/minis-data-center.access.log;
    error_log  /var/log/nginx/minis-data-center.error.log;
}
EOF

    nginx -t && systemctl reload nginx
    log_info "HTTPS 配置已生效"
}

# 设置证书自动续期
setup_auto_renewal() {
    log_info "配置证书自动续期..."

    # 添加 crontab 定时任务（每天凌晨 2:30 检查续期）
    (crontab -l 2>/dev/null; echo "30 2 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'") | sort -u | crontab -

    log_info "证书自动续期已配置（每天 02:30 检查）"
}

# 防火墙配置
configure_firewall() {
    log_info "配置防火墙..."

    if command -v firewall-cmd &> /dev/null; then
        firewall-cmd --permanent --add-service=http
        firewall-cmd --permanent --add-service=https
        firewall-cmd --reload
        log_info "firewalld 规则已添加"
    elif command -v ufw &> /dev/null; then
        ufw allow 'Nginx Full'
        log_info "ufw 规则已添加"
    else
        log_warn "未检测到防火墙工具，请手动开放 80/443 端口"
    fi
}

# ==================== 主流程 ====================
main() {
    echo "============================================"
    echo "  Minis Data Center 部署脚本"
    echo "  域名: ${DOMAIN}"
    echo "  后端: ${BACKEND_HOST}:${BACKEND_PORT}"
    echo "============================================"
    echo ""

    detect_os
    install_nginx
    install_certbot
    setup_directories
    configure_firewall
    generate_nginx_conf_http

    echo ""
    log_info "========== 第一阶段完成 =========="
    log_info "Nginx 已安装并配置 HTTP 访问"
    log_info "请将前端构建产物上传到: ${DEPLOY_DIR}/dist/"
    echo ""

    # 尝试申请 SSL 证书
    if obtain_ssl_certificate; then
        generate_nginx_conf_https
        setup_auto_renewal
        echo ""
        log_info "========== 部署完成 =========="
        log_info "HTTPS 已启用: https://${DOMAIN}"
        log_info "证书自动续期已配置"
    else
        echo ""
        log_warn "========== HTTP 部署完成 =========="
        log_info "当前可通过 HTTP 访问: http://${DOMAIN}"
        log_info "稍后申请证书请运行: certbot certonly --webroot -w ${CERTBOT_WEBROOT} -d ${DOMAIN} --email ${EMAIL} --agree-tos"
        log_info "申请成功后运行: sudo ./deploy.sh --enable-https"
    fi
}

# 支持单独启用 HTTPS（证书已申请后）
if [ "$1" == "--enable-https" ]; then
    generate_nginx_conf_https
    setup_auto_renewal
    log_info "HTTPS 已启用"
    exit 0
fi

main
