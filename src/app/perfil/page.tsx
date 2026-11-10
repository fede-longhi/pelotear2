import { SiteHeader } from "@/components/SiteHeader";
import { requireUser } from "@/lib/auth";
import { updateProfileAction } from "@/lib/auth-actions";

export default async function PerfilPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; nuevo?: string; error?: string }>;
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
          {sp.nuevo ? (
            <p className="pill pill-ok">Cuenta creada — completá tu perfil.</p>
          ) : null}
          {sp.ok ? (
            <p className="pill pill-ok">Perfil actualizado.</p>
          ) : null}

          <div className="panel profile-hero">
            {user.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.photo_url} alt="" className="avatar-lg" />
            ) : (
              <div className="avatar-lg avatar-placeholder">
                {user.name.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div>
              <strong>{user.name}</strong>
              <div className="meta">{user.email}</div>
              {user.simulated ? (
                <p className="meta">
                  Modo local demo — el perfil editable requiere una cuenta real.
                </p>
              ) : null}
            </div>
          </div>

          {!user.simulated ? (
            <form
              action={updateProfileAction}
              className="panel form-grid"
              encType="multipart/form-data"
            >
              <div className="two-col">
                <label>
                  Nombre
                  <input
                    name="first_name"
                    required
                    defaultValue={user.first_name}
                    maxLength={60}
                  />
                </label>
                <label>
                  Apellido
                  <input
                    name="last_name"
                    required
                    defaultValue={user.last_name}
                    maxLength={60}
                  />
                </label>
              </div>
              <label>
                Apodo
                <input
                  name="nickname"
                  defaultValue={user.nickname}
                  maxLength={40}
                />
              </label>
              <label>
                Teléfono
                <input
                  name="phone"
                  type="tel"
                  defaultValue={user.phone}
                  maxLength={30}
                  placeholder="+54 11 ..."
                />
              </label>
              <label>
                Fecha de nacimiento
                <input
                  name="birth_date"
                  type="date"
                  defaultValue={user.birth_date ?? ""}
                />
              </label>
              <label>
                Foto de perfil
                <input name="photo" type="file" accept="image/*" />
              </label>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  Guardar perfil
                </button>
              </div>
            </form>
          ) : null}
        </section>
      </main>
    </>
  );
}
