"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireVerifiedUser } from "./auth";
import { inviteCode, newId, sql } from "./db";
import {
  getGroup,
  getGroupByInvite,
  getMatch,
  getMembership,
  getUserFlags,
  listMatchPlayers,
} from "./queries";
import { playerStatsForGroup } from "./stats";
import { balanceTeams, mergeStats } from "./teams";
import type { Attendance, TeamSide } from "./types";

function revalidateGroup(groupId: string, matchId?: string) {
  revalidatePath("/");
  revalidatePath(`/grupos/${groupId}`);
  if (matchId) revalidatePath(`/grupos/${groupId}/partidos/${matchId}`);
}

export async function createGroup(formData: FormData) {
  const user = await requireVerifiedUser();
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("El nombre del grupo es obligatorio.");

  const id = newId("grp");
  const code = inviteCode();
  await sql(
    `insert into groups (id, name, invite_code, created_by) values ($1, $2, $3, $4)`,
    [id, name, code, user.id],
  );
  await sql(
    `insert into group_members (group_id, user_id, role) values ($1, $2, 'admin')`,
    [id, user.id],
  );
  redirect(`/grupos/${id}`);
}

export async function joinGroupByCode(formData: FormData) {
  const user = await requireVerifiedUser();
  const code = String(formData.get("code") || "")
    .trim()
    .toUpperCase();
  const group = await getGroupByInvite(code);
  if (!group) throw new Error("Código de invitación inválido.");

  await sql(
    `insert into group_members (group_id, user_id, role)
     values ($1, $2, 'member')
     on conflict do nothing`,
    [group.id, user.id],
  );
  redirect(`/grupos/${group.id}`);
}

export async function joinGroupFromInvite(code: string) {
  const user = await requireVerifiedUser();
  const group = await getGroupByInvite(code);
  if (!group) throw new Error("Invitación no encontrada.");
  await sql(
    `insert into group_members (group_id, user_id, role)
     values ($1, $2, 'member')
     on conflict do nothing`,
    [group.id, user.id],
  );
  redirect(`/grupos/${group.id}`);
}

export async function createMatch(formData: FormData) {
  const user = await requireVerifiedUser();
  const groupId = String(formData.get("group_id") || "").trim();
  if (!groupId) throw new Error("Grupo inválido.");
  const membership = await getMembership(groupId, user.id);
  if (!membership) throw new Error("No sos miembro de este grupo.");

  const playedOn = String(formData.get("played_on") || "").trim();
  const kickoff = String(formData.get("kickoff_time") || "").trim();
  const location = String(formData.get("location") || "").trim();
  if (!playedOn || !kickoff || !location) {
    throw new Error("Fecha, hora y ubicación son obligatorios.");
  }

  const id = newId("mtc");
  await sql(
    `insert into matches (id, group_id, played_on, kickoff_time, location, created_by)
     values ($1, $2, $3, $4, $5, $6)`,
    [id, groupId, playedOn, kickoff, location, user.id],
  );

  // Invite all current members as pending attendance.
  const members = await sql<{ user_id: string }>(
    `select user_id from group_members where group_id = $1`,
    [groupId],
  );
  for (const m of members) {
    await sql(
      `insert into match_players (match_id, user_id, attendance)
       values ($1, $2, 'pending')
       on conflict do nothing`,
      [id, m.user_id],
    );
  }

  revalidateGroup(groupId, id);
  redirect(`/grupos/${groupId}/partidos/${id}`);
}

function matchIds(formData: FormData) {
  const groupId = String(formData.get("group_id") || "").trim();
  const matchId = String(formData.get("match_id") || "").trim();
  if (!groupId || !matchId) throw new Error("Partido inválido.");
  return { groupId, matchId };
}

export async function setAttendance(formData: FormData) {
  const user = await requireVerifiedUser();
  const { groupId, matchId } = matchIds(formData);
  const attendance = String(formData.get("attendance") || "") as Attendance;
  if (!["pending", "confirmed", "declined"].includes(attendance)) {
    throw new Error("Asistencia inválida.");
  }
  const match = await getMatch(matchId);
  if (!match || match.group_id !== groupId) throw new Error("Partido no encontrado.");
  if (match.status !== "programado") {
    throw new Error("Solo se puede confirmar en partidos programados.");
  }

  await sql(
    `insert into match_players (match_id, user_id, attendance)
     values ($1, $2, $3)
     on conflict (match_id, user_id) do update set attendance = excluded.attendance,
       team = case when excluded.attendance = 'confirmed' then match_players.team else null end`,
    [matchId, user.id, attendance],
  );
  revalidateGroup(groupId, matchId);
}

export async function assignTeam(formData: FormData) {
  const user = await requireVerifiedUser();
  const { groupId, matchId } = matchIds(formData);
  const userId = String(formData.get("user_id") || "").trim();
  const teamRaw = String(formData.get("team") || "").trim();
  const team = (teamRaw === "A" || teamRaw === "B" ? teamRaw : null) as TeamSide | null;
  const membership = await getMembership(groupId, user.id);
  if (!membership) throw new Error("No sos miembro.");
  const match = await getMatch(matchId);
  if (!match || match.status !== "programado") {
    throw new Error("No se pueden editar equipos en este estado.");
  }

  await sql(
    `update match_players set team = $1
     where match_id = $2 and user_id = $3 and attendance = 'confirmed'`,
    [team, matchId, userId],
  );
  revalidateGroup(groupId, matchId);
}

export async function autoGenerateTeams(formData: FormData) {
  const user = await requireVerifiedUser();
  const { groupId, matchId } = matchIds(formData);
  const membership = await getMembership(groupId, user.id);
  if (!membership) throw new Error("No sos miembro.");
  const match = await getMatch(matchId);
  if (!match || match.status !== "programado") {
    throw new Error("El partido no admite armado de equipos.");
  }

  const players = (await listMatchPlayers(matchId)).filter(
    (p) => p.attendance === "confirmed",
  );
  if (players.length < 2) {
    throw new Error("Hacen falta al menos 2 confirmados para armar equipos.");
  }

  const stats = await playerStatsForGroup(groupId);
  const balanced = balanceTeams(
    mergeStats(
      players.map((p) => ({
        user_id: p.user_id,
        name: (p.nickname?.trim() || p.name || "Jugador").trim(),
      })),
      stats,
    ),
  );

  for (const row of balanced) {
    await sql(
      `update match_players set team = $1 where match_id = $2 and user_id = $3`,
      [row.team, matchId, row.user_id],
    );
  }
  revalidateGroup(groupId, matchId);
}

export async function clearTeams(formData: FormData) {
  const user = await requireVerifiedUser();
  const { groupId, matchId } = matchIds(formData);
  const membership = await getMembership(groupId, user.id);
  if (!membership) throw new Error("No sos miembro.");
  await sql(`update match_players set team = null where match_id = $1`, [
    matchId,
  ]);
  revalidateGroup(groupId, matchId);
}

export async function saveResult(formData: FormData) {
  const user = await requireVerifiedUser();
  const { groupId, matchId } = matchIds(formData);
  const membership = await getMembership(groupId, user.id);
  if (!membership) throw new Error("No sos miembro.");
  const match = await getMatch(matchId);
  if (!match || match.group_id !== groupId) throw new Error("Partido no encontrado.");

  const goalsA = Number(formData.get("goals_a"));
  const goalsB = Number(formData.get("goals_b"));
  if (!Number.isInteger(goalsA) || !Number.isInteger(goalsB) || goalsA < 0 || goalsB < 0) {
    throw new Error("Los goles deben ser enteros >= 0.");
  }

  const withTeams = (await listMatchPlayers(matchId)).filter(
    (p) => p.attendance === "confirmed" && p.team,
  );
  if (withTeams.length < 2) {
    throw new Error("Asigná jugadores a ambos equipos antes de cargar el resultado.");
  }

  await sql(
    `update matches
     set goals_a = $1, goals_b = $2, status = 'jugado'
     where id = $3`,
    [goalsA, goalsB, matchId],
  );
  revalidateGroup(groupId, matchId);
}

export async function cancelMatch(formData: FormData) {
  const user = await requireVerifiedUser();
  const { groupId, matchId } = matchIds(formData);
  const membership = await getMembership(groupId, user.id);
  if (membership?.role !== "admin") throw new Error("Solo un admin puede cancelar.");
  await sql(`update matches set status = 'cancelado' where id = $1`, [matchId]);
  revalidateGroup(groupId, matchId);
}

export async function ensureGroupAccess(groupId: string) {
  const user = await requireVerifiedUser();
  const group = await getGroup(groupId);
  if (!group) return { user, group: null, membership: null };
  const membership = await getMembership(groupId, user.id);
  return { user, group, membership };
}

/** Add a guest (no account) that members can manage in matches. */
export async function addGuestToGroup(formData: FormData) {
  const user = await requireVerifiedUser();
  const groupId = String(formData.get("group_id") || "").trim();
  const nickname = String(formData.get("nickname") || "").trim();
  if (!groupId) throw new Error("Grupo inválido.");
  if (!nickname) throw new Error("El apodo del invitado es obligatorio.");
  if (nickname.length > 40) throw new Error("Apodo demasiado largo.");

  const membership = await getMembership(groupId, user.id);
  if (!membership) throw new Error("No sos miembro de este grupo.");

  const id = newId("gst");
  const email = `guest_${id}@guest.pelotear.local`;
  await sql(
    `insert into users (id, email, name, nickname, first_name, is_guest, email_verified_at)
     values ($1, $2, $3, $3, $3, true, now())`,
    [id, email, nickname],
  );
  await sql(
    `insert into group_members (group_id, user_id, role) values ($1, $2, 'member')`,
    [groupId, id],
  );

  // Include guest in open scheduled matches of this group.
  const open = await sql<{ id: string }>(
    `select id from matches where group_id = $1 and status = 'programado'`,
    [groupId],
  );
  for (const m of open) {
    await sql(
      `insert into match_players (match_id, user_id, attendance)
       values ($1, $2, 'pending')
       on conflict do nothing`,
      [m.id, id],
    );
  }

  revalidateGroup(groupId);
  redirect(`/grupos/${groupId}`);
}

export async function removeGuestFromGroup(formData: FormData) {
  const user = await requireVerifiedUser();
  const groupId = String(formData.get("group_id") || "").trim();
  const guestId = String(formData.get("guest_id") || "").trim();
  if (!groupId || !guestId) throw new Error("Datos inválidos.");

  const membership = await getMembership(groupId, user.id);
  if (!membership) throw new Error("No sos miembro.");

  const flags = await getUserFlags(guestId);
  if (!flags?.is_guest) {
    throw new Error("Solo se pueden quitar invitados (sin cuenta).");
  }

  await sql(
    `delete from group_members where group_id = $1 and user_id = $2`,
    [groupId, guestId],
  );
  // Drop from open matches of this group; keep history on played matches.
  await sql(
    `delete from match_players mp
     using matches m
     where mp.match_id = m.id
       and m.group_id = $1
       and m.status = 'programado'
       and mp.user_id = $2`,
    [groupId, guestId],
  );

  revalidateGroup(groupId);
}

/** Real member sets attendance for a guest player. */
export async function setProxyAttendance(formData: FormData) {
  const user = await requireVerifiedUser();
  const { groupId, matchId } = matchIds(formData);
  const guestId = String(formData.get("user_id") || "").trim();
  const attendance = String(formData.get("attendance") || "") as Attendance;
  if (!guestId) throw new Error("Invitado inválido.");
  if (!["pending", "confirmed", "declined"].includes(attendance)) {
    throw new Error("Asistencia inválida.");
  }

  const membership = await getMembership(groupId, user.id);
  if (!membership) throw new Error("No sos miembro.");
  const flags = await getUserFlags(guestId);
  if (!flags?.is_guest) {
    throw new Error("Solo se puede cargar asistencia de invitados.");
  }
  const guestMembership = await getMembership(groupId, guestId);
  if (!guestMembership) throw new Error("El invitado no está en este grupo.");

  const match = await getMatch(matchId);
  if (!match || match.group_id !== groupId) throw new Error("Partido no encontrado.");
  if (match.status !== "programado") {
    throw new Error("Solo se puede confirmar en partidos programados.");
  }

  await sql(
    `insert into match_players (match_id, user_id, attendance)
     values ($1, $2, $3)
     on conflict (match_id, user_id) do update set attendance = excluded.attendance,
       team = case when excluded.attendance = 'confirmed' then match_players.team else null end`,
    [matchId, guestId, attendance],
  );
  revalidateGroup(groupId, matchId);
}
