import { sql } from "./db";
import type { ChemistryRow, PersonalGroupStats, PlayerStats } from "./types";

type Outcome = "W" | "D" | "L";

type MatchResultRow = {
  user_id: string;
  name: string;
  is_guest: boolean;
  match_id: string;
  played_on: string;
  kickoff_time: string;
  team: "A" | "B";
  goals_a: number;
  goals_b: number;
};

function outcomeFor(row: MatchResultRow): Outcome {
  if (row.goals_a === row.goals_b) return "D";
  const won =
    (row.team === "A" && row.goals_a > row.goals_b) ||
    (row.team === "B" && row.goals_b > row.goals_a);
  return won ? "W" : "L";
}

export async function playerStatsForGroup(
  groupId: string,
): Promise<PlayerStats[]> {
  const rows = await sql<MatchResultRow>(
    `select mp.user_id,
            coalesce(nullif(trim(u.nickname), ''), nullif(trim(u.name), ''), u.email) as name,
            coalesce(u.is_guest, false) as is_guest,
            mp.match_id,
            m.played_on::text as played_on,
            m.kickoff_time,
            mp.team, m.goals_a, m.goals_b
     from match_players mp
     join matches m on m.id = mp.match_id
     join users u on u.id = mp.user_id
     where m.group_id = $1
       and m.status = 'jugado'
       and m.deleted_at is null
       and mp.deleted_at is null
       and mp.attendance = 'confirmed'
       and mp.team is not null
       and m.goals_a is not null
       and m.goals_b is not null
     order by m.played_on asc, m.kickoff_time asc, m.created_at asc`,
    [groupId],
  );

  const motmRows = await sql<{ nominee_id: string; wins: number }>(
    `with tallies as (
       select v.match_id, v.nominee_id, count(*)::int as votes
       from match_motm_votes v
       join matches m on m.id = v.match_id
       where m.group_id = $1
         and m.status = 'jugado'
         and m.deleted_at is null
         and m.motm_revealed_at is not null
       group by v.match_id, v.nominee_id
     ),
     tops as (
       select match_id, max(votes) as top_votes
       from tallies
       group by match_id
     )
     select t.nominee_id, count(*)::int as wins
     from tallies t
     join tops x on x.match_id = t.match_id and x.top_votes = t.votes
     group by t.nominee_id`,
    [groupId],
  );
  const motmByUser = new Map(motmRows.map((r) => [r.nominee_id, Number(r.wins)]));

  type Acc = PlayerStats & { chronology: Outcome[] };
  const map = new Map<string, Acc>();

  for (const row of rows) {
    const cur = map.get(row.user_id) ?? {
      user_id: row.user_id,
      name: row.name,
      wins: 0,
      losses: 0,
      draws: 0,
      played: 0,
      streak: 0,
      motm: 0,
      form: "",
      is_guest: Boolean(row.is_guest),
      chronology: [],
    };
    const result = outcomeFor(row);
    cur.chronology.push(result);
    cur.played += 1;
    if (result === "D") cur.draws += 1;
    else if (result === "W") cur.wins += 1;
    else cur.losses += 1;
    map.set(row.user_id, cur);
  }

  return [...map.values()]
    .map((s) => {
      let streak = 0;
      for (let i = s.chronology.length - 1; i >= 0; i--) {
        if (s.chronology[i] !== "W") break;
        streak += 1;
      }
      const form = s.chronology.slice(-5).join("");
      const { chronology: _c, ...rest } = s;
      return {
        ...rest,
        streak,
        form,
        motm: motmByUser.get(s.user_id) ?? 0,
      };
    })
    .sort(
      (a, b) =>
        b.wins - a.wins ||
        b.motm - a.motm ||
        b.draws - a.draws ||
        a.name.localeCompare(b.name),
    );
}

type PairAcc = {
  user_id: string;
  name: string;
  is_guest: boolean;
  played: number;
  wins: number;
  losses: number;
  draws: number;
};

function bumpPair(
  map: Map<string, PairAcc>,
  other: { user_id: string; name: string; is_guest: boolean },
  result: Outcome,
) {
  const cur = map.get(other.user_id) ?? {
    user_id: other.user_id,
    name: other.name,
    is_guest: other.is_guest,
    played: 0,
    wins: 0,
    losses: 0,
    draws: 0,
  };
  cur.played += 1;
  if (result === "W") cur.wins += 1;
  else if (result === "L") cur.losses += 1;
  else cur.draws += 1;
  map.set(other.user_id, cur);
}

function toChemistry(rows: PairAcc[]): ChemistryRow[] {
  return rows.map((r) => ({
    user_id: r.user_id,
    name: r.name,
    is_guest: r.is_guest,
    played: r.played,
    wins: r.wins,
    losses: r.losses,
    draws: r.draws,
    win_rate: r.played > 0 ? r.wins / r.played : 0,
  }));
}

function sortBest(a: ChemistryRow, b: ChemistryRow) {
  return (
    b.win_rate - a.win_rate ||
    b.played - a.played ||
    b.wins - a.wins ||
    a.name.localeCompare(b.name)
  );
}

function sortWorst(a: ChemistryRow, b: ChemistryRow) {
  return (
    a.win_rate - b.win_rate ||
    b.played - a.played ||
    b.losses - a.losses ||
    a.name.localeCompare(b.name)
  );
}

/** Personal stats for one member inside a group (no chemistry threshold). */
export async function personalStatsForGroup(
  groupId: string,
  userId: string,
): Promise<PersonalGroupStats | null> {
  const rows = await sql<MatchResultRow>(
    `select mp.user_id,
            coalesce(nullif(trim(u.nickname), ''), nullif(trim(u.name), ''), u.email) as name,
            coalesce(u.is_guest, false) as is_guest,
            mp.match_id,
            m.played_on::text as played_on,
            m.kickoff_time,
            mp.team, m.goals_a, m.goals_b
     from match_players mp
     join matches m on m.id = mp.match_id
     join users u on u.id = mp.user_id
     where m.group_id = $1
       and m.status = 'jugado'
       and m.deleted_at is null
       and mp.deleted_at is null
       and mp.attendance = 'confirmed'
       and mp.team is not null
       and m.goals_a is not null
       and m.goals_b is not null
     order by m.played_on asc, m.kickoff_time asc, m.created_at asc`,
    [groupId],
  );

  const byMatch = new Map<string, MatchResultRow[]>();
  for (const row of rows) {
    const list = byMatch.get(row.match_id) ?? [];
    list.push(row);
    byMatch.set(row.match_id, list);
  }

  const chronology: Outcome[] = [];
  let wins = 0;
  let losses = 0;
  let draws = 0;
  let myName = "";
  const teammates = new Map<string, PairAcc>();
  const rivals = new Map<string, PairAcc>();

  for (const [, roster] of byMatch) {
    const me = roster.find((p) => p.user_id === userId);
    if (!me) continue;
    myName = me.name;
    const result = outcomeFor(me);
    chronology.push(result);
    if (result === "W") wins += 1;
    else if (result === "L") losses += 1;
    else draws += 1;

    for (const other of roster) {
      if (other.user_id === userId) continue;
      const peer = {
        user_id: other.user_id,
        name: other.name,
        is_guest: Boolean(other.is_guest),
      };
      if (other.team === me.team) bumpPair(teammates, peer, result);
      else bumpPair(rivals, peer, result);
    }
  }

  const played = chronology.length;

  let streak = 0;
  for (let i = chronology.length - 1; i >= 0; i--) {
    if (chronology[i] !== "W") break;
    streak += 1;
  }

  const motmRows = await sql<{ n: number }>(
    `with tallies as (
       select v.match_id, v.nominee_id, count(*)::int as votes
       from match_motm_votes v
       join matches m on m.id = v.match_id
       where m.group_id = $1
         and m.status = 'jugado'
         and m.deleted_at is null
         and m.motm_revealed_at is not null
       group by v.match_id, v.nominee_id
     ),
     tops as (
       select match_id, max(votes) as top_votes
       from tallies
       group by match_id
     )
     select count(*)::int as n
     from tallies t
     join tops x on x.match_id = t.match_id and x.top_votes = t.votes
     where t.nominee_id = $2`,
    [groupId, userId],
  );

  if (!myName) {
    const meRows = await sql<{ name: string }>(
      `select coalesce(nullif(trim(nickname), ''), nullif(trim(name), ''), email) as name
       from users where id = $1`,
      [userId],
    );
    myName = meRows[0]?.name ?? "";
    if (!myName) return null;
  }

  const mateRows = toChemistry([...teammates.values()]);
  const rivalRows = toChemistry([...rivals.values()]);

  return {
    user_id: userId,
    name: myName,
    played,
    wins,
    losses,
    draws,
    win_rate: played > 0 ? wins / played : 0,
    streak,
    form: chronology.slice(-5).join(""),
    motm: Number(motmRows[0]?.n ?? 0),
    best_teammates: [...mateRows].sort(sortBest).slice(0, 5),
    worst_teammates: [...mateRows].sort(sortWorst).slice(0, 5),
    toughest_rivals: [...rivalRows].sort(sortWorst).slice(0, 5),
    favorite_rivals: [...rivalRows].sort(sortBest).slice(0, 5),
  };
}
