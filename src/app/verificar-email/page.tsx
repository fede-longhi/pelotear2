import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { getOptionalUser } from "@/lib/auth";
import {
  getDevVerifyUrl,
  resendVerificationAction,
} from "@/lib/auth-actions";
import { emailConfigured } from "@/lib/email";
import { AFTER_AUTH_COOKIE, safeNextPath } from "@/lib/redirects";

export default async function VerificarEmailPage({
  searchParams,
}: {
  searchParams: Promise<{
    nuevo?: string;
    reenviado?: string;
    error?: string;
    next?: string;
  }>;
}) {
  const sp = await searchParams;
  const nextFromQuery = safeNextPath(sp.next);
  const jar = await cookies();
  const next =
    nextFromQuery || safeNextPath(jar.get(AFTER_AUTH_COOKIE)?.value);

  const user = await getOptionalUser();
  if (!user) {
    redirect(
      next ? `/ingresar?next=${encodeURIComponent(next)}` : "/ingresar",
    );
  }
  if (user.email_verified) {
    redirect(next || "/grupos");
  }

  const devUrl = await getDevVerifyUrl();
  const hasResend = emailConfigured();

  return (
    <>
      <SiteHeader user={user} />
      <main className="page">
        <section className="section">
          <h2>Confirmá tu email</h2>
          <p className="lead">
            Te enviamos un link a <strong>{user.email}</strong>. Hasta
            confirmarlo no podés crear ni unirte a grupos.
          </p>
          {next ? (
            <p className="pill pill-ok">
              Después de confirmar volvés a la invitación.
            </p>
          ) : null}
          {sp.error ? <p className="flash-error">{sp.error}</p> : null}
          {sp.nuevo ? (
            <p className="pill pill-ok">Cuenta creada — revisá tu bandeja.</p>
          ) : null}
          {sp.reenviado ? (
            <p className="pill pill-ok">Email reenviado.</p>
          ) : null}

          <div className="panel form-grid">
            <p className="meta" style={{ margin: 0 }}>
              {hasResend
                ? "Si no llega, mirá spam o reenviá el correo."
                : "Falta configurar RESEND_API_KEY en Vercel — en este entorno el link de verificación se muestra abajo."}
            </p>
            {devUrl ? (
              <p className="flash-info">
                Link de verificación (dev / sin Resend):{" "}
                <Link href={devUrl}>{devUrl}</Link>
              </p>
            ) : null}
            <div className="form-actions">
              <form action={resendVerificationAction}>
                <Button type="submit">Reenviar email</Button>
              </form>
              <Button asChild variant="secondary">
                <Link href="/perfil">Ir al perfil</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
