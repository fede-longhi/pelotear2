import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createMatch } from "@/lib/actions";
import { requireVerifiedUser } from "@/lib/auth";
import { playerLabel } from "@/lib/display";
import {
  getGroup,
  getMembership,
  listMatches,
  listMembers,
} from "@/lib/queries";
import { playerStatsForGroup } from "@/lib/stats";

export default async function GroupPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const user = await requireVerifiedUser();
  const group = await getGroup(groupId);
  if (!group) notFound();
  const membership = await getMembership(groupId, user.id);
  if (!membership) notFound();

  const [members, matches, stats] = await Promise.all([
    listMembers(groupId),
    listMatches(groupId),
    playerStatsForGroup(groupId),
  ]);

  const inviteUrl = `/unirse/${group.invite_code}`;

  return (
    <>
      <SiteHeader user={user} />
      <main className="page">
        <section className="section">
          <h2>{group.name}</h2>
          <p className="lead">Miembros, partidos y tabla del grupo.</p>
          <div className="panel invite-box">
            <span className="meta">Invitación</span>
            <span className="invite-code">{group.invite_code}</span>
            <Link className="btn btn-secondary btn-small" href={inviteUrl}>
              Link de ingreso
            </Link>
          </div>
        </section>

        <section className="section two-col">
          <div>
            <h2>Miembros</h2>
            <div className="panel stack">
              {members.map((m) => (
                <div key={m.user_id} className="player-row">
                  <span className="player-identity">
                    {m.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.photo_url} alt="" className="avatar-xs" />
                    ) : (
                      <span className="avatar-xs avatar-placeholder">
                        {playerLabel(m).slice(0, 1).toUpperCase()}
                      </span>
                    )}
                    {playerLabel(m)}
                    {m.user_id === user.id ? " (vos)" : ""}
                  </span>
                  <span className="pill">{m.role}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2>Nuevo partido</h2>
            <form action={createMatch} className="panel form-grid">
              <input type="hidden" name="group_id" value={groupId} />
              <div className="field">
                <Label htmlFor="played_on">Fecha</Label>
                <Input id="played_on" type="date" name="played_on" required />
              </div>
              <div className="field">
                <Label htmlFor="kickoff_time">Hora</Label>
                <Input
                  id="kickoff_time"
                  type="time"
                  name="kickoff_time"
                  required
                  defaultValue="20:00"
                />
              </div>
              <div className="field">
                <Label htmlFor="location">Ubicación</Label>
                <Input
                  id="location"
                  name="location"
                  required
                  maxLength={120}
                  placeholder="Cancha 3, Club Norte"
                  defaultValue="Cancha 3"
                />
              </div>
              <div className="form-actions">
                <Button type="submit">Crear partido</Button>
              </div>
            </form>
          </div>
        </section>

        <section className="section">
          <h2>Partidos</h2>
          {matches.length === 0 ? (
            <p className="empty">Todavía no hay partidos.</p>
          ) : (
            <div className="stack">
              {matches.map((m) => (
                <Link
                  key={m.id}
                  href={`/grupos/${groupId}/partidos/${m.id}`}
                  className="panel group-link"
                >
                  <div>
                    <strong>
                      {formatDate(m.played_on)} · {m.kickoff_time}
                    </strong>
                    <div className="meta">{m.location}</div>
                  </div>
                  <div className="meta" style={{ textAlign: "right" }}>
                    <StatusPill status={m.status} />
                    {m.status === "jugado" && (
                      <div>
                        {m.goals_a} — {m.goals_b}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="section">
          <h2>Estadísticas</h2>
          <p className="lead">W / L / D según el equipo en el que jugaste.</p>
          {stats.length === 0 ? (
            <p className="empty">Todavía no hay partidos jugados.</p>
          ) : (
            <div className="panel" style={{ overflowX: "auto" }}>
              <table className="stats-table">
                <thead>
                  <tr>
                    <th>Jugador</th>
                    <th>PJ</th>
                    <th>G</th>
                    <th>E</th>
                    <th>P</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((s) => (
                    <tr key={s.user_id}>
                      <td>{s.name}</td>
                      <td>{s.played}</td>
                      <td>{s.wins}</td>
                      <td>{s.draws}</td>
                      <td>{s.losses}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </>
  );
}

function StatusPill({ status }: { status: string }) {
  const cls =
    status === "jugado"
      ? "pill pill-ok"
      : status === "cancelado"
        ? "pill pill-bad"
        : "pill pill-warn";
  return <span className={cls}>{status}</span>;
}

function formatDate(value: string) {
  const d = new Date(`${value}T12:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}
