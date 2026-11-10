import { AvatarPhotoUpload } from "@/components/AvatarPhotoUpload";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireUser } from "@/lib/auth";
import { updateProfileAction } from "@/lib/auth-actions";

export default async function PerfilPage({
  searchParams,
}: {
  searchParams: Promise<{
    ok?: string;
    nuevo?: string;
    error?: string;
    verificado?: string;
  }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;

  return (
    <>
      <SiteHeader user={user} />
      <main className="page">
        <section className="section">
          <h2>Tu perfil</h2>
          <p className="lead">
            Datos visibles para tus grupos. El apodo es lo que se muestra en
            partidos y stats.
          </p>
          {sp.error ? <p className="flash-error">{sp.error}</p> : null}
          {sp.verificado ? (
            <p className="pill pill-ok">Email confirmado.</p>
          ) : null}
          {sp.nuevo ? (
            <p className="pill pill-ok">Cuenta creada — completá tu perfil.</p>
          ) : null}
          {sp.ok ? (
            <p className="pill pill-ok">Perfil actualizado.</p>
          ) : null}
          {!user.email_verified && !user.simulated ? (
            <p className="flash-info">
              Tu email aún no está confirmado.{" "}
              <a href="/verificar-email">Confirmar ahora</a>
            </p>
          ) : null}

          <div className="panel profile-hero">
            <AvatarPhotoUpload
              name={user.name}
              photoUrl={user.photo_url}
              editable={!user.simulated}
            />
            <div>
              <strong>{user.name}</strong>
              <div className="meta">{user.email}</div>
              {user.simulated ? (
                <p className="meta">
                  Modo local demo — el perfil editable requiere una cuenta real.
                </p>
              ) : (
                <p className="meta">Tocá el avatar para cambiar la foto.</p>
              )}
            </div>
          </div>

          {!user.simulated ? (
            <form action={updateProfileAction} className="panel form-grid">
              <div className="two-col">
                <div className="field">
                  <Label htmlFor="first_name">Nombre</Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    required
                    defaultValue={user.first_name}
                    maxLength={60}
                  />
                </div>
                <div className="field">
                  <Label htmlFor="last_name">Apellido</Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    required
                    defaultValue={user.last_name}
                    maxLength={60}
                  />
                </div>
              </div>
              <div className="field">
                <Label htmlFor="nickname">Apodo</Label>
                <Input
                  id="nickname"
                  name="nickname"
                  defaultValue={user.nickname}
                  maxLength={40}
                />
              </div>
              <div className="field">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  defaultValue={user.phone}
                  maxLength={30}
                  placeholder="+54 11 ..."
                />
              </div>
              <div className="field">
                <Label htmlFor="birth_date">Fecha de nacimiento</Label>
                <Input
                  id="birth_date"
                  name="birth_date"
                  type="date"
                  defaultValue={user.birth_date ?? ""}
                />
              </div>
              <div className="form-actions">
                <Button type="submit">Guardar perfil</Button>
              </div>
            </form>
          ) : null}
        </section>
      </main>
    </>
  );
}
