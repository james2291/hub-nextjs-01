import { TeamOverview } from "@/components/oval/team/overview";

// Overview tab.
export default async function TeamOverviewPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  return <TeamOverview slug={(await params).teamId} />;
}
