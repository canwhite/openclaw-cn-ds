export function normalizeFeishuTarget(raw: string): string {
  return raw.replace(/^feishu:/, "").trim();
}
