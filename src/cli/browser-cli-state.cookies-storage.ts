import type { Command } from "commander";

import { resolveBrowserControlUrl } from "../browser/client.js";
import {
  browserCookies,
  browserCookiesClear,
  browserCookiesSet,
  browserStorageClear,
  browserStorageGet,
  browserStorageSet,
} from "../browser/client-actions.js";
import { danger } from "../globals.js";
import { defaultRuntime } from "../runtime.js";
import type { BrowserParentOpts } from "./browser-cli-shared.js";

export function registerBrowserCookiesAndStorageCommands(
  browser: Command,
  parentOpts: (cmd: Command) => BrowserParentOpts,
) {
  const cookies = browser.command("cookies").description("读取/写入 cookies");

  cookies.option("--target-id <id>", "CDP 目标 ID（或唯一前缀）").action(async (opts, cmd) => {
    const parent = parentOpts(cmd);
    const baseUrl = resolveBrowserControlUrl(parent?.url);
    const profile = parent?.browserProfile;
    try {
      const result = await browserCookies(baseUrl, {
        targetId: opts.targetId?.trim() || undefined,
        profile,
      });
      if (parent?.json) {
        defaultRuntime.log(JSON.stringify(result, null, 2));
        return;
      }
      defaultRuntime.log(JSON.stringify(result.cookies ?? [], null, 2));
    } catch (err) {
      defaultRuntime.error(danger(String(err)));
      defaultRuntime.exit(1);
    }
  });

  cookies
    .command("set")
    .description("设置 cookie（需要 --url 或 domain+path）")
    .argument("<name>", "Cookie 名称")
    .argument("<value>", "Cookie 值")
    .requiredOption("--url <url>", "Cookie URL 范围（推荐）")
    .option("--target-id <id>", "CDP 目标 ID（或唯一前缀）")
    .action(async (name: string, value: string, opts, cmd) => {
      const parent = parentOpts(cmd);
      const baseUrl = resolveBrowserControlUrl(parent?.url);
      const profile = parent?.browserProfile;
      try {
        const result = await browserCookiesSet(baseUrl, {
          targetId: opts.targetId?.trim() || undefined,
          cookie: { name, value, url: opts.url },
          profile,
        });
        if (parent?.json) {
          defaultRuntime.log(JSON.stringify(result, null, 2));
          return;
        }
        defaultRuntime.log(`cookie set: ${name}`);
      } catch (err) {
        defaultRuntime.error(danger(String(err)));
        defaultRuntime.exit(1);
      }
    });

  cookies
    .command("clear")
    .description("清除所有 cookies")
    .option("--target-id <id>", "CDP 目标 ID（或唯一前缀）")
    .action(async (opts, cmd) => {
      const parent = parentOpts(cmd);
      const baseUrl = resolveBrowserControlUrl(parent?.url);
      const profile = parent?.browserProfile;
      try {
        const result = await browserCookiesClear(baseUrl, {
          targetId: opts.targetId?.trim() || undefined,
          profile,
        });
        if (parent?.json) {
          defaultRuntime.log(JSON.stringify(result, null, 2));
          return;
        }
        defaultRuntime.log("cookies cleared");
      } catch (err) {
        defaultRuntime.error(danger(String(err)));
        defaultRuntime.exit(1);
      }
    });

  const storage = browser.command("storage").description("读取/写入 localStorage/sessionStorage");

  function registerStorageKind(kind: "local" | "session") {
    const cmd = storage.command(kind).description(`${kind}Storage 命令`);

    cmd
      .command("get")
      .description(`获取 ${kind}Storage（所有键或单个键）`)
      .argument("[key]", "键（可选）")
      .option("--target-id <id>", "CDP 目标 ID（或唯一前缀）")
      .action(async (key: string | undefined, opts, cmd2) => {
        const parent = parentOpts(cmd2);
        const baseUrl = resolveBrowserControlUrl(parent?.url);
        const profile = parent?.browserProfile;
        try {
          const result = await browserStorageGet(baseUrl, {
            kind,
            key: key?.trim() || undefined,
            targetId: opts.targetId?.trim() || undefined,
            profile,
          });
          if (parent?.json) {
            defaultRuntime.log(JSON.stringify(result, null, 2));
            return;
          }
          defaultRuntime.log(JSON.stringify(result.values ?? {}, null, 2));
        } catch (err) {
          defaultRuntime.error(danger(String(err)));
          defaultRuntime.exit(1);
        }
      });

    cmd
      .command("set")
      .description(`设置 ${kind}Storage 键`)
      .argument("<key>", "键")
      .argument("<value>", "值")
      .option("--target-id <id>", "CDP 目标 ID（或唯一前缀）")
      .action(async (key: string, value: string, opts, cmd2) => {
        const parent = parentOpts(cmd2);
        const baseUrl = resolveBrowserControlUrl(parent?.url);
        const profile = parent?.browserProfile;
        try {
          const result = await browserStorageSet(baseUrl, {
            kind,
            key,
            value,
            targetId: opts.targetId?.trim() || undefined,
            profile,
          });
          if (parent?.json) {
            defaultRuntime.log(JSON.stringify(result, null, 2));
            return;
          }
          defaultRuntime.log(`${kind}Storage set: ${key}`);
        } catch (err) {
          defaultRuntime.error(danger(String(err)));
          defaultRuntime.exit(1);
        }
      });

    cmd
      .command("clear")
      .description(`清除所有 ${kind}Storage 键`)
      .option("--target-id <id>", "CDP 目标 ID（或唯一前缀）")
      .action(async (opts, cmd2) => {
        const parent = parentOpts(cmd2);
        const baseUrl = resolveBrowserControlUrl(parent?.url);
        const profile = parent?.browserProfile;
        try {
          const result = await browserStorageClear(baseUrl, {
            kind,
            targetId: opts.targetId?.trim() || undefined,
            profile,
          });
          if (parent?.json) {
            defaultRuntime.log(JSON.stringify(result, null, 2));
            return;
          }
          defaultRuntime.log(`${kind}Storage cleared`);
        } catch (err) {
          defaultRuntime.error(danger(String(err)));
          defaultRuntime.exit(1);
        }
      });
  }

  registerStorageKind("local");
  registerStorageKind("session");
}
