import { ensureAuthProfileStore, resolveAuthProfileOrder } from "../agents/auth-profiles.js";
import { resolveEnvApiKey } from "../agents/model-auth.js";
import {
  formatApiKeyPreview,
  normalizeApiKeyInput,
  validateApiKeyInput,
} from "./auth-choice.api-key.js";
import type { ApplyAuthChoiceParams, ApplyAuthChoiceResult } from "./auth-choice.apply.js";
import { applyDefaultModelChoice } from "./auth-choice.default-model.js";
import {
  applyAuthProfileConfig,
} from "./onboard-auth.js";

const DEEPSEEK_DEFAULT_MODEL_REF = "deepseek/deepseek-chat";

export async function setDeepseekApiKey(
  apiKey: string,
  agentDir: string | undefined,
): Promise<void> {
  if (!agentDir) return;
  const store = ensureAuthProfileStore(agentDir, {
    allowKeychainPrompt: false,
  });
  const profileId = "deepseek:default";
  store.profiles[profileId] = {
    type: "api_key",
    provider: "deepseek",
    key: apiKey,
  };
}

export async function applyAuthChoiceDeepSeek(
  params: ApplyAuthChoiceParams,
): Promise<ApplyAuthChoiceResult | null> {
  if (params.authChoice !== "deepseek-api-key") {
    return null;
  }

  let nextConfig = params.config;
  let agentModelOverride: string | undefined;

  const noteAgentModel = async (model: string) => {
    if (!params.agentId) return;
    await params.prompter.note(
      `Default model set to ${model} for agent "${params.agentId}".`,
      "Model configured",
    );
  };

  // Check for existing DEEPSEEK_API_KEY in environment
  const envKey = resolveEnvApiKey("deepseek");
  let hasCredential = false;

  if (envKey) {
    const useExisting = await params.prompter.confirm({
      message: `Use existing DEEPSEEK_API_KEY (${envKey.source}, ${formatApiKeyPreview(envKey.apiKey)})?`,
      initialValue: true,
    });
    if (useExisting) {
      await setDeepseekApiKey(envKey.apiKey, params.agentDir);
      hasCredential = true;
    }
  }

  if (!hasCredential) {
    const key = await params.prompter.text({
      message: "Enter DeepSeek API key",
      validate: validateApiKeyInput,
    });
    await setDeepseekApiKey(normalizeApiKeyInput(String(key)), params.agentDir);
  }

  nextConfig = applyAuthProfileConfig(nextConfig, {
    profileId: "deepseek:default",
    provider: "deepseek",
    mode: "api_key",
  });

  const applied = await applyDefaultModelChoice({
    config: nextConfig,
    setDefaultModel: params.setDefaultModel,
    defaultModel: DEEPSEEK_DEFAULT_MODEL_REF,
    applyDefaultConfig: (config) => {
      // Add DeepSeek provider configuration
      if (!config.models) config.models = {};
      if (!config.models.providers) config.models.providers = {};
      config.models.providers.deepseek = {
        baseUrl: "https://api.deepseek.com/v1",
        api: "openai-completions",
        models: [
          {
            id: "deepseek-chat",
            name: "DeepSeek Chat",
            reasoning: false,
            input: ["text"],
            contextWindow: 64000,
            maxTokens: 8000,
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
          },
          {
            id: "deepseek-reasoner",
            name: "DeepSeek R1",
            reasoning: true,
            input: ["text"],
            contextWindow: 64000,
            maxTokens: 8000,
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
          },
        ],
      };
      return config;
    },
    applyProviderConfig: (config) => config,
    noteAgentModel,
    prompter: params.prompter,
  });

  nextConfig = applied.config;
  agentModelOverride = applied.agentModelOverride ?? agentModelOverride;

  return { config: nextConfig, agentModelOverride };
}
