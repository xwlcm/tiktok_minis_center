#!/bin/bash
# ============================================================
# SSL 证书申请 & 自动续签脚本
# 功能: 输入域名，自动申请 Let's Encrypt 证书并配置自动续签
# 用法: chmod +x setup-ssl.sh && sudo ./setup-ssl.sh
# ============================================================

set -e

EMAIL="zhangxinhui@hklspower.com"
CERTBOT_WEBROOT="/var/www/certbot"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 检查 root 权限
if [ "$EUID" -ne 0 ]; then
    log_error "请使用 root 权限运行: sudo ./setup-ssl.sh"
    exit 1
fi

# 检查 nginx 和 certbot
if ! command -v nginx &> /dev/null; then
    log_error "Nginx 未安装，请先安装 Nginx"
    exit 1
fi

if ! command -v certbot &> /dev/null; then
    log_info "安装 Certbot..."
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        case $ID in
            ubuntu|debian) apt-get update -y && apt-get install -y certbot ;;
            centos|rhel|rocky|almalinux) yum install -y certbot ;;
        esac
    fi
fi

# 输入域名
echo ""
read -p "请输入域名: " DOMAIN

if [ -z "$DOMAIN" ]; then
    log_error "域名不能为空"
    exit 1
fi

echo ""
log_info "域名: $DOMAIN"
log_info "邮箱: $EMAIL"
echo ""

# 确保验证目录存在
mkdir -p "$CERTBOT_WEBROOT"

# 配置临时 HTTP server 用于验证（如果该域名还没有 nginx 配置）
NGINX_CONF="/etc/nginx/conf.d/${DOMAIN}-certbot.conf"

cat > "$NGINX_CONF" << EOF
server {
    listen 80;
    server_name ${DOMAIN};

    location /.well-known/acme-challenge/ {
        root ${CERTBOT_WEBROOT};
    }

    location / {
        return 444;
    }
}
EOF

nginx -t && systemctl reload nginx

# 申请证书
log_info "正在申请 SSL 证书..."

certbot certonly \
    --webroot \
    -w "$CERTBOT_WEBROOT" \
    -d "$DOMAIN" \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    --non-interactive

if [ $? -ne 0 ]; then
    log_error "证书申请失败，请检查域名是否已解析到本服务器"
    rm -f "$NGINX_CONF"
    nginx -t && systemctl reload nginx
    exit 1
fi

# 删除临时验证配置
rm -f "$NGINX_CONF"
nginx -t && systemctl reload nginx

# 配置自动续签
if systemctl list-timers 2>/dev/null | grep -q "certbot"; then
    systemctl enable certbot.timer 2>/dev/null || true
    systemctl start certbot.timer 2>/dev/null || true
else
    mkdir -p /etc/letsencrypt/renewal-hooks/post
    cat > /etc/letsencrypt/renewal-hooks/post/reload-nginx.sh << 'HOOK'
#!/bin/bash
systemctl reload nginx
HOOK
    chmod +x /etc/letsencrypt/renewal-hooks/post/reload-nginx.sh

    CRON_JOB="30 2,14 * * * certbot renew --quiet"
    (crontab -l 2>/dev/null | grep -v "certbot renew"; echo "$CRON_JOB") | crontab -
fi

# 输出结果
echo ""
echo "============================================"
log_info "✓ 证书申请成功！自动续签已配置。"
echo "============================================"
echo ""
echo "在 Nginx 配置中添加以下内容:"
echo ""
echo "    # SSL 证书"
echo "    ssl_certificate     /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;"
echo "    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;"
echo ""
echo "============================================"
