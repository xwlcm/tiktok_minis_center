#!/bin/bash
# ============================================================
# 泛域名 SSL 证书申请 & 自动续签脚本
# 使用 Let's Encrypt + DNS 验证方式申请通配符证书
# 用法: chmod +x setup-wildcard-ssl.sh && sudo ./setup-wildcard-ssl.sh
#
# 注意: 泛域名证书必须使用 DNS 验证（不能用 HTTP 验证）
#       需要手动添加 DNS TXT 记录，或配置 DNS API 插件实现自动化
# ============================================================

set -e

EMAIL="zhangxinhui@hklspower.com"
CERT_DIR="/etc/nginx/cert"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 检查 root 权限
if [ "$EUID" -ne 0 ]; then
    log_error "请使用 root 权限运行: sudo ./setup-wildcard-ssl.sh"
    exit 1
fi

# 安装 certbot
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
echo "============================================"
echo "  泛域名 SSL 证书申请（通配符证书）"
echo "============================================"
echo ""
echo "说明: 泛域名证书可覆盖 *.example.com 的所有子域名"
echo "      同时也会申请主域名 example.com 的证书"
echo ""

read -p "请输入主域名（例如 shortmotiontv.com）: " DOMAIN

if [ -z "$DOMAIN" ]; then
    log_error "域名不能为空"
    exit 1
fi

echo ""
log_info "将申请以下证书:"
log_info "  - ${DOMAIN}"
log_info "  - *.${DOMAIN}"
echo ""

# ==================== 选择验证方式 ====================
echo "请选择 DNS 验证方式:"
echo ""
echo "  1) 手动添加 DNS TXT 记录（适合所有 DNS 服务商）"
echo "  2) Cloudflare API 自动验证（需要 API Token）"
echo "  3) 阿里云 DNS API 自动验证（需要 AccessKey）"
echo ""
read -p "请选择 [1/2/3]: " DNS_METHOD

case $DNS_METHOD in
    # ==================== 方式1: 手动 DNS 验证 ====================
    1)
        log_info "使用手动 DNS 验证方式..."
        echo ""
        log_warn "接下来 certbot 会要求你添加 DNS TXT 记录"
        log_warn "请在 DNS 服务商后台添加记录后，等待 1-2 分钟再确认"
        echo ""

        certbot certonly \
            --manual \
            --preferred-challenges dns \
            -d "$DOMAIN" \
            -d "*.$DOMAIN" \
            --email "$EMAIL" \
            --agree-tos \
            --no-eff-email

        log_warn "⚠️  手动验证方式无法自动续签！"
        log_warn "证书到期前需要重新运行此脚本"
        ;;

    # ==================== 方式2: Cloudflare API ====================
    2)
        # 安装 cloudflare 插件
        if ! pip3 show certbot-dns-cloudflare &> /dev/null 2>&1; then
            log_info "安装 certbot-dns-cloudflare 插件..."
            pip3 install certbot-dns-cloudflare
        fi

        echo ""
        read -p "请输入 Cloudflare API Token: " CF_TOKEN

        if [ -z "$CF_TOKEN" ]; then
            log_error "API Token 不能为空"
            exit 1
        fi

        # 保存凭证
        mkdir -p /etc/letsencrypt
        CF_CRED_FILE="/etc/letsencrypt/cloudflare.ini"
        cat > "$CF_CRED_FILE" << EOF
dns_cloudflare_api_token = ${CF_TOKEN}
EOF
        chmod 600 "$CF_CRED_FILE"

        log_info "使用 Cloudflare DNS API 验证..."

        certbot certonly \
            --dns-cloudflare \
            --dns-cloudflare-credentials "$CF_CRED_FILE" \
            --dns-cloudflare-propagation-seconds 30 \
            -d "$DOMAIN" \
            -d "*.$DOMAIN" \
            --email "$EMAIL" \
            --agree-tos \
            --no-eff-email \
            --non-interactive

        # 配置自动续签
        log_info "✓ Cloudflare API 方式支持自动续签"
        ;;

    # ==================== 方式3: 阿里云 DNS API ====================
    3)
        # 安装阿里云插件
        if ! pip3 show certbot-dns-aliyun &> /dev/null 2>&1; then
            log_info "安装 certbot-dns-aliyun 插件..."
            pip3 install certbot-dns-aliyun
        fi

        echo ""
        read -p "请输入阿里云 AccessKey ID: " ALI_KEY_ID
        read -p "请输入阿里云 AccessKey Secret: " ALI_KEY_SECRET

        if [ -z "$ALI_KEY_ID" ] || [ -z "$ALI_KEY_SECRET" ]; then
            log_error "AccessKey 不能为空"
            exit 1
        fi

        # 保存凭证
        mkdir -p /etc/letsencrypt
        ALI_CRED_FILE="/etc/letsencrypt/aliyun.ini"
        cat > "$ALI_CRED_FILE" << EOF
dns_aliyun_access_key = ${ALI_KEY_ID}
dns_aliyun_access_key_secret = ${ALI_KEY_SECRET}
EOF
        chmod 600 "$ALI_CRED_FILE"

        log_info "使用阿里云 DNS API 验证..."

        certbot certonly \
            --authenticator dns-aliyun \
            --dns-aliyun-credentials "$ALI_CRED_FILE" \
            -d "$DOMAIN" \
            -d "*.$DOMAIN" \
            --email "$EMAIL" \
            --agree-tos \
            --no-eff-email \
            --non-interactive

        # 配置自动续签
        log_info "✓ 阿里云 API 方式支持自动续签"
        ;;

    *)
        log_error "无效选择"
        exit 1
        ;;
esac

# ==================== 部署证书到 nginx 目录 ====================
if [ $? -eq 0 ]; then
    log_info "证书申请成功，部署到 Nginx 证书目录..."

    mkdir -p "$CERT_DIR"

    # 复制证书到 nginx cert 目录（与你现有配置路径一致）
    cp /etc/letsencrypt/live/${DOMAIN}/fullchain.pem "${CERT_DIR}/${DOMAIN}.pem"
    cp /etc/letsencrypt/live/${DOMAIN}/privkey.pem "${CERT_DIR}/${DOMAIN}.key"
    chmod 644 "${CERT_DIR}/${DOMAIN}.pem"
    chmod 600 "${CERT_DIR}/${DOMAIN}.key"

    # 配置续签后自动复制证书并 reload nginx
    mkdir -p /etc/letsencrypt/renewal-hooks/deploy
    cat > /etc/letsencrypt/renewal-hooks/deploy/copy-and-reload-${DOMAIN}.sh << HOOK
#!/bin/bash
cp /etc/letsencrypt/live/${DOMAIN}/fullchain.pem ${CERT_DIR}/${DOMAIN}.pem
cp /etc/letsencrypt/live/${DOMAIN}/privkey.pem ${CERT_DIR}/${DOMAIN}.key
chmod 644 ${CERT_DIR}/${DOMAIN}.pem
chmod 600 ${CERT_DIR}/${DOMAIN}.key
systemctl reload nginx
HOOK
    chmod +x /etc/letsencrypt/renewal-hooks/deploy/copy-and-reload-${DOMAIN}.sh

    # 配置 crontab 自动续签
    CRON_JOB="30 2,14 * * * certbot renew --quiet"
    (crontab -l 2>/dev/null | grep -v "certbot renew"; echo "$CRON_JOB") | crontab -

    # reload nginx
    nginx -t && systemctl reload nginx

    echo ""
    echo "============================================"
    log_info "🎉 泛域名证书部署完成！"
    echo "============================================"
    echo ""
    echo -e "${CYAN}证书覆盖范围:${NC}"
    echo "  - ${DOMAIN}"
    echo "  - *.${DOMAIN} (所有子域名)"
    echo ""
    echo -e "${CYAN}证书文件路径（与你现有 Nginx 配置一致）:${NC}"
    echo ""
    echo "    ssl_certificate     ${CERT_DIR}/${DOMAIN}.pem;"
    echo "    ssl_certificate_key ${CERT_DIR}/${DOMAIN}.key;"
    echo ""
    echo -e "${CYAN}或直接引用 Let's Encrypt 路径:${NC}"
    echo ""
    echo "    ssl_certificate     /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;"
    echo "    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;"
    echo ""
    echo "============================================"
    echo ""
    log_info "证书有效期: 90 天"
    if [ "$DNS_METHOD" != "1" ]; then
        log_info "自动续签: 已配置（每天 02:30 和 14:30 检查）"
    else
        log_warn "自动续签: 手动模式不支持，到期前需重新运行脚本"
    fi
    log_info "手动续签测试: certbot renew --dry-run"
    log_info "查看证书信息: certbot certificates"
else
    log_error "证书申请失败"
    exit 1
fi
