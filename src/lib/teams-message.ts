import { playerLabel } from "@/lib/display";

type NamedPlayer = {
  nickname?: string | null;
  name?: string | null;
};

function formatWhen(playedOn: string, kickoffTime: string) {
  const d = new Date(`${playedOn}T12:00:00`);
  if (Number.isNaN(d.getTime())) {
    return `${playedOn} · ${kickoffTime}`;
  }
  const day = d.toLocaleDateString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  return `${day} · ${kickoffTime}`;
}

function listBlock(title: string, players: NamedPlayer[]) {
  const lines = players.map((p) => `• ${playerLabel(p)}`);
  return [`*${title}*`, ...(lines.length > 0 ? lines : ["• (vacío)"])].join(
    "\n",
  );
}

/** Plain text for WhatsApp / clipboard. */
export function buildTeamsShareMessage(input: {
  playedOn: string;
  kickoffTime: string;
  location: string;
  teamAName: string;
  teamBName: string;
  teamA: NamedPlayer[];
  teamB: NamedPlayer[];
  unassigned?: NamedPlayer[];
}) {
  const parts = [
    `⚽ ${formatWhen(input.playedOn, input.kickoffTime)}`,
    `📍 ${input.location}`,
    "",
    listBlock(input.teamAName, input.teamA),
    "",
    listBlock(input.teamBName, input.teamB),
  ];

  if (input.unassigned && input.unassigned.length > 0) {
    parts.push("", listBlock("Sin equipo", input.unassigned));
  }

  return parts.join("\n");
}
