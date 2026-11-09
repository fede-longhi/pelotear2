#!/usr/bin/env node
import { writeFileSync } from "node:fs";

const BASE = process.env.BASE_URL || "http://127.0.0.1:3000";
const jar = new Map();

function cookieHeader() {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

function storeCookies(res) {
  for (const c of res.headers.getSetCookie?.() || []) {
    const [pair] = c.split(";");
    const i = pair.indexOf("=");
    if (i > 0) jar.set(pair.slice(0, i), pair.slice(i + 1));
  }
}

async function get(path) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { cookie: cookieHeader() },
    redirect: "manual",
  });
  storeCookies(res);
  return { res, html: await res.text() };
}

function allActionIds(html) {
  return [...html.matchAll(/name="\$ACTION_ID_([a-f0-9]+)"/g)].map((m) => m[1]);
}

function actionNear(html, needle) {
  const idx = html.indexOf(needle);
  if (idx < 0) throw new Error(`needle not found: ${needle}`);
  const before = html.slice(Math.max(0, idx - 800), idx);
  const matches = [...before.matchAll(/name="\$ACTION_ID_([a-f0-9]+)"/g)];
  if (!matches.length) throw new Error(`No ACTION_ID before ${needle}`);
  return matches[matches.length - 1][1];
}

async function postAction(path, action, fields) {
  const fd = new FormData();
  fd.set(`$ACTION_ID_${action}`, "");
  for (const [k, v] of Object.entries(fields)) fd.set(k, String(v));
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { cookie: cookieHeader() },
    body: fd,
    redirect: "manual",
  });
  storeCookies(res);
  return res;
}

async function switchPersona(personaId) {
  const { html } = await get("/grupos");
  const id = actionNear(html, "personaId");
  await postAction("/grupos", id, { personaId });
}

async function main() {
  await switchPersona("demo_fede");
  let { html } = await get("/grupos");
  let id = actionNear(html, 'name="name"');
  let res = await postAction("/grupos", id, { name: "Los del jueves E2E" });
  const groupLoc = res.headers.get("location");
  if (!groupLoc?.startsWith("/grupos/")) throw new Error("create group failed " + res.status);
  const groupId = groupLoc.split("/")[2];
  ({ html } = await get(groupLoc));
  const invite = html.match(/class="invite-code">([A-Z0-9]+)</)?.[1];
  if (!invite) throw new Error("no invite");

  id = actionNear(html, 'name="played_on"');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const playedOn = tomorrow.toISOString().slice(0, 10);
  res = await postAction(groupLoc, id, {
    group_id: groupId,
    played_on: playedOn,
    kickoff_time: "20:00",
    location: "Cancha 3",
  });
  const matchLoc = res.headers.get("location");
  if (!matchLoc?.includes("/partidos/")) throw new Error("create match failed");
  const matchId = matchLoc.split("/").pop();

  for (const persona of ["demo_fede", "demo_juan", "demo_maria", "demo_lucia"]) {
    await switchPersona(persona);
    if (persona !== "demo_fede") {
      ({ html } = await get("/unirse"));
      id = actionNear(html, 'name="code"');
      await postAction("/unirse", id, { code: invite });
    }
    ({ html } = await get(matchLoc));
    if (!html.includes("<form")) {
      throw new Error("match page missing SSR forms");
    }
    id = actionNear(html, ">Confirmo<");
    res = await postAction(matchLoc, id, {
      group_id: groupId,
      match_id: matchId,
      attendance: "confirmed",
    });
    if (![200, 303].includes(res.status)) {
      throw new Error(`confirm ${persona} -> ${res.status}`);
    }
  }

  await switchPersona("demo_fede");
  ({ html } = await get(matchLoc));
  id = actionNear(html, "Generar equipos");
  await postAction(matchLoc, id, { group_id: groupId, match_id: matchId });

  ({ html } = await get(matchLoc));
  id = actionNear(html, 'name="goals_a"');
  await postAction(matchLoc, id, {
    group_id: groupId,
    match_id: matchId,
    goals_a: "3",
    goals_b: "2",
  });

  ({ html } = await get(matchLoc));
  const hasScore = html.includes('class="score"') && />(3)</.test(html) && />(2)</.test(html);
  ({ html } = await get(groupLoc));
  const hasStats = html.includes("<th>G</th>") && html.includes("Fede");

  const out = {
    ok: hasScore && hasStats,
    groupId,
    matchId,
    invite,
    groupUrl: `${BASE}${groupLoc}`,
    matchUrl: `${BASE}${matchLoc}`,
    hasScore,
    hasStats,
    actionIdsSample: allActionIds(html).slice(0, 3),
  };
  writeFileSync("/tmp/pelotear-e2e.json", JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  if (!out.ok) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
