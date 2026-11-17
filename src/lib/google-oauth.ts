import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { appBaseUrl } from "./email";

export const GOOGLE_OAUTH_STATE_COOKIE = "pelotear_google_oauth_state";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

export type GoogleProfile = {
  sub: string;
  email: string;
  email_verified: boolean;
  given_name: string;
  family_name: string;
  name: string;
  picture: string;
};

export function googleOAuthConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() &&
      process.env.GOOGLE_CLIENT_SECRET?.trim(),
  );
}

export function googleCallbackUrl(): string {
  return `${appBaseUrl()}/api/auth/google/callback`;
}

export function createOAuthState(): string {
  return randomBytes(24).toString("hex");
}

export function hashOAuthState(state: string): string {
  return createHash("sha256").update(state).digest("hex");
}

export async function setOAuthStateCookie(state: string): Promise<void> {
  const jar = await cookies();
  jar.set(GOOGLE_OAUTH_STATE_COOKIE, hashOAuthState(state), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.VERCEL === "1",
    path: "/",
    maxAge: 60 * 10,
  });
}

export async function consumeOAuthStateCookie(
  state: string,
): Promise<boolean> {
  const jar = await cookies();
  const expected = jar.get(GOOGLE_OAUTH_STATE_COOKIE)?.value;
  jar.delete(GOOGLE_OAUTH_STATE_COOKIE);
  if (!expected || !state) return false;
  return expected === hashOAuthState(state);
}

export function buildGoogleAuthorizeUrl(state: string): string {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  if (!clientId) throw new Error("Google no está configurado.");

  const url = new URL(GOOGLE_AUTH_URL);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", googleCallbackUrl());
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("access_type", "online");
  url.searchParams.set("prompt", "select_account");
  return url.toString();
}

export async function exchangeGoogleCode(
  code: string,
): Promise<GoogleProfile> {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    throw new Error("Google no está configurado.");
  }

  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: googleCallbackUrl(),
    grant_type: "authorization_code",
  });

  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!tokenRes.ok) {
    throw new Error("No se pudo completar el login con Google.");
  }

  const tokenJson = (await tokenRes.json()) as {
    access_token?: string;
    error?: string;
  };
  if (!tokenJson.access_token) {
    throw new Error("No se pudo completar el login con Google.");
  }

  const profileRes = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
  });
  if (!profileRes.ok) {
    throw new Error("No se pudo leer el perfil de Google.");
  }

  const raw = (await profileRes.json()) as {
    sub?: string;
    email?: string;
    email_verified?: boolean;
    given_name?: string;
    family_name?: string;
    name?: string;
    picture?: string;
  };

  const sub = String(raw.sub || "").trim();
  const email = String(raw.email || "")
    .trim()
    .toLowerCase();
  if (!sub || !email || !email.includes("@")) {
    throw new Error("Google no devolvió un email válido.");
  }
  if (raw.email_verified === false) {
    throw new Error("Tu email de Google no está verificado.");
  }

  return {
    sub,
    email,
    email_verified: true,
    given_name: String(raw.given_name || "").trim(),
    family_name: String(raw.family_name || "").trim(),
    name: String(raw.name || "").trim(),
    picture: String(raw.picture || "").trim(),
  };
}
