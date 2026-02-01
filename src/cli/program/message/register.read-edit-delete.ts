import type { Command } from "commander";
import type { MessageCliHelpers } from "./helpers.js";

export function registerMessageReadEditDeleteCommands(
  message: Command,
  helpers: MessageCliHelpers,
) {
  helpers
    .withMessageBase(
      helpers.withRequiredMessageTarget(message.command("read").description("读取最近的消息")),
    )
    .option("--limit <n>", "结果限制")
    .option("--before <id>", "读取/搜索此 ID 之前的")
    .option("--after <id>", "读取/搜索此 ID 之后的")
    .option("--around <id>", "读取此 ID 附近的")
    .option("--include-thread", "包含主题回复（Discord）", false)
    .action(async (opts) => {
      await helpers.runMessageAction("read", opts);
    });

  helpers
    .withMessageBase(
      helpers.withRequiredMessageTarget(
        message
          .command("edit")
          .description("编辑消息")
          .requiredOption("--message-id <id>", "消息 ID")
          .requiredOption("-m, --message <text>", "消息内容"),
      ),
    )
    .option("--thread-id <id>", "主题 ID（Telegram 论坛主题）")
    .action(async (opts) => {
      await helpers.runMessageAction("edit", opts);
    });

  helpers
    .withMessageBase(
      helpers.withRequiredMessageTarget(
        message
          .command("delete")
          .description("删除消息")
          .requiredOption("--message-id <id>", "消息 ID"),
      ),
    )
    .action(async (opts) => {
      await helpers.runMessageAction("delete", opts);
    });
}
