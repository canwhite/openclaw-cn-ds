import type { Command } from "commander";
import { collectOption } from "../helpers.js";
import type { MessageCliHelpers } from "./helpers.js";

export function registerMessageEmojiCommands(message: Command, helpers: MessageCliHelpers) {
  const emoji = message.command("emoji").description("表情操作");

  helpers
    .withMessageBase(emoji.command("list").description("列出表情"))
    .option("--guild-id <id>", "服务器 ID（Discord）")
    .action(async (opts) => {
      await helpers.runMessageAction("emoji-list", opts);
    });

  helpers
    .withMessageBase(
      emoji
        .command("upload")
        .description("上传表情")
        .requiredOption("--guild-id <id>", "服务器 ID"),
    )
    .requiredOption("--emoji-name <name>", "表情名称")
    .requiredOption("--media <path-or-url>", "表情媒体（路径或 URL）")
    .option("--role-ids <id>", "角色 ID（可重复）", collectOption, [] as string[])
    .action(async (opts) => {
      await helpers.runMessageAction("emoji-upload", opts);
    });
}

export function registerMessageStickerCommands(message: Command, helpers: MessageCliHelpers) {
  const sticker = message.command("sticker").description("贴纸操作");

  helpers
    .withMessageBase(
      helpers.withRequiredMessageTarget(sticker.command("send").description("发送贴纸")),
    )
    .requiredOption("--sticker-id <id>", "贴纸 ID（可重复）", collectOption)
    .option("-m, --message <text>", "可选的消息内容")
    .action(async (opts) => {
      await helpers.runMessageAction("sticker", opts);
    });

  helpers
    .withMessageBase(
      sticker
        .command("upload")
        .description("上传贴纸")
        .requiredOption("--guild-id <id>", "服务器 ID"),
    )
    .requiredOption("--sticker-name <name>", "贴纸名称")
    .requiredOption("--sticker-desc <text>", "贴纸描述")
    .requiredOption("--sticker-tags <tags>", "贴纸标签")
    .requiredOption("--media <path-or-url>", "贴纸媒体（路径或 URL）")
    .action(async (opts) => {
      await helpers.runMessageAction("sticker-upload", opts);
    });
}
