import type { Command } from "commander";
import { healthCommand } from "../../commands/health.js";
import { sessionsCommand } from "../../commands/sessions.js";
import { statusCommand } from "../../commands/status.js";
import { setVerbose } from "../../globals.js";
import { defaultRuntime } from "../../runtime.js";
import { formatDocsLink } from "../../terminal/links.js";
import { theme } from "../../terminal/theme.js";
import { runCommandWithRuntime } from "../cli-utils.js";
import { formatHelpExamples } from "../help-format.js";
import { parsePositiveIntOrUndefined } from "./helpers.js";

function resolveVerbose(opts: { verbose?: boolean; debug?: boolean }): boolean {
  return Boolean(opts.verbose || opts.debug);
}

function parseTimeoutMs(timeout: unknown): number | null | undefined {
  const parsed = parsePositiveIntOrUndefined(timeout);
  if (timeout !== undefined && parsed === undefined) {
    defaultRuntime.error("--timeout 必须是正整数（毫秒）");
    defaultRuntime.exit(1);
    return null;
  }
  return parsed;
}

export function registerStatusHealthSessionsCommands(program: Command) {
  program
    .command("status")
    .description("显示渠道健康状态和最近的会话接收方")
    .option("--json", "输出 JSON 而不是文本", false)
    .option("--all", "完整诊断（只读，可粘贴）", false)
    .option("--usage", "显示模型提供商用量/配额快照", false)
    .option("--deep", "探测渠道（WhatsApp Web + Telegram + Discord + Slack + Signal）", false)
    .option("--timeout <ms>", "探测超时（毫秒）", "10000")
    .option("--verbose", "详细日志", false)
    .option("--debug", "--verbose 的别名", false)
    .addHelpText(
      "after",
      () =>
        `\n${theme.heading("示例：")}\n${formatHelpExamples([
          ["clawdbot status", "显示渠道健康 + 会话摘要。"],
          ["clawdbot status --all", "完整诊断（只读）。"],
          ["clawdbot status --json", "机器可读输出。"],
          ["clawdbot status --usage", "显示模型提供商用量/配额快照。"],
          ["clawdbot status --deep", "运行渠道探测（WA + Telegram + Discord + Slack + Signal）。"],
          ["clawdbot status --deep --timeout 5000", "缩短探测超时。"],
        ])}`,
    )
    .addHelpText(
      "after",
      () =>
        `\n${theme.muted("文档：")} ${formatDocsLink("/cli/status", "docs.clawd.bot/cli/status")}\n`,
    )
    .action(async (opts) => {
      const verbose = resolveVerbose(opts);
      setVerbose(verbose);
      const timeout = parseTimeoutMs(opts.timeout);
      if (timeout === null) {
        return;
      }
      await runCommandWithRuntime(defaultRuntime, async () => {
        await statusCommand(
          {
            json: Boolean(opts.json),
            all: Boolean(opts.all),
            deep: Boolean(opts.deep),
            usage: Boolean(opts.usage),
            timeoutMs: timeout,
            verbose,
          },
          defaultRuntime,
        );
      });
    });

  program
    .command("health")
    .description("从运行中的网关获取健康状态")
    .option("--json", "输出 JSON 而不是文本", false)
    .option("--timeout <ms>", "连接超时（毫秒）", "10000")
    .option("--verbose", "详细日志", false)
    .option("--debug", "--verbose 的别名", false)
    .addHelpText(
      "after",
      () =>
        `\n${theme.muted("文档：")} ${formatDocsLink("/cli/health", "docs.clawd.bot/cli/health")}\n`,
    )
    .action(async (opts) => {
      const verbose = resolveVerbose(opts);
      setVerbose(verbose);
      const timeout = parseTimeoutMs(opts.timeout);
      if (timeout === null) {
        return;
      }
      await runCommandWithRuntime(defaultRuntime, async () => {
        await healthCommand(
          {
            json: Boolean(opts.json),
            timeoutMs: timeout,
            verbose,
          },
          defaultRuntime,
        );
      });
    });

  program
    .command("sessions")
    .description("列出存储的对话会话")
    .option("--json", "输出 JSON", false)
    .option("--verbose", "详细日志", false)
    .option("--store <path>", "会话存储路径（默认：从配置解析）")
    .option("--active <minutes>", "仅显示过去 N 分钟内更新的会话")
    .addHelpText(
      "after",
      () =>
        `\n${theme.heading("示例：")}\n${formatHelpExamples([
          ["clawdbot sessions", "列出所有会话。"],
          ["clawdbot sessions --active 120", "仅显示过去 2 小时内的。"],
          ["clawdbot sessions --json", "机器可读输出。"],
          ["clawdbot sessions --store ./tmp/sessions.json", "使用特定的会话存储。"],
        ])}\n\n${theme.muted(
          "当智能体报告时显示每个会话的 Token 使用量；设置 agents.defaults.contextTokens 可查看模型窗口的百分比。",
        )}`,
    )
    .addHelpText(
      "after",
      () =>
        `\n${theme.muted("文档：")} ${formatDocsLink("/cli/sessions", "docs.clawd.bot/cli/sessions")}\n`,
    )
    .action(async (opts) => {
      setVerbose(Boolean(opts.verbose));
      await sessionsCommand(
        {
          json: Boolean(opts.json),
          store: opts.store as string | undefined,
          active: opts.active as string | undefined,
        },
        defaultRuntime,
      );
    });
}
