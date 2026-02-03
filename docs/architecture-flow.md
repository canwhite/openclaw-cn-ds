# Moltbot-CN 架构流转文档

**版本**: 1.0
**创建时间**: 2026-02-01
**作者**: Claude Code

## 目录

1. [概述](#概述)
2. [消息流转主流程](#消息流转主流程)
3. [工具调用机制](#工具调用机制)
4. [模块交互关系](#模块交互关系)
5. [关键代码解析](#关键代码解析)
6. [配置说明](#配置说明)

---

## 概述

Moltbot-CN 是一个模块化的 AI 智能助手系统，通过渠道适配器统一接入多个消息平台，
使用 PI Agent 作为核心 AI 引擎，支持多种 LLM 提供商，并通过技能系统和工具调用扩展功能。

### 核心设计原则

- **渠道抽象**：统一的渠道接口，支持多种消息平台
- **Provider 抽象**：统一的 LLM 提供商接口，支持多种 AI 模型
- **插件化**：扩展（extensions）和技能（skills）系统提供模块化能力
- **事件驱动**：基于事件和回调的异步消息处理
- **沙盒隔离**：可选的 Docker 沙盒环境执行工具

---

## 消息流转主流程

### 完整消息流转图

```
┌──────┐     ┌──────────┐     ┌─────────┐     ┌──────┐
│ 用户 │ ──→ │ 渠道适配器│ ──→ │ Gateway │ ──→ │会话存储│
└──────┘     │WhatsApp/ │     │ Server  │     │      │
             │Telegram  │     └─────────┘     └──────┘
             └──────────┘         │
                                 │
                                 ▼
                             ┌──────────┐
                             │PI Agent  │
                             │运行器    │
                             └──────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    ▼             ▼             ▼
                ┌────────┐   ┌────────┐   ┌────────┐
                │解析模型│   │解析认证│   │构建提示│
                │配置    │   │配置    │   │词     │
                └────────┘   └────────┘   └────────┘
                    │             │             │
                    └─────────────┴─────────────┘
                                  │
                                  ▼
                            ┌──────────┐
                            │ LLM      │
                            │ Provider │
                            └──────────┘
                                  │
                ┌─────────────────┼─────────────────┐
                ▼                 ▼                 ▼
           ┌─────────┐       ┌─────────┐       ┌─────────┐
           │返回响应 │       │调用工具 │       │最终响应 │
           │流       │       │         │       │         │
           └─────────┘       └─────────┘       └─────────┘
                                  │
                ┌─────────────────┼─────────────────┐
                ▼                 ▼                 ▼
           ┌─────────┐       ┌─────────┐       ┌─────────┐
           │执行工具 │       │返回结果 │       │保存历史 │
           │bash-tools│      │         │       │         │
           └─────────┘       └─────────┘       └─────────┘
                                                    │
                                                    ▼
                                             ┌──────────┐
                                             │发送响应 │
                                             │到渠道    │
                                             └──────────┘
                                                    │
                                                    ▼
                                             ┌──────┐
                                             │ 用户 │
                                             └──────┘

注：整个过程通过 WebSocket 实时推送进度事件
```

### 详细流程说明

#### 1. 消息接收阶段 (Channel → Gateway)

**代码位置**:

- 渠道适配器接口: `extensions/*/src/channel.ts`
  - WhatsApp: `extensions/whatsapp/src/channel.ts`
  - Telegram: `extensions/telegram/src/channel.ts`
  - Discord: `extensions/discord/src/channel.ts`
  - Slack: `extensions/slack/src/channel.ts`
  - Signal: `extensions/signal/src/channel.ts`
  - iMessage: `extensions/imessage/src/channel.ts`
  - Feishu: `extensions/feishu/src/channel.ts`
- 会话记录: `src/channels/session.ts:17`
- Gateway 聊天处理: `src/gateway/server-chat.ts:182`

```typescript
// 示例：WhatsApp 渠道接收消息（extensions/whatsapp/src/channel.ts）
// 实际代码中，每个渠道有自己的实现，但都调用统一的会话记录函数

// 1. 渠道特定的消息处理（伪代码示例）
async function handleInboundMessage(message: InboundMessage) {
  // 2. 规范化消息格式
  const normalized = normalizeMessage(message);

  // 3. 解析会话密钥（src/config/sessions.ts）
  const sessionKey = resolveSessionKey({
    channel: normalized.channel,
    to: normalized.to,
    groupId: normalized.groupId,
  });

  // 4. 记录会话元数据（src/channels/session.ts:17）
  await recordInboundSession({
    storePath: config.sessionStorePath,
    sessionKey,
    ctx: normalized.context,
  });
}
```

**关键点**：

- 每个渠道（WhatsApp/Telegram/etc）实现统一的 `Channel` 接口
- 消息被规范化为统一的内部格式
- 会话密钥（sessionKey）由 `channel:to:groupId` 组成
- 所有渠道共享同一套会话管理逻辑（`src/channels/session.ts`）

#### 2. Agent 启动阶段 (Gateway → Agent)

**代码位置**:

- Agent 运行器: `src/agents/pi-embedded-runner/run.ts:69`
- Gateway 调用 Agent: `src/gateway/server-methods/agent.ts:208`
- 会话加载: `src/gateway/session-utils.ts:157`

```typescript
export async function runEmbeddedPiAgent(
  params: RunEmbeddedPiAgentParams,
): Promise<EmbeddedPiRunResult> {
  // 1. 解析模型配置
  const { model, error, authStorage, modelRegistry } = resolveModel(
    provider,
    modelId,
    agentDir,
    params.config,
  );

  // 2. 解析认证配置（支持多 profile 轮换）
  const authStore = ensureAuthProfileStore(agentDir);
  const profileOrder = resolveAuthProfileOrder({
    cfg: params.config,
    store: authStore,
    provider,
    preferredProfile: params.authProfileId,
  });

  // 3. 应用 API Key
  await applyApiKeyInfo(profileCandidates[profileIndex]);

  // 4. 上下文窗口检查
  const ctxGuard = evaluateContextWindowGuard({
    info: ctxInfo,
    warnBelowTokens: CONTEXT_WINDOW_WARN_BELOW_TOKENS,
    hardMinTokens: CONTEXT_WINDOW_HARD_MIN_TOKENS,
  });

  // 5. 构建并运行 Agent
  const attempt = await runEmbeddedAttempt({
    sessionId: params.sessionId,
    sessionKey: params.sessionKey,
    prompt: params.prompt,
    images: params.images,
    provider,
    modelId,
    model,
    authStorage,
    // ... 更多参数
  });

  return attempt;
}
```

**关键点**：

- **模型解析**：从配置文件和环境变量加载模型配置
- **认证轮换**：支持多个 auth profile，失败时自动切换
- **上下文窗口**：检查模型上下文是否足够，不足时自动压缩历史
- **Lane 调度**：使用全局和会话级别的 Lane 进行并发控制

#### 3. LLM 调用阶段 (Agent → Provider)

**代码位置**:

- Agent 执行: `src/agents/pi-embedded-runner/run/attempt.ts`
- Provider 抽象: `src/providers/`
  - OpenAI: 各个 provider 文件中的流式调用实现
  - Anthropic: `src/providers/` 下的 Anthropic 实现
  - Google Gemini: `src/providers/google-shared.ts`
- 模型选择: `src/agents/model-selection.ts`

```typescript
async function runEmbeddedAttempt(params: RunAttemptParams) {
  // 1. 构建提示词
  const messages = buildMessages({
    systemPrompt: params.systemPrompt,
    history: params.sessionHistory,
    prompt: params.prompt,
  });

  // 2. 构建工具定义
  const tools = buildTools({
    codingTools: createClawdbotCodingTools(options),
    clawdbotTools: createClawdbotTools(options),
    skills: params.skillsSnapshot,
  });

  // 3. 流式调用 LLM API
  const response = await streamCompletion({
    provider: params.provider,
    model: params.modelId,
    messages,
    tools,
    onChunk: (chunk) => {
      // 实时推送响应片段
      emitChatDelta(sessionKey, runId, chunk.text);
    },
    onToolCall: (toolCall) => {
      // 处理工具调用
      return handleToolCall(toolCall);
    },
  });

  return response;
}
```

**关键点**：

- **流式响应**：使用 Server-Sent Events (SSE) 实时推送响应
- **工具定义**：根据配置动态构建可用工具列表
- **错误处理**：支持自动重试、认证切换、模型降级

#### 4. 工具调用阶段 (Agent → Tools)

详见 [工具调用机制](#工具调用机制) 章节。这个后边会讲～

#### 5. 响应返回阶段 (Agent → User)

**代码位置**:

- 增量推送: `src/gateway/server-chat.ts:116`
- 最终响应: `src/gateway/server-chat.ts:137`
- 广播到客户端: `src/gateway/server-broadcast.ts`

```typescript
// 实时推送响应片段
function emitChatDelta(
  sessionKey: string,
  runId: string,
  seq: number,
  text: string,
) {
  const payload = {
    runId,
    sessionKey,
    seq,
    state: "delta",
    message: {
      role: "assistant",
      content: [{ type: "text", text }],
      timestamp: Date.now(),
    },
  };

  // 广播到所有 Gateway 客户端
  broadcast("chat", payload, { dropIfSlow: true });

  // 发送到 Node 会话
  nodeSendToSession(sessionKey, "chat", payload);
}

// 最终响应
function emitChatFinal(sessionKey: string, runId: string, seq: number) {
  const payload = {
    runId,
    sessionKey,
    seq,
    state: "final",
    message: {
      /* ... */
    },
  };

  broadcast("chat", payload);
  nodeSendToSession(sessionKey, "chat", payload);
}
```

**关键点**：

- **增量推送**：每 150ms 推送一次文本片段（防抖）
- **广播机制**：同时推送到 Web UI 和 Node 会话
- **最终确认**：发送 `state: "final"` 表示响应完成

---

## 工具调用机制

### 工具调用流程图

```
┌────────┐     ┌────────┐     ┌──────────┐     ┌──────────┐
│  LLM   │ ──→ │ PI     │ ──→ │ 工具注册表│ ──→  │ 工具策略 │
│Provider│     │ Agent  │     │pi-tools.ts│     │tool-policy│
└────────┘     └────────┘     └──────────┘     └──────────┘
                                              │
                                              ▼
                                         ┌────────┐
                                         │检查权限 │
                                         │isToolAllowed│
                                         └────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    ▼                         ▼                         ▼
              ┌──────────┐              ┌──────────┐              ┌──────────┐
              │工具被拒绝  │              │工具允许   │              │需要批准  │
              │          │              │执行       │              │          │
              └──────────┘              └──────────┘              └──────────┘
                   │                         │                         │
                   ▼                         ▼                         ▼
              返回错误                 ┌──────────┐              请求用户批准
              to LLM                  │检查沙盒   │                    │
                                      │是否需要   │                    │
                                      └──────────┘                    │
                                         │                            │
                    ┌────────────────────┼────────────────────┐       │
                    ▼                    ▼                    ▼       │
               ┌────────┐          ┌────────┐          ┌────────┐    │
               │需要沙盒│           │本地执行│            │Docker  │    │
               │        │          │        │          │沙盒    │     │
               └────────┘          └────────┘          └────────┘    │
                    │                    │                    │     │
                    └────────────────────┼────────────────────┘     │
                                         │                         │
                                         ▼                         ▼
                                  ┌──────────┐              ┌──────────┐
                                  │执行命令  │               │用户批准  │
                                  │spawn()  │               │          │
                                  └──────────┘              └──────────┘
                                         │                         │
                    ┌────────────────────┼────────────────────┐     │
                    ▼                    ▼                    ▼     │
               ┌────────┐          ┌────────┐          ┌────────┐ │
               │后台运行│          │同步运行│          │返回结果│ │
               │返回ID  │          │返回输出│          │to LLM  │ │
               └────────┘          └────────┘          └────────┘ │
                    │                    │                    │     │
                    └────────────────────┼────────────────────┘     │
                                         │                         │
                                         ▼                         │
                                  ┌──────────┐                    │
                                  │返回工具结果│                    │
                                  │tool_result│ ◄──────────────────┘
                                  └──────────┘
                                         │
                                         ▼
                                  ┌──────────┐
                                  │ LLM 继续处理│
                                  │ (可能再次调用工具) │
                                  └──────────┘
```

### 工具注册表

**代码位置**:

- 工具注册: `src/agents/pi-tools.ts`
- 工具定义接口: `src/agents/pi-tools.types.ts`
- 工具策略: `src/agents/tool-policy.ts`
- 工具权限检查: `src/agents/pi-tools.policy.ts`

工具分为三大类：

#### 1. 编码工具 (Coding Tools)

**代码位置**:

- 工具创建: `src/agents/pi-tools.ts:107` (createClawdbotCodingTools)
- 外部依赖: `@mariozechner/pi-coding-agent` 包
- 工具定义: `src/agents/pi-tools.read.ts`

来自 `@mariozechner/pi-coding-agent` 包：

```typescript
import {
  codingTools,
  createEditTool,
  createReadTool,
  createWriteTool,
  readTool,
} from "@mariozechner/pi-coding-agent";

// 创建编码工具（src/agents/pi-tools.ts:107）
export function createClawdbotCodingTools(options: {
  workspaceDir?: string;
  sandbox?: SandboxContext;
  config?: ClawdbotConfig;
}): AnyAgentTool[] {
  return [
    createReadTool({
      /* ... */
    }),
    createWriteTool({
      /* ... */
    }),
    createEditTool({
      /* ... */
    }),
    // 根据配置添加更多工具
  ];
}
```

**工具列表**：

- `read` - 读取文件内容
- `write` - 写入文件
- `edit` - 编辑文件（使用 apply-patch）

#### 2. Bash 工具 (Bash Tools)

**代码位置**:

- 工具创建: `src/agents/bash-tools.exec.ts:706` (createExecTool)
- Bash 执行: `src/agents/bash-tools.exec.ts:1495` (execTool 导出)
- 进程管理: `src/agents/bash-tools.process.ts`
- 进程注册表: `src/agents/bash-process-registry.ts`
- PTY 处理: `src/agents/pty-dsr.ts`

```typescript
export function createExecTool(options: ExecToolDefaults): AgentTool {
  return {
    name: "exec",
    description: "Execute shell commands",
    inputSchema: execSchema, // TypeBox schema
    handler: async (args) => {
      const { command, workdir, env, background, timeout, pty, elevated } =
        args;

      // 1. 检查权限
      if (!(await checkExecPermission(command, options))) {
        return { error: "Permission denied" };
      }

      // 2. 准备执行环境
      const execEnv = prepareEnv(env, options);
      const cwd = workdir || options.cwd;

      // 3. 后台运行
      if (background) {
        const session = await spawnBackground(command, cwd, execEnv);
        return {
          status: "running",
          sessionId: session.slug,
          pid: session.pid,
        };
      }

      // 4. 同步运行
      const result = await spawnSync(command, cwd, execEnv, {
        timeout,
        pty,
      });

      return {
        status: result.exitCode === 0 ? "completed" : "failed",
        exitCode: result.exitCode,
        output: result.stdout + result.stderr,
      };
    },
  };
}
```

**工具列表**：

- `exec` - 执行 Shell 命令（支持前台/后台）
- `process` - 管理后台进程（发送输入、查看输出、kill）

#### 3. Clawdbot 高级工具

**代码位置**:

- 工具创建: `src/agents/clawdbot-tools.ts:22` (createClawdbotTools)
- 浏览器工具: `src/agents/tools/browser-tool.ts`
- Canvas 工具: `src/agents/tools/canvas-tool.ts`
- Cron 工具: `src/agents/tools/cron-tool.ts`
- 消息工具: `src/agents/tools/message-tool.ts`
- TTS 工具: `src/agents/tools/tts-tool.ts`
- Gateway 工具: `src/agents/tools/gateway-tool.ts`
- 会话工具: `src/agents/tools/sessions-*-tool.ts`
- Web 工具: `src/agents/tools/web-tools.ts`
- 图像工具: `src/agents/tools/image-tool.ts`
- 节点工具: `src/agents/tools/nodes-tool.ts`
- Agents 工具: `src/agents/tools/agents-list-tool.ts`

```typescript
export function createClawdbotTools(options?: {
  browserControlUrl?: string;
  agentSessionKey?: string;
  agentChannel?: GatewayMessageChannel;
  // ...
}): AnyAgentTool[] {
  return [
    createBrowserTool({
      /* 浏览器控制 */
    }),
    createCanvasTool(), // Canvas 画布
    createCronTool(), // 定时任务
    createMessageTool(), // 发送消息
    createTtsTool(), // 语音合成
    createGatewayTool(), // Gateway 控制
    createSessionsListTool(), // 列出会话
    createSessionsSpawnTool(), // 生成子 Agent
    createSessionsSendTool(), // 向会话发送消息
    createSessionStatusTool(), // 会话状态
    createWebSearchTool(), // 网络搜索
    createWebFetchTool(), // 网络请求
    createImageTool(), // 图像处理
    createNodesTool(), // 节点管理
    createAgentsListTool(), // Agent 列表
    // ...
  ];
}
```

### 工具策略 (Tool Policy)

**代码位置**:

- 策略解析: `src/agents/tool-policy.ts`
- 权限检查: `src/agents/pi-tools.policy.ts:173`
- 策略应用: `src/agents/pi-tools.policy.ts:190`

工具策略分为多个层级（`src/agents/pi-tools.policy.ts`）:

```typescript

type ToolPolicy = {
  allow?: string[];      // 允许的工具列表
  deny?: string[];       // 拒绝的工具列表
};

// 策略优先级（从高到低）：
1. 沙盒策略 (sandbox.tools)
2. 子 Agent 策略 (subagentPolicy)
3. 群组策略 (groupPolicy)
4. Agent 策略 (agentPolicy)
5. Provider 策略 (agentProviderPolicy)
6. 全局 Provider 策略 (globalProviderPolicy)
7. 全局策略 (globalPolicy)
8. Profile 策略 (profilePolicy)

```

**权限检查流程**：

```typescript
function isToolAllowedByPolicies(
  toolName: string,
  policies: ToolPolicy[],
): boolean {
  // 从最具体的策略开始检查
  for (const policy of policies) {
    if (policy.deny?.includes(toolName)) {
      return false; // 明确拒绝
    }
  }

  // 检查是否有任何策略允许
  for (const policy of policies) {
    if (policy.allow?.includes(toolName)) {
      return true; // 明确允许
    }
  }

  // 默认拒绝（白名单模式）
  return false;
}
```

### 工具执行选项

**代码位置**:

- 类型定义: `src/agents/bash-tools.exec.ts:118` (ExecToolDefaults)
- 执行配置: `src/agents/bash-tools.exec.ts:706-820`
- 安全配置: `src/infra/exec-approvals.ts`
- 沙盒配置: `src/agents/sandbox.ts`
- PTY 配置: `src/agents/pty-dsr.ts`

```typescript
type ExecToolDefaults = {
  host?: "sandbox" | "gateway" | "node"; // 执行主机
  security?: "deny" | "allowlist" | "full"; // 安全级别
  ask?: "off" | "on-miss" | "always"; // 批准模式
  node?: string; // 节点 ID（host=node 时）
  pathPrepend?: string[]; // PATH 前置
  safeBins?: string[]; // 安全二进制列表
  backgroundMs?: number; // 后台自动后台化时间
  timeoutSec?: number; // 超时时间
  sandbox?: BashSandboxConfig; // 沙盒配置
  elevated?: ExecElevatedDefaults; // 提权配置
  scopeKey?: string; // 作用域密钥
  sessionKey?: string; // 会话密钥
  cwd?: string; // 工作目录
};
```

**安全级别说明**：

| security    | 说明                   |
| ----------- | ---------------------- |
| `deny`      | 拒绝所有执行           |
| `allowlist` | 仅允许白名单中的命令   |
| `full`      | 允许所有命令（不推荐） |

**批准模式说明**：

| ask       | 说明               |
| --------- | ------------------ |
| `off`     | 自动批准所有命令   |
| `on-miss` | 白名单外需要批准   |
| `always`  | 所有命令都需要批准 |

---

## 模块交互关系

### 模块依赖图

```
┌─────────────────────────────────────────────────────────────────┐
│                      渠道层 (Channels)                           │
├─────────────────────────────────────────────────────────────────┤
│  WhatsApp    Telegram    Discord    Feishu    Slack             │
│     │           │          │          │         │               │
│     └───────────┴──────────┴──────────┴─────────┘               │
│                            │                                    │
└────────────────────────────┼────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      网关层 (Gateway)          [核心模块]         │
├─────────────────────────────────────────────────────────────────┤
│              ┌──────────────────────────────┐                   │
│              │         Gateway Server       │                   │
│              └──────────────────────────────┘                   │
│                      │           │                              │
│              ┌───────┴─────┐   ┌──┴──────┐                      │
│              ▼             ▼   ▼         ▼                      │
│         WebSocket      HTTP API  (更多模块)                      │
│                                                                 │
└────────────────────────────┼────────────────────────────────────┘
                             │
                ┌────────────┴────────────┐
                ▼                         ▼
┌───────────────────────────┐  ┌───────────────────────────┐
│    Agent 层 (Agents)      │  │   存储层 (Storage)         │
├───────────────────────────┤  ├───────────────────────────┤
│   [核心模块]               │  │  Session Store             │
│ ┌───────────────────────┐ │  │  Config Store             │
│ │  PI Agent Runner      │ │  │  Cache                    │
│ └───────────────────────┘ │  └───────────────────────────┘
 │          │               │           ▲
 │    ┌─────┴─────┬─────┐   │           │
 │    ▼           ▼     ▼   │           │
 │ Auth      Model   Tool  │◄──────────┘
 │ Profiles  Catalog       │
 │                   │     │
 │              ┌────┴─────┴───┐
 │              ▼              ▼
 │           Skill         (更多)
 │           Loader
 └───────┬───────────────────┘
         │
    ┌────┴──────────────────────────────────────────────────┐
    ▼                                                     ▼
┌────────────────────┐                          ┌────────────────────┐
│ Provider 层        │                          │ 工具执行层 (Tools) │
├────────────────────┤                          ├────────────────────┤
│ OpenAI             │    ┌─────────────┐      │ Bash Tools         │
│ Anthropic          │◄───│ Tool Registry│◄────│ Coding Tools       │
│ Google Gemini      │    └─────────────┘      │ Canvas Tool        │
│ GitHub Copilot     │                          │ Browser Tool       │
│ AWS Bedrock        │                          │ Web Tools          │
└────────────────────┘                          └────────────────────┘

图例：
[核心模块] = 主要依赖中心
───►      = 依赖关系
◄────      = 被依赖关系
```

### 核心模块说明

#### 1. 渠道层 (Channels)

**位置**:

- 渠道接口: `extensions/*/src/channel.ts`
- 渠道运行时: `extensions/*/src/runtime.ts`
- 渠道注册: `src/channels/registry.ts`
- 渠道配置: `src/channels/channel-config.ts`
- 会话管理: `src/channels/session.ts:17`

**职责**：

- 接收来自消息平台的原始消息
- 规范化为统一的内部格式
- 发送响应回消息平台
- 处理平台特定功能（如文件上传、消息编辑）

**接口定义**：

```typescript
interface Channel {
  id: string; // 渠道 ID
  label: string; // 显示名称
  meta: ChannelMeta; // 元数据

  // 核心方法
  sendMessage(params: SendMessageParams): Promise<void>;
  handleInbound(message: RawMessage): Promise<void>;
  normalizeMessage(message: RawMessage): NormalizedMessage;
}
```

#### 2. 网关层 (Gateway)

**位置**: `src/gateway/`

**关键文件**:

- WebSocket 服务器: `src/gateway/server-*.ts`
- HTTP 服务器: `src/gateway/server-http.ts`
- 聊天处理: `src/gateway/server-chat.ts`
- 聊天方法: `src/gateway/server-methods/chat.ts`
- Agent 方法: `src/gateway/server-methods/agent.ts`
- 会话方法: `src/gateway/server-methods/sessions.ts`
- 配置应用: `src/gateway/server.config-apply.ts`
- 认证: `src/gateway/auth.ts`

**职责**：

- WebSocket 服务器（实时通信）
- HTTP API（配置、控制）
- 会话管理
- 事件广播
- CLI 后端支持

#### 3. Agent 层 (Agents)

**位置**: `src/agents/`

**关键文件**:

- Agent 运行器: `src/agents/pi-embedded-runner/run.ts:69`
- Agent 执行: `src/agents/pi-embedded-runner/run/attempt.ts`
- 模型选择: `src/agents/model-selection.ts`
- 认证管理: `src/agents/model-auth.ts`
- 工具注册: `src/agents/pi-tools.ts`
- Bash 工具: `src/agents/bash-tools.exec.ts:706`
- 技能加载: `src/agents/skills.ts`
- 沙盒管理: `src/agents/sandbox.ts`

**职责**：

- 运行 PI Agent
- 管理会话状态
- 工具注册和执行
- 技能加载
- 认证管理

#### 4. Provider 层 (Providers)

**位置**: `src/providers/`

**关键文件**:

- GitHub Copilot: `src/providers/github-copilot-*.ts`
- Google Gemini: `src/providers/google-shared.ts`
- Qwen: `src/providers/qwen-portal-oauth.ts`
- Provider 认证: `src/agents/model-auth.ts`
- 模型目录: `src/agents/model-catalog.ts`

**职责**：

- 统一不同 LLM 提供商的 API
- 处理 OAuth 认证
- 流式响应处理
- 错误处理和重试

**支持的提供商**：

- OpenAI (GPT-4, o1)
- Anthropic (Claude)
- Google (Gemini)
- GitHub Copilot
- AWS Bedrock
- 自定义（OpenAI 兼容 API）

#### 5. 工具执行层 (Tools)

**位置**: `src/agents/bash-tools.exec.ts`, `src/agents/tools/`

**职责**：

- 执行 Shell 命令
- 文件读写
- 浏览器自动化
- Canvas 绘图
- 网络请求

#### 6. 存储层 (Storage)

**位置**: `src/config/sessions.ts`, `src/config/`

**职责**：

- 会话历史存储
- 配置持久化
- 缓存管理
- 认证存储

---

## 关键代码解析

### 1）. 会话管理

**代码位置**:

- 会话类型: `src/config/sessions.ts`
- 会话加载: `src/gateway/session-utils.ts:157` (loadSessionEntry)
- 会话记录: `src/channels/session.ts:17` (recordInboundSession)
- SessionKey 解析: `src/gateway/http-utils.ts:52` (resolveSessionKey)
- SessionKey 从参数: `src/gateway/sessions-resolve.ts:18` (resolveSessionKeyFromResolveParams)

```typescript
// 会话密钥格式
type SessionKey = `${string}:${string}:${string}:${string}`;
//                channel  :to      :accountId:threadId

// 示例
const sessionKey = "whatsapp:+1234567890::";

// 加载会话
async function loadSessionEntry(sessionKey: string): Promise<SessionEntry> {
  const sessionPath = path.join(storePath, `${sessionKey}.json`);
  const content = await fs.readFile(sessionPath, "utf-8");
  return JSON.parse(content);
}

// 追加消息
async function appendMessage(
  sessionKey: string,
  message: SessionMessage,
): Promise<void> {
  const entry = await loadSessionEntry(sessionKey);
  entry.history.push(message);

  // 自动压缩历史（如果超过上下文窗口）
  if (entry.history.length > maxHistory) {
    entry.history = await compactHistory(entry.history);
  }

  await saveSessionEntry(sessionKey, entry);
}
```

### 2）. Lane 调度系统

**代码位置**:

- 命令队列: `src/process/command-queue.ts`
- Lane 创建: `src/process/lane.ts`
- 全局 Lane: `src/agents/pi-embedded-runner/run.ts:72-77`
- 会话 Lane: `src/agents/pi-embedded-runner/run.ts:72`

Lane 是用于控制并发和优先级的队列系统：

```typescript
// 全局 Lane（系统级限制）
const globalLane = createLane({
  concurrency: 4, // 最多 4 个并发任务
  timeout: 300000, // 5 分钟超时
});

// 会话 Lane（会话级串行化）
const sessionLane = createLane({
  concurrency: 1, // 同一会话串行执行
  timeout: 600000, // 10 分钟超时
});

// 使用 Lane
await enqueueInLane(globalLane, async () => {
  await enqueueInLane(sessionLane, async () => {
    // 执行 Agent
    await runEmbeddedPiAgent(params);
  });
});
```

**Lane 类型**：

| Lane    | 并发数 | 用途            |
| ------- | ------ | --------------- |
| Global  | 4      | 限制全局并发数  |
| Session | 1      | 同一会话串行    |
| Agent   | 1-4    | 特定 Agent 限制 |

### 3）. 事件系统

**代码位置**:

- 事件类型定义: `src/infra/agent-events.ts`
- 事件处理器: `src/gateway/server-chat.ts:108` (createAgentEventHandler)
- 事件广播: `src/gateway/server-broadcast.ts`
- Node 事件: `src/gateway/server-node-events.ts`

```typescript
// Agent 事件类型
type AgentEventPayload =
  | { type: "run_start"; runId: string; sessionKey: string }
  | { type: "run_end"; runId: string; sessionKey: string }
  | { type: "message_start"; runId: string; role: string }
  | { type: "message_delta"; runId: string; text: string }
  | { type: "message_end"; runId: string }
  | { type: "tool_call"; runId: string; toolName: string; args: unknown }
  | { type: "tool_result"; runId: string; toolName: string; result: unknown }
  | { type: "error"; runId: string; error: Error };

// 事件处理
function onAgentEvent(evt: AgentEventPayload) {
  switch (evt.type) {
    case "message_delta":
      // 实时推送响应片段
      emitChatDelta(evt.sessionKey, evt.runId, evt.text);
      break;
    case "tool_call":
      // 记录工具调用
      logToolCall(evt.runId, evt.toolName, evt.args);
      break;
    // ...
  }
}
```

### 4.） 沙盒执行

**代码位置**:

- 沙盒上下文: `src/agents/sandbox.ts`
- 沙盒信息: `src/agents/pi-embedded-runner/sandbox-info.ts`
- Docker 执行参数: `src/agents/bash-tools.shared.ts` (buildDockerExecArgs)
- 沙盒环境: `src/agents/bash-tools.shared.ts` (buildSandboxEnv)

```typescript
type SandboxContext = {
  enabled: boolean;
  mode: "docker" | "local";
  image?: string; // Docker 镜像
  workspaceDir: string; // 工作区目录
  workspaceAccess: "ro" | "rw"; // 工作区访问权限
  mount?: string[]; // 额外挂载点
  env?: Record<string, string>; // 环境变量
  capabilities?: string[]; // Docker capabilities
  tools?: ToolPolicy; // 工具策略
};

// 在沙盒中执行命令
async function execInSandbox(
  command: string[],
  sandbox: SandboxContext,
): Promise<ExecResult> {
  if (sandbox.mode === "docker") {
    return await execInDocker(command, sandbox);
  } else {
    return await execLocal(command, sandbox);
  }
}

// Docker 执行
async function execInDocker(
  command: string[],
  sandbox: SandboxContext,
): Promise<ExecResult> {
  const args = buildDockerExecArgs({
    image: sandbox.image,
    workdir: sandbox.workspaceDir,
    mount: sandbox.mount,
    env: sandbox.env,
    capabilities: sandbox.capabilities,
  });

  const dockerCommand = ["docker", "exec", ...args, ...command];
  return await spawn(dockerCommand);
}
```

### 5）. 技能系统

**代码位置**:

- 技能加载: `src/agents/skills.ts`
- 技能快照: `src/agents/skills.ts:100+`
- 工作区技能: `src/agents/skills.ts:150+`
- 技能提示词: `src/agents/skills.ts:200+`
- 技能工具: `src/agents/skills.ts:250+`

```typescript
// 技能加载器
async function loadWorkspaceSkillEntries(
  workspaceDir: string,
): Promise<SkillEntry[]> {
  const skillsDirs = [
    path.join(workspaceDir, ".moltbot", "skills"),
    path.join(workspaceDir, "skills"),
    // ...
  ];

  const entries: SkillEntry[] = [];
  for (const dir of skillsDirs) {
    if (await pathExists(dir)) {
      const subdirs = await fs.readdir(dir);
      for (const sub of subdirs) {
        const skillPath = path.join(dir, sub);
        const packageJson = await loadPackageJson(skillPath);
        if (packageJson?.moltbot?.skill) {
          entries.push({
            id: sub,
            path: skillPath,
            manifest: packageJson.moltbot.skill,
          });
        }
      }
    }
  }

  return entries;
}

// 构建技能提示词
function buildSkillsPrompt(skills: SkillEntry[]): string {
  const lines = [];
  for (const skill of skills) {
    lines.push(`## ${skill.manifest.name}`);
    lines.push(skill.manifest.description);
    if (skill.manifest.tools) {
      for (const tool of skill.manifest.tools) {
        lines.push(`- ${tool.name}: ${tool.description}`);
      }
    }
  }
  return lines.join("\n");
}
```

**技能包结构**：

```
skills/my-skill/
├── package.json          # 技能清单
├── src/
│   ├── index.ts          # 技能入口
│   └── tools/
│       └── my-tool.ts    # 工具实现
└── README.md             # 技能说明
```

**package.json 示例**：

```json
{
  "name": "my-skill",
  "version": "1.0.0",
  "moltbot": {
    "skill": {
      "name": "My Skill",
      "description": "A custom skill",
      "tools": [
        {
          "name": "my_tool",
          "description": "Does something",
          "inputSchema": {
            /* ... */
          }
        }
      ]
    }
  }
}
```

---

## 配置说明

### 1. 全局配置

**位置**: `~/.moltbot/moltbot.json`

```json
{
  "agent": {
    "model": "anthropic/claude-opus-4-5",
    "think": "off",
    "verboseDefault": "off"
  },
  "tools": {
    "exec": {
      "host": "sandbox",
      "security": "allowlist",
      "ask": "on-miss",
      "safeBins": ["ls", "cat", "echo"],
      "backgroundMs": 10000,
      "timeoutSec": 120
    }
  },
  "channels": {
    "whatsapp": {
      "enabled": true
    }
  },
  "gateway": {
    "port": 3737
  }
}
```

### 2. 模型配置

**位置**: `~/.moltbot/models.json`

```json
{
  "providers": [
    {
      "id": "anthropic",
      "baseUrl": "https://api.anthropic.com",
      "api": "anthropic-messages",
      "models": [
        {
          "id": "claude-opus-4-5",
          "name": "Claude Opus 4.5",
          "contextWindow": 200000,
          "supportsImages": true
        }
      ]
    },
    {
      "id": "openai",
      "baseUrl": "https://api.openai.com/v1",
      "api": "openai-completions",
      "models": [
        {
          "id": "gpt-4o",
          "name": "GPT-4o",
          "contextWindow": 128000
        }
      ]
    }
  ]
}
```

### 3. 认证配置

**位置**: `~/.moltbot/auth.json`

```json
{
  "profiles": {
    "anthropic-default": {
      "provider": "anthropic",
      "mode": "api-key",
      "apiKey": "sk-ant-..."
    },
    "openai-copilot": {
      "provider": "openai",
      "mode": "oauth",
      "token": "gho_..."
    }
  }
}
```

### 4. Agent 配置

**位置**: `~/.moltbot/agents/agent-id/config.json`

```json
{
  "id": "my-agent",
  "model": "anthropic/claude-opus-4-5",
  "systemPrompt": "You are a helpful assistant.",
  "tools": {
    "allow": ["exec", "read", "write"]
  },
  "sandbox": {
    "enabled": true,
    "mode": "docker",
    "image": "node:20"
  }
}
```

### 5. 环境变量

**位置**: `.env` 或系统环境变量

```bash
# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.openai.com/v1

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Google
GOOGLE_API_KEY=...
GOOGLE_CREDENTIALS=/path/to/credentials.json

# Gateway
GATEWAY_PORT=3737
GATEWAY_HOST=0.0.0.0

# Agent
AGENT_WORKSPACE=/path/to/workspace
AGENT_DIR=/path/to/agent

# Tools
PI_BASH_MAX_OUTPUT_CHARS=200000
CLAWDBOT_BASH_PENDING_MAX_OUTPUT_CHARS=200000
```

---

## 总结

Moltbot-CN 的架构设计遵循了模块化、可扩展、事件驱动的原则：

1. **渠道抽象**：统一接入多种消息平台
2. **Agent 核心**：PI Agent 提供强大的 AI 推理能力
3. **工具系统**：丰富的工具库和灵活的策略控制
4. **Provider 抽象**：支持多种 LLM 提供商
5. **技能扩展**：插件化的技能系统
6. **沙盒隔离**：可选的 Docker 沙盒保证安全性

通过理解这些流转机制，你可以更好地：

- 调试消息处理问题
- 添加新的渠道支持
- 开发自定义工具
- 配置安全的沙盒环境
- 优化性能和并发控制

---

**文档维护**：本文档应随代码变更同步更新。

**相关文档**：

- [项目结构分析](project-structure-analysis.md)
- [渠道开发指南](channels/channel-development.md)
- [技能开发指南](skills/skill-development.md)
- [API 文档](reference/api.md)
