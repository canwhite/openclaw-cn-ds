import process from "node:process";

import { formatUncaughtError } from "./errors.js";

type UnhandledRejectionHandler = (reason: unknown) => boolean;

const handlers = new Set<UnhandledRejectionHandler>();

export function registerUnhandledRejectionHandler(handler: UnhandledRejectionHandler): () => void {
  handlers.add(handler);
  return () => {
    handlers.delete(handler);
  };
}

export function isUnhandledRejectionHandled(reason: unknown): boolean {
  for (const handler of handlers) {
    try {
      if (handler(reason)) return true;
    } catch (err) {
      console.error(
        "[clawdbot] Unhandled rejection handler failed:",
        err instanceof Error ? (err.stack ?? err.message) : err,
      );
    }
  }
  return false;
}

// Check if the error is a network-related fetch error that should not crash the process
function isNetworkFetchError(reason: unknown): boolean {
  if (!(reason instanceof Error)) return false;

  // TypeError: fetch failed (Node.js undici)
  if (reason.name === "TypeError" && reason.message.includes("fetch failed")) {
    return true;
  }

  // Common network error patterns
  const networkErrorPatterns = [
    "ECONNREFUSED",
    "ECONNRESET",
    "ETIMEDOUT",
    "ENOTFOUND",
    "EAI_AGAIN",
    "EHOSTUNREACH",
    "ENETUNREACH",
    "socket hang up",
    "network timeout",
    "getaddrinfo",
  ];

  const message = reason.message.toLowerCase();
  const causeMessage = reason.cause instanceof Error ? reason.cause.message.toLowerCase() : "";

  return networkErrorPatterns.some(
    (pattern) =>
      message.includes(pattern.toLowerCase()) || causeMessage.includes(pattern.toLowerCase()),
  );
}

export function installUnhandledRejectionHandler(): void {
  process.on("unhandledRejection", (reason, _promise) => {
    if (isUnhandledRejectionHandled(reason)) return;

    // Ignore AbortError during shutdown/restart as they are expected
    // when HTTP requests/connections are terminated during gateway restart
    if (reason instanceof Error && reason.name === "AbortError") {
      console.warn(
        "[moltbot] AbortError during operation (expected during restart):",
        reason.message,
      );
      return;
    }

    // Handle network fetch errors gracefully - log but don't crash
    // This prevents the gateway from exiting when Telegram API is unreachable
    // (common in regions where Telegram is blocked)
    if (isNetworkFetchError(reason)) {
      console.error(
        "[moltbot] Network error (non-fatal):",
        formatUncaughtError(reason),
        "\nHint: If you're in a region where Telegram is blocked, configure a proxy in channels.telegram.proxy",
      );
      return;
    }

    console.error("[moltbot] Unhandled promise rejection:", formatUncaughtError(reason));
    process.exit(1);
  });
}
