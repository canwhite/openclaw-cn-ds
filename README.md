# 🧞 Moltbot 中文版 (OpenClaw-CN-DS)

**私有化部署的 AI 智能助手，完整中文本地化。**

[![npm version](https://img.shields.io/npm/v/moltbot-cn?style=flat-square&logo=npm&logoColor=white)](https://www.npmjs.com/package/moltbot-cn)
[![Node.js Version](https://img.shields.io/badge/Node.js-%E2%89%A5%2022.12.0-brightgreen?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/jiulingyun/moltbot-cn?style=flat-square&logo=github)](https://github.com/jiulingyun/moltbot-cn)

---

## 📖 目录

- [特性](#-特性)
- [快速开始](#-快速开始)
- [Docker 部署](#-docker-部署)
- [访问 Control UI](#-访问-control-ui)
- [配置说明](#-配置说明)
- [文档](#-文档)
- [故障排查](#-故障排查)
- [贡献指南](#-贡献指南)

---

## ✨ 特性

### 核心功能

- **🇨🇳 完整中文化** — CLI、Web 控制界面、配置向导全部汉化
- **🏠 本地优先** — 数据存储在你自己的设备上，隐私可控
- **📱 多渠道支持** — WhatsApp、Telegram、Slack、Discord、Signal、iMessage、飞书、微信（开发中）
- **🎙️ 语音交互** — macOS/iOS/Android 语音唤醒和对话
- **🖼️ Canvas 画布** — 智能体驱动的可视化工作区
- **🔧 技能扩展** — 内置技能 + 自定义工作区技能

### AI 模型支持

- ✅ **DeepSeek** — 已集成，开箱即用
- ✅ **Anthropic Claude** — 完整支持
- ✅ **OpenAI GPT** — GPT-4/o1 系列
- ✅ **Google Gemini** — Gemini 2.0 系列
- ✅ **GitHub Copilot** — 使用 Copilot Token
- ✅ **AWS Bedrock** — 企业级部署
- ✅ **自定义提供商** — 支持 OpenAI 兼容 API

---

## 🚀 快速开始

### 环境要求

- **Node.js** ≥ 22.12.0
- **pnpm** 10.23.0+ （推荐）
- **Docker** (可选，用于容器化部署)

## 🐳 Docker 部署

### 方式一：快速部署（推荐）

#### 1. 克隆项目

```bash
git clone https://github.com/canwhite/openclaw-cn-ds.git
cd openclaw-cn-ds
```

#### 2. 配置环境变量

```bash
# 复制示例配置
cp .env.example .env

# 编辑 .env 文件
vim .env
```

**必填配置**：

```bash
# DeepSeek API Key（推荐）
DEEPSEEK_API_KEY=sk-your-deepseek-api-key

# Gateway Token（留空自动生成）
CLAWDBOT_GATEWAY_TOKEN=

# Gateway 绑定模式
CLAWDBOT_GATEWAY_BIND=lan  # lan（局域网）或 loopback（仅本机）
CLAWDBOT_GATEWAY_PORT=18789
```

#### 3. 构建 Docker 镜像

```bash
docker build --load -t moltbot-cn:local -f Dockerfile .
```

#### 4. 运行配置向导

```bash
docker compose run --rm clawdbot-cli onboard --no-install-daemon
```

向导会引导您：

- 选择 AI 模型提供商（推荐 DeepSeek）
- 配置 API Keys
- 设置工作区
- 选择要启用的渠道

#### 5. 启动服务

```bash
docker compose up -d
```

#### 6. 查看日志

```bash
docker compose logs -f clawdbot-gateway
```

看到以下日志表示启动成功：

```
[gateway] listening on ws://0.0.0.0:18789 (PID 7)
[gateway] agent model: deepseek/deepseek-chat
```

---

### api请求

#### curl

```
curl -H "Authorization: Bearer xxxtokenxxx" \
 -H "Content-Type: application/json" \
 -d '{
   "model": "deepseek/deepseek-chat",
   "messages": [{"role": "user", "content": "你的问题"}]
 }' \
 http://localhost:18789/v1/chat/completions
```

#### python

```
import requests

class ClawdbotClient:
    def __init__(self, base_url="http://localhost:18789", token="836f22c5c7ba1f3cabc38ff10d61eea249c1d7e05debfa53"):
        self.base_url = base_url
        self.headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

    def chat(self, message, model="deepseek/deepseek-chat"):
        response = requests.post(
            f"{self.base_url}/v1/chat/completions",
            headers=self.headers,
            json={
                "model": model,
                "messages": [{"role": "user", "content": message}]
            }
        )
        return response.json()["choices"][0]["message"]["content"]

# 使用
client = ClawdbotClient()
result = client.chat("分析今天的科技新闻")
print(result)
```

#### node

```
import requests

class ClawdbotClient:
    def __init__(self, base_url="http://localhost:18789", token="836f22c5c7ba1f3cabc38ff10d61eea249c1d7e05debfa53"):
        self.base_url = base_url
        self.headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

    def chat(self, message, model="deepseek/deepseek-chat"):
        response = requests.post(
            f"{self.base_url}/v1/chat/completions",
            headers=self.headers,
            json={
                "model": model,
                "messages": [{"role": "user", "content": message}]
            }
        )
        return response.json()["choices"][0]["message"]["content"]

# 使用
client = ClawdbotClient()
result = client.chat("分析今天的科技新闻")
print(result)
```

---

## 🎨 访问 Control UI

### 方法一：使用 Token URL（最简单）⭐

#### 1. 查看 Token

```bash
# 方法 1：查看配置文件
cat data/config/clawdbot.json | grep token

# 方法 2：使用 CLI
docker exec -it openclaw-cn-ds-clawdbot-gateway-1 \
  node dist/index.js config get gateway.auth.token
```

输出示例：

```
"token": "xxxx"
```

#### 2. 使用带 Token 的 URL 访问

在浏览器中打开：

```
http://localhost:18789/?token=YOUR_TOKEN_HERE
```

**完整示例**：

```
http://localhost:18789/?token=xxx
```

✅ **第一次访问后，Token 会自动保存到浏览器，下次无需再带参数。**

---

### 方法二：使用 CLI 命令

```bash
docker exec -it openclaw-cn-ds-clawdbot-gateway-1 \
  node dist/index.js dashboard
```

这会自动在浏览器中打开带 Token 的 URL。

---

### 方法三：在 UI 中手动输入

1. 访问：`http://localhost:18789`
2. 页面会提示需要身份验证
3. 找到设置页面（⚙️ 图标）
4. 在 Token 输入框中粘贴您的 Token
5. 点击连接

---

### 🔐 关于 Token

**什么是 Token？**

Token 是一个共享密钥，用于保护您的 Gateway 安全。类似于密码，但是用于程序间通信。

**Token 从哪里来？**

Token 在您运行 `onboard` 向导时自动生成，存储在配置文件中：

```
data/config/clawdbot.json
```

**安全建议**：

- ⚠️ **不要**将 Token 分享给他人
- ⚠️ **不要**将 Token 提交到 Git 仓库
- ✅ **可以**创建书签保存带 Token 的 URL（本机使用）
- ✅ **建议**定期轮换 Token（生产环境）

**Token 管理文档**：[docs/gateway/token-auth.md](docs/gateway/token-auth.md)

---

## 🔧 配置说明

### 最小配置

`data/config/clawdbot.json`：

```json
{
  "agent": {
    "model": {
      "primary": "deepseek/deepseek-chat"
    }
  }
}
```

### 完整配置示例

```json
{
  "gateway": {
    "port": 18789,
    "bind": "lan",
    "auth": {
      "mode": "token",
      "token": "your-token-here"
    },
    "controlUi": {
      "allowInsecureAuth": true
    }
  },
  "agent": {
    "defaults": {
      "model": {
        "primary": "deepseek/deepseek-chat"
      }
    }
  },
  "models": {
    "providers": {
      "deepseek": {
        "baseUrl": "https://api.deepseek.com/v1",
        "apiKey": "${DEEPSEEK_API_KEY}",
        "api": "openai-completions"
      }
    }
  }
}
```

### 环境变量

`.env` 文件：

```bash
# ========== 基础配置 ==========
CLAWDBOT_IMAGE=moltbot-cn:local

# 配置目录
CLAWDBOT_CONFIG_DIR=/path/to/data/config
CLAWDBOT_WORKSPACE_DIR=/path/to/data/workspace

# Gateway 配置
CLAWDBOT_GATEWAY_PORT=18789
CLAWDBOT_GATEWAY_BIND=lan  # lan 或 loopback
CLAWDBOT_GATEWAY_TOKEN=

# ========== AI 模型配置 ==========
# DeepSeek（推荐）
DEEPSEEK_API_KEY=sk-your-api-key

# Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-your-api-key

# OpenAI
OPENAI_API_KEY=sk-your-api-key
```

---

## 📚 文档

### 官方文档

- [快速开始](https://clawd.org.cn/docs/start/getting-started)
- [Gateway 配置](https://clawd.org.cn/docs/gateway/configuration)
- [渠道接入指南](https://clawd.org.cn/docs/channels)
- [技能开发](https://clawd.org.cn/docs/tools/skills)

### 项目文档

- [Docker 部署完整指南](DOCKER.md)
- [DeepSeek 集成教程](DOCKER_DEEPSEEK.md)
- [Gateway Token 认证指南](docs/gateway/token-auth.md) ⭐
- [Gateway 故障排查](docs/TROUBLESHOOTING-GATEWAY.md)

---

## 🔧 常用命令

### Docker Compose 命令

```bash
# 查看服务状态
docker compose ps

# 查看实时日志
docker compose logs -f clawdbot-gateway

# 重启 Gateway
docker compose restart clawdbot-gateway

# 停止所有服务
docker compose down

# 启动所有服务
docker compose up -d

# 进入 CLI 容器
docker compose run --rm clawdbot-cli bash
```

### CLI 命令

```bash
# 查看配置
docker exec -it <container> node dist/index.js config get

# 查看设备列表
docker exec -it <container> node dist/index.js devices list

# 查看日志
docker exec -it <container> node dist/index.js logs

# 健康检查
docker exec -it <container> node dist/index.js doctor
```

---

## 🔍 故障排查

### 问题 1：无法访问 Control UI

**症状**：访问 `http://localhost:18789` 显示错误或无法连接

**解决方案**：

#### 1. 检查服务状态

```bash
docker compose ps
```

确认 `clawdbot-gateway` 状态为 `Up`。

#### 2. 检查日志

```bash
docker compose logs clawdbot-gateway --tail 50
```

查找错误信息。

#### 3. 验证端口绑定

```bash
# 查看监听端口
lsof -i :18789

# 或
netstat -tuln | grep 18789
```

#### 4. 确认配置

```bash
# 查看配置
docker exec -it <container> cat /home/node/.clawdbot/clawdbot.json

# 检查绑定模式
docker exec -it <container> cat /home/node/.clawdbot/clawdbot.json | grep bind
```

如果是 `loopback`，改为 `lan`：

```bash
# 编辑配置
vim data/config/clawdbot.json

# 重启服务
docker compose restart clawdbot-gateway
```

---

### 问题 2：Token 认证失败

**错误信息**：

```
disconnected (1008): unauthorized: gateway token missing
disconnected (1008): unauthorized: gateway token invalid
```

**解决方案**：

#### 1. 使用带 Token 的 URL

```
http://localhost:18789/?token=YOUR_TOKEN
```

#### 2. 清除浏览器缓存

1. 按 F12 打开开发者工具
2. Application → Local Storage
3. 删除 `http://localhost:18789` 的数据
4. 刷新页面

#### 3. 重新生成 Token

```bash
docker exec -it <container> node dist/index.js doctor --generate-gateway-token
```

---

### 问题 3：设备认证错误

**错误信息**：

```
disconnected (1008): device identity required
```

**解决方案**：

#### 方法一：禁用设备认证（本机使用）

编辑 `data/config/clawdbot.json`：

```json
{
  "gateway": {
    "controlUi": {
      "allowInsecureAuth": true
    }
  }
}
```

然后重启：

```bash
docker compose restart clawdbot-gateway
```

#### 方法二：完成设备配对（生产环境）

```bash
# 查看待配对设备
docker exec -it <container> node dist/index.js devices list

# 批准配对
docker exec -it <container> node dist/index.js devices approve <REQUEST-ID>
```

---

**更多故障排查**：[docs/TROUBLESHOOTING-GATEWAY.md](docs/TROUBLESHOOTING-GATEWAY.md)

---

## 🔄 版本同步

本项目基于 [moltbot/moltbot](https://github.com/moltbot/moltbot) 进行中文本地化，定期与上游保持同步。

**版本格式**：`vYYYY.M.D-cn.N`（如 `v2026.1.24-cn.3`）

- `YYYY.M.D`：上游版本日期
- `cn`：中文版标识
- `N`：中文版修订号

---

## 🤝 参与贡献

欢迎提交 Issue 和 PR！

### 贡献方向

- ✅ Bug 修复和功能优化（会考虑贡献回上游）
- ✅ 翻译改进、文档完善
- ✅ 国内渠道适配（飞书、微信等）
- ✅ 中文模型集成（DeepSeek、通义千问等）

### 开发指南

```bash
# 安装依赖
pnpm install

# 构建 UI
pnpm ui:build

# 构建 TypeScript
pnpm build

# 运行测试
pnpm test

# 运行 E2E 测试
pnpm test:e2e
```

---

## 📄 许可证

[MIT](LICENSE)

---

## 🙏 致谢

- 基于 [Moltbot](https://github.com/moltbot/moltbot) · 感谢原项目开发者 🧞
- 基于 [moltbot-cn](https://github.com/jiulingyun/moltbot-cn) · 感谢中文版维护者 🧞

---

## 📮 联系方式

- **官网**：[https://clawd.org.cn](https://clawd.org.cn)
- **文档**：[https://clawd.org.cn/docs](https://clawd.org.cn/docs)
- **GitHub Issues**：[提交问题](https://github.com/jiulingyun/moltbot-cn/issues)

---

<p align="center">
  <sub>Built with ❤️ by the Moltbot-CN community</sub>
</p>
