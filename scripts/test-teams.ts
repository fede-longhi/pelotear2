import { balanceTeams } from "../src/lib/teams";

const players = [
  { user_id: "1", name: "A", wins: 5, losses: 1, draws: 0 },
  { user_id: "2", name: "B", wins: 4, losses: 2, draws: 0 },
  { user_id: "3", name: "C", wins: 1, losses: 4, draws: 1 },
  { user_id: "4", name: "D", wins: 0, losses: 3, draws: 2 },
  { user_id: "5", name: "E", wins: 2, losses: 2, draws: 2 },
];

const result = balanceTeams(players);
const a = result.filter((r) => r.team === "A");
const b = result.filter((r) => r.team === "B");
if (Math.abs(a.length - b.length) > 1) {
  console.error("unbalanced sizes", a.length, b.length);
  process.exit(1);
}
if (result.length !== players.length) {
  console.error("missing players");
  process.exit(1);
}
console.log("ok", result);
