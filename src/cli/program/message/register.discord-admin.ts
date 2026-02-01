import type { Command } from "commander";
import type { MessageCliHelpers } from "./helpers.js";

export function registerMessageDiscordAdminCommands(message: Command, helpers: MessageCliHelpers) {
  const role = message.command("role").description("角色操作");
  helpers
    .withMessageBase(
      role.command("info").description("列出角色").requiredOption("--guild-id <id>", "服务器 ID"),
    )
    .action(async (opts) => {
      await helpers.runMessageAction("role-info", opts);
    });

  helpers
    .withMessageBase(
      role
        .command("add")
        .description("为成员添加角色")
        .requiredOption("--guild-id <id>", "服务器 ID")
        .requiredOption("--user-id <id>", "用户 ID")
        .requiredOption("--role-id <id>", "角色 ID"),
    )
    .action(async (opts) => {
      await helpers.runMessageAction("role-add", opts);
    });

  helpers
    .withMessageBase(
      role
        .command("remove")
        .description("移除成员的角色")
        .requiredOption("--guild-id <id>", "服务器 ID")
        .requiredOption("--user-id <id>", "用户 ID")
        .requiredOption("--role-id <id>", "角色 ID"),
    )
    .action(async (opts) => {
      await helpers.runMessageAction("role-remove", opts);
    });

  const channel = message.command("channel").description("频道操作");
  helpers
    .withMessageBase(
      helpers.withRequiredMessageTarget(channel.command("info").description("获取频道信息")),
    )
    .action(async (opts) => {
      await helpers.runMessageAction("channel-info", opts);
    });

  helpers
    .withMessageBase(
      channel
        .command("list")
        .description("列出频道")
        .requiredOption("--guild-id <id>", "服务器 ID"),
    )
    .action(async (opts) => {
      await helpers.runMessageAction("channel-list", opts);
    });

  const member = message.command("member").description("成员操作");
  helpers
    .withMessageBase(
      member
        .command("info")
        .description("获取成员信息")
        .requiredOption("--user-id <id>", "用户 ID"),
    )
    .option("--guild-id <id>", "服务器 ID（Discord）")
    .action(async (opts) => {
      await helpers.runMessageAction("member-info", opts);
    });

  const voice = message.command("voice").description("语音操作");
  helpers
    .withMessageBase(
      voice
        .command("status")
        .description("获取语音状态")
        .requiredOption("--guild-id <id>", "服务器 ID")
        .requiredOption("--user-id <id>", "用户 ID"),
    )
    .action(async (opts) => {
      await helpers.runMessageAction("voice-status", opts);
    });

  const event = message.command("event").description("活动操作");
  helpers
    .withMessageBase(
      event
        .command("list")
        .description("列出计划活动")
        .requiredOption("--guild-id <id>", "服务器 ID"),
    )
    .action(async (opts) => {
      await helpers.runMessageAction("event-list", opts);
    });

  helpers
    .withMessageBase(
      event
        .command("create")
        .description("创建计划活动")
        .requiredOption("--guild-id <id>", "服务器 ID")
        .requiredOption("--event-name <name>", "活动名称")
        .requiredOption("--start-time <iso>", "活动开始时间"),
    )
    .option("--end-time <iso>", "活动结束时间")
    .option("--desc <text>", "活动描述")
    .option("--channel-id <id>", "频道 ID")
    .option("--location <text>", "活动地点")
    .option("--event-type <stage|external|voice>", "活动类型")
    .action(async (opts) => {
      await helpers.runMessageAction("event-create", opts);
    });

  helpers
    .withMessageBase(
      message
        .command("timeout")
        .description("禁言成员")
        .requiredOption("--guild-id <id>", "服务器 ID")
        .requiredOption("--user-id <id>", "用户 ID"),
    )
    .option("--duration-min <n>", "禁言时长（分钟）")
    .option("--until <iso>", "禁言至")
    .option("--reason <text>", "管理原因")
    .action(async (opts) => {
      await helpers.runMessageAction("timeout", opts);
    });

  helpers
    .withMessageBase(
      message
        .command("kick")
        .description("踢出成员")
        .requiredOption("--guild-id <id>", "服务器 ID")
        .requiredOption("--user-id <id>", "用户 ID"),
    )
    .option("--reason <text>", "管理原因")
    .action(async (opts) => {
      await helpers.runMessageAction("kick", opts);
    });

  helpers
    .withMessageBase(
      message
        .command("ban")
        .description("封禁成员")
        .requiredOption("--guild-id <id>", "服务器 ID")
        .requiredOption("--user-id <id>", "用户 ID"),
    )
    .option("--reason <text>", "管理原因")
    .option("--delete-days <n>", "封禁后删除消息的天数")
    .action(async (opts) => {
      await helpers.runMessageAction("ban", opts);
    });
}
