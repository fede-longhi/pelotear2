import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { joinGroupFromInvite } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { getGroupByInvite, getMembership } from "@/lib/queries";
import { redirect } from "next/navigation";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const user = await requireUser();
  const group = await getGroupByInvite(code);
  if (!group) notFound();

  const membership = await getMembership(group.id, user.id);
  if (membership) redirect(`/grupos/${group.id}`);

  return (
    <>
      <SiteHeader user={user} />
      <main className="page">
        <section className="section">
          <h2>Invitación</h2>
          <p className="lead">
            Te invitaron a <strong>{group.name}</strong>.
          </p>
          <form
            action={async () => {
              "use server";
              await joinGroupFromInvite(code);
            }}
            className="panel form-actions"
          >
            <button type="submit" className="btn btn-primary">
              Unirme al grupo
            </button>
          </form>
        </section>
      </main>
    </>
  );
}
