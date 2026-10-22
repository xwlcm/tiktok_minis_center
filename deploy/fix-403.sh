#!/bin/bash
# ============================================================
# 修复 403 Forbidden + 隐藏 Nginx 版本号
# 用法: chmod +x fix-403.sh && sudo ./fix-403.sh
# ============================================================

set -e

DEPLOY_DIR="/data/minis"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }

# ==================== 1. 隐藏 Nginx 版本号 ====================
log_info "隐藏 Nginx 版本号..."

# 在 nginx.conf 的 http 块中添加 server_tokens off
if grep -q "server_tokens" /etc/nginx/nginx.conf; then
    sed -i 's/server_tokens.*/server_tokens off;/' /etc/nginx/nginx.conf
    log_info "server_tokens 已更新为 off"
else
    # 在 http { 后面插入 server_tokens off
    sed -i '/http {/a\    server_tokens off;' /etc/nginx/nginx.conf
    log_info "已添加 server_tokens off"
fi

# ==================== 2. 修复目录权限 ====================
log_info "修复目录权限..."

# 确保从根路径到 dist 的每一级目录都有执行权限（Nginx 需要 x 权限来遍历目录）
chmod 755 /data
chmod 755 /data/minis
chmod -R 755 /data/minis/dist 2>/dev/null || true

# 设置正确的所有者
chown -R www-data:www-data "$DEPLOY_DIR"

log_info "权限已修复: /data (755) -> /data/minis (755) -> dist (755)"

# ==================== 3. 检查 dist 目录是否有内容 ====================
if [ ! -f "$DEPLOY_DIR/dist/index.html" ]; then
    log_warn "⚠️  $DEPLOY_DIR/dist/index.html 不存在！"
    log_warn "这是 403 的主要原因 —— 你还没有上传构建产物"
    log_warn "请在本地执行 build-and-upload.sh 上传前端文件"
    echo ""
    log_info "临时创建一个占位页面以验证 Nginx 配置..."
    cat > "$DEPLOY_DIR/dist/index.html" << 'PLACEHOLDER'
<!DOCTYPE html>
<html>
<head><title>Minis Data Center</title></head>
<body>
<h1>Nginx 配置正常 ✓</h1>
<p>请上传前端构建产物到此目录</p>
</body>
</html>
PLACEHOLDER
    chown www-data:www-data "$DEPLOY_DIR/dist/index.html"
    log_info "已创建占位页面"
else
    log_info "✓ index.html 存在"
fi

# ==================== 4. 验证并重载 Nginx ====================
log_info "验证 Nginx 配置..."
nginx -t

log_info "重载 Nginx..."
systemctl reload nginx

echo ""
log_info "========== 修复完成 =========="
log_info "1. Nginx 版本号已隐藏（响应头不再显示版本）"
log_info "2. 目录权限已修复"
if [ ! -f "$DEPLOY_DIR/dist/index.html" ] || grep -q "占位页面" "$DEPLOY_DIR/dist/index.html" 2>/dev/null; then
    log_warn "3. 当前为占位页面，请尽快上传真实构建产物"
fi
echo ""
log_info "验证: curl -I https://minis.chromeforhearts.com"
log_info "应该看到 'server: nginx' 而不是 'nginx/1.24.0'"
