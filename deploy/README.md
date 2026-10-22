# Minis Data Center 部署指南

## 文件说明

| 文件 | 用途 |
|------|------|
| `nginx.conf` | Nginx 配置文件模板（可直接复制到服务器） |
| `deploy.sh` | 服务器一键部署脚本（安装 Nginx + 申请证书） |
| `build-and-upload.sh` | 本地构建并上传到服务器 |

## 部署步骤

### 1. 准备工作

- 一台 Linux 服务器（CentOS/Ubuntu/Debian）
- 域名已解析到服务器 IP（A 记录）
- 服务器开放 80 和 443 端口

### 2. 修改配置

编辑 `deploy.sh` 顶部的配置区域：

```bash
DOMAIN="your-domain.com"          # 替换为你的域名
EMAIL="admin@your-domain.com"     # 替换为你的邮箱
BACKEND_HOST="127.0.0.1"          # 后端地址（如果后端在同一台服务器）
BACKEND_PORT="8080"               # 后端端口
```

### 3. 在服务器上执行部署

```bash
# 上传脚本到服务器
scp deploy.sh root@your-server-ip:/root/

# SSH 登录服务器执行
ssh root@your-server-ip
chmod +x deploy.sh
./deploy.sh
```

### 4. 构建并上传前端代码

编辑 `build-and-upload.sh` 中的服务器信息，然后在本地执行：

```bash
chmod +x build-and-upload.sh
./build-and-upload.sh
```

### 5. 验证

访问 `https://your-domain.com` 确认部署成功。

## 证书续期

脚本已自动配置 crontab 定时任务，每天凌晨 2:30 检查证书是否需要续期。

手动续期：
```bash
certbot renew --dry-run  # 测试续期
certbot renew            # 实际续期
```

## 常见问题

**Q: 证书申请失败？**
- 确认域名 A 记录已指向服务器 IP
- 确认 80 端口可从外网访问
- 等待 DNS 生效（通常 5-10 分钟）

**Q: 如果后端不在同一台服务器？**
- 修改 `BACKEND_HOST` 为后端服务器的内网 IP

**Q: 如何使用已有证书（非 Let's Encrypt）？**
- 直接修改 `nginx.conf` 中的 `ssl_certificate` 和 `ssl_certificate_key` 路径指向你的证书文件
