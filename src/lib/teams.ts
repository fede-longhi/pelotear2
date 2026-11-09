import type { PlayerStats, TeamSide } from "./types";

export type BalancePlayer = {
  user_id: string;
  name: string;
  wins?: number;
  losses?: number;
  draws?: number;
};

/** Simple balanced split: seed by W/L/D strength, snake-draft into A/B. */
export function balanceTeams(
  players: BalancePlayer[],
): { user_id: string; team: TeamSide }[] {
  if (players.length === 0) return [];

  const ranked = [...players].sort((a, b) => strength(b) - strength(a));
  const teamA: BalancePlayer[] = [];
  const teamB: BalancePlayer[] = [];

  for (let i = 0; i < ranked.length; i++) {
    const pick = ranked[i];
    const aScore = teamA.reduce((s, p) => s + strength(p), 0);
    const bScore = teamB.reduce((s, p) => s + strength(p), 0);
    if (teamA.length === teamB.length) {
      if (aScore <= bScore) teamA.push(pick);
      else teamB.push(pick);
    } else if (teamA.length < teamB.length) {
      teamA.push(pick);
    } else {
      teamB.push(pick);
    }
  }

  return [
    ...teamA.map((p) => ({ user_id: p.user_id, team: "A" as const })),
    ...teamB.map((p) => ({ user_id: p.user_id, team: "B" as const })),
  ];
}

function strength(p: BalancePlayer): number {
  const w = p.wins ?? 0;
  const l = p.losses ?? 0;
  const d = p.draws ?? 0;
  const played = w + l + d;
  if (played === 0) return 1;
  return (w * 3 + d) / played + played * 0.05;
}

export function mergeStats(
  players: { user_id: string; name: string }[],
  stats: PlayerStats[],
): BalancePlayer[] {
  const byId = new Map(stats.map((s) => [s.user_id, s]));
  return players.map((p) => {
    const s = byId.get(p.user_id);
    return {
      user_id: p.user_id,
      name: p.name,
      wins: s?.wins ?? 0,
      losses: s?.losses ?? 0,
      draws: s?.draws ?? 0,
    };
  });
}
