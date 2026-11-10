import { notFound, redirect } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { joinGroupFromInvite } from "@/lib/actions";
import { requireVerifiedUser } from "@/lib/auth";
import { getGroupByInvite, getMembership } from "@/lib/queries";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const user = await requireVerifiedUser();
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
            <Button type="submit">Unirme al grupo</Button>
          </form>
        </section>
      </main>
    </>
  );
}
