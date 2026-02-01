import type { Command } from "commander";
import { collectOption } from "../helpers.js";
import type { MessageCliHelpers } from "./helpers.js";

export function registerMessagePollCommand(message: Command, helpers: MessageCliHelpers) {
  helpers
    .withMessageBase(
      helpers.withRequiredMessageTarget(message.command("poll").description("发送投票")),
    )
    .requiredOption("--poll-question <text>", "投票问题")
    .option("--poll-option <choice>", "投票选项（重复 2-12 次）", collectOption, [] as string[])
    .option("--poll-multi", "允许多选", false)
    .option("--poll-duration-hours <n>", "投票时长（Discord）")
    .option("-m, --message <text>", "可选的消息内容")
    .action(async (opts) => {
      await helpers.runMessageAction("poll", opts);
    });
}
