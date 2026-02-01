import { z } from "zod";

export const FeishuAccountSchema = z.object({
  appId: z.string().describe("Feishu App ID (cli_...)"),
  appSecret: z.string().describe("Feishu App Secret"),
  botName: z.string().optional().describe("Bot Name (Optional)"),
});
