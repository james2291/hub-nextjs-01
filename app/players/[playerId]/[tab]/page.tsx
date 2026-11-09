import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { entityTabLabel, isEntityTab } from "@/components/oval/entity-navigation";
import { EntityTabPage } from "@/components/oval/entity-tabs";
import { getPlayer } from "@/data/hub";

type Params = Promise<{ playerId: string; tab: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { playerId, tab } = await params;
  const entity = getPlayer(playerId);
  const label = entityTabLabel("player", tab);
  const title = `${label} · ${entity?.name ?? "Player"} | Oval Hub`;
  const description = `${label} for ${entity?.name ?? "the selected player"} in Oval Hub.`;
  return { title, description, openGraph: { title, description, type: "website" }, twitter: { card: "summary_large_image" } };
}

export default async function PlayerTabPage({ params }: { params: Params }) {
  const { playerId, tab } = await params;
  // Legacy tab slugs from earlier prototype versions (was TanStack beforeLoad).
  if (tab === "video-library") redirect(`/players/${playerId}/fixture-card`);
  if (tab === "reports") redirect(`/players/${playerId}/player-stats`);
  if (tab === "match-centre") redirect(`/players/${playerId}/match-room`);
  return <EntityTabPage tab={isEntityTab("player", tab) ? tab : "match-room"} />;
}
