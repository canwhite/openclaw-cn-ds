import type { Command } from "commander";
import { resolveBrowserControlUrl } from "../browser/client.js";
import {
  browserConsoleMessages,
  browserPdfSave,
  browserResponseBody,
} from "../browser/client-actions.js";
import { danger } from "../globals.js";
import { defaultRuntime } from "../runtime.js";
import type { BrowserParentOpts } from "./browser-cli-shared.js";
import { runCommandWithRuntime } from "./cli-utils.js";
import { shortenHomePath } from "../utils.js";

function runBrowserObserve(action: () => Promise<void>) {
  return runCommandWithRuntime(defaultRuntime, action, (err) => {
    defaultRuntime.error(danger(String(err)));
    defaultRuntime.exit(1);
  });
}

export function registerBrowserActionObserveCommands(
  browser: Command,
  parentOpts: (cmd: Command) => BrowserParentOpts,
) {
  browser
    .command("console")
    .description("获取最近的控制台消息")
    .option("--level <level>", "按级别过滤（error, warn, info）")
    .option("--target-id <id>", "CDP 目标 ID（或唯一前缀）")
    .action(async (opts, cmd) => {
      const parent = parentOpts(cmd);
      const baseUrl = resolveBrowserControlUrl(parent?.url);
      const profile = parent?.browserProfile;
      await runBrowserObserve(async () => {
        const result = await browserConsoleMessages(baseUrl, {
          level: opts.level?.trim() || undefined,
          targetId: opts.targetId?.trim() || undefined,
          profile,
        });
        if (parent?.json) {
          defaultRuntime.log(JSON.stringify(result, null, 2));
          return;
        }
        defaultRuntime.log(JSON.stringify(result.messages, null, 2));
      });
    });

  browser
    .command("pdf")
    .description("将页面保存为 PDF")
    .option("--target-id <id>", "CDP 目标 ID（或唯一前缀）")
    .action(async (opts, cmd) => {
      const parent = parentOpts(cmd);
      const baseUrl = resolveBrowserControlUrl(parent?.url);
      const profile = parent?.browserProfile;
      await runBrowserObserve(async () => {
        const result = await browserPdfSave(baseUrl, {
          targetId: opts.targetId?.trim() || undefined,
          profile,
        });
        if (parent?.json) {
          defaultRuntime.log(JSON.stringify(result, null, 2));
          return;
        }
        defaultRuntime.log(`PDF: ${shortenHomePath(result.path)}`);
      });
    });

  browser
    .command("responsebody")
    .description("等待网络响应并返回其正文")
    .argument("<url>", "URL（精确匹配、子字符串或通配符如 **/api）")
    .option("--target-id <id>", "CDP 目标 ID（或唯一前缀）")
    .option("--timeout-ms <ms>", "等待响应的时间（默认：20000）", (v: string) => Number(v))
    .option("--max-chars <n>", "返回的最大字符数（默认：200000）", (v: string) => Number(v))
    .action(async (url: string, opts, cmd) => {
      const parent = parentOpts(cmd);
      const baseUrl = resolveBrowserControlUrl(parent?.url);
      const profile = parent?.browserProfile;
      await runBrowserObserve(async () => {
        const result = await browserResponseBody(baseUrl, {
          url,
          targetId: opts.targetId?.trim() || undefined,
          timeoutMs: Number.isFinite(opts.timeoutMs) ? opts.timeoutMs : undefined,
          maxChars: Number.isFinite(opts.maxChars) ? opts.maxChars : undefined,
          profile,
        });
        if (parent?.json) {
          defaultRuntime.log(JSON.stringify(result, null, 2));
          return;
        }
        defaultRuntime.log(result.response.body);
      });
    });
}
