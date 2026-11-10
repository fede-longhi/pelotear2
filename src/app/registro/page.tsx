import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { getOptionalUser } from "@/lib/auth";
import { signupAction } from "@/lib/auth-actions";

export default async function RegistroPage({
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
          <h2>Crear cuenta</h2>
          <p className="lead">
            Registro interno de Pelotear — sin Google ni proveedores externos.
          </p>
          {sp.error ? <p className="flash-error">{sp.error}</p> : null}
          <form action={signupAction} className="panel form-grid">
            <div className="two-col">
              <label>
                Nombre
                <input name="first_name" required maxLength={60} />
              </label>
              <label>
                Apellido
                <input name="last_name" required maxLength={60} />
              </label>
            </div>
            <label>
              Apodo
              <input
                name="nickname"
                maxLength={40}
                placeholder="Cómo te dicen en la cancha"
              />
            </label>
            <label>
              Email
              <input type="email" name="email" required autoComplete="email" />
            </label>
            <label>
              Contraseña
              <input
                type="password"
                name="password"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </label>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                Registrarme
              </button>
              <Link className="btn btn-secondary" href="/ingresar">
                Ya tengo cuenta
              </Link>
            </div>
          </form>
        </section>
      </main>
    </>
  );
}
