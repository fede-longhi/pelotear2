import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createGroup } from "@/lib/actions";
import { requireVerifiedUser } from "@/lib/auth";
import { listGroupsForUser } from "@/lib/queries";

export default async function GruposPage() {
  const user = await requireVerifiedUser();
  const groups = await listGroupsForUser(user.id);

  return (
    <>
      <SiteHeader user={user} />
      <main className="page">
        <section className="section" id="nuevo">
          <h2>Crear grupo</h2>
          <p className="lead">Un espacio para tu equipo de siempre.</p>
          <form action={createGroup} className="panel form-grid">
            <div className="field">
              <Label htmlFor="name">Nombre del grupo</Label>
              <Input
                id="name"
                name="name"
                required
                maxLength={60}
                placeholder="Los del jueves"
              />
            </div>
            <div className="form-actions">
              <Button type="submit">Crear</Button>
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
                <Link
                  key={g.id}
                  href={`/grupos/${g.id}`}
                  className="panel group-link"
                >
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
