import { createHash, randomBytes } from "node:crypto";
import { Resend } from "resend";
import { newId, sql } from "./db";

const TOKEN_HOURS = 24;

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function appBaseUrl(): string {
  const explicit = process.env.APP_BASE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://127.0.0.1:3000";
}

export async function createEmailVerificationToken(
  userId: string,
): Promise<{ token: string; url: string }> {
  // Invalidate prior unused tokens
  await sql(
    `update email_verification_tokens
     set used_at = now()
     where user_id = $1 and used_at is null`,
    [userId],
  );

  const token = randomBytes(32).toString("hex");
  const id = newId("evt");
  const expires = new Date();
  expires.setHours(expires.getHours() + TOKEN_HOURS);

  await sql(
    `insert into email_verification_tokens (id, user_id, token_hash, expires_at)
     values ($1, $2, $3, $4)`,
    [id, userId, hashToken(token), expires.toISOString()],
  );

  const url = `${appBaseUrl()}/verificar/${token}`;
  return { token, url };
}

export type SendResult =
  | { ok: true; mode: "resend" | "dev" }
  | { ok: false; error: string };

export async function sendVerificationEmail(input: {
  to: string;
  name: string;
  url: string;
}): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.EMAIL_FROM?.trim() || "Pelotear <onboarding@resend.dev>";

  if (!apiKey) {
    console.info(
      `[email] RESEND_API_KEY missing — verification link for ${input.to}: ${input.url}`,
    );
    return { ok: true, mode: "dev" };
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to: input.to,
      subject: "Confirmá tu email en Pelotear",
      html: `
        <p>Hola ${escapeHtml(input.name)},</p>
        <p>Confirmá tu email para usar grupos y partidos en Pelotear:</p>
        <p><a href="${input.url}">Confirmar email</a></p>
        <p>El link vence en ${TOKEN_HOURS} horas.</p>
        <p>Si no creaste esta cuenta, ignorá este mensaje.</p>
      `,
      text: `Hola ${input.name},\n\nConfirmá tu email: ${input.url}\n\nVence en ${TOKEN_HOURS} horas.`,
    });
    if (error) {
      console.error("[email] Resend error", error);
      return { ok: false, error: error.message || "No se pudo enviar el email." };
    }
    return { ok: true, mode: "resend" };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo enviar el email.";
    console.error("[email] send failed", error);
    return { ok: false, error: message };
  }
}

export async function verifyEmailToken(token: string): Promise<{
  ok: boolean;
  error?: string;
}> {
  if (!token || token.length < 20) {
    return { ok: false, error: "Link inválido." };
  }

  const rows = await sql<{
    id: string;
    user_id: string;
    used_at: string | null;
    expires_at: string;
  }>(
    `select id, user_id, used_at::text as used_at, expires_at::text as expires_at
     from email_verification_tokens
     where token_hash = $1
     limit 1`,
    [hashToken(token)],
  );
  const row = rows[0];
  if (!row) return { ok: false, error: "Link inválido o ya usado." };
  if (row.used_at) return { ok: false, error: "Este link ya fue usado." };
  if (new Date(row.expires_at).getTime() < Date.now()) {
    return { ok: false, error: "El link expiró. Pedí uno nuevo." };
  }

  await sql(
    `update email_verification_tokens set used_at = now() where id = $1`,
    [row.id],
  );
  await sql(
    `update users set email_verified_at = coalesce(email_verified_at, now())
     where id = $1`,
    [row.user_id],
  );
  return { ok: true };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
