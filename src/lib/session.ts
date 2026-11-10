import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { newId, sql } from "./db";

export const SESSION_COOKIE = "pelotear_session";
const SESSION_DAYS = 30;

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export async function createSession(userId: string): Promise<string> {
  const token = createSessionToken();
  const id = newId("ses");
  const expires = new Date();
  expires.setDate(expires.getDate() + SESSION_DAYS);

  await sql(
    `insert into sessions (id, user_id, token_hash, expires_at)
     values ($1, $2, $3, $4)`,
    [id, userId, hashToken(token), expires.toISOString()],
  );

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.VERCEL === "1",
    path: "/",
    expires,
  });

  return token;
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await sql(`delete from sessions where token_hash = $1`, [
      hashToken(token),
    ]);
  }
  jar.delete(SESSION_COOKIE);
}

export async function getSessionUserId(): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const rows = await sql<{ user_id: string }>(
    `select user_id from sessions
     where token_hash = $1 and expires_at > now()
     limit 1`,
    [hashToken(token)],
  );
  return rows[0]?.user_id ?? null;
}

/** Local-only: allow demo personas when not on Vercel and PELOTEAR_DEMO is not "0". */
export function demoModeEnabled(): boolean {
  if (process.env.VERCEL === "1") return false;
  if (process.env.PELOTEAR_DEMO === "0") return false;
  return process.env.NODE_ENV !== "production" || process.env.PELOTEAR_DEMO === "1";
}
