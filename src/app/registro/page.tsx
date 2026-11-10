import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getOptionalUser } from "@/lib/auth";
import { signupAction } from "@/lib/auth-actions";

export default async function RegistroPage({
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
          <h2>Crear cuenta</h2>
          <p className="lead">
            Registro interno de Pelotear — sin Google ni proveedores externos.
            Después te pedimos confirmar el email.
          </p>
          {sp.error ? <p className="flash-error">{sp.error}</p> : null}
          <form action={signupAction} className="panel form-grid">
            <div className="two-col">
              <div className="field">
                <Label htmlFor="first_name">Nombre</Label>
                <Input id="first_name" name="first_name" required maxLength={60} />
              </div>
              <div className="field">
                <Label htmlFor="last_name">Apellido</Label>
                <Input id="last_name" name="last_name" required maxLength={60} />
              </div>
            </div>
            <div className="field">
              <Label htmlFor="nickname">Apodo</Label>
              <Input
                id="nickname"
                name="nickname"
                maxLength={40}
                placeholder="Cómo te dicen en la cancha"
              />
            </div>
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
            <div className="form-actions">
              <Button type="submit">Registrarme</Button>
              <Button asChild variant="secondary">
                <Link href="/ingresar">Ya tengo cuenta</Link>
              </Button>
            </div>
          </form>
        </section>
      </main>
    </>
  );
}
