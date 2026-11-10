import { sql } from "./db";
import type { PlayerStats } from "./types";

export async function playerStatsForGroup(
  groupId: string,
): Promise<PlayerStats[]> {
  const rows = await sql<{
    user_id: string;
    name: string;
    team: "A" | "B";
    goals_a: number;
    goals_b: number;
  }>(
    `select mp.user_id,
            coalesce(nullif(trim(u.nickname), ''), nullif(trim(u.name), ''), u.email) as name,
            mp.team, m.goals_a, m.goals_b
     from match_players mp
     join matches m on m.id = mp.match_id
     join users u on u.id = mp.user_id
     where m.group_id = $1
       and m.status = 'jugado'
       and mp.attendance = 'confirmed'
       and mp.team is not null
       and m.goals_a is not null
       and m.goals_b is not null`,
    [groupId],
  );

  const map = new Map<string, PlayerStats>();
  for (const row of rows) {
    const cur = map.get(row.user_id) ?? {
      user_id: row.user_id,
      name: row.name,
      wins: 0,
      losses: 0,
      draws: 0,
      played: 0,
    };
    cur.played += 1;
    if (row.goals_a === row.goals_b) cur.draws += 1;
    else if (
      (row.team === "A" && row.goals_a > row.goals_b) ||
      (row.team === "B" && row.goals_b > row.goals_a)
    ) {
      cur.wins += 1;
    } else {
      cur.losses += 1;
    }
    map.set(row.user_id, cur);
  }

  return [...map.values()].sort(
    (a, b) => b.wins - a.wins || b.draws - a.draws || a.name.localeCompare(b.name),
  );
}
