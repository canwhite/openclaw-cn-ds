import type { Command } from "commander";
import type { MessageCliHelpers } from "./helpers.js";

export function registerMessageSendCommand(message: Command, helpers: MessageCliHelpers) {
  helpers
    .withMessageBase(
      helpers
        .withRequiredMessageTarget(
          message
            .command("send")
            .description("发送消息")
            .option("-m, --message <text>", "消息内容（除非设置了 --media，否则必填）"),
        )
        .option("--media <path-or-url>", "附加媒体（图片/音频/视频/文档）。接受本地路径或 URL。")
        .option("--buttons <json>", "Telegram 内联键盘按钮，JSON 格式（按钮行数组）")
        .option("--card <json>", "自适应卡片 JSON 对象（当渠道支持时）")
        .option("--reply-to <id>", "回复的消息 ID")
        .option("--thread-id <id>", "主题 ID（Telegram 论坛主题）")
        .option("--gif-playback", "将视频媒体作为 GIF 播放（仅 WhatsApp）。", false),
    )
    .action(async (opts) => {
      await helpers.runMessageAction("send", opts);
    });
}
