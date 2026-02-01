---
summary: "Telegram 机器人支持状态、功能和配置"
read_when:
  - 您想要连接 Telegram 机器人
  - 您正在配置 Telegram 渠道
---

# Telegram 机器人

状态：生产就绪，支持机器人私聊和群组。默认使用长轮询模式，可选 webhook。

---

## 快速开始

添加 Telegram 渠道有两种方式：

### 方式一：通过安装向导添加（推荐）

如果您刚安装完 Moltbot，可以直接运行向导，根据提示添加 Telegram：

```bash
moltbot-cn onboard
```

向导会引导您完成：
1. 创建 Telegram 机器人并获取 Token
2. 配置机器人 Token
3. 启动网关

### 方式二：通过命令行添加

如果您已经完成了初始安装，可以用以下命令添加 Telegram 渠道：

```bash
moltbot-cn channels add --channel telegram --token "您的Token"
```

---

## 第一步：创建 Telegram 机器人

### 1. 打开 BotFather

在 Telegram 中搜索并打开官方机器人 **@BotFather**。

<!-- 截图位置：搜索 BotFather -->
![BotFather 搜索](../images/telegram-search-botfather.png)

### 2. 启动 BotFather

点击 **Start** 或发送 `/start` 开始与 BotFather 对话。

<!-- 截图位置：点击 Start -->
![BotFather Start](../images/telegram-botfather-start.png)

### 3. 创建新机器人

发送 `/newbot` 命令，然后按提示操作：

1. **输入机器人名称**：例如 `我的AI助手`
2. **输入机器人用户名**：必须以 `bot` 结尾，例如 `myai_assistant_bot`

<!-- 截图位置：创建机器人过程 -->
![BotFather 创建机器人](../images/telegram-botfather-newbot.png)

### 4. 复制 Token

创建成功后，BotFather 会返回一个 **Token**（格式如 `123456789:ABCdef...`）。

❗ **重要**：请妙善保管此 Token，不要分享给他人。

<!-- 截图位置：获取 Token -->
![BotFather Token](../images/telegram-botfather-token.png)

---

## 第二步：配置 Moltbot

### 通过向导配置

运行 `moltbot-cn onboard` 或 `moltbot-cn configure`，根据提示粘贴 Token。

### 通过命令行配置

```bash
moltbot-cn channels add --channel telegram --token "123456789:ABCdef..."
```

### 通过配置文件配置

编辑 `~/.moltbot/moltbot.json`：

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "123456789:ABCdef...",
      dmPolicy: "pairing"
    }
  }
}
```

### 通过环境变量配置

```bash
export TELEGRAM_BOT_TOKEN="123456789:ABCdef..."
```

---

## 第三步：启动并测试

### 1. 启动网关

```bash
moltbot-cn gateway
```

### 2. 发送测试消息

在 Telegram 中找到您创建的机器人，发送一条消息。

### 3. 配对授权

默认情况下，机器人会回复一个 **配对码**。您需要批准此代码：

```bash
moltbot-cn pairing approve telegram <配对码>
```

批准后即可正常对话。

---

## 介绍

- **Telegram Bot API 渠道**：由网关管理的 Telegram 机器人
- **确定性路由**：回复始终返回 Telegram，模型不会选择渠道
- **会话隔离**：私聊共享主会话；群组独立隔离

---

## 权限设置（BotFather）

### 隐私模式

Telegram 机器人默认启用 **隐私模式**，只能接收 @提及 的消息。

如果您希望机器人接收群组中的 **所有消息**：
- 用 `/setprivacy` 命令禁用隐私模式，**或**
- 将机器人设为群组 **管理员**

> 注意：修改隐私设置后，需要将机器人移出群组再重新添加才能生效。

### 其他 BotFather 设置

- `/setjoingroups` — 允许/禁止机器人加入群组
- `/setprivacy` — 控制机器人是否能查看所有群组消息

---

## 访问控制

### 私聊访问

- **默认**：`dmPolicy: "pairing"`，陌生用户会收到配对码
- **批准配对**：
  ```bash
  moltbot-cn pairing list telegram      # 查看待审批列表
  moltbot-cn pairing approve telegram <CODE>  # 批准
  ```
- **白名单模式**：通过 `channels.telegram.allowFrom` 配置允许的用户 ID

### 群组访问

**1. 允许哪些群组**（`channels.telegram.groups`）：
- 不配置 = 允许所有群组
- 配置后 = 仅允许列出的群组或 `"*"`

**2. 允许哪些发送者**（`channels.telegram.groupPolicy`）：
- `"open"` = 允许群组中所有人
- `"allowlist"` = 仅允许 `groupAllowFrom` 中的用户
- `"disabled"` = 禁用群组消息

---

## 群组配置示例

### 允许所有群组，需要 @提及

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { requireMention: true }
      }
    }
  }
}
```

### 允许所有群组，始终响应

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { requireMention: false }
      }
    }
  }
}
```

### 仅允许特定群组

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": { requireMention: false }
      }
    }
  }
}
```

---

## 获取群组/用户 ID

### 获取群组 ID

将群组中的任意消息转发给 `@userinfobot` 或 `@getidsbot`，即可获取群组 ID（负数，如 `-1001234567890`）。

### 获取用户 ID

**方法一**（推荐）：
1. 启动网关并给机器人发消息
2. 运行 `moltbot-cn logs --follow` 查看 `from.id`

**方法二**：
私聊 `@userinfobot`，它会返回您的用户 ID。

---

## 常用命令

| 命令 | 说明 |
|------|------|
| `/status` | 查看机器人状态 |
| `/reset` | 重置对话会话 |
| `/model` | 查看/切换模型 |
| `/activation always` | 响应所有消息（仅当前会话） |
| `/activation mention` | 仅响应 @提及（默认） |

---

## 故障排除

### 机器人在群组中不响应

1. 检查隐私模式是否已禁用（BotFather `/setprivacy`）
2. 检查群组是否在 `channels.telegram.groups` 配置中
3. 确认机器人是群组成员
4. 查看日志：`moltbot-cn logs --follow`

### 命令不生效

- 确保您的 Telegram 用户 ID 已授权（通过配对或 `allowFrom`）
- 命令即使在 `groupPolicy: "open"` 的群组中也需要授权

### Token 泄露怎么办

1. 在 BotFather 中使用 `/revoke` 废除旧 Token
2. 获取新 Token 并更新配置
3. 重启网关

### 网络问题

- 检查是否能访问 `api.telegram.org`
- 如有代理需求，配置 `channels.telegram.proxy`

---

## 高级配置

### Webhook 模式

默认使用长轮询，无需公网 URL。如需使用 Webhook：

```json5
{
  channels: {
    telegram: {
      webhookUrl: "https://your-domain.com/telegram-webhook",
      webhookSecret: "your-secret"  // 可选
    }
  }
}
```

### 消息格式

- 出站消息使用 Telegram HTML 格式
- Markdown 会自动转换为 Telegram 兼容的 HTML
- 如果 HTML 被拒绝，会自动回退到纯文本

### 消息限制

- `textChunkLimit`：出站文本分块大小（默认 4000 字符）
- `mediaMaxMb`：媒体上传/下载限制（默认 5MB）

### 自定义命令菜单

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Git 备份" },
        { command: "generate", description: "生成图片" }
      ]
    }
  }
}
```

---

## 配置参考

完整配置请参考：[网关配置](/gateway/configuration)

主要选项：

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `channels.telegram.enabled` | 启用/禁用渠道 | `true` |
| `channels.telegram.botToken` | 机器人 Token | - |
| `channels.telegram.dmPolicy` | 私聊策略 | `pairing` |
| `channels.telegram.allowFrom` | 私聊白名单 | - |
| `channels.telegram.groupPolicy` | 群组策略 | `allowlist` |
| `channels.telegram.groups` | 群组配置 | - |
| `channels.telegram.proxy` | 代理 URL | - |
