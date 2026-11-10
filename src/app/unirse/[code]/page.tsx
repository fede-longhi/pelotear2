import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { joinGroupFromInvite, rejectGroupInvite } from "@/lib/actions";
import { getOptionalUser } from "@/lib/auth";
import { getGroupByInvite, getMembership } from "@/lib/queries";
import { withNext } from "@/lib/redirects";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const group = await getGroupByInvite(code);
  if (!group) notFound();

  const user = await getOptionalUser();
  const invitePath = `/unirse/${code}`;

  if (user && !user.simulated) {
    if (!user.email_verified) {
      redirect(
        `/auth/return?next=${encodeURIComponent(invitePath)}&to=${encodeURIComponent("/verificar-email")}`,
      );
    }
    const membership = await getMembership(group.id, user.id);
    if (membership) redirect(`/grupos/${group.id}`);
  }

  const loggedIn =
    Boolean(user) && !user!.simulated && user!.email_verified;

  return (
    <>
      <SiteHeader user={user} />
      <main className="page">
        <section className="section">
          <h2>Invitación al grupo</h2>
          <p className="lead">
            Te invitaron a unirte a <strong>{group.name}</strong>.
          </p>

          {!loggedIn ? (
            <div className="panel form-grid">
              <p className="meta" style={{ margin: 0 }}>
                Para aceptar o rechazar la invitación, ingresá o creá una
                cuenta. Te devolvemos acá después.
              </p>
              <div className="form-actions">
                <Button asChild>
                  <Link href={withNext("/ingresar", invitePath)}>Ingresar</Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link href={withNext("/registro", invitePath)}>
                    Crear cuenta
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="panel form-actions invite-decision">
              <form
                action={async () => {
                  "use server";
                  await joinGroupFromInvite(code);
                }}
              >
                <Button type="submit">Aceptar y unirme</Button>
              </form>
              <form action={rejectGroupInvite}>
                <Button type="submit" variant="secondary">
                  Rechazar
                </Button>
              </form>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
