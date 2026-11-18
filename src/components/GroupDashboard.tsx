"use client";

import Link from "next/link";
import { useState } from "react";
import {
  CalendarPlus,
  ChevronDown,
  ChevronRight,
  MapPin,
  Pencil,
  Share2,
  Users,
  X,
} from "lucide-react";
import { CopyInviteLink } from "@/components/CopyInviteLink";
import { DeleteGroupButton } from "@/components/DeleteGroupButton";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TimePicker } from "@/components/ui/time-picker";
import {
  addGuestToGroup,
  createMatch,
  removeGuestFromGroup,
  setAttendance,
  updateGroup,
} from "@/lib/actions";
import { playerLabel } from "@/lib/display";
import type { MatchRow, MemberRow, PlayerStats } from "@/lib/types";

type NextMatchInfo = {
  match: MatchRow;
  confirmed: number;
  pending: number;
  myAttendance: string | null;
};

export function GroupDashboard({
  groupId,
  groupName,
  inviteCode,
  invitePath,
  inviteUrl,
  isAdmin,
  currentUserId,
  members,
  nextMatch,
  history,
  stats,
}: {
  groupId: string;
  groupName: string;
  inviteCode: string;
  invitePath: string;
  inviteUrl: string;
  isAdmin: boolean;
  currentUserId: string;
  members: MemberRow[];
  nextMatch: NextMatchInfo | null;
  history: MatchRow[];
  stats: PlayerStats[];
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [playersOpen, setPlayersOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [statsOpen, setStatsOpen] = useState(false);

  const realMembers = members.filter((m) => !m.is_guest);
  const guests = members.filter((m) => m.is_guest);
  const topStats = stats.slice(0, 5);
  const shownStats = statsOpen ? stats : topStats;

  return (
    <main className="page mock-group">
      <section className="section mock-group-header">
        <div className="mock-group-heading">
          <p className="meta" style={{ margin: 0 }}>
            Tu grupo
          </p>
          <h1 className="mock-group-title">{groupName}</h1>
        </div>
        <div className="mock-group-actions">
          <button
            type="button"
            className="btn btn-small btn-secondary"
            onClick={() => {
              setInviteOpen((v) => !v);
              setEditOpen(false);
            }}
          >
            <Share2 size={14} aria-hidden />
            Invitar
          </button>
          {isAdmin ? (
            <button
              type="button"
              className="btn btn-small btn-secondary"
              onClick={() => {
                setEditOpen((v) => !v);
                setInviteOpen(false);
              }}
            >
              {editOpen ? (
                <X size={14} aria-hidden />
              ) : (
                <Pencil size={14} aria-hidden />
              )}
              Editar
            </button>
          ) : null}
        </div>
      </section>

      {editOpen && isAdmin ? (
        <section className="section panel form-grid mock-invite">
          <div className="reschedule-panel-head">
            <strong>Editar grupo</strong>
          </div>
          <form action={updateGroup} className="form-grid">
            <input type="hidden" name="group_id" value={groupId} />
            <Field>
              <Label htmlFor="group_name">Nombre</Label>
              <Input
                id="group_name"
                name="name"
                required
                maxLength={80}
                defaultValue={groupName}
              />
            </Field>
            <div className="form-actions">
              <Button type="submit" size="sm">
                Guardar
              </Button>
              <button
                type="button"
                className="btn btn-small btn-secondary"
                onClick={() => setEditOpen(false)}
              >
                Cancelar
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {inviteOpen ? (
        <section className="section panel invite-box mock-invite">
          <span className="meta">Código</span>
          <span className="invite-code">{inviteCode}</span>
          <Link className="btn btn-secondary btn-small" href={invitePath}>
            Abrir invitación
          </Link>
          <CopyInviteLink url={inviteUrl} />
        </section>
      ) : null}

      <section className="section">
        {nextMatch ? (
          <article className="panel mock-next-match">
            <div className="mock-next-match-top">
              <span className="pill pill-warn">Próximo</span>
              <span className="meta">
                {nextMatch.confirmed} confirmados · {nextMatch.pending}{" "}
                pendientes
              </span>
            </div>
            <h2 className="mock-next-when">
              {formatMatchWhen(nextMatch.match)}
            </h2>
            <p className="mock-next-where">
              <MapPin size={16} aria-hidden />
              {nextMatch.match.location}
            </p>
            <div className="form-actions" style={{ marginTop: "0.85rem" }}>
              <Link
                className="btn btn-primary"
                href={`/grupos/${groupId}/partidos/${nextMatch.match.id}`}
              >
                Abrir partido
              </Link>
              {nextMatch.myAttendance &&
              nextMatch.myAttendance !== "confirmed" ? (
                <form action={setAttendance}>
                  <input type="hidden" name="group_id" value={groupId} />
                  <input
                    type="hidden"
                    name="match_id"
                    value={nextMatch.match.id}
                  />
                  <input type="hidden" name="attendance" value="confirmed" />
                  <button type="submit" className="btn btn-secondary">
                    Confirmar asistencia
                  </button>
                </form>
              ) : nextMatch.myAttendance === "confirmed" ? (
                <span className="pill pill-ok">Ya confirmaste</span>
              ) : null}
            </div>
          </article>
        ) : (
          <article className="panel mock-next-match">
            <span className="pill pill-warn">Sin próximo partido</span>
            <h2 className="mock-next-when" style={{ marginTop: "0.55rem" }}>
              Armá el siguiente
            </h2>
            <p className="meta" style={{ margin: "0.35rem 0 0" }}>
              Cuando haya uno programado, aparece acá con confirmados y acceso
              rápido.
            </p>
            <div className="form-actions" style={{ marginTop: "0.85rem" }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setCreateOpen(true)}
              >
                <CalendarPlus size={16} aria-hidden />
                Crear partido
              </button>
            </div>
          </article>
        )}
      </section>

      <section className="section">
        {!createOpen ? (
          <button
            type="button"
            className="btn btn-secondary mock-create-trigger"
            onClick={() => setCreateOpen(true)}
          >
            <CalendarPlus size={16} aria-hidden />
            Crear partido
          </button>
        ) : (
          <div className="panel form-grid">
            <div className="reschedule-panel-head">
              <strong>Nuevo partido</strong>
              <button
                type="button"
                className="btn btn-small btn-secondary"
                onClick={() => setCreateOpen(false)}
              >
                Cerrar
              </button>
            </div>
            <form action={createMatch} className="form-grid">
              <input type="hidden" name="group_id" value={groupId} />
              <Field>
                <Label htmlFor="played_on">Fecha</Label>
                <DatePicker id="played_on" name="played_on" required />
              </Field>
              <Field>
                <Label htmlFor="kickoff_time">Hora</Label>
                <TimePicker
                  id="kickoff_time"
                  name="kickoff_time"
                  required
                  defaultValue="20:00"
                />
              </Field>
              <Field>
                <Label htmlFor="location">Ubicación</Label>
                <Input
                  id="location"
                  name="location"
                  required
                  maxLength={120}
                  placeholder="Cancha 3, Club Norte"
                  defaultValue="Cancha 3"
                />
              </Field>
              <div className="form-actions">
                <Button type="submit">Crear partido</Button>
              </div>
            </form>
          </div>
        )}
      </section>

      <section className="section">
        <button
          type="button"
          className="mock-section-toggle"
          onClick={() => setHistoryOpen((v) => !v)}
        >
          <h2>Historial reciente</h2>
          {historyOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </button>
        {historyOpen ? (
          history.length === 0 ? (
            <p className="empty">Todavía no hay partidos anteriores.</p>
          ) : (
            <div className="stack">
              {history.map((m) => (
                <Link
                  key={m.id}
                  href={`/grupos/${groupId}/partidos/${m.id}`}
                  className="panel group-link"
                >
                  <div>
                    <strong>{formatMatchWhen(m)}</strong>
                    <div className="meta">{m.location}</div>
                  </div>
                  <div className="meta" style={{ textAlign: "right" }}>
                    <StatusPill status={m.status} />
                    {m.status === "jugado" ? (
                      <div>
                        {m.goals_a} — {m.goals_b}
                      </div>
                    ) : null}
                  </div>
                </Link>
              ))}
            </div>
          )
        ) : null}
      </section>

      <section className="section">
        <div className="mock-section-toggle" style={{ cursor: "default" }}>
          <h2>Ranking</h2>
          <span className="meta">{statsOpen ? "Completo" : "Top 5"}</span>
        </div>
        {stats.length === 0 ? (
          <p className="empty">Todavía no hay partidos jugados.</p>
        ) : (
          <>
            <div className="panel" style={{ overflowX: "auto" }}>
              <table className="stats-table">
                <thead>
                  <tr>
                    <th>Jugador</th>
                    <th>G-E-P</th>
                    <th>Forma</th>
                    <th>MOTM</th>
                  </tr>
                </thead>
                <tbody>
                  {shownStats.map((s) => (
                    <tr key={s.user_id}>
                      <td>
                        {s.name}
                        {s.is_guest ? (
                          <span
                            className="pill"
                            style={{ marginLeft: "0.4rem" }}
                          >
                            invitado
                          </span>
                        ) : null}
                      </td>
                      <td>
                        {s.wins}-{s.draws}-{s.losses}
                      </td>
                      <td>
                        <span
                          className="form-pills"
                          aria-label={`Forma ${s.form || "sin datos"}`}
                        >
                          {(s.form || "—").split("").map((ch, i) => (
                            <span
                              key={`${s.user_id}-form-${i}`}
                              className={
                                ch === "W"
                                  ? "form-pill form-w"
                                  : ch === "D"
                                    ? "form-pill form-d"
                                    : ch === "L"
                                      ? "form-pill form-l"
                                      : "form-pill"
                              }
                            >
                              {ch}
                            </span>
                          ))}
                        </span>
                      </td>
                      <td>{s.motm}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {stats.length > 5 ? (
              <p className="meta" style={{ marginTop: "0.55rem" }}>
                <button
                  type="button"
                  className="mock-linkish"
                  onClick={() => setStatsOpen((v) => !v)}
                >
                  {statsOpen ? "Ver solo top 5" : "Ver tabla completa"}
                </button>
              </p>
            ) : null}
          </>
        )}
      </section>

      <section className="section">
        <button
          type="button"
          className="mock-section-toggle"
          onClick={() => setPlayersOpen((v) => !v)}
        >
          <h2>
            <Users size={18} aria-hidden style={{ marginRight: "0.35rem" }} />
            Jugadores
          </h2>
          {playersOpen ? (
            <ChevronDown size={18} />
          ) : (
            <ChevronRight size={18} />
          )}
        </button>
        {playersOpen ? (
          <div className="stack">
            <div className="panel stack">
              {realMembers.map((m) => (
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
                    {m.user_id === currentUserId ? " (vos)" : ""}
                  </span>
                  <span className="pill">{m.role}</span>
                </div>
              ))}
              {realMembers.length === 0 ? (
                <p className="empty">Sin miembros con cuenta.</p>
              ) : null}
            </div>

            <div className="panel stack">
              <h3 style={{ margin: 0 }}>Invitados</h3>
              {guests.length === 0 ? (
                <p className="empty">Todavía no hay invitados.</p>
              ) : (
                guests.map((m) => (
                  <div key={m.user_id} className="player-row">
                    <span className="player-identity">
                      <span className="avatar-xs avatar-placeholder">
                        {playerLabel(m).slice(0, 1).toUpperCase()}
                      </span>
                      {playerLabel(m)}
                      <span className="pill">invitado</span>
                    </span>
                    <form action={removeGuestFromGroup}>
                      <input type="hidden" name="group_id" value={groupId} />
                      <input type="hidden" name="guest_id" value={m.user_id} />
                      <Button type="submit" variant="secondary" size="sm">
                        Quitar
                      </Button>
                    </form>
                  </div>
                ))
              )}
              <form action={addGuestToGroup} className="form-grid">
                <input type="hidden" name="group_id" value={groupId} />
                <Field>
                  <Label htmlFor="guest_nickname">Apodo del invitado</Label>
                  <Input
                    id="guest_nickname"
                    name="nickname"
                    required
                    maxLength={40}
                    placeholder="Ej. El Flaco"
                  />
                </Field>
                <div className="form-actions">
                  <Button type="submit" variant="secondary" size="sm">
                    Agregar invitado
                  </Button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <p className="meta" style={{ margin: 0 }}>
            {realMembers.length} con cuenta · {guests.length}{" "}
            {guests.length === 1 ? "invitado" : "invitados"}
          </p>
        )}
      </section>

      {isAdmin ? (
        <section className="section mock-danger">
          <p className="meta">Zona de peligro · solo admin</p>
          <DeleteGroupButton groupId={groupId} groupName={groupName} />
        </section>
      ) : null}
    </main>
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

function formatMatchWhen(match: MatchRow) {
  const d = new Date(`${match.played_on}T12:00:00`);
  if (Number.isNaN(d.getTime())) {
    return `${match.played_on} · ${match.kickoff_time}`;
  }
  const day = d.toLocaleDateString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  return `${day} · ${match.kickoff_time}`;
}
