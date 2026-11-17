import { cookies } from "next/headers";

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

export async function rememberAfterAuth(nextRaw: unknown) {
  const next = safeNextPath(nextRaw);
  const jar = await cookies();
  if (!next) {
    jar.delete(AFTER_AUTH_COOKIE);
    return null;
  }
  jar.set(AFTER_AUTH_COOKIE, next, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 2,
  });
  return next;
}

export async function consumeAfterAuthPath(): Promise<string | null> {
  const jar = await cookies();
  const next = safeNextPath(jar.get(AFTER_AUTH_COOKIE)?.value);
  jar.delete(AFTER_AUTH_COOKIE);
  return next;
}
