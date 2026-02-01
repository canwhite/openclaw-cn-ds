import type { ClawdbotConfig } from "../config/config.js";

export type FeishuConfig = {
  appId: string;
  appSecret: string;
  encryptKey?: string;
  verificationToken?: string;
};

export type FeishuAccountConfig = FeishuConfig & {
  botName?: string;
};

export type FeishuContext = {
  appId: string;
  chatId?: string;
  openId?: string;
  userId?: string;
  messageId?: string;
  messageType?: string;
  text?: string;
  raw?: any;
};
