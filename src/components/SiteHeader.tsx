import Link from "next/link";
import type { AppUser } from "@/lib/auth";
import { logoutAction } from "@/lib/auth-actions";
import { DemoSwitcher } from "./DemoSwitcher";

export function SiteHeader({ user }: { user: AppUser | null }) {
  return (
    <header className="site-header">
      <Link href="/" className="brand-mark">
        Pelotear
      </Link>
      <nav className="site-nav">
        {user ? (
          <>
            <Link href="/grupos">Mis grupos</Link>
            <Link href="/unirse">Unirme</Link>
            <Link href="/perfil">Perfil</Link>
            {!user.email_verified && !user.simulated ? (
              <Link href="/verificar-email">Confirmar email</Link>
            ) : null}
          </>
        ) : (
          <>
            <Link href="/ingresar">Ingresar</Link>
            <Link href="/registro">Crear cuenta</Link>
          </>
        )}
      </nav>
      <div className="header-user">
        {user ? (
          <>
            <Link href="/perfil" className="user-chip user-chip-link">
              {user.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.photo_url} alt="" className="avatar-xs" />
              ) : null}
              {user.name}
            </Link>
            {!user.simulated ? (
              <form action={logoutAction}>
                <button type="submit" className="btn btn-small btn-secondary">
                  Salir
                </button>
              </form>
            ) : null}
            <DemoSwitcher user={user} />
          </>
        ) : (
          <Link className="btn btn-small btn-primary" href="/registro">
            Empezar
          </Link>
        )}
      </div>
    </header>
  );
}
