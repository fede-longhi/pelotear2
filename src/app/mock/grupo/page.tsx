"use client";

import Link from "next/link";
import { useState } from "react";
import {
  CalendarPlus,
  ChevronDown,
  ChevronRight,
  Copy,
  MapPin,
  Pencil,
  Share2,
  Users,
  X,
} from "lucide-react";

const NEXT_MATCH = {
  when: "Vie 21 nov · 20:00",
  where: "Cancha 3, Club Norte",
  confirmed: 9,
  pending: 3,
  status: "programado" as const,
};

const HISTORY = [
  { id: "1", when: "Vie 14 nov · 20:00", where: "Cancha 3", score: "6 — 4", status: "jugado" },
  { id: "2", when: "Vie 7 nov · 21:00", where: "Cancha 1", score: "3 — 3", status: "jugado" },
  { id: "3", when: "Vie 31 oct · 20:00", where: "Cancha 3", score: null, status: "cancelado" },
];

const RANKING = [
  { name: "Fede", record: "8-2-1", form: "WWDLW", streak: "2G", motm: 3 },
  { name: "Juan", record: "7-3-1", form: "WLWWW", streak: "3G", motm: 2 },
  { name: "María", record: "6-2-3", form: "DWWLW", streak: "—", motm: 1 },
  { name: "Lucía", record: "5-4-2", form: "LWWDL", streak: "—", motm: 1 },
  { name: "El Flaco", record: "4-3-2", form: "WWLDL", streak: "—", motm: 0, guest: true },
];

export default function GroupPageMock() {
  const [createOpen, setCreateOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [peopleOpen, setPeopleOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [editGroupOpen, setEditGroupOpen] = useState(false);
  const [groupName, setGroupName] = useState("Los del jueves");

  return (
    <>
      <header className="site-header">
        <Link href="/" className="brand-mark">
          Pelotear
        </Link>
        <nav className="site-nav">
          <Link href="/grupos">Mis grupos</Link>
          <span className="meta">Mock UI</span>
        </nav>
      </header>

      <main className="page mock-group">
        <p className="mock-banner">
          Mock de rediseño — no guarda datos.{" "}
          <Link href="/grupos">Volver a la app</Link>
        </p>

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
                setEditGroupOpen(false);
              }}
            >
              <Share2 size={14} aria-hidden />
              Invitar
            </button>
            <button
              type="button"
              className="btn btn-small btn-secondary"
              onClick={() => {
                setEditGroupOpen((v) => !v);
                setInviteOpen(false);
              }}
            >
              {editGroupOpen ? (
                <X size={14} aria-hidden />
              ) : (
                <Pencil size={14} aria-hidden />
              )}
              Editar
            </button>
          </div>
        </section>

        {editGroupOpen ? (
          <section className="section panel form-grid mock-invite">
            <div className="reschedule-panel-head">
              <strong>Editar grupo</strong>
            </div>
            <div className="field">
              <label className="meta" htmlFor="mock_group_name">
                Nombre
              </label>
              <input
                id="mock_group_name"
                className="mock-input"
                value={groupName}
                maxLength={60}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>
            <div className="form-actions">
              <button
                type="button"
                className="btn btn-primary btn-small"
                onClick={() => setEditGroupOpen(false)}
              >
                Guardar
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-small"
                onClick={() => setEditGroupOpen(false)}
              >
                Cancelar
              </button>
            </div>
          </section>
        ) : null}

        {inviteOpen ? (
          <section className="section panel invite-box mock-invite">
            <span className="meta">Código</span>
            <span className="invite-code">ABCD2345</span>
            <button type="button" className="btn btn-secondary btn-small">
              <Copy size={14} aria-hidden />
              Copiar link
            </button>
          </section>
        ) : null}

        <section className="section">
          <article className="panel mock-next-match">
            <div className="mock-next-match-top">
              <span className="pill pill-warn">Próximo</span>
              <span className="meta">
                {NEXT_MATCH.confirmed} confirmados · {NEXT_MATCH.pending}{" "}
                pendientes
              </span>
            </div>
            <h2 className="mock-next-when">{NEXT_MATCH.when}</h2>
            <p className="mock-next-where">
              <MapPin size={16} aria-hidden />
              {NEXT_MATCH.where}
            </p>
            <div className="form-actions" style={{ marginTop: "0.85rem" }}>
              <button type="button" className="btn btn-primary">
                Abrir partido
              </button>
              <button type="button" className="btn btn-secondary">
                Confirmar asistencia
              </button>
            </div>
          </article>
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
              <div className="field">
                <label className="meta" htmlFor="mock_date">
                  Fecha
                </label>
                <input id="mock_date" className="mock-input" defaultValue="2026-11-28" />
              </div>
              <div className="field">
                <label className="meta" htmlFor="mock_time">
                  Hora
                </label>
                <input id="mock_time" className="mock-input" defaultValue="20:00" />
              </div>
              <div className="field">
                <label className="meta" htmlFor="mock_loc">
                  Ubicación
                </label>
                <input
                  id="mock_loc"
                  className="mock-input"
                  defaultValue="Cancha 3, Club Norte"
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-primary">
                  Crear (mock)
                </button>
              </div>
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
            <div className="stack">
              {HISTORY.map((m) => (
                <div key={m.id} className="panel group-link mock-history-row">
                  <div>
                    <strong>{m.when}</strong>
                    <div className="meta">{m.where}</div>
                  </div>
                  <div className="meta" style={{ textAlign: "right" }}>
                    <span
                      className={
                        m.status === "jugado"
                          ? "pill pill-ok"
                          : m.status === "cancelado"
                            ? "pill pill-bad"
                            : "pill pill-warn"
                      }
                    >
                      {m.status}
                    </span>
                    {m.score ? <div>{m.score}</div> : null}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </section>

        <section className="section">
          <div className="mock-section-toggle" style={{ cursor: "default" }}>
            <h2>Ranking</h2>
            <span className="meta">Top 5</span>
          </div>
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
                {RANKING.map((s) => (
                  <tr key={s.name}>
                    <td>
                      {s.name}
                      {s.guest ? (
                        <span className="pill" style={{ marginLeft: "0.4rem" }}>
                          invitado
                        </span>
                      ) : null}
                    </td>
                    <td>{s.record}</td>
                    <td>
                      <span className="form-pills">
                        {s.form.split("").map((ch, i) => (
                          <span
                            key={`${s.name}-${i}`}
                            className={
                              ch === "W"
                                ? "form-pill form-w"
                                : ch === "D"
                                  ? "form-pill form-d"
                                  : "form-pill form-l"
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
          <p className="meta" style={{ marginTop: "0.55rem" }}>
            <button type="button" className="mock-linkish">
              Ver tabla completa
            </button>
          </p>
        </section>

        <section className="section">
          <button
            type="button"
            className="mock-section-toggle"
            onClick={() => setPeopleOpen((v) => !v)}
          >
            <h2>
              <Users size={18} aria-hidden style={{ marginRight: "0.35rem" }} />
              Jugadores
            </h2>
            {peopleOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </button>
          {peopleOpen ? (
            <div className="panel stack">
              <div className="player-row">
                <span>Fede (vos)</span>
                <span className="pill">admin</span>
              </div>
              <div className="player-row">
                <span>Juan</span>
                <span className="pill">member</span>
              </div>
              <div className="player-row">
                <span>
                  El Flaco <span className="pill">invitado</span>
                </span>
                <button type="button" className="btn btn-small btn-secondary">
                  Quitar
                </button>
              </div>
              <button type="button" className="btn btn-small btn-secondary">
                Agregar invitado
              </button>
            </div>
          ) : (
            <p className="meta" style={{ margin: 0 }}>
              4 con cuenta · 1 invitado
            </p>
          )}
        </section>

        <section className="section mock-danger">
          <p className="meta">Zona de peligro · solo admin</p>
          <button type="button" className="btn btn-danger btn-small">
            Eliminar grupo
          </button>
        </section>
      </main>
    </>
  );
}
