import type { Command } from "commander";
import { formatDocsLink } from "../../terminal/links.js";
import { theme } from "../../terminal/theme.js";
import { formatHelpExamples } from "../help-format.js";
import type { ProgramContext } from "./context.js";
import { createMessageCliHelpers } from "./message/helpers.js";
import { registerMessageDiscordAdminCommands } from "./message/register.discord-admin.js";
import {
  registerMessageEmojiCommands,
  registerMessageStickerCommands,
} from "./message/register.emoji-sticker.js";
import {
  registerMessagePermissionsCommand,
  registerMessageSearchCommand,
} from "./message/register.permissions-search.js";
import { registerMessagePinCommands } from "./message/register.pins.js";
import { registerMessagePollCommand } from "./message/register.poll.js";
import { registerMessageReactionsCommands } from "./message/register.reactions.js";
import { registerMessageReadEditDeleteCommands } from "./message/register.read-edit-delete.js";
import { registerMessageSendCommand } from "./message/register.send.js";
import { registerMessageThreadCommands } from "./message/register.thread.js";
import { registerMessageBroadcastCommand } from "./message/register.broadcast.js";

export function registerMessageCommands(program: Command, ctx: ProgramContext) {
  const message = program
    .command("message")
    .description("发送消息和渠道操作")
    .addHelpText(
      "after",
      () =>
        `
${theme.heading("示例：")}
${formatHelpExamples([
  ['clawdbot message send --target +15555550123 --message "你好"', "发送文本消息。"],
  [
    'clawdbot message send --target +15555550123 --message "你好" --media photo.jpg',
    "发送带媒体的消息。",
  ],
  [
    'clawdbot message poll --channel discord --target channel:123 --poll-question "吃什么？" --poll-option 披萨 --poll-option 寿司',
    "创建 Discord 投票。",
  ],
  [
    'clawdbot message react --channel discord --target 123 --message-id 456 --emoji "✅"',
    "对消息添加反应。",
  ],
])}

${theme.muted("文档：")} ${formatDocsLink("/cli/message", "docs.clawd.bot/cli/message")}`,
    )
    .action(() => {
      message.help({ error: true });
    });

  const helpers = createMessageCliHelpers(message, ctx.messageChannelOptions);
  registerMessageSendCommand(message, helpers);
  registerMessageBroadcastCommand(message, helpers);
  registerMessagePollCommand(message, helpers);
  registerMessageReactionsCommands(message, helpers);
  registerMessageReadEditDeleteCommands(message, helpers);
  registerMessagePinCommands(message, helpers);
  registerMessagePermissionsCommand(message, helpers);
  registerMessageSearchCommand(message, helpers);
  registerMessageThreadCommands(message, helpers);
  registerMessageEmojiCommands(message, helpers);
  registerMessageStickerCommands(message, helpers);
  registerMessageDiscordAdminCommands(message, helpers);
}
