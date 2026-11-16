import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { entityTabLabel, isEntityTab } from "@/components/oval/entity-navigation";
import { EntityFixtureCard } from "@/components/oval/entity-fixture-card";
import { PlayerStats } from "@/components/oval/player/stats";
import { playerHeader } from "@/server/entities";

type Params = Promise<{ playerId: string; tab: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { playerId, tab } = await params;
  const label = entityTabLabel("player", tab);
  const title = `${label} · ${playerHeader(playerId)?.title ?? "Player"} | Oval Hub`;
  return { title, openGraph: { title, type: "website" }, twitter: { card: "summary_large_image" } };
}

export default async function PlayerTabPage({ params }: { params: Params }) {
  const { playerId, tab } = await params;
  // Legacy tab slugs are redirected in proxy.ts (src/lib/legacy-routes.ts).
  if (!isEntityTab("player", tab)) notFound();
  if (tab === "fixtures") return <EntityFixtureCard kind="player" id={playerId} />;
  return <PlayerStats slug={playerId} />;
}
