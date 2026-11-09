import { sql } from "./db";
import type {
  GroupRow,
  MatchPlayerRow,
  MatchRow,
  MemberRow,
} from "./types";

function asDateString(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value ?? "").slice(0, 10);
}

function asIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  return String(value ?? "");
}

function normalizeGroup<T extends GroupRow>(row: T): T {
  return { ...row, created_at: asIso(row.created_at) };
}

function normalizeMatch(row: MatchRow): MatchRow {
  return {
    ...row,
    played_on: asDateString(row.played_on),
    created_at: asIso(row.created_at),
    goals_a: row.goals_a === null || row.goals_a === undefined ? null : Number(row.goals_a),
    goals_b: row.goals_b === null || row.goals_b === undefined ? null : Number(row.goals_b),
  };
}

export async function listGroupsForUser(userId: string) {
  const rows = await sql<GroupRow & { role: string; member_count: number }>(
    `select g.*, gm.role,
            (select count(*)::int from group_members x where x.group_id = g.id) as member_count
     from groups g
     join group_members gm on gm.group_id = g.id
     where gm.user_id = $1
     order by g.created_at desc`,
    [userId],
  );
  return rows.map((r) => ({ ...normalizeGroup(r), member_count: Number(r.member_count) }));
}

export async function getGroup(groupId: string) {
  const rows = await sql<GroupRow>(`select * from groups where id = $1`, [
    groupId,
  ]);
  return rows[0] ? normalizeGroup(rows[0]) : null;
}

export async function getGroupByInvite(code: string) {
  const rows = await sql<GroupRow>(
    `select * from groups where invite_code = $1`,
    [code.toUpperCase()],
  );
  return rows[0] ? normalizeGroup(rows[0]) : null;
}

export async function getMembership(groupId: string, userId: string) {
  const rows = await sql<{ role: string }>(
    `select role from group_members where group_id = $1 and user_id = $2`,
    [groupId, userId],
  );
  return rows[0] ?? null;
}

export async function listMembers(groupId: string) {
  return sql<MemberRow>(
    `select gm.*, u.name, u.email
     from group_members gm
     join users u on u.id = gm.user_id
     where gm.group_id = $1
     order by gm.role desc, u.name`,
    [groupId],
  );
}

export async function listMatches(groupId: string) {
  const rows = await sql<MatchRow>(
    `select * from matches where group_id = $1
     order by played_on desc, kickoff_time desc`,
    [groupId],
  );
  return rows.map(normalizeMatch);
}

export async function getMatch(matchId: string) {
  const rows = await sql<MatchRow>(`select * from matches where id = $1`, [
    matchId,
  ]);
  return rows[0] ? normalizeMatch(rows[0]) : null;
}

export async function listMatchPlayers(matchId: string) {
  return sql<MatchPlayerRow>(
    `select mp.*, u.name, u.email
     from match_players mp
     join users u on u.id = mp.user_id
     where mp.match_id = $1
     order by mp.team nulls last, u.name`,
    [matchId],
  );
}
