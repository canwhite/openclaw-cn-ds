import type { Command } from "commander";
import { formatDocsLink } from "../../terminal/links.js";
import { theme } from "../../terminal/theme.js";
import { loadNodeHostConfig } from "../../node-host/config.js";
import { runNodeHost } from "../../node-host/runner.js";
import {
  runNodeDaemonInstall,
  runNodeDaemonRestart,
  runNodeDaemonStatus,
  runNodeDaemonStop,
  runNodeDaemonUninstall,
} from "./daemon.js";
import { parsePort } from "../daemon-cli/shared.js";

function parsePortWithFallback(value: unknown, fallback: number): number {
  const parsed = parsePort(value);
  return parsed ?? fallback;
}

export function registerNodeCli(program: Command) {
  const node = program
    .command("node")
    .description("运行无头节点主机（system.run/system.which）")
    .addHelpText(
      "after",
      () =>
        `\n${theme.muted("文档：")} ${formatDocsLink("/cli/node", "docs.clawd.bot/cli/node")}\n`,
    );

  node
    .command("run")
    .description("运行无头节点主机（前台）")
    .option("--host <host>", "网关主机")
    .option("--port <port>", "网关端口")
    .option("--tls", "使用 TLS 连接网关", false)
    .option("--tls-fingerprint <sha256>", "预期的 TLS 证书指纹（sha256）")
    .option("--node-id <id>", "覆盖节点 ID（清除配对令牌）")
    .option("--display-name <name>", "覆盖节点显示名称")
    .action(async (opts) => {
      const existing = await loadNodeHostConfig();
      const host =
        (opts.host as string | undefined)?.trim() || existing?.gateway?.host || "127.0.0.1";
      const port = parsePortWithFallback(opts.port, existing?.gateway?.port ?? 18789);
      await runNodeHost({
        gatewayHost: host,
        gatewayPort: port,
        gatewayTls: Boolean(opts.tls) || Boolean(opts.tlsFingerprint),
        gatewayTlsFingerprint: opts.tlsFingerprint,
        nodeId: opts.nodeId,
        displayName: opts.displayName,
      });
    });

  node
    .command("status")
    .description("显示节点主机状态")
    .option("--json", "输出 JSON", false)
    .action(async (opts) => {
      await runNodeDaemonStatus(opts);
    });

  node
    .command("install")
    .description("安装节点主机服务（launchd/systemd/schtasks）")
    .option("--host <host>", "网关主机")
    .option("--port <port>", "网关端口")
    .option("--tls", "使用 TLS 连接网关", false)
    .option("--tls-fingerprint <sha256>", "预期的 TLS 证书指纹（sha256）")
    .option("--node-id <id>", "覆盖节点 ID（清除配对令牌）")
    .option("--display-name <name>", "覆盖节点显示名称")
    .option("--runtime <runtime>", "服务运行时（node|bun）。默认：node")
    .option("--force", "如已安装则重新安装/覆盖", false)
    .option("--json", "输出 JSON", false)
    .action(async (opts) => {
      await runNodeDaemonInstall(opts);
    });

  node
    .command("uninstall")
    .description("卸载节点主机服务（launchd/systemd/schtasks）")
    .option("--json", "输出 JSON", false)
    .action(async (opts) => {
      await runNodeDaemonUninstall(opts);
    });

  node
    .command("stop")
    .description("停止节点主机服务（launchd/systemd/schtasks）")
    .option("--json", "输出 JSON", false)
    .action(async (opts) => {
      await runNodeDaemonStop(opts);
    });

  node
    .command("restart")
    .description("重启节点主机服务（launchd/systemd/schtasks）")
    .option("--json", "输出 JSON", false)
    .action(async (opts) => {
      await runNodeDaemonRestart(opts);
    });
}
