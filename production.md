# Moltbot-CN 生产环境文档

**创建时间**: 2026-01-30
**最后更新**: 2026-01-30

## 项目定位

Moltbot 中文版是一个私有化部署的 AI 智能助手,完整支持中文本地化。基于 Clawdbot/Moltbot 项目开发,支持多渠道消息接入、语音交互、Canvas 画布等功能。

## 核心架构

### 技术栈
- **运行时**: Node.js ≥ 22.12.0
- **包管理**: pnpm 10.23.0
- **语言**: TypeScript 5.9.3
- **构建工具**: TypeScript Compiler (tsc)
- **测试框架**: Vitest 4.0.18

### 核心依赖
- **AI Agent**: @mariozechner/pi-agent-core 0.49.3
- **WhatsApp**: @whiskeysockets/baileys 7.0.0-rc.9
- **Telegram**: grammy 1.39.3
- **Discord**: discord-api-types 0.38.37
- **Slack**: @slack/bolt 4.6.0
- **AWS Bedrock**: @aws-sdk/client-bedrock 3.975.0
- **LLM Provider**: 支持多种 AI 提供商 (OpenAI、Anthropic、Google Gemini、GitHub Copilot、AWS Bedrock)

### 目录结构
```
moltbot-cn/
├── src/                    # 源代码
│   ├── agents/            # AI Agent 相关
│   ├── auto-reply/        # 自动回复逻辑
│   ├── channels/          # 消息渠道适配器
│   ├── config/            # 配置管理
│   ├── gateway/           # Gateway 服务器
│   ├── providers/         # LLM 提供商实现
│   └── commands/          # CLI 命令
├── ui/                    # Web 控制界面
├── apps/                  # 移动端应用 (iOS/Android/macOS)
├── extensions/            # 扩展插件
├── skills/                # 技能脚本
└── docs/                  # 文档
```

## LLM 配置架构

### 模型提供商配置 (src/config/types.models.ts)

```typescript
type ModelApi =
  | "openai-completions"   // OpenAI Completions API
  | "openai-responses"     // OpenAI Responses API (O3)
  | "anthropic-messages"   // Anthropic Messages API
  | "google-generative-ai" // Google Gemini API
  | "github-copilot"       // GitHub Copilot API
  | "bedrock-converse-stream"; // AWS Bedrock API

type ModelProviderConfig = {
  baseUrl: string;         // API 端点
  apiKey?: string;         // API 密钥
  auth?: "api-key" | "aws-sdk" | "oauth" | "token";
  api?: ModelApi;          // API 类型
  headers?: Record<string, string>;
  models: ModelDefinitionConfig[];
}
```

### 配置文件位置
- **全局配置**: `~/.moltbot/moltbot.json`
- **环境变量**: `.env` (项目根目录) 或系统环境变量
- **Docker 部署**: 通过 `.env` 文件配置

### 支持的 LLM 提供商
1. **Anthropic Claude** - 默认推荐
2. **OpenAI** - GPT-4/o1 系列
3. **Google Gemini** - Gemini 2.0 系列
4. **GitHub Copilot** - 使用 Copilot Token
5. **AWS Bedrock** - 企业级部署
6. **自定义提供商** - 支持 OpenAI 兼容 API

## 部署流程

### npm 全局安装
```bash
npm install -g moltbot-cn@latest
moltbot-cn onboard --install-daemon
```

### 从源码构建
```bash
git clone https://github.com/jiulingyun/moltbot-cn.git
cd moltbot-cn
pnpm install
pnpm ui:build
pnpm build
```

### Docker 部署
```bash
git clone https://github.com/jiulingyun/moltbot-cn.git
cd moltbot-cn
chmod +x docker-setup.sh
./docker-setup.sh
```

## 配置示例

最小配置 (`~/.moltbot/moltbot.json`):
```json
{
  "agent": {
    "model": "anthropic/claude-opus-4-5"
  }
}
```

## 渠道支持

- ✅ WhatsApp
- ✅ Telegram
- ✅ Slack
- ✅ Discord
- ✅ Signal
- ✅ iMessage (macOS/iOS)
- ✅ Line
- ✅ 飞书 (Feishu)
- 🚧 微信 (开发中)

## 特性

- 🇨🇳 完整中文化
- 🏠 本地优先,数据隐私可控
- 🎙️ 语音唤醒和对话
- 🖼️ Canvas 智能画布
- 🔧 技能扩展系统
- 📱 多渠道消息统一接入
- 🔄 自动回复和智能路由

## 版本信息

- **当前版本**: 2026.1.24-cn.3
- **Node.js 要求**: ≥ 22.12.0
- **包管理器**: pnpm 10.23.0
