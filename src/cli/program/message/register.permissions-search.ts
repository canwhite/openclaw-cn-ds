import type { Command } from "commander";
import { collectOption } from "../helpers.js";
import type { MessageCliHelpers } from "./helpers.js";

export function registerMessagePermissionsCommand(message: Command, helpers: MessageCliHelpers) {
  helpers
    .withMessageBase(
      helpers.withRequiredMessageTarget(message.command("permissions").description("获取渠道权限")),
    )
    .action(async (opts) => {
      await helpers.runMessageAction("permissions", opts);
    });
}

export function registerMessageSearchCommand(message: Command, helpers: MessageCliHelpers) {
  helpers
    .withMessageBase(message.command("search").description("搜索 Discord 消息"))
    .requiredOption("--guild-id <id>", "服务器 ID")
    .requiredOption("--query <text>", "搜索关键词")
    .option("--channel-id <id>", "频道 ID")
    .option("--channel-ids <id>", "频道 ID（可重复）", collectOption, [] as string[])
    .option("--author-id <id>", "作者 ID")
    .option("--author-ids <id>", "作者 ID（可重复）", collectOption, [] as string[])
    .option("--limit <n>", "结果限制")
    .action(async (opts) => {
      await helpers.runMessageAction("search", opts);
    });
}
