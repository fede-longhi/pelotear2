/** Prefer nickname, then stored name. */
export function playerLabel(u: {
  nickname?: string | null;
  name?: string | null;
}): string {
  const nick = u.nickname?.trim();
  if (nick) return nick;
  return (u.name || "Jugador").trim();
}
