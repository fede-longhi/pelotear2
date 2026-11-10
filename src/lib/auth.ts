import { cookies } from "next/headers";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { sql, newId } from "./db";
import { demoModeEnabled, getSessionUserId } from "./session";
import type { UserRow } from "./types";

export const DEMO_PERSONAS = [
  { id: "demo_fede", name: "Fede", email: "fede@pelotear.local" },
  { id: "demo_juan", name: "Juan", email: "juan@pelotear.local" },
  { id: "demo_maria", name: "María", email: "maria@pelotear.local" },
  { id: "demo_lucia", name: "Lucía", email: "lucia@pelotear.local" },
] as const;

const DEMO_COOKIE = "pelotear_demo_user";

export type AppUser = {
  id: string;
  email: string;
  name: string;
  first_name: string;
  last_name: string;
  nickname: string;
  phone: string;
  birth_date: string | null;
  photo_url: string;
  email_verified: boolean;
  simulated: boolean;
};

function displayName(u: {
  nickname?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  name?: string | null;
  email?: string | null;
}): string {
  const nick = u.nickname?.trim();
  if (nick) return nick;
  const full = `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim();
  if (full) return full;
  if (u.name?.trim()) return u.name.trim();
  return u.email?.split("@")[0] || "Jugador";
}

function asDateString(value: unknown): string | null {
  if (value == null || value === "") return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function mapUser(row: UserRow, simulated: boolean): AppUser {
  return {
    id: row.id,
    email: row.email,
    name: displayName(row),
    first_name: row.first_name || "",
    last_name: row.last_name || "",
    nickname: row.nickname || "",
    phone: row.phone || "",
    birth_date: asDateString(row.birth_date),
    photo_url: row.photo_url || "",
    email_verified: Boolean(row.email_verified_at) || simulated,
    simulated,
  };
}

async function loadUserById(id: string): Promise<UserRow | null> {
  const rows = await sql<UserRow>(
    `select id, email, name, first_name, last_name, nickname, phone,
            birth_date::text as birth_date, photo_url, password_hash,
            email_verified_at::text as email_verified_at
     from users where id = $1`,
    [id],
  );
  return rows[0] ?? null;
}

async function ensureDemoUser(
  persona: (typeof DEMO_PERSONAS)[number],
): Promise<AppUser> {
  await sql(
    `insert into users (id, email, name, first_name, nickname, email_verified_at)
     values ($1, $2, $3, $3, $3, now())
     on conflict (id) do update set
       email = excluded.email,
       name = excluded.name,
       email_verified_at = coalesce(users.email_verified_at, now())`,
    [persona.id, persona.email, persona.name],
  );
  const row = await loadUserById(persona.id);
  return mapUser(row!, true);
}

async function personaFromCookie(): Promise<AppUser> {
  const jar = await cookies();
  const demoId = jar.get(DEMO_COOKIE)?.value;
  const persona =
    DEMO_PERSONAS.find((p) => p.id === demoId) ?? DEMO_PERSONAS[0];
  return ensureDemoUser(persona);
}

export async function getOptionalUser(): Promise<AppUser | null> {
  await connection();
  const sessionUserId = await getSessionUserId();
  if (sessionUserId) {
    const row = await loadUserById(sessionUserId);
    if (row) return mapUser(row, false);
  }
  if (demoModeEnabled()) return personaFromCookie();
  return null;
}

export async function requireUser(): Promise<AppUser> {
  const user = await getOptionalUser();
  if (!user) redirect("/ingresar");
  return user;
}

/** Require login + verified email (demo users always pass). */
export async function requireVerifiedUser(): Promise<AppUser> {
  const user = await requireUser();
  if (!user.email_verified) redirect("/verificar-email");
  return user;
}

export async function setDemoUser(personaId: string) {
  if (!demoModeEnabled()) return;
  const jar = await cookies();
  if (!DEMO_PERSONAS.some((p) => p.id === personaId)) {
    jar.delete(DEMO_COOKIE);
    return;
  }
  jar.set(DEMO_COOKIE, personaId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
}

export async function registerUser(input: {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  nickname: string;
}): Promise<AppUser> {
  const email = input.email.trim().toLowerCase();
  if (!email.includes("@")) throw new Error("Email inválido.");
  if (input.password.length < 6) {
    throw new Error("La contraseña debe tener al menos 6 caracteres.");
  }
  const first = input.first_name.trim();
  const last = input.last_name.trim();
  const nick = input.nickname.trim();
  if (!first || !last) throw new Error("Nombre y apellido son obligatorios.");

  const existing = await sql<{ id: string }>(
    `select id from users where lower(email) = $1 limit 1`,
    [email],
  );
  if (existing[0]) throw new Error("Ya existe una cuenta con ese email.");

  const id = newId("usr");
  const password_hash = await bcrypt.hash(input.password, 10);
  const name = displayName({
    nickname: nick,
    first_name: first,
    last_name: last,
  });

  await sql(
    `insert into users (id, email, name, password_hash, first_name, last_name, nickname)
     values ($1, $2, $3, $4, $5, $6, $7)`,
    [id, email, name, password_hash, first, last, nick],
  );

  const row = await loadUserById(id);
  return mapUser(row!, false);
}

export async function loginUser(
  emailRaw: string,
  password: string,
): Promise<AppUser> {
  const email = emailRaw.trim().toLowerCase();
  const rows = await sql<UserRow>(
    `select id, email, name, first_name, last_name, nickname, phone,
            birth_date::text as birth_date, photo_url, password_hash,
            email_verified_at::text as email_verified_at
     from users where lower(email) = $1 limit 1`,
    [email],
  );
  const row = rows[0];
  if (!row?.password_hash) {
    throw new Error("Email o contraseña incorrectos.");
  }
  const ok = await bcrypt.compare(password, row.password_hash);
  if (!ok) throw new Error("Email o contraseña incorrectos.");
  return mapUser(row, false);
}

export async function updateProfile(
  userId: string,
  input: {
    first_name: string;
    last_name: string;
    nickname: string;
    phone: string;
    birth_date: string;
    photo_url?: string;
  },
): Promise<AppUser> {
  const first = input.first_name.trim();
  const last = input.last_name.trim();
  const nick = input.nickname.trim();
  if (!first || !last) throw new Error("Nombre y apellido son obligatorios.");
  const birth = input.birth_date.trim() || null;
  const name = displayName({
    nickname: nick,
    first_name: first,
    last_name: last,
  });

  if (input.photo_url !== undefined) {
    await sql(
      `update users set first_name = $1, last_name = $2, nickname = $3, phone = $4,
         birth_date = $5, name = $6, photo_url = $7
       where id = $8`,
      [
        first,
        last,
        nick,
        input.phone.trim(),
        birth,
        name,
        input.photo_url,
        userId,
      ],
    );
  } else {
    await sql(
      `update users set first_name = $1, last_name = $2, nickname = $3, phone = $4,
         birth_date = $5, name = $6
       where id = $7`,
      [first, last, nick, input.phone.trim(), birth, name, userId],
    );
  }

  const row = await loadUserById(userId);
  return mapUser(row!, false);
}

export async function updatePhotoUrl(
  userId: string,
  photo_url: string,
): Promise<AppUser> {
  await sql(`update users set photo_url = $1 where id = $2`, [
    photo_url,
    userId,
  ]);
  const row = await loadUserById(userId);
  return mapUser(row!, false);
}
