import type { Command } from "commander";

import { resolveBrowserControlUrl } from "../browser/client.js";
import {
  browserHighlight,
  browserPageErrors,
  browserRequests,
  browserTraceStart,
  browserTraceStop,
} from "../browser/client-actions.js";
import { danger } from "../globals.js";
import { defaultRuntime } from "../runtime.js";
import type { BrowserParentOpts } from "./browser-cli-shared.js";
import { runCommandWithRuntime } from "./cli-utils.js";
import { shortenHomePath } from "../utils.js";

function runBrowserDebug(action: () => Promise<void>) {
  return runCommandWithRuntime(defaultRuntime, action, (err) => {
    defaultRuntime.error(danger(String(err)));
    defaultRuntime.exit(1);
  });
}

export function registerBrowserDebugCommands(
  browser: Command,
  parentOpts: (cmd: Command) => BrowserParentOpts,
) {
  browser
    .command("highlight")
    .description("通过引用高亮元素")
    .argument("<ref>", "来自快照的引用 ID")
    .option("--target-id <id>", "CDP 目标 ID（或唯一前缀）")
    .action(async (ref: string, opts, cmd) => {
      const parent = parentOpts(cmd);
      const baseUrl = resolveBrowserControlUrl(parent?.url);
      const profile = parent?.browserProfile;
      await runBrowserDebug(async () => {
        const result = await browserHighlight(baseUrl, {
          ref: ref.trim(),
          targetId: opts.targetId?.trim() || undefined,
          profile,
        });
        if (parent?.json) {
          defaultRuntime.log(JSON.stringify(result, null, 2));
          return;
        }
        defaultRuntime.log(`highlighted ${ref.trim()}`);
      });
    });

  browser
    .command("errors")
    .description("获取最近的页面错误")
    .option("--clear", "读取后清除存储的错误", false)
    .option("--target-id <id>", "CDP 目标 ID（或唯一前缀）")
    .action(async (opts, cmd) => {
      const parent = parentOpts(cmd);
      const baseUrl = resolveBrowserControlUrl(parent?.url);
      const profile = parent?.browserProfile;
      await runBrowserDebug(async () => {
        const result = await browserPageErrors(baseUrl, {
          targetId: opts.targetId?.trim() || undefined,
          clear: Boolean(opts.clear),
          profile,
        });
        if (parent?.json) {
          defaultRuntime.log(JSON.stringify(result, null, 2));
          return;
        }
        if (!result.errors.length) {
          defaultRuntime.log("无页面错误。");
          return;
        }
        defaultRuntime.log(
          result.errors
            .map((e) => `${e.timestamp} ${e.name ? `${e.name}: ` : ""}${e.message}`)
            .join("\n"),
        );
      });
    });

  browser
    .command("requests")
    .description("获取最近的网络请求（尽力而为）")
    .option("--filter <text>", "仅显示包含此子字符串的 URL")
    .option("--clear", "读取后清除存储的请求", false)
    .option("--target-id <id>", "CDP 目标 ID（或唯一前缀）")
    .action(async (opts, cmd) => {
      const parent = parentOpts(cmd);
      const baseUrl = resolveBrowserControlUrl(parent?.url);
      const profile = parent?.browserProfile;
      await runBrowserDebug(async () => {
        const result = await browserRequests(baseUrl, {
          targetId: opts.targetId?.trim() || undefined,
          filter: opts.filter?.trim() || undefined,
          clear: Boolean(opts.clear),
          profile,
        });
        if (parent?.json) {
          defaultRuntime.log(JSON.stringify(result, null, 2));
          return;
        }
        if (!result.requests.length) {
          defaultRuntime.log("无请求记录。");
          return;
        }
        defaultRuntime.log(
          result.requests
            .map((r) => {
              const status = typeof r.status === "number" ? ` ${r.status}` : "";
              const ok = r.ok === true ? " ok" : r.ok === false ? " fail" : "";
              const fail = r.failureText ? ` (${r.failureText})` : "";
              return `${r.timestamp} ${r.method}${status}${ok} ${r.url}${fail}`;
            })
            .join("\n"),
        );
      });
    });

  const trace = browser.command("trace").description("记录 Playwright 追踪");

  trace
    .command("start")
    .description("开始追踪记录")
    .option("--target-id <id>", "CDP 目标 ID（或唯一前缀）")
    .option("--no-screenshots", "禁用截图")
    .option("--no-snapshots", "禁用快照")
    .option("--sources", "包含源代码（更大的追踪文件）", false)
    .action(async (opts, cmd) => {
      const parent = parentOpts(cmd);
      const baseUrl = resolveBrowserControlUrl(parent?.url);
      const profile = parent?.browserProfile;
      await runBrowserDebug(async () => {
        const result = await browserTraceStart(baseUrl, {
          targetId: opts.targetId?.trim() || undefined,
          screenshots: Boolean(opts.screenshots),
          snapshots: Boolean(opts.snapshots),
          sources: Boolean(opts.sources),
          profile,
        });
        if (parent?.json) {
          defaultRuntime.log(JSON.stringify(result, null, 2));
          return;
        }
        defaultRuntime.log("追踪已开始");
      });
    });

  trace
    .command("stop")
    .description("停止追踪记录并生成 .zip 文件")
    .option("--out <path>", "追踪 ZIP 文件的输出路径")
    .option("--target-id <id>", "CDP 目标 ID（或唯一前缀）")
    .action(async (opts, cmd) => {
      const parent = parentOpts(cmd);
      const baseUrl = resolveBrowserControlUrl(parent?.url);
      const profile = parent?.browserProfile;
      await runBrowserDebug(async () => {
        const result = await browserTraceStop(baseUrl, {
          targetId: opts.targetId?.trim() || undefined,
          path: opts.out?.trim() || undefined,
          profile,
        });
        if (parent?.json) {
          defaultRuntime.log(JSON.stringify(result, null, 2));
          return;
        }
        defaultRuntime.log(`TRACE:${shortenHomePath(result.path)}`);
      });
    });
}
