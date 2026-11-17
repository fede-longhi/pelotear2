import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getOptionalUser } from "@/lib/auth";
import {
  getDevResetUrl,
  requestPasswordResetAction,
} from "@/lib/auth-actions";

export default async function RecuperarPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; enviado?: string }>;
}) {
  const sp = await searchParams;
  const user = await getOptionalUser();
  const devUrl = sp.enviado ? await getDevResetUrl() : null;

  return (
    <>
      <SiteHeader user={user} />
      <main className="page">
        <section className="section">
          <h2>Restablecer contraseña</h2>
          <p className="lead">
            Te mandamos un link al email de la cuenta (también sirve si entrás
            solo con Google y querés agregar contraseña).
          </p>
          {sp.error ? <p className="flash-error">{sp.error}</p> : null}
          {sp.enviado ? (
            <p className="pill pill-ok">
              Si existe una cuenta con ese email, vas a recibir el link.
            </p>
          ) : null}
          {devUrl ? (
            <p className="flash-info">
              Modo local sin Resend:{" "}
              <a href={devUrl}>abrir link de restablecer</a>
            </p>
          ) : null}
          <form action={requestPasswordResetAction} className="panel form-grid">
            <div className="field">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                name="email"
                required
                autoComplete="email"
              />
            </div>
            <div className="form-actions">
              <Button type="submit">Enviar link</Button>
              <Button asChild variant="secondary">
                <Link href="/ingresar">Volver a ingresar</Link>
              </Button>
            </div>
          </form>
        </section>
      </main>
    </>
  );
}
