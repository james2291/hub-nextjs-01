import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { entityTabLabel, isEntityTab } from "@/components/oval/entity-navigation";
import { EntityTabPage } from "@/components/oval/entity-tabs";
import { getCompetition } from "@/data/hub";

type Params = Promise<{ competitionId: string; tab: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { competitionId, tab } = await params;
  const entity = getCompetition(competitionId);
  const label = entityTabLabel("competition", tab);
  const title = `${label} · ${entity?.name ?? "Competition"} | Oval Hub`;
  const description = `${label} for ${entity?.name ?? "the selected competition"} in Oval Hub.`;
  return { title, description, openGraph: { title, description, type: "website" }, twitter: { card: "summary_large_image" } };
}

export default async function CompetitionTabPage({ params }: { params: Params }) {
  const { competitionId, tab } = await params;
  // Legacy tab slugs from earlier prototype versions (was TanStack beforeLoad).
  if (tab === "video-library") redirect(`/competitions/${competitionId}/fixture-card`);
  if (tab === "competitions") redirect(`/competitions/${competitionId}/match-room`);
  return <EntityTabPage tab={isEntityTab("competition", tab) ? tab : "match-room"} />;
}
