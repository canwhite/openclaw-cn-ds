---
summary: "云服务器部署 SSL 证书配置指南"
read_when:
  - 您在云服务器上部署 Moltbot 时遇到 "control ui requires HTTPS or localhost" 错误
  - 您需要通过公网访问 Moltbot 控制界面
  - 您想为 Moltbot 配置 HTTPS 安全连接
---

# 云服务器 SSL 证书部署

当您在云服务器上部署 Moltbot 并尝试从浏览器访问控制界面时，可能会遇到以下错误：

```
disconnected (1008): control ui requires HTTPS or localhost (secure context)
```

这是因为 Moltbot 的 Web 控制界面需要 **安全上下文（Secure Context）** 才能正常工作。浏览器只在以下情况下提供安全上下文：

1. 通过 `localhost` 或 `127.0.0.1` 访问
2. 通过 HTTPS 访问

本文档将介绍几种解决方案。

---

## 方案一：使用反向代理 + Let's Encrypt（推荐）

这是最推荐的生产环境方案，使用 Nginx 作为反向代理，配合 Let's Encrypt 免费证书。

### 前提条件

- 一个指向您服务器 IP 的域名
- 服务器开放 80 和 443 端口

### 步骤 1：安装 Nginx 和 Certbot

**Ubuntu/Debian：**

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

**CentOS/RHEL：**

```bash
sudo yum install -y epel-release
sudo yum install -y nginx certbot python3-certbot-nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 步骤 2：配置 Nginx 反向代理

创建 Nginx 配置文件：

```bash
sudo nano /etc/nginx/sites-available/moltbot
```

添加以下内容（将 `your-domain.com` 替换为您的域名）：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:18789;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }
}
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/moltbot /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 步骤 3：申请 Let's Encrypt 证书

```bash
sudo certbot --nginx -d your-domain.com
```

按提示操作，Certbot 会自动配置 HTTPS 并设置自动续期。

### 步骤 4：配置 Moltbot

编辑 `~/.moltbot/moltbot.json`：

```json5
{
  gateway: {
    // 绑定到本地，由 Nginx 代理
    bind: "loopback",
    port: 18789,
    // 配置信任的代理地址
    trustedProxies: ["127.0.0.1"],
    // 启用认证（推荐）
    auth: {
      mode: "token",
      token: "your-secure-token-here"
    }
  }
}
```

重启 Moltbot：

```bash
moltbot-cn gateway
```

### 步骤 5：访问控制界面

打开浏览器访问 `https://your-domain.com`，输入配置的 token 即可。

---

## 方案二：使用 Moltbot 内置 TLS

Moltbot 支持内置 TLS，可以直接配置证书。

### 使用自签名证书（开发/测试）

```json5
{
  gateway: {
    bind: "lan",  // 或 "0.0.0.0"
    port: 18789,
    tls: {
      enabled: true,
      autoGenerate: true  // 自动生成自签名证书
    },
    auth: {
      mode: "token",
      token: "your-secure-token-here"
    }
  }
}
```

**注意：** 自签名证书会导致浏览器显示安全警告，需要手动信任。

### 使用正式证书

```json5
{
  gateway: {
    bind: "lan",
    port: 18789,
    tls: {
      enabled: true,
      certPath: "/path/to/fullchain.pem",
      keyPath: "/path/to/privkey.pem"
    },
    auth: {
      mode: "token",
      token: "your-secure-token-here"
    }
  }
}
```

---

## 方案三：使用 Tailscale（简单易用）

如果您使用 Tailscale 组网，这是最简单的方案。

### 步骤 1：安装并登录 Tailscale

```bash
# Ubuntu/Debian
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
```

### 步骤 2：配置 Moltbot

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: {
      mode: "serve"  // 或 "funnel" 用于公网访问
    },
    auth: {
      allowTailscale: true  // 允许 Tailscale 身份认证
    }
  }
}
```

### 步骤 3：访问

通过 Tailscale MagicDNS 地址访问：`https://<your-machine>.<tailnet>.ts.net/`

---

## 方案四：仅开发/测试用 - 禁用安全检查

**⚠️ 警告：此方案仅用于开发测试，切勿在生产环境使用！**

如果您只是临时测试，可以禁用控制界面的安全检查：

```json5
{
  gateway: {
    bind: "lan",
    port: 18789,
    controlUi: {
      // 允许 HTTP 下使用 token 认证
      allowInsecureAuth: true
    },
    auth: {
      mode: "token",
      token: "your-token-here"
    }
  }
}
```

然后通过 `http://your-server-ip:18789` 访问。

---

## 常见问题

### Q: 为什么必须使用 HTTPS？

Moltbot 控制界面使用 Web Crypto API 进行设备身份验证，这些 API 只在安全上下文（Secure Context）下可用。浏览器将 `localhost` 和 HTTPS 页面视为安全上下文。

### Q: 可以使用 IP 地址而不是域名吗？

可以，但需要：
1. 使用自签名证书（会有浏览器警告）
2. 或使用方案四的不安全模式

### Q: Let's Encrypt 证书如何自动续期？

Certbot 会自动设置定时任务，您可以通过以下命令测试续期：

```bash
sudo certbot renew --dry-run
```

### Q: 反向代理后 WebSocket 连接失败？

确保 Nginx 配置中包含 WebSocket 相关的头部设置：

```nginx
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

### Q: 如何配置多个域名？

在 Nginx 配置中添加多个 `server_name`，然后为每个域名申请证书：

```bash
sudo certbot --nginx -d domain1.com -d domain2.com
```

---

## 安全建议

1. **始终启用认证** - 设置 `gateway.auth.mode` 为 `token` 或 `password`
2. **使用强密码/Token** - 避免使用简单的密码
3. **限制访问来源** - 如果可能，使用防火墙限制访问 IP
4. **定期更新证书** - Let's Encrypt 证书有效期 90 天，确保自动续期正常
5. **保护私钥** - 证书私钥权限应为 600，仅 root 可读

---

## 相关文档

- [网关配置](/gateway/configuration) - 完整配置参考
- [网关认证](/gateway/authentication) - 认证方式详解
- [Tailscale 集成](/gateway/tailscale) - Tailscale 详细配置
- [安全指南](/gateway/security) - 安全最佳实践
