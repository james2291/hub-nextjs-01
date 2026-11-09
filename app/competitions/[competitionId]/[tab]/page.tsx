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
import { competitionHeader } from "@/server/entities";

type Params = Promise<{ competitionId: string; tab: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { competitionId, tab } = await params;
  const label = entityTabLabel("competition", tab);
  const title = `${label} · ${competitionHeader(competitionId)?.title ?? "Competition"} | Oval Hub`;
  return { title, openGraph: { title, type: "website" }, twitter: { card: "summary_large_image" } };
}

export default async function CompetitionTabPage({ params }: { params: Params }) {
  const { competitionId, tab } = await params;
  const replacement = legacyTab("competition", tab);
  if (replacement !== undefined) redirect(entityHref("competition", competitionId, replacement));
  if (!isEntityTab("competition", tab)) notFound();
  if (tab === "fixtures") return <EntityFixtureCard kind="competition" id={competitionId} />;
  return <LegacyTabContent tab={tab} />;
}
