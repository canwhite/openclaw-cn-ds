import type { Command } from "commander";
import { DEFAULT_CHAT_CHANNEL } from "../../channels/registry.js";
import { agentCliCommand } from "../../commands/agent-via-gateway.js";
import {
  agentsAddCommand,
  agentsDeleteCommand,
  agentsListCommand,
  agentsSetIdentityCommand,
} from "../../commands/agents.js";
import { setVerbose } from "../../globals.js";
import { defaultRuntime } from "../../runtime.js";
import { formatDocsLink } from "../../terminal/links.js";
import { theme } from "../../terminal/theme.js";
import { hasExplicitOptions } from "../command-options.js";
import { formatHelpExamples } from "../help-format.js";
import { createDefaultDeps } from "../deps.js";
import { runCommandWithRuntime } from "../cli-utils.js";
import { collectOption } from "./helpers.js";

export function registerAgentCommands(program: Command, args: { agentChannelOptions: string }) {
  program
    .command("agent")
    .description("通过网关运行智能体轮次（使用 --local 运行内嵌智能体）")
    .requiredOption("-m, --message <text>", "发送给智能体的消息内容")
    .option("-t, --to <number>", "用于派生会话密钥的 E.164 格式接收方号码")
    .option("--session-id <id>", "使用显式的会话 ID")
    .option("--agent <id>", "智能体 ID（覆盖路由绑定）")
    .option(
      "--thinking <level>",
      "思考级别：off|关闭 | minimal|最小 | low|低 | medium|中 | high|高",
    )
    .option("--verbose <on|off>", "为会话持久化智能体详细日志级别")
    .option(
      "--channel <channel>",
      `交付渠道：${args.agentChannelOptions}（默认：${DEFAULT_CHAT_CHANNEL}）`,
    )
    .option("--reply-to <target>", "交付目标覆盖（与会话路由分离）")
    .option("--reply-channel <channel>", "交付渠道覆盖（与路由分离）")
    .option("--reply-account <id>", "交付账户 ID 覆盖")
    .option("--local", "本地运行内嵌智能体（需要在 shell 中配置模型提供商 API 密钥）", false)
    .option("--deliver", "将智能体的回复发送到所选渠道", false)
    .option("--json", "以 JSON 格式输出结果", false)
    .option("--timeout <seconds>", "覆盖智能体命令超时（秒，默认 600 或配置值）")
    .addHelpText(
      "after",
      () =>
        `
${theme.heading("示例：")}
${formatHelpExamples([
  ['clawdbot agent --to +15555550123 --message "状态更新"', "开始新会话。"],
  ['clawdbot agent --agent ops --message "汇总日志"', "使用特定智能体。"],
  [
    'clawdbot agent --session-id 1234 --message "汇总收件箱" --thinking medium',
    "指定会话并设置思考级别。",
  ],
  [
    'clawdbot agent --to +15555550123 --message "跟踪日志" --verbose on --json',
    "启用详细日志和 JSON 输出。",
  ],
  ['clawdbot agent --to +15555550123 --message "召唤回复" --deliver', "发送回复。"],
  [
    'clawdbot agent --agent ops --message "生成报告" --deliver --reply-channel slack --reply-to "#reports"',
    "将回复发送到不同的渠道/目标。",
  ],
])}

${theme.muted("文档：")} ${formatDocsLink("/cli/agent", "docs.clawd.bot/cli/agent")}`,
    )
    .action(async (opts) => {
      const verboseLevel = typeof opts.verbose === "string" ? opts.verbose.toLowerCase() : "";
      setVerbose(verboseLevel === "on");
      // Build default deps (keeps parity with other commands; future-proofing).
      const deps = createDefaultDeps();
      await runCommandWithRuntime(defaultRuntime, async () => {
        await agentCliCommand(opts, defaultRuntime, deps);
      });
    });

  const agents = program
    .command("agents")
    .description("管理隔离的智能体（工作区 + 认证 + 路由）")
    .addHelpText(
      "after",
      () =>
        `\n${theme.muted("文档：")} ${formatDocsLink("/cli/agents", "docs.clawd.bot/cli/agents")}\n`,
    );

  agents
    .command("list")
    .description("列出已配置的智能体")
    .option("--json", "输出 JSON 而不是文本", false)
    .option("--bindings", "包含路由绑定", false)
    .action(async (opts) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        await agentsListCommand(
          { json: Boolean(opts.json), bindings: Boolean(opts.bindings) },
          defaultRuntime,
        );
      });
    });

  agents
    .command("add [name]")
    .description("添加新的隔离智能体")
    .option("--workspace <dir>", "新智能体的工作区目录")
    .option("--model <id>", "此智能体的模型 ID")
    .option("--agent-dir <dir>", "此智能体的状态目录")
    .option("--bind <channel[:accountId]>", "路由渠道绑定（可重复）", collectOption, [])
    .option("--non-interactive", "禁用提示；需要 --workspace", false)
    .option("--json", "输出 JSON 摘要", false)
    .action(async (name, opts, command) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        const hasFlags = hasExplicitOptions(command, [
          "workspace",
          "model",
          "agentDir",
          "bind",
          "nonInteractive",
        ]);
        await agentsAddCommand(
          {
            name: typeof name === "string" ? name : undefined,
            workspace: opts.workspace as string | undefined,
            model: opts.model as string | undefined,
            agentDir: opts.agentDir as string | undefined,
            bind: Array.isArray(opts.bind) ? (opts.bind as string[]) : undefined,
            nonInteractive: Boolean(opts.nonInteractive),
            json: Boolean(opts.json),
          },
          defaultRuntime,
          { hasFlags },
        );
      });
    });

  agents
    .command("set-identity")
    .description("更新智能体身份（名称/主题/表情/头像）")
    .option("--agent <id>", "要更新的智能体 ID")
    .option("--workspace <dir>", "用于定位智能体和 IDENTITY.md 的工作区目录")
    .option("--identity-file <path>", "显式指定要读取的 IDENTITY.md 路径")
    .option("--from-identity", "从 IDENTITY.md 读取值", false)
    .option("--name <name>", "身份名称")
    .option("--theme <theme>", "身份主题")
    .option("--emoji <emoji>", "身份表情")
    .option("--avatar <value>", "身份头像（工作区路径、http(s) URL 或 data URI）")
    .option("--json", "输出 JSON 摘要", false)
    .addHelpText(
      "after",
      () =>
        `
${theme.heading("示例：")}
${formatHelpExamples([
  ['clawdbot agents set-identity --agent main --name "Clawd" --emoji "🧠"', "设置名称和表情。"],
  ["clawdbot agents set-identity --agent main --avatar avatars/clawd.png", "设置头像路径。"],
  ["clawdbot agents set-identity --workspace ~/clawd --from-identity", "从 IDENTITY.md 加载。"],
  [
    "clawdbot agents set-identity --identity-file ~/clawd/IDENTITY.md --agent main",
    "使用特定的 IDENTITY.md。",
  ],
])}
`,
    )
    .action(async (opts) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        await agentsSetIdentityCommand(
          {
            agent: opts.agent as string | undefined,
            workspace: opts.workspace as string | undefined,
            identityFile: opts.identityFile as string | undefined,
            fromIdentity: Boolean(opts.fromIdentity),
            name: opts.name as string | undefined,
            theme: opts.theme as string | undefined,
            emoji: opts.emoji as string | undefined,
            avatar: opts.avatar as string | undefined,
            json: Boolean(opts.json),
          },
          defaultRuntime,
        );
      });
    });

  agents
    .command("delete <id>")
    .description("删除智能体并清理工作区/状态")
    .option("--force", "跳过确认", false)
    .option("--json", "输出 JSON 摘要", false)
    .action(async (id, opts) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        await agentsDeleteCommand(
          {
            id: String(id),
            force: Boolean(opts.force),
            json: Boolean(opts.json),
          },
          defaultRuntime,
        );
      });
    });

  agents.action(async () => {
    await runCommandWithRuntime(defaultRuntime, async () => {
      await agentsListCommand({}, defaultRuntime);
    });
  });
}
