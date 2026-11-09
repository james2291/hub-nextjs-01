import { notFound } from "next/navigation";

import { MatchOverview } from "@/components/oval/match/overview";
import { isPlayed } from "@/lib/now";
import { getMatch } from "@/server/feeds";

// Overview tab.
export default async function MatchOverviewPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const fixture = getMatch((await params).matchId);
  if (!fixture) notFound();
  return <MatchOverview fixture={fixture} played={isPlayed(fixture.dateTime)} />;
}
