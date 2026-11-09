import { notFound, redirect } from "next/navigation";

import { MatchStats } from "@/components/oval/match/stats";
import { MatchVideo } from "@/components/oval/match/video";
import { isPlayed } from "@/lib/now";
import { getMatch, SEASON } from "@/server/feeds";

// Tabs from the prototype's 7-tab match workspace, mapped onto Overview / Video / Stats.
const LEGACY: Record<string, string> = {
  overview: "",
  lineups: "",
  "player-data": "stats",
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
  if (tab === "video") return <MatchVideo fixture={fixture} season={SEASON.key} />;
  if (tab === "stats") return <MatchStats fixture={fixture} played={isPlayed(fixture.dateTime)} />;
  notFound();
}
