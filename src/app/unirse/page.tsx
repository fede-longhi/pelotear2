import { SiteHeader } from "@/components/SiteHeader";
import { joinGroupByCode } from "@/lib/actions";
import { requireUser } from "@/lib/auth";

export default async function UnirsePage() {
  const user = await requireUser();

  return (
    <>
      <SiteHeader user={user} />
      <main className="page">
        <section className="section">
          <h2>Unirme a un grupo</h2>
          <p className="lead">Pegá el código de invitación que te pasaron.</p>
          <form action={joinGroupByCode} className="panel form-grid">
            <label>
              Código
              <input
                name="code"
                required
                minLength={6}
                maxLength={12}
                placeholder="AB12CD34"
                style={{ textTransform: "uppercase", letterSpacing: "0.12em" }}
              />
            </label>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                Unirme
              </button>
            </div>
          </form>
        </section>
      </main>
    </>
  );
}
