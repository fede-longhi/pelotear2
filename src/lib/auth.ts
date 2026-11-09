import { cookies } from "next/headers";
import { connection } from "next/server";
import { getIdentity } from "../../cursor/identity";
import { sql } from "./db";
import type { UserRow } from "./types";

export const DEMO_PERSONAS = [
  { id: "demo_fede", name: "Fede", email: "fede@pelotear.local" },
  { id: "demo_juan", name: "Juan", email: "juan@pelotear.local" },
  { id: "demo_maria", name: "María", email: "maria@pelotear.local" },
  { id: "demo_lucia", name: "Lucía", email: "lucia@pelotear.local" },
] as const;

const DEMO_COOKIE = "pelotear_demo_user";

export type AppUser = UserRow & { simulated: boolean };

export async function requireUser(request?: Request): Promise<AppUser> {
  // Opt into request-time rendering (identity uses Date.now(); cookies for demo personas).
  await connection();
  const identity = await getIdentity(request ?? new Request("http://local"));
  if (!identity.verified) {
    throw new Error("Necesitás iniciar sesión para usar Pelotear.");
  }

  let id = identity.sub;
  let name = identity.name?.trim() || identity.email?.split("@")[0] || "Jugador";
  let email = identity.email || "";
  let simulated = Boolean(identity.simulated);

  if (simulated) {
    const jar = await cookies();
    const demoId = jar.get(DEMO_COOKIE)?.value;
    const persona = DEMO_PERSONAS.find((p) => p.id === demoId);
    if (persona) {
      id = persona.id;
      name = persona.name;
      email = persona.email;
    } else {
      // Default simulated viewer maps to first demo persona for local multi-user.
      id = DEMO_PERSONAS[0].id;
      name = DEMO_PERSONAS[0].name;
      email = DEMO_PERSONAS[0].email;
    }
  }

  await sql(
    `insert into users (id, email, name)
     values ($1, $2, $3)
     on conflict (id) do update set email = excluded.email, name = excluded.name`,
    [id, email, name],
  );

  return { id, email, name, simulated };
}

export async function setDemoUser(personaId: string) {
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
