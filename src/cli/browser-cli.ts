import type { Command } from "commander";

import { danger } from "../globals.js";
import { defaultRuntime } from "../runtime.js";
import { formatDocsLink } from "../terminal/links.js";
import { theme } from "../terminal/theme.js";
import { formatCliCommand } from "./command-format.js";
import { formatHelpExamples } from "./help-format.js";
import { registerBrowserActionInputCommands } from "./browser-cli-actions-input.js";
import { registerBrowserActionObserveCommands } from "./browser-cli-actions-observe.js";
import { registerBrowserDebugCommands } from "./browser-cli-debug.js";
import { browserActionExamples, browserCoreExamples } from "./browser-cli-examples.js";
import { registerBrowserExtensionCommands } from "./browser-cli-extension.js";
import { registerBrowserInspectCommands } from "./browser-cli-inspect.js";
import { registerBrowserManageCommands } from "./browser-cli-manage.js";
import { registerBrowserServeCommands } from "./browser-cli-serve.js";
import type { BrowserParentOpts } from "./browser-cli-shared.js";
import { registerBrowserStateCommands } from "./browser-cli-state.js";

export function registerBrowserCli(program: Command) {
  const browser = program
    .command("browser")
    .description("管理 clawd 专用浏览器（Chrome/Chromium）")
    .option("--url <url>", "覆盖浏览器控制 URL（默认来自 ~/.clawdbot/clawdbot.json）")
    .option("--browser-profile <name>", "浏览器配置文件名称（默认来自配置）")
    .option("--json", "输出机器可读的 JSON", false)
    .addHelpText(
      "after",
      () =>
        `\n${theme.heading("示例：")}\n${formatHelpExamples(
          [...browserCoreExamples, ...browserActionExamples].map((cmd) => [cmd, ""]),
          true,
        )}\n\n${theme.muted("文档：")} ${formatDocsLink(
          "/cli/browser",
          "docs.clawd.bot/cli/browser",
        )}\n`,
    )
    .action(() => {
      browser.outputHelp();
      defaultRuntime.error(
        danger(`缺少子命令。尝试: "${formatCliCommand("clawdbot browser status")}"`),
      );
      defaultRuntime.exit(1);
    });

  const parentOpts = (cmd: Command) => cmd.parent?.opts?.() as BrowserParentOpts;

  registerBrowserManageCommands(browser, parentOpts);
  registerBrowserExtensionCommands(browser, parentOpts);
  registerBrowserServeCommands(browser, parentOpts);
  registerBrowserInspectCommands(browser, parentOpts);
  registerBrowserActionInputCommands(browser, parentOpts);
  registerBrowserActionObserveCommands(browser, parentOpts);
  registerBrowserDebugCommands(browser, parentOpts);
  registerBrowserStateCommands(browser, parentOpts);
}
