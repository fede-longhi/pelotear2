import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { joinGroupByCode } from "@/lib/actions";
import { requireVerifiedUser } from "@/lib/auth";

export default async function UnirsePage() {
  const user = await requireVerifiedUser();

  return (
    <>
      <SiteHeader user={user} />
      <main className="page">
        <section className="section">
          <h2>Unirme a un grupo</h2>
          <p className="lead">Pegá el código de invitación que te pasaron.</p>
          <form action={joinGroupByCode} className="panel form-grid">
            <div className="field">
              <Label htmlFor="code">Código</Label>
              <Input
                id="code"
                name="code"
                required
                minLength={6}
                maxLength={12}
                placeholder="AB12CD34"
                className="uppercase tracking-[0.12em]"
              />
            </div>
            <div className="form-actions">
              <Button type="submit">Unirme</Button>
            </div>
          </form>
        </section>
      </main>
    </>
  );
}
