import type { Command } from "commander";
import type { MessageCliHelpers } from "./helpers.js";

export function registerMessageThreadCommands(message: Command, helpers: MessageCliHelpers) {
  const thread = message.command("thread").description("主题操作");

  helpers
    .withMessageBase(
      helpers.withRequiredMessageTarget(
        thread
          .command("create")
          .description("创建主题")
          .requiredOption("--thread-name <name>", "主题名称"),
      ),
    )
    .option("--message-id <id>", "消息 ID（可选）")
    .option("--auto-archive-min <n>", "主题自动归档分钟数")
    .action(async (opts) => {
      await helpers.runMessageAction("thread-create", opts);
    });

  helpers
    .withMessageBase(
      thread.command("list").description("列出主题").requiredOption("--guild-id <id>", "服务器 ID"),
    )
    .option("--channel-id <id>", "频道 ID")
    .option("--include-archived", "包含已归档的主题", false)
    .option("--before <id>", "读取/搜索此 ID 之前的")
    .option("--limit <n>", "结果限制")
    .action(async (opts) => {
      await helpers.runMessageAction("thread-list", opts);
    });

  helpers
    .withMessageBase(
      helpers.withRequiredMessageTarget(
        thread
          .command("reply")
          .description("在主题中回复")
          .requiredOption("-m, --message <text>", "消息内容"),
      ),
    )
    .option("--media <path-or-url>", "附加媒体（图片/音频/视频/文档）。接受本地路径或 URL。")
    .option("--reply-to <id>", "回复的消息 ID")
    .action(async (opts) => {
      await helpers.runMessageAction("thread-reply", opts);
    });
}
