import type { Command } from "commander";
import type { MessageCliHelpers } from "./helpers.js";

export function registerMessageReactionsCommands(message: Command, helpers: MessageCliHelpers) {
  helpers
    .withMessageBase(
      helpers.withRequiredMessageTarget(message.command("react").description("添加或移除反应")),
    )
    .requiredOption("--message-id <id>", "消息 ID")
    .option("--emoji <emoji>", "反应表情")
    .option("--remove", "移除反应", false)
    .option("--participant <id>", "WhatsApp 反应参与者")
    .option("--from-me", "WhatsApp 反应 fromMe", false)
    .option("--target-author <id>", "Signal 反应目标作者（uuid 或电话）")
    .option("--target-author-uuid <uuid>", "Signal 反应目标作者 uuid")
    .action(async (opts) => {
      await helpers.runMessageAction("react", opts);
    });

  helpers
    .withMessageBase(
      helpers.withRequiredMessageTarget(message.command("reactions").description("列出消息的反应")),
    )
    .requiredOption("--message-id <id>", "消息 ID")
    .option("--limit <n>", "结果限制")
    .action(async (opts) => {
      await helpers.runMessageAction("reactions", opts);
    });
}
