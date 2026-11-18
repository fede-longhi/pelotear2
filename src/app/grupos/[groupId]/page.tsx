import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { GroupDashboard } from "@/components/GroupDashboard";
import { SiteHeader } from "@/components/SiteHeader";
import { requireVerifiedUser } from "@/lib/auth";
import {
  countMatchAttendance,
  getGroup,
  getMembership,
  listMatches,
  listMatchPlayers,
  listMembers,
} from "@/lib/queries";
import { playerStatsForGroup } from "@/lib/stats";
import type { MatchRow } from "@/lib/types";

async function absoluteInviteUrl(code: string) {
  const h = await headers();
  const host =
    h.get("x-forwarded-host") || h.get("host") || "pelotear.fedelonghi.com.ar";
  const proto = h.get("x-forwarded-proto") || "https";
  return `${proto}://${host}/unirse/${code}`;
}

function matchSortKey(m: MatchRow) {
  return `${m.played_on}T${m.kickoff_time || "00:00"}`;
}

export default async function GroupPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const user = await requireVerifiedUser();
  const group = await getGroup(groupId);
  if (!group) notFound();
  const membership = await getMembership(groupId, user.id);
  if (!membership) notFound();

  const [members, matches, stats] = await Promise.all([
    listMembers(groupId),
    listMatches(groupId),
    playerStatsForGroup(groupId),
  ]);

  const upcoming = matches
    .filter((m) => m.status === "programado")
    .sort((a, b) => matchSortKey(a).localeCompare(matchSortKey(b)));
  const next = upcoming[0] ?? null;

  let nextMatch: {
    match: MatchRow;
    confirmed: number;
    pending: number;
    myAttendance: string | null;
  } | null = null;

  if (next) {
    const [attendance, players] = await Promise.all([
      countMatchAttendance(next.id),
      listMatchPlayers(next.id),
    ]);
    const me = players.find((p) => p.user_id === user.id);
    nextMatch = {
      match: next,
      confirmed: attendance.confirmed,
      pending: attendance.pending,
      myAttendance: me?.attendance ?? null,
    };
  }

  const history = matches
    .filter((m) => !next || m.id !== next.id)
    .sort((a, b) => matchSortKey(b).localeCompare(matchSortKey(a)));

  const invitePath = `/unirse/${group.invite_code}`;
  const inviteUrl = await absoluteInviteUrl(group.invite_code);

  return (
    <>
      <SiteHeader user={user} />
      <GroupDashboard
        groupId={groupId}
        groupName={group.name}
        inviteCode={group.invite_code}
        invitePath={invitePath}
        inviteUrl={inviteUrl}
        isAdmin={membership.role === "admin"}
        currentUserId={user.id}
        members={members.map((m) => ({
          ...m,
          joined_at: String(m.joined_at),
        }))}
        nextMatch={nextMatch}
        history={history}
        stats={stats}
      />
    </>
  );
}
