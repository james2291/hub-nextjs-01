import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import {
  entityHref,
  entityTabLabel,
  isEntityTab,
  legacyTab,
} from "@/components/oval/entity-navigation";
import { EntityFixtureCard } from "@/components/oval/entity-fixture-card";
import { LegacyTabContent } from "@/components/oval/entity-tabs";
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
  const replacement = legacyTab("player", tab);
  if (replacement !== undefined) redirect(entityHref("player", playerId, replacement));
  if (!isEntityTab("player", tab)) notFound();
  if (tab === "fixtures") return <EntityFixtureCard kind="player" id={playerId} />;
  return <LegacyTabContent tab={tab} />;
}
