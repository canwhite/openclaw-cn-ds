import type { Command } from "commander";
import type { MessageCliHelpers } from "./helpers.js";

export function registerMessagePinCommands(message: Command, helpers: MessageCliHelpers) {
  const pins = [
    helpers
      .withMessageBase(
        helpers.withRequiredMessageTarget(message.command("pin").description("置顶消息")),
      )
      .requiredOption("--message-id <id>", "消息 ID")
      .action(async (opts) => {
        await helpers.runMessageAction("pin", opts);
      }),
    helpers
      .withMessageBase(
        helpers.withRequiredMessageTarget(message.command("unpin").description("取消置顶消息")),
      )
      .requiredOption("--message-id <id>", "消息 ID")
      .action(async (opts) => {
        await helpers.runMessageAction("unpin", opts);
      }),
    helpers
      .withMessageBase(
        helpers.withRequiredMessageTarget(message.command("pins").description("列出置顶消息")),
      )
      .option("--limit <n>", "结果限制")
      .action(async (opts) => {
        await helpers.runMessageAction("list-pins", opts);
      }),
  ] as const;

  void pins;
}
