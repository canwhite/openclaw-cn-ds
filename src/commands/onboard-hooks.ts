import type { ClawdbotConfig } from "../config/config.js";
import type { RuntimeEnv } from "../runtime.js";
import type { WizardPrompter } from "../wizard/prompts.js";
import { buildWorkspaceHookStatus } from "../hooks/hooks-status.js";
import { resolveAgentWorkspaceDir, resolveDefaultAgentId } from "../agents/agent-scope.js";
import { formatCliCommand } from "../cli/command-format.js";

export async function setupInternalHooks(
  cfg: ClawdbotConfig,
  runtime: RuntimeEnv,
  prompter: WizardPrompter,
): Promise<ClawdbotConfig> {
  await prompter.note(
    [
      "钩子让您能够在代理命令发出时自动执行操作。",
      "例如：在您发出/new时将会话上下文保存到内存中。",
      "",
      "了解更多：https://docs.clawd.bot/hooks",
    ].join("\n"),
    "钩子",
  );

  // Discover available hooks using the hook discovery system
  const workspaceDir = resolveAgentWorkspaceDir(cfg, resolveDefaultAgentId(cfg));
  const report = buildWorkspaceHookStatus(workspaceDir, { config: cfg });

  // Show every eligible hook so users can opt in during onboarding.
  const eligibleHooks = report.hooks.filter((h) => h.eligible);

  if (eligibleHooks.length === 0) {
    await prompter.note("未找到符合条件的钩子。您可以稍后在配置中配置钩子。", "无可用钩子");
    return cfg;
  }

  const toEnable = await prompter.multiselect({
    message: "启用钩子？",
    options: [
      { value: "__skip__", label: "暂时跳过" },
      ...eligibleHooks.map((hook) => ({
        value: hook.name,
        label: `${hook.emoji ?? "🔗"} ${hook.name}`,
        hint: hook.description,
      })),
    ],
  });

  const selected = toEnable.filter((name) => name !== "__skip__");
  if (selected.length === 0) {
    return cfg;
  }

  // Enable selected hooks using the new entries config format
  const entries = { ...cfg.hooks?.internal?.entries };
  for (const name of selected) {
    entries[name] = { enabled: true };
  }

  const next: ClawdbotConfig = {
    ...cfg,
    hooks: {
      ...cfg.hooks,
      internal: {
        enabled: true,
        entries,
      },
    },
  };

  await prompter.note(
    [
      `启用了 ${selected.length} 个钩子：${selected.join(", ")}`,
      "",
      "您可以稍后使用以下命令管理钩子：",
      `  ${formatCliCommand("clawdbot hooks list")}`,
      `  ${formatCliCommand("clawdbot hooks enable <name>")}`,
      `  ${formatCliCommand("clawdbot hooks disable <name>")}`,
    ].join("\n"),
    "钩子已配置",
  );

  return next;
}
