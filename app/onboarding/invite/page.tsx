import { InviteTeamScreen } from "@/components/taskview/auth/invite-team-screen";

export default async function InviteTeamPage({
  searchParams,
}: {
  searchParams: Promise<{ workspace?: string | string[] }>;
}) {
  const query = await searchParams;
  const workspaceId = typeof query.workspace === "string" ? query.workspace : undefined;
  return <InviteTeamScreen workspaceId={workspaceId} />;
}
