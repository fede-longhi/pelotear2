import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { getOptionalUser } from "@/lib/auth";
import { loginAction } from "@/lib/auth-actions";

export default async function IngresarPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getOptionalUser();
  if (user && !user.simulated) redirect("/grupos");
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
            <label>
              Email
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                placeholder="vos@email.com"
              />
            </label>
            <label>
              Contraseña
              <input
                type="password"
                name="password"
                required
                minLength={6}
                autoComplete="current-password"
              />
            </label>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                Entrar
              </button>
              <Link className="btn btn-secondary" href="/registro">
                Crear cuenta
              </Link>
            </div>
          </form>
        </section>
      </main>
    </>
  );
}
