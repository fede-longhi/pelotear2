import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import {
  assignTeam,
  autoGenerateTeams,
  cancelMatch,
  clearTeams,
  saveResult,
  setAttendance,
} from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import {
  getMatch,
  getMembership,
  listMatchPlayers,
} from "@/lib/queries";
import type { TeamSide } from "@/lib/types";

export default async function MatchPage({
  params,
}: {
  params: Promise<{ groupId: string; matchId: string }>;
}) {
  const { groupId, matchId } = await params;
  const user = await requireUser();
  const membership = await getMembership(groupId, user.id);
  if (!membership) notFound();
  const match = await getMatch(matchId);
  if (!match || match.group_id !== groupId) notFound();

  const players = await listMatchPlayers(matchId);
  const me = players.find((p) => p.user_id === user.id);
  const confirmed = players.filter((p) => p.attendance === "confirmed");
  const teamA = confirmed.filter((p) => p.team === "A");
  const teamB = confirmed.filter((p) => p.team === "B");
  const unassigned = confirmed.filter((p) => !p.team);
  const scheduled = match.status === "programado";

  return (
    <>
      <SiteHeader user={user} />
      <main className="page">
        <section className="section">
          <p className="meta">
            <Link href={`/grupos/${groupId}`}>← Volver al grupo</Link>
          </p>
          <h2>
            {match.played_on} · {match.kickoff_time}
          </h2>
          <p className="lead">{match.location}</p>
          <span
            className={
              match.status === "jugado"
                ? "pill pill-ok"
                : match.status === "cancelado"
                  ? "pill pill-bad"
                  : "pill pill-warn"
            }
          >
            {match.status}
          </span>
        </section>

        {match.status === "jugado" && (
          <section className="section panel">
            <div className="scoreboard">
              <div>
                <div className="meta">Equipo A</div>
                <div className="score">{match.goals_a}</div>
              </div>
              <div className="meta">vs</div>
              <div>
                <div className="meta">Equipo B</div>
                <div className="score">{match.goals_b}</div>
              </div>
            </div>
          </section>
        )}

        {scheduled && (
          <section className="section">
            <h2>Tu asistencia</h2>
            <div className="panel form-actions">
              <AttendanceButton
                groupId={groupId}
                matchId={matchId}
                attendance="confirmed"
                label="Confirmo"
                active={me?.attendance === "confirmed"}
              />
              <AttendanceButton
                groupId={groupId}
                matchId={matchId}
                attendance="declined"
                label="No puedo"
                active={me?.attendance === "declined"}
                danger
              />
              <AttendanceButton
                groupId={groupId}
                matchId={matchId}
                attendance="pending"
                label="Pendiente"
                active={me?.attendance === "pending"}
              />
            </div>
          </section>
        )}

        <section className="section">
          <h2>Confirmados ({confirmed.length})</h2>
          <div className="panel stack">
            {players.length === 0 ? (
              <p className="empty">Sin jugadores todavía.</p>
            ) : (
              players.map((p) => (
                <div key={p.user_id} className="player-row">
                  <span>
                    {p.name}
                    {p.user_id === user.id ? " (vos)" : ""}
                  </span>
                  <span className="meta">
                    {p.attendance}
                    {p.team ? ` · equipo ${p.team}` : ""}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="section">
          <h2>Equipos</h2>
          <p className="lead">
            Manual o automático (balancea con W/L/D del grupo).
          </p>
          {scheduled && (
            <div className="form-actions" style={{ marginBottom: "1rem" }}>
              <form action={autoGenerateTeams}>
                <input type="hidden" name="group_id" value={groupId} />
                <input type="hidden" name="match_id" value={matchId} />
                <button type="submit" className="btn btn-primary">
                  Generar equipos
                </button>
              </form>
              <form action={clearTeams}>
                <input type="hidden" name="group_id" value={groupId} />
                <input type="hidden" name="match_id" value={matchId} />
                <button type="submit" className="btn btn-secondary">
                  Limpiar equipos
                </button>
              </form>
            </div>
          )}

          <div className="team-board">
            <TeamPanel
              title="Equipo A"
              players={teamA}
              scheduled={scheduled}
              groupId={groupId}
              matchId={matchId}
            />
            <TeamPanel
              title="Equipo B"
              players={teamB}
              scheduled={scheduled}
              groupId={groupId}
              matchId={matchId}
            />
          </div>

          {unassigned.length > 0 && (
            <div className="panel" style={{ marginTop: "1rem" }}>
              <h3 style={{ marginTop: 0 }}>Sin equipo</h3>
              {unassigned.map((p) => (
                <div key={p.user_id} className="player-row">
                  <span>{p.name}</span>
                  {scheduled && (
                    <div className="inline-actions">
                      <TeamButton
                        groupId={groupId}
                        matchId={matchId}
                        userId={p.user_id}
                        team="A"
                        label="A"
                      />
                      <TeamButton
                        groupId={groupId}
                        matchId={matchId}
                        userId={p.user_id}
                        team="B"
                        label="B"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {scheduled && (
          <section className="section">
            <h2>Resultado</h2>
            <p className="lead">Goles por equipo (no por jugador).</p>
            <form action={saveResult} className="panel form-grid">
              <input type="hidden" name="group_id" value={groupId} />
              <input type="hidden" name="match_id" value={matchId} />
              <div className="two-col">
                <label>
                  Goles equipo A
                  <input
                    type="number"
                    name="goals_a"
                    min={0}
                    step={1}
                    required
                    defaultValue={0}
                  />
                </label>
                <label>
                  Goles equipo B
                  <input
                    type="number"
                    name="goals_b"
                    min={0}
                    step={1}
                    required
                    defaultValue={0}
                  />
                </label>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  Guardar resultado
                </button>
              </div>
            </form>
            {membership.role === "admin" && (
              <form action={cancelMatch} style={{ marginTop: "0.75rem" }}>
                <input type="hidden" name="group_id" value={groupId} />
                <input type="hidden" name="match_id" value={matchId} />
                <button type="submit" className="btn btn-danger">
                  Cancelar partido
                </button>
              </form>
            )}
          </section>
        )}
      </main>
    </>
  );
}

function AttendanceButton({
  groupId,
  matchId,
  attendance,
  label,
  active,
  danger,
}: {
  groupId: string;
  matchId: string;
  attendance: string;
  label: string;
  active?: boolean;
  danger?: boolean;
}) {
  const cls = active
    ? danger
      ? "btn btn-small btn-danger"
      : "btn btn-small btn-primary"
    : "btn btn-small btn-secondary";
  return (
    <form action={setAttendance}>
      <input type="hidden" name="group_id" value={groupId} />
      <input type="hidden" name="match_id" value={matchId} />
      <input type="hidden" name="attendance" value={attendance} />
      <button type="submit" className={cls}>
        {label}
      </button>
    </form>
  );
}

function TeamPanel({
  title,
  players,
  scheduled,
  groupId,
  matchId,
}: {
  title: string;
  players: { user_id: string; name: string; team: TeamSide | null }[];
  scheduled: boolean;
  groupId: string;
  matchId: string;
}) {
  return (
    <div className="panel team-col">
      <h3>{title}</h3>
      {players.length === 0 ? (
        <p className="empty">Vacío</p>
      ) : (
        players.map((p) => (
          <div key={p.user_id} className="player-row">
            <span>{p.name}</span>
            {scheduled && (
              <div className="inline-actions">
                <TeamButton
                  groupId={groupId}
                  matchId={matchId}
                  userId={p.user_id}
                  team={p.team === "A" ? "B" : "A"}
                  label={p.team === "A" ? "→ B" : "→ A"}
                />
                <TeamButton
                  groupId={groupId}
                  matchId={matchId}
                  userId={p.user_id}
                  team={null}
                  label="Quitar"
                />
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

function TeamButton({
  groupId,
  matchId,
  userId,
  team,
  label,
}: {
  groupId: string;
  matchId: string;
  userId: string;
  team: TeamSide | null;
  label: string;
}) {
  return (
    <form action={assignTeam}>
      <input type="hidden" name="group_id" value={groupId} />
      <input type="hidden" name="match_id" value={matchId} />
      <input type="hidden" name="user_id" value={userId} />
      <input type="hidden" name="team" value={team ?? ""} />
      <button type="submit" className="btn btn-small btn-secondary">
        {label}
      </button>
    </form>
  );
}
