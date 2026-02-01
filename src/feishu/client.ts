import * as Lark from "@larksuiteoapi/node-sdk";
import { loadConfig } from "../config/config.js";
import { getChildLogger } from "../logging.js";
import type { FeishuConfig } from "../config/types.feishu.js";

const logger = getChildLogger({ module: "feishu-client" });

export function getFeishuClient(accountIdOrAppId?: string, explicitAppSecret?: string) {
  const cfg = loadConfig();
  const feishuCfg = (cfg.channels as any)?.feishu as FeishuConfig | undefined;

  let appId = accountIdOrAppId;
  let appSecret = explicitAppSecret;

  if (!appSecret && feishuCfg?.accounts) {
    // If accountId is provided, look it up
    if (accountIdOrAppId && feishuCfg.accounts[accountIdOrAppId]) {
      const acc = feishuCfg.accounts[accountIdOrAppId];
      appId = acc.appId;
      appSecret = acc.appSecret;
    } else if (!accountIdOrAppId) {
      // Fallback to first account if not specified
      const firstKey = Object.keys(feishuCfg.accounts)[0];
      if (firstKey) {
        const acc = feishuCfg.accounts[firstKey];
        appId = acc.appId;
        appSecret = acc.appSecret;
      }
    }
  }

  // Environment variables fallback
  if (!appId) appId = process.env.FEISHU_APP_ID;
  if (!appSecret) appSecret = process.env.FEISHU_APP_SECRET;

  if (!appId || !appSecret) {
    throw new Error(
      "Feishu App ID and Secret are required. Configure them in channels.feishu.accounts or FEISHU_APP_ID/SECRET env vars.",
    );
  }

  const client = new Lark.Client({
    appId,
    appSecret,
    logger: {
      debug: (msg) => {
        logger.debug(msg);
      },
      info: (msg) => {
        logger.info(msg);
      },
      warn: (msg) => {
        logger.warn(msg);
      },
      error: (msg) => {
        logger.error(msg);
      },
      trace: (msg) => {
        logger.silly(msg);
      },
    },
  });

  return client;
}
