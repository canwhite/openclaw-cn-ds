import type { Command } from "commander";
import { onboardCommand } from "../../commands/onboard.js";
import { setupCommand } from "../../commands/setup.js";
import { defaultRuntime } from "../../runtime.js";
import { formatDocsLink } from "../../terminal/links.js";
import { theme } from "../../terminal/theme.js";
import { hasExplicitOptions } from "../command-options.js";
import { runCommandWithRuntime } from "../cli-utils.js";

export function registerSetupCommand(program: Command) {
  program
    .command("setup")
    .description("初始化 ~/.clawdbot/clawdbot.json 和智能体工作区")
    .addHelpText(
      "after",
      () =>
        `\n${theme.muted("文档：")} ${formatDocsLink("/cli/setup", "docs.clawd.bot/cli/setup")}\n`,
    )
    .option(
      "--workspace <dir>",
      "智能体工作区目录（默认：~/clawd；存储为 agents.defaults.workspace）",
    )
    .option("--wizard", "运行交互式引导向导", false)
    .option("--non-interactive", "无提示运行向导", false)
    .option("--mode <mode>", "向导模式：local|本地|remote|远程")
    .option("--remote-url <url>", "远程网关 WebSocket URL")
    .option("--remote-token <token>", "远程网关令牌（可选）")
    .action(async (opts, command) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        const hasWizardFlags = hasExplicitOptions(command, [
          "wizard",
          "nonInteractive",
          "mode",
          "remoteUrl",
          "remoteToken",
        ]);
        if (opts.wizard || hasWizardFlags) {
          await onboardCommand(
            {
              workspace: opts.workspace as string | undefined,
              nonInteractive: Boolean(opts.nonInteractive),
              mode: opts.mode as "local" | "remote" | undefined,
              remoteUrl: opts.remoteUrl as string | undefined,
              remoteToken: opts.remoteToken as string | undefined,
            },
            defaultRuntime,
          );
          return;
        }
        await setupCommand({ workspace: opts.workspace as string | undefined }, defaultRuntime);
      });
    });
}
