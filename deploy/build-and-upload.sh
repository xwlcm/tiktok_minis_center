#!/bin/bash
# ============================================================
# Minis Data Center - 本地构建 & 上传脚本
# 功能: 在本地构建前端项目并上传到服务器
# 用法: chmod +x build-and-upload.sh && ./build-and-upload.sh
# ============================================================

set -e

# ==================== 配置区域 ====================
SERVER_USER="root"                          # 服务器用户名
SERVER_HOST="101.47.16.118"               # 服务器 IP 或域名
SERVER_PORT="22"                           # SSH 端口
DEPLOY_DIR="/data/minis"    # 服务器部署目录
PROJECT_DIR="$(cd "$(dirname "$0")/../minis-data-center" && pwd)"
# ==================================================

GREEN='\033[0;32m'
NC='\033[0m'
log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }

# 1. 构建项目
log_info "开始构建项目..."
cd "$PROJECT_DIR"
npm install
npm run build

if [ ! -d "dist" ]; then
    echo "构建失败: dist 目录不存在"
    exit 1
fi

log_info "构建完成，产物目录: $PROJECT_DIR/dist"

# 2. 上传到服务器
log_info "正在上传到服务器 ${SERVER_HOST}..."

# 使用 rsync 增量同步（推荐）
if command -v rsync &> /dev/null; then
    rsync -avz --delete \
        -e "ssh -p ${SERVER_PORT}" \
        "$PROJECT_DIR/dist/" \
        "${SERVER_USER}@${SERVER_HOST}:${DEPLOY_DIR}/dist/"
else
    # 备选方案: scp
    ssh -p "$SERVER_PORT" "${SERVER_USER}@${SERVER_HOST}" "rm -rf ${DEPLOY_DIR}/dist/*"
    scp -P "$SERVER_PORT" -r "$PROJECT_DIR/dist/"* "${SERVER_USER}@${SERVER_HOST}:${DEPLOY_DIR}/dist/"
fi

log_info "上传完成！"
log_info "访问地址: https://${SERVER_HOST}"
