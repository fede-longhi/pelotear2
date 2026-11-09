import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { createGroup } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { listGroupsForUser } from "@/lib/queries";

export default async function GruposPage() {
  const user = await requireUser();
  const groups = await listGroupsForUser(user.id);

  return (
    <>
      <SiteHeader user={user} />
      <main className="page">
        <section className="section" id="nuevo">
          <h2>Crear grupo</h2>
          <p className="lead">Un espacio para tu equipo de siempre.</p>
          <form action={createGroup} className="panel form-grid">
            <label>
              Nombre del grupo
              <input
                name="name"
                required
                maxLength={60}
                placeholder="Los del jueves"
              />
            </label>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                Crear
              </button>
            </div>
          </form>
        </section>

        <section className="section">
          <h2>Mis grupos</h2>
          {groups.length === 0 ? (
            <p className="empty">Todavía no estás en ningún grupo.</p>
          ) : (
            <div className="stack">
              {groups.map((g) => (
                <Link key={g.id} href={`/grupos/${g.id}`} className="panel group-link">
                  <div>
                    <strong>{g.name}</strong>
                    <div className="meta">Código {g.invite_code}</div>
                  </div>
                  <span className="meta">
                    {g.member_count} · {g.role}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
