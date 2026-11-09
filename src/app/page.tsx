import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { requireUser } from "@/lib/auth";
import { listGroupsForUser } from "@/lib/queries";

export default async function HomePage() {
  const user = await requireUser();
  const groups = await listGroupsForUser(user.id);

  return (
    <>
      <SiteHeader user={user} />
      <main className="page">
        <section className="hero">
          <div className="hero-brand">Pelotear</div>
          <h1>Armá el partido. Cargá el resultado. Seguís las stats.</h1>
          <p>
            Grupos de amigos, equipos balanceados y un historial claro de
            victorias, empates y derrotas.
          </p>
          <div className="cta-row">
            <Link className="btn btn-primary" href="/grupos#nuevo">
              Crear grupo
            </Link>
            <Link className="btn btn-secondary" href="/unirse">
              Unirme con código
            </Link>
          </div>
        </section>

        {groups.length > 0 && (
          <section className="section">
            <h2>Tus grupos</h2>
            <p className="lead">Seguí donde dejaste el último partido.</p>
            <div className="stack">
              {groups.slice(0, 3).map((g) => (
                <Link key={g.id} href={`/grupos/${g.id}`} className="panel group-link">
                  <strong>{g.name}</strong>
                  <span className="meta">
                    {g.member_count} miembros · {g.role}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
