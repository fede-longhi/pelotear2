import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getOptionalUser } from "@/lib/auth";
import { resetPasswordAction } from "@/lib/auth-actions";

export default async function NuevaContrasenaPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { token } = await params;
  const sp = await searchParams;
  const user = await getOptionalUser();

  return (
    <>
      <SiteHeader user={user} />
      <main className="page">
        <section className="section">
          <h2>Nueva contraseña</h2>
          <p className="lead">Elegí una contraseña de al menos 6 caracteres.</p>
          {sp.error ? <p className="flash-error">{sp.error}</p> : null}
          <form action={resetPasswordAction} className="panel form-grid">
            <input type="hidden" name="token" value={token} />
            <div className="field">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                name="password"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <div className="field">
              <Label htmlFor="password_confirm">Repetir contraseña</Label>
              <Input
                id="password_confirm"
                type="password"
                name="password_confirm"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <div className="form-actions">
              <Button type="submit">Guardar e ingresar</Button>
              <Button asChild variant="secondary">
                <Link href="/recuperar">Pedir otro link</Link>
              </Button>
            </div>
          </form>
        </section>
      </main>
    </>
  );
}
