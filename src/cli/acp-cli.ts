import type { Command } from "commander";

import { runAcpClientInteractive } from "../acp/client.js";
import { serveAcpGateway } from "../acp/server.js";
import { defaultRuntime } from "../runtime.js";
import { formatDocsLink } from "../terminal/links.js";
import { theme } from "../terminal/theme.js";

export function registerAcpCli(program: Command) {
  const acp = program.command("acp").description("运行由网关支持的 ACP 桥接");

  acp
    .option("--url <url>", "网关 WebSocket URL（已配置时默认为 gateway.remote.url）")
    .option("--token <token>", "网关令牌（如需要）")
    .option("--password <password>", "网关密码（如需要）")
    .option("--session <key>", "默认会话密钥（例如 agent:main:main）")
    .option("--session-label <label>", "要解析的默认会话标签")
    .option("--require-existing", "如果会话密钥/标签不存在则失败", false)
    .option("--reset-session", "首次使用前重置会话密钥", false)
    .option("--no-prefix-cwd", "不要在提示符前加工作目录", false)
    .option("--verbose, -v", "向 stderr 输出详细日志", false)
    .addHelpText(
      "after",
      () => `\n${theme.muted("文档：")} ${formatDocsLink("/cli/acp", "docs.clawd.bot/cli/acp")}\n`,
    )
    .action((opts) => {
      try {
        serveAcpGateway({
          gatewayUrl: opts.url as string | undefined,
          gatewayToken: opts.token as string | undefined,
          gatewayPassword: opts.password as string | undefined,
          defaultSessionKey: opts.session as string | undefined,
          defaultSessionLabel: opts.sessionLabel as string | undefined,
          requireExistingSession: Boolean(opts.requireExisting),
          resetSession: Boolean(opts.resetSession),
          prefixCwd: !opts.noPrefixCwd,
          verbose: Boolean(opts.verbose),
        });
      } catch (err) {
        defaultRuntime.error(String(err));
        defaultRuntime.exit(1);
      }
    });

  acp
    .command("client")
    .description("运行与本地 ACP 桥接交互的客户端")
    .option("--cwd <dir>", "ACP 会话的工作目录")
    .option("--server <command>", "ACP 服务器命令（默认：clawdbot）")
    .option("--server-args <args...>", "ACP 服务器的额外参数")
    .option("--server-verbose", "在 ACP 服务器上启用详细日志", false)
    .option("--verbose, -v", "详细客户端日志", false)
    .action(async (opts) => {
      try {
        await runAcpClientInteractive({
          cwd: opts.cwd as string | undefined,
          serverCommand: opts.server as string | undefined,
          serverArgs: opts.serverArgs as string[] | undefined,
          serverVerbose: Boolean(opts.serverVerbose),
          verbose: Boolean(opts.verbose),
        });
      } catch (err) {
        defaultRuntime.error(String(err));
        defaultRuntime.exit(1);
      }
    });
}
