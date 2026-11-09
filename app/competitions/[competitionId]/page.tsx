import { CompetitionOverview } from "@/components/oval/competition/overview";

// Overview tab.
export default async function CompetitionOverviewPage({
  params,
}: {
  params: Promise<{ competitionId: string }>;
}) {
  return <CompetitionOverview slug={(await params).competitionId} />;
}
