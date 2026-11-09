/**
 * End-to-end smoke against PGlite (no HTTP).
 * Run: env -u DATABASE_URL npx tsx scripts/smoke-e2e.ts
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { balanceTeams, mergeStats } from "../src/lib/teams";

async function main() {
  const db = new PGlite();
  const dir = path.join(process.cwd(), "migrations");
  for (const file of (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort()) {
    await db.exec(await readFile(path.join(dir, file), "utf8"));
  }

  const q = async <T>(text: string, params: unknown[] = []) =>
    (await db.query<T>(text, params)).rows;

  await q(`insert into users (id, email, name) values
    ('demo_fede','fede@x','Fede'),
    ('demo_juan','juan@x','Juan'),
    ('demo_maria','maria@x','María'),
    ('demo_lucia','lucia@x','Lucía')`);

  await q(
    `insert into groups (id, name, invite_code, created_by) values ('grp1','Los del jueves','ABCD1234','demo_fede')`,
  );
  for (const id of ["demo_fede", "demo_juan", "demo_maria", "demo_lucia"]) {
    await q(
      `insert into group_members (group_id, user_id, role) values ('grp1',$1,$2)`,
      [id, id === "demo_fede" ? "admin" : "member"],
    );
  }

  await q(
    `insert into matches (id, group_id, played_on, kickoff_time, location, created_by)
     values ('mtc1','grp1','2026-11-12','20:00','Cancha 3','demo_fede')`,
  );
  for (const id of ["demo_fede", "demo_juan", "demo_maria", "demo_lucia"]) {
    await q(
      `insert into match_players (match_id, user_id, attendance) values ('mtc1',$1,'confirmed')`,
      [id],
    );
  }

  const confirmed = await q<{ user_id: string; name: string }>(
    `select mp.user_id, u.name from match_players mp join users u on u.id = mp.user_id
     where mp.match_id = 'mtc1' and mp.attendance = 'confirmed'`,
  );
  const teams = balanceTeams(mergeStats(confirmed, []));
  for (const t of teams) {
    await q(`update match_players set team = $1 where match_id = 'mtc1' and user_id = $2`, [
      t.team,
      t.user_id,
    ]);
  }

  await q(`update matches set goals_a = 3, goals_b = 2, status = 'jugado' where id = 'mtc1'`);

  const rows = await q<{
    user_id: string;
    name: string;
    team: "A" | "B";
    goals_a: number;
    goals_b: number;
  }>(
    `select mp.user_id, u.name, mp.team, m.goals_a, m.goals_b
     from match_players mp
     join matches m on m.id = mp.match_id
     join users u on u.id = mp.user_id
     where m.group_id = 'grp1' and m.status = 'jugado' and mp.team is not null`,
  );

  const stats = new Map<string, { w: number; l: number; d: number }>();
  for (const r of rows) {
    const cur = stats.get(r.user_id) ?? { w: 0, l: 0, d: 0 };
    if (r.goals_a === r.goals_b) cur.d++;
    else if (
      (r.team === "A" && r.goals_a > r.goals_b) ||
      (r.team === "B" && r.goals_b > r.goals_a)
    )
      cur.w++;
    else cur.l++;
    stats.set(r.user_id, cur);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        teams,
        result: "3-2",
        stats: Object.fromEntries(stats),
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
