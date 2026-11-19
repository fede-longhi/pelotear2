import Link from "next/link";
import { ChevronLeft } from "lucide-react";

type ChemistryRow = {
  name: string;
  played: number;
  record: string;
  winRate: string;
  guest?: boolean;
};

const SUMMARY = {
  name: "Fede",
  played: 11,
  record: "8-2-1",
  winRate: "73%",
  streak: 2,
  motm: 3,
  form: "WWDLW",
};

const BEST_TEAMMATES: ChemistryRow[] = [
  { name: "Juan", played: 7, record: "6-1-0", winRate: "86%" },
  { name: "Lucía", played: 4, record: "3-1-0", winRate: "75%" },
  { name: "El Flaco", played: 3, record: "2-0-1", winRate: "67%", guest: true },
  { name: "María", played: 5, record: "3-1-1", winRate: "60%" },
  { name: "Tomi", played: 2, record: "1-0-1", winRate: "50%" },
];

const WORST_TEAMMATES: ChemistryRow[] = [
  { name: "Nico", played: 3, record: "0-1-2", winRate: "0%" },
  { name: "Pablo", played: 4, record: "1-1-2", winRate: "25%" },
  { name: "Tomi", played: 2, record: "1-0-1", winRate: "50%" },
  { name: "María", played: 5, record: "3-1-1", winRate: "60%" },
  { name: "El Flaco", played: 3, record: "2-0-1", winRate: "67%", guest: true },
];

const TOUGHEST_RIVALS: ChemistryRow[] = [
  { name: "Santi", played: 6, record: "1-1-4", winRate: "17%" },
  { name: "Diego", played: 4, record: "1-0-3", winRate: "25%" },
  { name: "María", played: 3, record: "1-1-1", winRate: "33%" },
  { name: "Nico", played: 2, record: "1-0-1", winRate: "50%" },
  { name: "Pablo", played: 5, record: "3-0-2", winRate: "60%" },
];

const FAVORITE_RIVALS: ChemistryRow[] = [
  { name: "Rulo", played: 3, record: "3-0-0", winRate: "100%", guest: true },
  { name: "Gabo", played: 4, record: "3-1-0", winRate: "75%" },
  { name: "Pablo", played: 5, record: "3-0-2", winRate: "60%" },
  { name: "Nico", played: 2, record: "1-0-1", winRate: "50%" },
  { name: "María", played: 3, record: "1-1-1", winRate: "33%" },
];

function FormPills({ form }: { form: string }) {
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
                : "form-pill form-l"
          }
        >
          {ch}
        </span>
      ))}
    </span>
  );
}

function ChemistryTable({ rows }: { rows: ChemistryRow[] }) {
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
            <tr key={r.name}>
              <td>
                {r.name}
                {r.guest ? (
                  <span className="pill" style={{ marginLeft: "0.4rem" }}>
                    invitado
                  </span>
                ) : null}
              </td>
              <td>{r.played}</td>
              <td>{r.record}</td>
              <td>{r.winRate}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function MyStatsMockPage() {
  return (
    <>
      <header className="site-header">
        <Link href="/" className="brand-mark">
          Pelotear
        </Link>
        <nav className="site-nav">
          <Link href="/mock/grupo">Mock grupo</Link>
          <span className="meta">Mock UI</span>
        </nav>
      </header>

      <main className="page mock-group">
        <p className="mock-banner">
          Mock de estadísticas personales — no guarda datos.{" "}
          <Link href="/mock/grupo">Volver al mock de grupo</Link>
        </p>

        <p className="meta" style={{ margin: "0 0 0.75rem" }}>
          <Link href="/mock/grupo" className="mock-linkish">
            <ChevronLeft size={14} aria-hidden style={{ verticalAlign: "-2px" }} />{" "}
            Los del jueves
          </Link>
        </p>

        <section className="section">
          <p className="meta" style={{ margin: 0 }}>
            Mis estadísticas
          </p>
          <h1 className="mock-group-title" style={{ marginTop: "0.15rem" }}>
            {SUMMARY.name}
          </h1>
        </section>

        <section className="section">
          <h2>Resumen</h2>
          <div className="panel personal-summary">
            <div className="personal-stat">
              <span className="personal-stat-value">{SUMMARY.played}</span>
              <span className="meta">Jugados</span>
            </div>
            <div className="personal-stat">
              <span className="personal-stat-value">{SUMMARY.record}</span>
              <span className="meta">G-E-P</span>
            </div>
            <div className="personal-stat">
              <span className="personal-stat-value">{SUMMARY.winRate}</span>
              <span className="meta">% ganados</span>
            </div>
            <div className="personal-stat">
              <span className="personal-stat-value">{SUMMARY.streak}</span>
              <span className="meta">Racha</span>
            </div>
            <div className="personal-stat">
              <span className="personal-stat-value">{SUMMARY.motm}</span>
              <span className="meta">MOTM</span>
            </div>
            <div className="personal-stat personal-stat-form">
              <FormPills form={SUMMARY.form} />
              <span className="meta">Forma</span>
            </div>
          </div>
        </section>

        <section className="section">
          <h2>Mejor pareja</h2>
          <p className="meta" style={{ marginTop: "-0.35rem" }}>
            Con quién más ganás cuando van juntos
          </p>
          <ChemistryTable rows={BEST_TEAMMATES} />
        </section>

        <section className="section">
          <h2>Peor pareja</h2>
          <p className="meta" style={{ marginTop: "-0.35rem" }}>
            Con quién menos ganás de compañero
          </p>
          <ChemistryTable rows={WORST_TEAMMATES} />
        </section>

        <section className="section">
          <h2>Rivales difíciles</h2>
          <p className="meta" style={{ marginTop: "-0.35rem" }}>
            Contra quién menos ganás
          </p>
          <ChemistryTable rows={TOUGHEST_RIVALS} />
        </section>

        <section className="section">
          <h2>Rivales favoritos</h2>
          <p className="meta" style={{ marginTop: "-0.35rem" }}>
            Contra quién más ganás
          </p>
          <ChemistryTable rows={FAVORITE_RIVALS} />
        </section>
      </main>
    </>
  );
}
