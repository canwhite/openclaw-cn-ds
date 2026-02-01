import type { Command } from "commander";
import { dashboardCommand } from "../../commands/dashboard.js";
import { doctorCommand } from "../../commands/doctor.js";
import { resetCommand } from "../../commands/reset.js";
import { uninstallCommand } from "../../commands/uninstall.js";
import { defaultRuntime } from "../../runtime.js";
import { formatDocsLink } from "../../terminal/links.js";
import { theme } from "../../terminal/theme.js";
import { runCommandWithRuntime } from "../cli-utils.js";

export function registerMaintenanceCommands(program: Command) {
  program
    .command("doctor")
    .description("网关和渠道的健康检查 + 快速修复")
    .addHelpText(
      "after",
      () =>
        `\n${theme.muted("文档：")} ${formatDocsLink("/cli/doctor", "docs.clawd.bot/cli/doctor")}\n`,
    )
    .option("--no-workspace-suggestions", "禁用工作区记忆系统建议", false)
    .option("--yes", "接受默认值无需提示", false)
    .option("--repair", "无提示应用推荐修复", false)
    .option("--fix", "应用推荐修复（--repair 的别名）", false)
    .option("--force", "应用激进修复（覆盖自定义服务配置）", false)
    .option("--non-interactive", "无提示运行（仅安全迁移）", false)
    .option("--generate-gateway-token", "生成并配置网关令牌", false)
    .option("--deep", "扫描系统服务以查找额外的网关安装", false)
    .action(async (opts) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        await doctorCommand(defaultRuntime, {
          workspaceSuggestions: opts.workspaceSuggestions,
          yes: Boolean(opts.yes),
          repair: Boolean(opts.repair) || Boolean(opts.fix),
          force: Boolean(opts.force),
          nonInteractive: Boolean(opts.nonInteractive),
          generateGatewayToken: Boolean(opts.generateGatewayToken),
          deep: Boolean(opts.deep),
        });
      });
    });

  program
    .command("dashboard")
    .description("使用当前令牌打开控制 UI")
    .addHelpText(
      "after",
      () =>
        `\n${theme.muted("文档：")} ${formatDocsLink("/cli/dashboard", "docs.clawd.bot/cli/dashboard")}\n`,
    )
    .option("--no-open", "打印 URL 但不启动浏览器", false)
    .action(async (opts) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        await dashboardCommand(defaultRuntime, {
          noOpen: Boolean(opts.noOpen),
        });
      });
    });

  program
    .command("reset")
    .description("重置本地配置/状态（保留 CLI 安装）")
    .addHelpText(
      "after",
      () =>
        `\n${theme.muted("文档：")} ${formatDocsLink("/cli/reset", "docs.clawd.bot/cli/reset")}\n`,
    )
    .option(
      "--scope <scope>",
      "范围：config|配置|config+creds+sessions|配置+凭据+会话|full|全部（默认：交互提示）",
    )
    .option("--yes", "跳过确认提示", false)
    .option("--non-interactive", "禁用提示（需要 --scope + --yes）", false)
    .option("--dry-run", "打印操作但不删除文件", false)
    .action(async (opts) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        await resetCommand(defaultRuntime, {
          scope: opts.scope,
          yes: Boolean(opts.yes),
          nonInteractive: Boolean(opts.nonInteractive),
          dryRun: Boolean(opts.dryRun),
        });
      });
    });

  program
    .command("uninstall")
    .description("卸载网关服务 + 本地数据（保留 CLI）")
    .addHelpText(
      "after",
      () =>
        `\n${theme.muted("文档：")} ${formatDocsLink("/cli/uninstall", "docs.clawd.bot/cli/uninstall")}\n`,
    )
    .option("--service", "删除网关服务", false)
    .option("--state", "删除状态 + 配置", false)
    .option("--workspace", "删除工作区目录", false)
    .option("--app", "删除 macOS 应用", false)
    .option("--all", "删除服务 + 状态 + 工作区 + 应用", false)
    .option("--yes", "跳过确认提示", false)
    .option("--non-interactive", "禁用提示（需要 --yes）", false)
    .option("--dry-run", "打印操作但不删除文件", false)
    .action(async (opts) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        await uninstallCommand(defaultRuntime, {
          service: Boolean(opts.service),
          state: Boolean(opts.state),
          workspace: Boolean(opts.workspace),
          app: Boolean(opts.app),
          all: Boolean(opts.all),
          yes: Boolean(opts.yes),
          nonInteractive: Boolean(opts.nonInteractive),
          dryRun: Boolean(opts.dryRun),
        });
      });
    });
}
