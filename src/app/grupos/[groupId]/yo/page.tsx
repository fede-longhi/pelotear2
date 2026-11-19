import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { requireVerifiedUser } from "@/lib/auth";
import { getGroup, getMembership } from "@/lib/queries";
import { personalStatsForGroup } from "@/lib/stats";
import type { ChemistryRow } from "@/lib/types";

function pct(rate: number) {
  return `${Math.round(rate * 100)}%`;
}

function FormPills({ form }: { form: string }) {
  if (!form) return <span className="meta">—</span>;
  return (
    <span className="form-pills" aria-label={`Forma ${form}`}>
      {form.split("").map((ch, i) => (
        <span
          key={`form-${i}`}
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
  );
}

function ChemistryTable({
  rows,
  empty,
}: {
  rows: ChemistryRow[];
  empty: string;
}) {
  if (rows.length === 0) {
    return <p className="empty">{empty}</p>;
  }
  return (
    <div className="panel" style={{ overflowX: "auto" }}>
      <table className="stats-table">
        <thead>
          <tr>
            <th>Jugador</th>
            <th>Juntos</th>
            <th>G-E-P</th>
            <th>% ganados</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.user_id}>
              <td>
                {r.name}
                {r.is_guest ? (
                  <span className="pill" style={{ marginLeft: "0.4rem" }}>
                    invitado
                  </span>
                ) : null}
              </td>
              <td>{r.played}</td>
              <td>
                {r.wins}-{r.draws}-{r.losses}
              </td>
              <td>{pct(r.win_rate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function MyStatsPage({
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

  const stats = await personalStatsForGroup(groupId, user.id);
  if (!stats) notFound();

  return (
    <>
      <SiteHeader user={user} />
      <main className="page mock-group">
        <p className="meta" style={{ margin: "0 0 0.75rem" }}>
          <Link href={`/grupos/${groupId}`} className="mock-linkish">
            <ChevronLeft size={14} aria-hidden style={{ verticalAlign: "-2px" }} />{" "}
            {group.name}
          </Link>
        </p>

        <section className="section">
          <p className="meta" style={{ margin: 0 }}>
            Mis estadísticas
          </p>
          <h1 className="mock-group-title" style={{ marginTop: "0.15rem" }}>
            {stats.name}
          </h1>
        </section>

        <section className="section">
          <h2>Resumen</h2>
          {stats.played === 0 ? (
            <p className="empty">Todavía no jugaste partidos en este grupo.</p>
          ) : (
            <div className="panel personal-summary">
              <div className="personal-stat">
                <span className="personal-stat-value">{stats.played}</span>
                <span className="meta">Jugados</span>
              </div>
              <div className="personal-stat">
                <span className="personal-stat-value">
                  {stats.wins}-{stats.draws}-{stats.losses}
                </span>
                <span className="meta">G-E-P</span>
              </div>
              <div className="personal-stat">
                <span className="personal-stat-value">{pct(stats.win_rate)}</span>
                <span className="meta">% ganados</span>
              </div>
              <div className="personal-stat">
                <span className="personal-stat-value">{stats.streak}</span>
                <span className="meta">Racha</span>
              </div>
              <div className="personal-stat">
                <span className="personal-stat-value">{stats.motm}</span>
                <span className="meta">MOTM</span>
              </div>
              <div className="personal-stat personal-stat-form">
                <FormPills form={stats.form} />
                <span className="meta">Forma</span>
              </div>
            </div>
          )}
        </section>

        <section className="section">
          <h2>Mejor pareja</h2>
          <p className="meta" style={{ marginTop: "-0.35rem" }}>
            Con quién más ganás cuando van juntos
          </p>
          <ChemistryTable
            rows={stats.best_teammates}
            empty="Todavía no compartiste equipo con nadie."
          />
        </section>

        <section className="section">
          <h2>Peor pareja</h2>
          <p className="meta" style={{ marginTop: "-0.35rem" }}>
            Con quién menos ganás de compañero
          </p>
          <ChemistryTable
            rows={stats.worst_teammates}
            empty="Todavía no compartiste equipo con nadie."
          />
        </section>

        <section className="section">
          <h2>Rivales difíciles</h2>
          <p className="meta" style={{ marginTop: "-0.35rem" }}>
            Contra quién menos ganás
          </p>
          <ChemistryTable
            rows={stats.toughest_rivals}
            empty="Todavía no enfrentaste a nadie."
          />
        </section>

        <section className="section">
          <h2>Rivales favoritos</h2>
          <p className="meta" style={{ marginTop: "-0.35rem" }}>
            Contra quién más ganás
          </p>
          <ChemistryTable
            rows={stats.favorite_rivals}
            empty="Todavía no enfrentaste a nadie."
          />
        </section>
      </main>
    </>
  );
}
