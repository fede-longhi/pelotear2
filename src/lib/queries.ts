import { sql } from "./db";
import type {
  GroupRow,
  MatchPlayerRow,
  MatchRow,
  MemberRow,
  MotmTallyRow,
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
    team_a_name: (row.team_a_name?.trim() || "Equipo A").slice(0, 40),
    team_b_name: (row.team_b_name?.trim() || "Equipo B").slice(0, 40),
    motm_revealed_at: row.motm_revealed_at
      ? asIso(row.motm_revealed_at)
      : null,
  };
}

export async function listGroupsForUser(userId: string) {
  const rows = await sql<GroupRow & { role: string; member_count: number }>(
    `select g.*, gm.role,
            (select count(*)::int from group_members x
              where x.group_id = g.id and x.deleted_at is null) as member_count
     from groups g
     join group_members gm on gm.group_id = g.id
     where gm.user_id = $1
       and g.deleted_at is null
       and gm.deleted_at is null
     order by g.created_at desc`,
    [userId],
  );
  return rows.map((r) => ({ ...normalizeGroup(r), member_count: Number(r.member_count) }));
}

export async function getGroup(groupId: string) {
  const rows = await sql<GroupRow>(
    `select * from groups where id = $1 and deleted_at is null`,
    [groupId],
  );
  return rows[0] ? normalizeGroup(rows[0]) : null;
}

export async function getGroupByInvite(code: string) {
  const rows = await sql<GroupRow>(
    `select * from groups
     where invite_code = $1 and deleted_at is null`,
    [code.toUpperCase()],
  );
  return rows[0] ? normalizeGroup(rows[0]) : null;
}

export async function getMembership(groupId: string, userId: string) {
  const rows = await sql<{ role: string }>(
    `select role from group_members
     where group_id = $1 and user_id = $2 and deleted_at is null`,
    [groupId, userId],
  );
  return rows[0] ?? null;
}

export async function listMembers(groupId: string) {
  return sql<MemberRow>(
    `select gm.*, u.name, u.email, u.nickname, u.photo_url,
            coalesce(u.is_guest, false) as is_guest
     from group_members gm
     join users u on u.id = gm.user_id
     where gm.group_id = $1
       and gm.deleted_at is null
     order by u.is_guest asc, gm.role desc, u.name`,
    [groupId],
  );
}

export async function getUserFlags(userId: string) {
  const rows = await sql<{ is_guest: boolean }>(
    `select coalesce(is_guest, false) as is_guest from users where id = $1`,
    [userId],
  );
  return rows[0] ?? null;
}

export async function listMatches(groupId: string) {
  const rows = await sql<MatchRow>(
    `select * from matches
     where group_id = $1 and deleted_at is null
     order by played_on desc, kickoff_time desc`,
    [groupId],
  );
  return rows.map(normalizeMatch);
}

export async function getMatch(matchId: string) {
  const rows = await sql<MatchRow>(
    `select m.*
     from matches m
     join groups g on g.id = m.group_id
     where m.id = $1
       and m.deleted_at is null
       and g.deleted_at is null`,
    [matchId],
  );
  return rows[0] ? normalizeMatch(rows[0]) : null;
}

export async function listMatchPlayers(matchId: string) {
  return sql<MatchPlayerRow>(
    `select mp.*, u.name, u.email, u.nickname, u.photo_url,
            coalesce(u.is_guest, false) as is_guest
     from match_players mp
     join users u on u.id = mp.user_id
     where mp.match_id = $1
       and mp.deleted_at is null
     order by u.is_guest asc, mp.team nulls last, u.name`,
    [matchId],
  );
}

export async function getMyMotmVote(matchId: string, voterId: string) {
  const rows = await sql<{ nominee_id: string }>(
    `select nominee_id from match_motm_votes
     where match_id = $1 and voter_id = $2
     limit 1`,
    [matchId, voterId],
  );
  return rows[0]?.nominee_id ?? null;
}

export async function listMotmTally(matchId: string): Promise<MotmTallyRow[]> {
  return sql<MotmTallyRow>(
    `select v.nominee_id,
            u.name,
            u.nickname,
            coalesce(u.is_guest, false) as is_guest,
            count(*)::int as votes
     from match_motm_votes v
     join users u on u.id = v.nominee_id
     where v.match_id = $1
     group by v.nominee_id, u.name, u.nickname, u.is_guest
     order by votes desc, u.name asc`,
    [matchId],
  );
}

export async function countMotmVotes(matchId: string): Promise<number> {
  const rows = await sql<{ n: number }>(
    `select count(*)::int as n from match_motm_votes where match_id = $1`,
    [matchId],
  );
  return Number(rows[0]?.n ?? 0);
}

export async function countMatchAttendance(matchId: string): Promise<{
  confirmed: number;
  pending: number;
  declined: number;
}> {
  const rows = await sql<{ attendance: string; n: number }>(
    `select attendance, count(*)::int as n
     from match_players
     where match_id = $1 and deleted_at is null
     group by attendance`,
    [matchId],
  );
  const counts = { confirmed: 0, pending: 0, declined: 0 };
  for (const row of rows) {
    if (row.attendance === "confirmed") counts.confirmed = Number(row.n);
    else if (row.attendance === "pending") counts.pending = Number(row.n);
    else if (row.attendance === "declined") counts.declined = Number(row.n);
  }
  return counts;
}
