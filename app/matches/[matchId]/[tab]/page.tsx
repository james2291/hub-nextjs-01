import type { Metadata } from "next";

import { getMatch } from "@/lib/matches";
import { MatchView } from "@/views/match";

type Params = Promise<{ matchId: string; tab: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { matchId, tab } = await params;
  const match = getMatch(matchId);
  const label = tab.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  const title = `${match?.fixture.fixture ?? "Match"} · ${label} | Oval Hub`;
  const description = `${label} workspace for ${match?.fixture.fixture ?? "the selected match"}.`;
  return { title, description, openGraph: { title, description, type: "website" }, twitter: { card: "summary_large_image" } };
}

export default async function MatchTabPage({ params }: { params: Params }) {
  const { matchId, tab } = await params;
  return <MatchView matchId={matchId} tab={tab} />;
}
