import { emptyPluginConfigSchema } from "clawdbot/plugin-sdk";

import { loginQwenPortalOAuth } from "./oauth.js";

const PROVIDER_ID = "qwen-portal";
const PROVIDER_LABEL = "Qwen";
const DEFAULT_MODEL = "qwen-portal/coder-model";
const DEFAULT_BASE_URL = "https://portal.qwen.ai/v1";
const DEFAULT_CONTEXT_WINDOW = 128000;
const DEFAULT_MAX_TOKENS = 8192;
const OAUTH_PLACEHOLDER = "qwen-oauth";

function normalizeBaseUrl(value: string | undefined): string {
  const raw = value?.trim() || DEFAULT_BASE_URL;
  const withProtocol = raw.startsWith("http") ? raw : `https://${raw}`;
  return withProtocol.endsWith("/v1") ? withProtocol : `${withProtocol.replace(/\/+$/, "")}/v1`;
}

function buildModelDefinition(params: { id: string; name: string; input: Array<"text" | "image"> }) {
  return {
    id: params.id,
    name: params.name,
    reasoning: false,
    input: params.input,
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: DEFAULT_CONTEXT_WINDOW,
    maxTokens: DEFAULT_MAX_TOKENS,
  };
}

const qwenPortalPlugin = {
  id: "qwen-portal-auth",
  name: "Qwen OAuth",
  description: "Qwen（免费版）模型的OAuth流程",
  configSchema: emptyPluginConfigSchema(),
  register(api) {
    api.registerProvider({
      id: PROVIDER_ID,
      label: PROVIDER_LABEL,
      docsPath: "/providers/qwen",
      aliases: ["qwen"],
      auth: [
        {
          id: "device",
          label: "Qwen OAuth",
          hint: "设备码登录",
          kind: "device_code",
          run: async (ctx) => {
            const progress = ctx.prompter.progress("正在启动Qwen OAuth…");
            try {
              const result = await loginQwenPortalOAuth({
                openUrl: ctx.openUrl,
                note: ctx.prompter.note,
                progress,
              });

              progress.stop("Qwen OAuth完成")

              const profileId = `${PROVIDER_ID}:default`;
              const baseUrl = normalizeBaseUrl(result.resourceUrl);

              return {
                profiles: [
                  {
                    profileId,
                    credential: {
                      type: "oauth",
                      provider: PROVIDER_ID,
                      access: result.access,
                      refresh: result.refresh,
                      expires: result.expires,
                    },
                  },
                ],
                configPatch: {
                  models: {
                    providers: {
                      [PROVIDER_ID]: {
                        baseUrl,
                        apiKey: OAUTH_PLACEHOLDER,
                        api: "openai-completions",
                        models: [
                          buildModelDefinition({
                            id: "coder-model",
                            name: "Qwen Coder",
                            input: ["text"],
                          }),
                          buildModelDefinition({
                            id: "vision-model",
                            name: "Qwen Vision",
                            input: ["text", "image"],
                          }),
                        ],
                      },
                    },
                  },
                  agents: {
                    defaults: {
                      models: {
                        "qwen-portal/coder-model": { alias: "qwen" },
                        "qwen-portal/vision-model": {},
                      },
                    },
                  },
                },
                defaultModel: DEFAULT_MODEL,
                notes: [
                  "Qwen OAuth令牌自动刷新。如果刷新失败或访问权限被撤销，请重新运行登录。",
                  `基础URL默认为${DEFAULT_BASE_URL}。如有需要，请覆盖models.providers.${PROVIDER_ID}.baseUrl。`
                ],
              };
            } catch (err) {
              progress.stop("Qwen OAuth失败")
              await ctx.prompter.note(
                "如果OAuth失败，请验证您的Qwen账户是否有门户访问权限，然后重试。",
                "Qwen OAuth",
              );
              throw err;
            }
          },
        },
      ],
    });
  },
};

export default qwenPortalPlugin;
