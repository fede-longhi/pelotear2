/** Internal relative paths only (open-redirect safe). */
export function safeNextPath(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const value = raw.trim();
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  if (value.includes("://") || value.includes("\\")) return null;
  return value;
}

export function withNext(path: string, next: string | null | undefined) {
  if (!next) return path;
  const url = new URL(path, "http://local.invalid");
  url.searchParams.set("next", next);
  return `${url.pathname}${url.search}`;
}

export const AFTER_AUTH_COOKIE = "pelotear_after_auth";
