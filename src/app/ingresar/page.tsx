import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getOptionalUser } from "@/lib/auth";
import { loginAction } from "@/lib/auth-actions";
import { safeNextPath, withNext } from "@/lib/redirects";

export default async function IngresarPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const sp = await searchParams;
  const next = safeNextPath(sp.next);
  const user = await getOptionalUser();
  if (user && !user.simulated) {
    redirect(
      user.email_verified
        ? next || "/grupos"
        : withNext("/verificar-email", next),
    );
  }

  return (
    <>
      <SiteHeader user={user} />
      <main className="page">
        <section className="section">
          <h2>Ingresar</h2>
          <p className="lead">Entrá con tu email y contraseña.</p>
          {next ? (
            <p className="pill pill-ok">
              Después volvés a la invitación del grupo.
            </p>
          ) : null}
          {sp.error ? <p className="flash-error">{sp.error}</p> : null}
          <form action={loginAction} className="panel form-grid">
            {next ? <input type="hidden" name="next" value={next} /> : null}
            <div className="field">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                name="email"
                required
                autoComplete="email"
                placeholder="vos@email.com"
              />
            </div>
            <div className="field">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                name="password"
                required
                minLength={6}
                autoComplete="current-password"
              />
            </div>
            <div className="form-actions">
              <Button type="submit">Entrar</Button>
              <Button asChild variant="secondary">
                <Link href={withNext("/registro", next)}>Crear cuenta</Link>
              </Button>
            </div>
          </form>
        </section>
      </main>
    </>
  );
}
