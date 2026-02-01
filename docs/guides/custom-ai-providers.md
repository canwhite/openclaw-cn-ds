---
summary: "配置自定义 AI 供应商和模型"
read_when:
  - 您想使用国内 AI 服务（如硅基流动、DeepSeek、通义千问等）
  - 您想配置 OpenAI 兼容的 API 代理
  - 您想使用本地模型（Ollama、LM Studio 等）
---

# 自定义 AI 供应商配置

Moltbot 支持多种 AI 供应商，包括内置供应商和自定义供应商。本文档介绍如何配置自定义 AI 供应商和模型。

---

## 快速开始

### 配置方式

配置文件位于 `~/.moltbot/moltbot.json`。

**最简配置示例**（以硅基流动为例）：

```json5
{
  // 环境变量配置 API Key
  env: {
    SILICONFLOW_API_KEY: "sk-xxx..."
  },
  // 设置默认模型
  agents: {
    defaults: {
      model: { primary: "siliconflow/Qwen/Qwen2.5-72B-Instruct" }
    }
  },
  // 配置自定义供应商
  models: {
    providers: {
      siliconflow: {
        baseUrl: "https://api.siliconflow.cn/v1",
        apiKey: "${SILICONFLOW_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "Qwen/Qwen2.5-72B-Instruct", name: "通义千问 2.5 72B" }
        ]
      }
    }
  }
}
```

---

## API 协议支持

Moltbot 支持两种主流 API 协议：

| 协议 | `api` 值 | 兼容服务 |
|------|----------|----------|
| OpenAI | `openai-completions` | 硅基流动、DeepSeek、Moonshot、Ollama、vLLM、LM Studio 等 |
| Anthropic | `anthropic-messages` | Anthropic、AWS Bedrock Claude 等 |

大多数国内服务都兼容 OpenAI 协议，使用 `api: "openai-completions"` 即可。

---

## 国内 AI 服务配置示例

### 硅基流动 (SiliconFlow)

硅基流动提供多种开源模型的 API 服务。

```json5
{
  env: { SILICONFLOW_API_KEY: "sk-xxx..." },
  agents: {
    defaults: { model: { primary: "siliconflow/Qwen/Qwen2.5-72B-Instruct" } }
  },
  models: {
    providers: {
      siliconflow: {
        baseUrl: "https://api.siliconflow.cn/v1",
        apiKey: "${SILICONFLOW_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "Qwen/Qwen2.5-72B-Instruct", name: "通义千问 2.5 72B" },
          { id: "deepseek-ai/DeepSeek-V3", name: "DeepSeek V3" },
          { id: "deepseek-ai/DeepSeek-R1", name: "DeepSeek R1", reasoning: true }
        ]
      }
    }
  }
}
```

### DeepSeek

DeepSeek 官方 API：

```json5
{
  env: { DEEPSEEK_API_KEY: "sk-xxx..." },
  agents: {
    defaults: { model: { primary: "deepseek/deepseek-chat" } }
  },
  models: {
    providers: {
      deepseek: {
        baseUrl: "https://api.deepseek.com/v1",
        apiKey: "${DEEPSEEK_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "deepseek-chat", name: "DeepSeek Chat" },
          { id: "deepseek-reasoner", name: "DeepSeek R1", reasoning: true }
        ]
      }
    }
  }
}
```

### 月之暗面 (Moonshot / Kimi)

```json5
{
  env: { MOONSHOT_API_KEY: "sk-xxx..." },
  agents: {
    defaults: { model: { primary: "moonshot/moonshot-v1-128k" } }
  },
  models: {
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.cn/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "moonshot-v1-8k", name: "Moonshot 8K" },
          { id: "moonshot-v1-32k", name: "Moonshot 32K" },
          { id: "moonshot-v1-128k", name: "Moonshot 128K" }
        ]
      }
    }
  }
}
```

### 智谱 AI (GLM)

```json5
{
  env: { ZHIPU_API_KEY: "xxx..." },
  agents: {
    defaults: { model: { primary: "zhipu/glm-4-plus" } }
  },
  models: {
    providers: {
      zhipu: {
        baseUrl: "https://open.bigmodel.cn/api/paas/v4",
        apiKey: "${ZHIPU_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "glm-4-plus", name: "GLM-4 Plus" },
          { id: "glm-4-flash", name: "GLM-4 Flash" }
        ]
      }
    }
  }
}
```

### 通义千问 (阿里云)

```json5
{
  env: { DASHSCOPE_API_KEY: "sk-xxx..." },
  agents: {
    defaults: { model: { primary: "dashscope/qwen-max" } }
  },
  models: {
    providers: {
      dashscope: {
        baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
        apiKey: "${DASHSCOPE_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "qwen-max", name: "通义千问 Max" },
          { id: "qwen-plus", name: "通义千问 Plus" },
          { id: "qwen-turbo", name: "通义千问 Turbo" }
        ]
      }
    }
  }
}
```

### 百川 AI

```json5
{
  env: { BAICHUAN_API_KEY: "sk-xxx..." },
  agents: {
    defaults: { model: { primary: "baichuan/Baichuan4" } }
  },
  models: {
    providers: {
      baichuan: {
        baseUrl: "https://api.baichuan-ai.com/v1",
        apiKey: "${BAICHUAN_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "Baichuan4", name: "百川 4" },
          { id: "Baichuan3-Turbo", name: "百川 3 Turbo" }
        ]
      }
    }
  }
}
```

---

## 本地模型配置

### Ollama

Ollama 是最简单的本地模型运行方式。Moltbot 可以自动发现 Ollama 中的模型。

**安装和使用：**

```bash
# 1. 安装 Ollama
# macOS: brew install ollama
# Linux: curl -fsSL https://ollama.com/install.sh | sh

# 2. 拉取模型
ollama pull llama3.3
ollama pull qwen2.5:32b

# 3. 启动 Ollama 服务
ollama serve
```

**配置 Moltbot：**

```json5
{
  // 设置任意值启用 Ollama（Ollama 本身不需要真正的 key）
  env: { OLLAMA_API_KEY: "ollama-local" },
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } }
  }
}
```

Moltbot 会自动发现本地 Ollama 中支持工具调用的模型。

**手动配置（可选）：**

如果 Ollama 运行在非默认端口或其他主机：

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://192.168.1.100:11434/v1",
        apiKey: "ollama-local",
        api: "openai-completions",
        models: [
          { id: "llama3.3", name: "Llama 3.3" }
        ]
      }
    }
  }
}
```

### LM Studio

LM Studio 提供 OpenAI 兼容的本地 API：

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/local-model" } }
  },
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "lm-studio",
        api: "openai-completions",
        models: [
          { id: "local-model", name: "本地模型" }
        ]
      }
    }
  }
}
```

### vLLM

vLLM 是高性能的本地推理服务器：

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://localhost:8000/v1",
        apiKey: "vllm-local",
        api: "openai-completions",
        models: [
          { id: "Qwen/Qwen2.5-72B-Instruct", name: "Qwen 2.5 72B" }
        ]
      }
    }
  }
}
```

---

## 模型配置详解

### 完整模型配置

```json5
{
  models: {
    providers: {
      "my-provider": {
        baseUrl: "https://api.example.com/v1",
        apiKey: "${MY_API_KEY}",
        api: "openai-completions",  // 或 "anthropic-messages"
        models: [
          {
            id: "model-id",           // 模型 ID（必填）
            name: "显示名称",          // 显示名称（可选）
            reasoning: false,          // 是否支持推理模式（可选）
            input: ["text"],           // 输入类型（可选）
            contextWindow: 128000,     // 上下文窗口大小（可选）
            maxTokens: 8192,           // 最大输出 token（可选）
            cost: {                    // 成本配置（可选）
              input: 0,
              output: 0,
              cacheRead: 0,
              cacheWrite: 0
            }
          }
        ]
      }
    }
  }
}
```

### 配置字段说明

| 字段 | 必填 | 说明 | 默认值 |
|------|------|------|--------|
| `baseUrl` | ✅ | API 端点地址 | - |
| `apiKey` | ✅ | API 密钥，支持 `${ENV_VAR}` 引用 | - |
| `api` | ✅ | API 协议类型 | - |
| `models` | ✅ | 模型列表 | - |
| `models[].id` | ✅ | 模型 ID | - |
| `models[].name` | ❌ | 显示名称 | 使用 id |
| `models[].reasoning` | ❌ | 推理模式支持 | `false` |
| `models[].contextWindow` | ❌ | 上下文窗口 | `200000` |
| `models[].maxTokens` | ❌ | 最大输出 | `8192` |

---

## CLI 命令

### 查看模型

```bash
# 查看已配置的模型
moltbot-cn models list

# 查看所有可用模型
moltbot-cn models list --all

# 查看模型状态
moltbot-cn models status
```

### 设置默认模型

```bash
# 设置主模型
moltbot-cn models set <provider/model>

# 设置图像模型
moltbot-cn models set-image <provider/model>
```

### 管理回退模型

```bash
# 添加回退模型
moltbot-cn models fallbacks add <provider/model>

# 查看回退列表
moltbot-cn models fallbacks list

# 清空回退
moltbot-cn models fallbacks clear
```

### 配置命令

```bash
# 直接设置供应商配置
moltbot-cn config set models.providers.siliconflow.baseUrl "https://api.siliconflow.cn/v1"
moltbot-cn config set models.providers.siliconflow.apiKey "sk-xxx"
```

---

## 在聊天中切换模型

在 Telegram/WhatsApp 等渠道中，可以使用命令切换模型：

```
/model              # 查看当前模型
/model list         # 列出可用模型
/model 1            # 选择第 1 个模型
/model deepseek/deepseek-chat  # 切换到指定模型
/model status       # 查看详细状态
```

---

## 故障排除

### API 连接失败

1. 检查 `baseUrl` 是否正确（注意是否需要 `/v1` 后缀）
2. 检查 API Key 是否有效
3. 检查网络是否可访问 API 端点

```bash
# 测试 API 连接
curl -H "Authorization: Bearer $API_KEY" https://api.example.com/v1/models
```

### 模型不在列表中

确保在 `models` 数组中正确配置了模型：

```json5
models: [
  { id: "正确的模型ID", name: "显示名称" }
]
```

### 模型调用报错

1. 检查模型 ID 是否正确
2. 确认 API 协议类型（`openai-completions` 或 `anthropic-messages`）
3. 查看日志：`moltbot-cn logs --follow`

---

## 相关文档

- [模型选择](/concepts/models) - 模型选择和回退机制
- [模型供应商](/concepts/model-providers) - 供应商详细配置
- [网关配置](/gateway/configuration) - 完整配置参考
- [Ollama](/providers/ollama) - Ollama 详细配置
