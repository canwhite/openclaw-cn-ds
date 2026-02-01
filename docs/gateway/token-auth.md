# Gateway Token 认证指南

> **适用场景**：Control UI 访问、远程连接、API 认证

**创建时间**：2026-02-01
**最后更新**：2026-02-01

---

## 📋 目录

- [什么是 Token](#什么是-token)
- [Token 从哪里来](#token-从哪里来)
- [如何使用 Token](#如何使用-token)
- [Token 管理](#token-管理)
- [安全建议](#安全建议)
- [故障排查](#故障排查)

---

## 什么是 Token？

**Token（令牌）** 是一个共享密钥，用于 Gateway 的身份验证：

### 工作原理

```
┌─────────────┐                    ┌─────────────┐
│  浏览器/客户端  │                    │   Gateway   │
└──────┬──────┘                    └──────┬──────┘
       │                                  │
       │  1. 连接请求 + Token              │
       │ ──────────────────────────────>  │
       │                                  │
       │                                  │ 2. 验证 Token
       │                                  │    (检查配置文件)
       │                                  │
       │  3. 连接成功/失败                  │
       │  <─────────────────────────────  │
       │                                  │
```

### Token vs 密码

| 特性         | Token                | 密码 (Password)    |
| ------------ | -------------------- | ------------------ |
| **存储位置** | 配置文件             | 配置文件或环境变量 |
| **复杂度**   | 较长（通常 40 位）   | 较短（用户自定义） |
| **用途**     | 程序间通信           | 人类使用           |
| **安全性**   | ✅ 高                | ⚠️ 取决于强度      |
| **典型场景** | Control UI、API 连接 | 手动登录           |

---

## Token 从哪里来？

### 自动生成（推荐）

Token 通常在以下情况下**自动生成**：

#### 1️⃣ 首次运行向导

```bash
moltbot-cn onboard
```

或

```bash
moltbot-cn gateway
```

向导会自动生成一个安全的随机 Token 并保存到配置文件。

#### 2️⃣ 使用 CLI 命令生成

```bash
moltbot-cn doctor --generate-gateway-token
```

或（Docker 环境）

```bash
docker exec -it openclaw-cn-ds-clawdbot-gateway-1 \
  node dist/index.js doctor --generate-gateway-token
```

---

### 手动创建

您可以手动创建一个随机 Token：

#### 使用 OpenSSL

```bash
openssl rand -hex 20
```

#### 使用 Python

```python
import secrets
print(secrets.token_hex(20))
```

#### 使用 Node.js

```bash
node -e "console.log(require('crypto').randomBytes(20).toString('hex'))"
```

---

### Token 存储位置

**配置文件**：`~/.moltbot/moltbot.json` 或 `/home/node/.clawdbot/clawdbot.json`

```json
{
  "gateway": {
    "auth": {
      "mode": "token",
      "token": "xxx"
    }
  }
}
```

**Docker 环境**：`/path/to/data/config/clawdbot.json`

---

## 如何使用 Token？

### 方法 1：URL 参数（最简单）⭐

直接在 URL 中添加 `?token=xxx` 参数：

```
http://localhost:18789/?token=xxx
```

**优点**：

- ✅ 最简单，复制即可使用
- ✅ 自动保存到浏览器
- ✅ 下次无需再输入

**适用场景**：

- 首次连接
- 分享给团队成员
- 创建书签

---

### 方法 2：浏览器 UI 输入

#### 步骤 1：打开 Control UI

```
http://localhost:18789
```

#### 步骤 2：输入 Token

页面会显示身份验证提示，找到以下位置之一：

- ⚙️ 设置页面
- 🔑 Token/密码输入框
- 📝 认证配置

#### 步骤 3：保存并连接

输入 Token 后点击连接，浏览器会自动保存。

---

### 方法 3：CLI Dashboard 命令

```bash
moltbot-cn dashboard
```

这会：

1. 自动读取配置文件中的 Token
2. 在浏览器中打开带 Token 的 URL
3. 自动连接成功

**Docker 环境**：

```bash
docker exec -it openclaw-cn-ds-clawdbot-gateway-1 \
  node dist/index.js dashboard
```

---

### 方法 4：浏览器开发者控制台

打开浏览器开发者工具（F12），在 Console 中运行：

```javascript
window.location.search = "?token=YOUR_TOKEN_HERE";
```

页面会重新加载并带上 Token 参数。

---

## Token 管理

### 查看当前 Token

#### 方法 1：查看配置文件

```bash
cat ~/.moltbot/moltbot.json | jq '.gateway.auth.token'
```

#### 方法 2：使用 CLI

```bash
moltbot-cn config get gateway.auth.token
```

**Docker 环境**：

```bash
docker exec -it openclaw-cn-ds-clawdbot-gateway-1 \
  node dist/index.js config get gateway.auth.token
```

---

### 生成新 Token

```bash
moltbot-cn doctor --generate-gateway-token
```

这会：

1. 生成新的随机 Token
2. 更新配置文件
3. 重启 Gateway
4. 显示新 Token

**Docker 环境**：

```bash
docker exec -it openclaw-cn-ds-clawdbot-gateway-1 \
  node dist/index.js doctor --generate-gateway-token
```

---

### 手动修改 Token

#### 步骤 1：编辑配置文件

```bash
vim ~/.moltbot/moltbot.json
```

#### 步骤 2：更新 Token

```json
{
  "gateway": {
    "auth": {
      "mode": "token",
      "token": "YOUR_NEW_TOKEN_HERE"
    }
  }
}
```

#### 步骤 3：重启 Gateway

```bash
moltbot-cn gateway restart
```

**Docker 环境**：

```bash
docker-compose restart clawdbot-gateway
```

---

### 撤销旧 Token

如果您怀疑 Token 泄露：

1. **生成新 Token**（见上文）
2. **通知所有用户**：更新书签和保存的 Token
3. **监控日志**：检查是否有未授权访问

```bash
moltbot-cn logs | grep "unauthorized"
```

---

## 安全建议

### ✅ 最佳实践

| 场景         | Token 长度 | 存储方式            | 其他措施              |
| ------------ | ---------- | ------------------- | --------------------- |
| **本机开发** | 20-40 字节 | 配置文件            | ✅ 当前配置足够安全   |
| **团队协作** | 40+ 字节   | 配置文件 + 私有渠道 | 定期轮换              |
| **公网部署** | 40+ 字节   | 配置文件            | ⚠️ 必须使用 HTTPS     |
| **生产环境** | 40+ 字节   | 环境变量            | HTTPS + VPN/IP 白名单 |

---

### 🔒 安全级别

#### 级别 1：本机开发（最低安全）

**配置**：

```json
{
  "gateway": {
    "bind": "loopback",
    "auth": {
      "mode": "token",
      "token": "generated_token"
    },
    "controlUi": {
      "allowInsecureAuth": true
    }
  }
}
```

**风险**：🟢 低

- 仅本机可访问
- Token 泄露影响小

---

#### 级别 2：家庭/办公网络（中等安全）

**配置**：

```json
{
  "gateway": {
    "bind": "lan",
    "auth": {
      "mode": "token",
      "token": "strong_token_40_bytes"
    }
  }
}
```

**风险**：🟡 中

- 局域网可访问
- 需要强 Token
- 定期轮换

---

#### 级别 3：公网部署（高安全）

**配置**：

```json
{
  "gateway": {
    "bind": "0.0.0.0",
    "tls": {
      "enabled": true,
      "certPath": "/path/to/cert.pem",
      "keyPath": "/path/to/key.pem"
    },
    "auth": {
      "mode": "token",
      "token": "very_strong_token_40_bytes"
    },
    "controlUi": {
      "enabled": true
    }
  }
}
```

**风险**：🔴 高

- 公网可访问
- **必须**使用 HTTPS
- 强 Token + 定期轮换
- 考虑 IP 白名单
- 考虑 VPN

---

### ⚠️ 安全注意事项

#### 1. 不要共享 Token

❌ **错误做法**：

- 在 GitHub Issues 中粘贴 Token
- 在公开聊天中发送 Token
- 在不安全的 HTTP 连接中使用

✅ **正确做法**：

- 使用私有渠道（加密聊天、邮件）
- 使用临时 Token（一次性）
- 使用密码管理器

---

#### 2. 定期轮换 Token

```bash
# 每 90 天轮换一次
moltbot-cn doctor --generate-gateway-token
```

---

#### 3. 使用环境变量（生产环境）

```bash
# .env
CLAWDBOT_GATEWAY_TOKEN=your_token_here

# docker-compose.yml
environment:
  CLAWDBOT_GATEWAY_TOKEN: ${CLAWDBOT_GATEWAY_TOKEN}
```

---

#### 4. 监控访问日志

```bash
# 查看未授权访问尝试
moltbot-cn logs | grep "unauthorized"

# 查看成功连接
moltbot-cn logs | grep "connected"
```

---

## 故障排查

### 问题 1：Token missing 错误

**错误信息**：

```
disconnected (1008): unauthorized: gateway token missing
```

**原因**：

- 浏览器没有保存 Token
- Token 已过期或被撤销
- 配置文件中 Token 为空

**解决方案**：

#### 方法 1：使用带 Token 的 URL

```
http://localhost:18789/?token=YOUR_TOKEN
```

#### 方法 2：检查配置文件

```bash
cat ~/.moltbot/moltbot.json | grep token
```

确保 Token 存在且不为空。

#### 方法 3：重新生成 Token

```bash
moltbot-cn doctor --generate-gateway-token
```

---

### 问题 2：Token invalid 错误

**错误信息**：

```
disconnected (1008): unauthorized: gateway token invalid
```

**原因**：

- 浏览器保存的 Token 与配置文件不匹配
- Token 已被修改

**解决方案**：

#### 步骤 1：清除浏览器存储

1. 打开开发者工具（F12）
2. Application → Local Storage
3. 删除 `http://localhost:18789` 的所有数据
4. 刷新页面

#### 步骤 2：重新输入 Token

使用正确的 Token 重新连接。

---

### 问题 3：每次都需要输入 Token

**症状**：
每次访问 `http://localhost:18789` 都需要重新输入 Token。

**原因**：

- 浏览器禁用了 Local Storage
- 使用了无痕模式
- Token 没有正确保存

**解决方案**：

#### 检查浏览器设置

确保：

- ✅ Local Storage 已启用
- ✅ 不是无痕/隐私模式
- ✅ 没有清除网站数据

#### 使用书签

创建书签保存带 Token 的 URL：

```
http://localhost:18789/?token=YOUR_TOKEN
```

---

### 问题 4：忘记 Token

**解决方案**：

#### 方法 1：查看配置文件

```bash
cat ~/.moltbot/moltbot.json | grep token
```

**Docker 环境**：

```bash
docker exec openclaw-cn-ds-clawdbot-gateway-1 \
  cat /home/node/.clawdbot/clawdbot.json | grep token
```

#### 方法 2：生成新 Token

```bash
moltbot-cn doctor --generate-gateway-token
```

⚠️ **注意**：生成新 Token 后，所有使用旧 Token 的连接都会失效。

---

## 快速参考

### 常用命令

```bash
# 查看 Token
moltbot-cn config get gateway.auth.token

# 生成新 Token
moltbot-cn doctor --generate-gateway-token

# 打开 Dashboard（自动带 Token）
moltbot-cn dashboard

# 重启 Gateway
moltbot-cn gateway restart

# 查看日志
moltbot-cn logs
```

### Docker 环境

```bash
# 查看 Token
docker exec -it <container> node dist/index.js config get gateway.auth.token

# 生成新 Token
docker exec -it <container> node dist/index.js doctor --generate-gateway-token

# 重启 Gateway
docker-compose restart clawdbot-gateway

# 查看日志
docker logs <container> --tail 100 -f
```

---

## 相关文档

- [Gateway 安全配置](/gateway/security)
- [Control UI 使用指南](/web/control-ui)
- [Docker 部署指南](/platforms/docker)
- [故障排查指南](/TROUBLESHOOTING-GATEWAY)

---

**文档维护**：如有问题或建议，请提交 Issue 或 PR。
