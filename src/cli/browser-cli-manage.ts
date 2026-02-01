import type { Command } from "commander";
import type { BrowserTab } from "../browser/client.js";
import {
  browserCloseTab,
  browserCreateProfile,
  browserDeleteProfile,
  browserFocusTab,
  browserOpenTab,
  browserProfiles,
  browserResetProfile,
  browserStart,
  browserStatus,
  browserStop,
  browserTabAction,
  browserTabs,
  resolveBrowserControlUrl,
} from "../browser/client.js";
import { browserAct } from "../browser/client-actions-core.js";
import { danger, info } from "../globals.js";
import { defaultRuntime } from "../runtime.js";
import { shortenHomePath } from "../utils.js";
import type { BrowserParentOpts } from "./browser-cli-shared.js";
import { runCommandWithRuntime } from "./cli-utils.js";

function runBrowserCommand(action: () => Promise<void>) {
  return runCommandWithRuntime(defaultRuntime, action, (err) => {
    defaultRuntime.error(danger(String(err)));
    defaultRuntime.exit(1);
  });
}

export function registerBrowserManageCommands(
  browser: Command,
  parentOpts: (cmd: Command) => BrowserParentOpts,
) {
  browser
    .command("status")
    .description("显示浏览器状态")
    .action(async (_opts, cmd) => {
      const parent = parentOpts(cmd);
      const baseUrl = resolveBrowserControlUrl(parent?.url);
      await runBrowserCommand(async () => {
        const status = await browserStatus(baseUrl, {
          profile: parent?.browserProfile,
        });
        if (parent?.json) {
          defaultRuntime.log(JSON.stringify(status, null, 2));
          return;
        }
        const detectedPath = status.detectedExecutablePath ?? status.executablePath;
        const detectedDisplay = detectedPath ? shortenHomePath(detectedPath) : "auto";
        defaultRuntime.log(
          [
            `profile: ${status.profile ?? "clawd"}`,
            `enabled: ${status.enabled}`,
            `运行中: ${status.running}`,
            `controlUrl: ${status.controlUrl}`,
            `cdpPort: ${status.cdpPort}`,
            `cdpUrl: ${status.cdpUrl ?? `http://127.0.0.1:${status.cdpPort}`}`,
            `browser: ${status.chosenBrowser ?? "unknown"}`,
            `detectedBrowser: ${status.detectedBrowser ?? "unknown"}`,
            `detectedPath: ${detectedDisplay}`,
            `profileColor: ${status.color}`,
            ...(status.detectError ? [`detectError: ${status.detectError}`] : []),
          ].join("\n"),
        );
      });
    });

  browser
    .command("start")
    .description("启动浏览器（如果已在运行则无操作）")
    .action(async (_opts, cmd) => {
      const parent = parentOpts(cmd);
      const baseUrl = resolveBrowserControlUrl(parent?.url);
      const profile = parent?.browserProfile;
      await runBrowserCommand(async () => {
        await browserStart(baseUrl, { profile });
        const status = await browserStatus(baseUrl, { profile });
        if (parent?.json) {
          defaultRuntime.log(JSON.stringify(status, null, 2));
          return;
        }
        const name = status.profile ?? "clawd";
        defaultRuntime.log(info(`🦞 浏览器 [${name}] 运行中: ${status.running}`));
      });
    });

  browser
    .command("stop")
    .description("停止浏览器（尽力而为）")
    .action(async (_opts, cmd) => {
      const parent = parentOpts(cmd);
      const baseUrl = resolveBrowserControlUrl(parent?.url);
      const profile = parent?.browserProfile;
      await runBrowserCommand(async () => {
        await browserStop(baseUrl, { profile });
        const status = await browserStatus(baseUrl, { profile });
        if (parent?.json) {
          defaultRuntime.log(JSON.stringify(status, null, 2));
          return;
        }
        const name = status.profile ?? "clawd";
        defaultRuntime.log(info(`🦞 浏览器 [${name}] 运行中: ${status.running}`));
      });
    });

  browser
    .command("reset-profile")
    .description("重置浏览器配置文件（将其移至废纸篓）")
    .action(async (_opts, cmd) => {
      const parent = parentOpts(cmd);
      const baseUrl = resolveBrowserControlUrl(parent?.url);
      const profile = parent?.browserProfile;
      await runBrowserCommand(async () => {
        const result = await browserResetProfile(baseUrl, { profile });
        if (parent?.json) {
          defaultRuntime.log(JSON.stringify(result, null, 2));
          return;
        }
        if (!result.moved) {
          defaultRuntime.log(info(`🦞 浏览器配置文件已丢失。`));
          return;
        }
        const dest = result.to ?? result.from;
        defaultRuntime.log(info(`🦞 浏览器配置文件已移至废纸篓 (${dest})`));
      });
    });

  browser
    .command("tabs")
    .description("列出打开的标签页")
    .action(async (_opts, cmd) => {
      const parent = parentOpts(cmd);
      const baseUrl = resolveBrowserControlUrl(parent?.url);
      const profile = parent?.browserProfile;
      await runBrowserCommand(async () => {
        const tabs = await browserTabs(baseUrl, { profile });
        if (parent?.json) {
          defaultRuntime.log(JSON.stringify({ tabs }, null, 2));
          return;
        }
        if (tabs.length === 0) {
          defaultRuntime.log("无标签页（浏览器已关闭或无目标）。");
          return;
        }
        defaultRuntime.log(
          tabs
            .map(
              (t, i) => `${i + 1}. ${t.title || "（无标题）"}\n   ${t.url}\n   id: ${t.targetId}`,
            )
            .join("\n"),
        );
      });
    });

  const tab = browser
    .command("tab")
    .description("标签页快捷方式（基于索引）")
    .action(async (_opts, cmd) => {
      const parent = parentOpts(cmd);
      const baseUrl = resolveBrowserControlUrl(parent?.url);
      const profile = parent?.browserProfile;
      await runBrowserCommand(async () => {
        const result = (await browserTabAction(baseUrl, {
          action: "list",
          profile,
        })) as { ok: true; tabs: BrowserTab[] };
        const tabs = result.tabs ?? [];
        if (parent?.json) {
          defaultRuntime.log(JSON.stringify({ tabs }, null, 2));
          return;
        }
        if (tabs.length === 0) {
          defaultRuntime.log("无标签页（浏览器已关闭或无目标）。");
          return;
        }
        defaultRuntime.log(
          tabs
            .map(
              (t, i) => `${i + 1}. ${t.title || "（无标题）"}\n   ${t.url}\n   id: ${t.targetId}`,
            )
            .join("\n"),
        );
      });
    });

  tab
    .command("new")
    .description("打开新标签页（about:blank）")
    .action(async (_opts, cmd) => {
      const parent = parentOpts(cmd);
      const baseUrl = resolveBrowserControlUrl(parent?.url);
      const profile = parent?.browserProfile;
      await runBrowserCommand(async () => {
        const result = await browserTabAction(baseUrl, {
          action: "new",
          profile,
        });
        if (parent?.json) {
          defaultRuntime.log(JSON.stringify(result, null, 2));
          return;
        }
        defaultRuntime.log("已打开新标签页");
      });
    });

  tab
    .command("select")
    .description("按索引聚焦标签页（从1开始）")
    .argument("<index>", "标签页索引（从1开始）", (v: string) => Number(v))
    .action(async (index: number, _opts, cmd) => {
      const parent = parentOpts(cmd);
      const baseUrl = resolveBrowserControlUrl(parent?.url);
      const profile = parent?.browserProfile;
      if (!Number.isFinite(index) || index < 1) {
        defaultRuntime.error(danger("索引必须是正数"));
        defaultRuntime.exit(1);
        return;
      }
      await runBrowserCommand(async () => {
        const result = await browserTabAction(baseUrl, {
          action: "select",
          index: Math.floor(index) - 1,
          profile,
        });
        if (parent?.json) {
          defaultRuntime.log(JSON.stringify(result, null, 2));
          return;
        }
        defaultRuntime.log(`已选择标签页 ${Math.floor(index)}`);
      });
    });

  tab
    .command("close")
    .description("按索引关闭标签页（从1开始）；默认：第一个标签页")
    .argument("[index]", "标签页索引（从1开始）", (v: string) => Number(v))
    .action(async (index: number | undefined, _opts, cmd) => {
      const parent = parentOpts(cmd);
      const baseUrl = resolveBrowserControlUrl(parent?.url);
      const profile = parent?.browserProfile;
      const idx =
        typeof index === "number" && Number.isFinite(index) ? Math.floor(index) - 1 : undefined;
      if (typeof idx === "number" && idx < 0) {
        defaultRuntime.error(danger("索引必须 >= 1"));
        defaultRuntime.exit(1);
        return;
      }
      await runBrowserCommand(async () => {
        const result = await browserTabAction(baseUrl, {
          action: "close",
          index: idx,
          profile,
        });
        if (parent?.json) {
          defaultRuntime.log(JSON.stringify(result, null, 2));
          return;
        }
        defaultRuntime.log("已关闭标签页");
      });
    });

  browser
    .command("open")
    .description("在新标签页中打开 URL")
    .argument("<url>", "要打开的 URL")
    .action(async (url: string, _opts, cmd) => {
      const parent = parentOpts(cmd);
      const baseUrl = resolveBrowserControlUrl(parent?.url);
      const profile = parent?.browserProfile;
      await runBrowserCommand(async () => {
        const tab = await browserOpenTab(baseUrl, url, { profile });
        if (parent?.json) {
          defaultRuntime.log(JSON.stringify(tab, null, 2));
          return;
        }
        defaultRuntime.log(`已打开: ${tab.url}\nID: ${tab.targetId}`);
      });
    });

  browser
    .command("focus")
    .description("按目标 ID 聚焦标签页（或唯一前缀）")
    .argument("<targetId>", "目标 ID 或唯一前缀")
    .action(async (targetId: string, _opts, cmd) => {
      const parent = parentOpts(cmd);
      const baseUrl = resolveBrowserControlUrl(parent?.url);
      const profile = parent?.browserProfile;
      await runBrowserCommand(async () => {
        await browserFocusTab(baseUrl, targetId, { profile });
        if (parent?.json) {
          defaultRuntime.log(JSON.stringify({ ok: true }, null, 2));
          return;
        }
        defaultRuntime.log(`已聚焦标签页 ${targetId}`);
      });
    });

  browser
    .command("close")
    .description("关闭标签页（目标 ID 可选）")
    .argument("[targetId]", "目标 ID 或唯一前缀（可选）")
    .action(async (targetId: string | undefined, _opts, cmd) => {
      const parent = parentOpts(cmd);
      const baseUrl = resolveBrowserControlUrl(parent?.url);
      const profile = parent?.browserProfile;
      await runBrowserCommand(async () => {
        if (targetId?.trim()) {
          await browserCloseTab(baseUrl, targetId.trim(), { profile });
        } else {
          await browserAct(baseUrl, { kind: "close" }, { profile });
        }
        if (parent?.json) {
          defaultRuntime.log(JSON.stringify({ ok: true }, null, 2));
          return;
        }
        defaultRuntime.log("已关闭标签页");
      });
    });

  // Profile management commands
  browser
    .command("profiles")
    .description("列出所有浏览器配置文件")
    .action(async (_opts, cmd) => {
      const parent = parentOpts(cmd);
      const baseUrl = resolveBrowserControlUrl(parent?.url);
      await runBrowserCommand(async () => {
        const profiles = await browserProfiles(baseUrl);
        if (parent?.json) {
          defaultRuntime.log(JSON.stringify({ profiles }, null, 2));
          return;
        }
        if (profiles.length === 0) {
          defaultRuntime.log("未配置配置文件。");
          return;
        }
        defaultRuntime.log(
          profiles
            .map((p) => {
              const status = p.running ? "运行中" : "已停止";
              const tabs = p.running ? ` (${p.tabCount} 个标签页)` : "";
              const def = p.isDefault ? " [默认]" : "";
              const loc = p.isRemote ? `cdpUrl: ${p.cdpUrl}` : `port: ${p.cdpPort}`;
              const remote = p.isRemote ? " [远程]" : "";
              return `${p.name}: ${status}${tabs}${def}${remote}\n  ${loc}, color: ${p.color}`;
            })
            .join("\n"),
        );
      });
    });

  browser
    .command("create-profile")
    .description("创建新的浏览器配置文件")
    .requiredOption("--name <name>", "配置文件名称（小写字母、数字、连字符）")
    .option("--color <hex>", "配置文件颜色（十六进制格式，例如 #0066CC）")
    .option("--cdp-url <url>", "远程 Chrome 的 CDP URL（http/https）")
    .option("--driver <driver>", "配置文件驱动（clawd|extension）。默认：clawd")
    .action(
      async (opts: { name: string; color?: string; cdpUrl?: string; driver?: string }, cmd) => {
        const parent = parentOpts(cmd);
        const baseUrl = resolveBrowserControlUrl(parent?.url);
        await runBrowserCommand(async () => {
          const result = await browserCreateProfile(baseUrl, {
            name: opts.name,
            color: opts.color,
            cdpUrl: opts.cdpUrl,
            driver: opts.driver === "extension" ? "extension" : undefined,
          });
          if (parent?.json) {
            defaultRuntime.log(JSON.stringify(result, null, 2));
            return;
          }
          const loc = result.isRemote ? `  cdpUrl: ${result.cdpUrl}` : `  port: ${result.cdpPort}`;
          defaultRuntime.log(
            info(
              `🦞 已创建配置文件 "${result.profile}"\n${loc}\n  颜色: ${result.color}${
                opts.driver === "extension" ? "\n  driver: extension" : ""
              }`,
            ),
          );
        });
      },
    );

  browser
    .command("delete-profile")
    .description("删除浏览器配置文件")
    .requiredOption("--name <name>", "要删除的配置文件名称")
    .action(async (opts: { name: string }, cmd) => {
      const parent = parentOpts(cmd);
      const baseUrl = resolveBrowserControlUrl(parent?.url);
      await runBrowserCommand(async () => {
        const result = await browserDeleteProfile(baseUrl, opts.name);
        if (parent?.json) {
          defaultRuntime.log(JSON.stringify(result, null, 2));
          return;
        }
        const msg = result.deleted
          ? `🦞 已删除配置文件 "${result.profile}"（用户数据已移除）`
          : `🦞 已删除配置文件 "${result.profile}"（未找到用户数据）`;
        defaultRuntime.log(info(msg));
      });
    });
}
