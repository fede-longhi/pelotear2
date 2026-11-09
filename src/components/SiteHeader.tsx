import Link from "next/link";
import type { AppUser } from "@/lib/auth";
import { DemoSwitcher } from "./DemoSwitcher";

export function SiteHeader({ user }: { user: AppUser }) {
  return (
    <header className="site-header">
      <Link href="/" className="brand-mark">
        Pelotear
      </Link>
      <nav className="site-nav">
        <Link href="/grupos">Mis grupos</Link>
        <Link href="/unirse">Unirme</Link>
      </nav>
      <div className="header-user">
        <span className="user-chip">{user.name}</span>
        <DemoSwitcher user={user} />
      </div>
    </header>
  );
}
