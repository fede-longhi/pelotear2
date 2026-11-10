import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getOptionalUser } from "@/lib/auth";
import { loginAction } from "@/lib/auth-actions";

export default async function IngresarPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getOptionalUser();
  if (user && !user.simulated) {
    redirect(user.email_verified ? "/grupos" : "/verificar-email");
  }
  const sp = await searchParams;

  return (
    <>
      <SiteHeader user={user} />
      <main className="page">
        <section className="section">
          <h2>Ingresar</h2>
          <p className="lead">Entrá con tu email y contraseña.</p>
          {sp.error ? <p className="flash-error">{sp.error}</p> : null}
          <form action={loginAction} className="panel form-grid">
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
                <Link href="/registro">Crear cuenta</Link>
              </Button>
            </div>
          </form>
        </section>
      </main>
    </>
  );
}
