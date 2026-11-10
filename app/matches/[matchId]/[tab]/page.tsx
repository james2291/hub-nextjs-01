import { notFound, redirect } from "next/navigation";

import { FixtureMatchCentre } from "@/components/oval/match-centre/match-centre";
import { MatchStats } from "@/components/oval/match/stats";
import { MatchVideo } from "@/components/oval/match/video";
import { isPlayed } from "@/lib/now";
import { getMatch, SEASON } from "@/server/feeds";

// Tabs from the prototype's 7-tab match workspace, mapped onto Overview / Match Centre / Video /
// Stats.
const LEGACY: Record<string, string> = {
  overview: "",
  lineups: "",
  "player-data": "match-centre",
  reports: "video",
  "files-feeds": "video",
};

export default async function MatchTabPage({
  params,
}: {
  params: Promise<{ matchId: string; tab: string }>;
}) {
  const { matchId, tab } = await params;
  const fixture = getMatch(matchId);
  if (!fixture) notFound();
  const legacy = LEGACY[tab];
  if (legacy !== undefined) redirect(`/matches/${matchId}${legacy ? `/${legacy}` : ""}`);
  if (tab === "match-centre") {
    return <FixtureMatchCentre fixture={fixture} played={isPlayed(fixture.dateTime)} />;
  }
  if (tab === "video") return <MatchVideo fixture={fixture} season={SEASON.key} />;
  if (tab === "stats") return <MatchStats fixture={fixture} played={isPlayed(fixture.dateTime)} />;
  notFound();
}
