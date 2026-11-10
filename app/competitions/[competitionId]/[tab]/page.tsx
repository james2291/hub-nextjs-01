import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import {
  entityHref,
  entityTabLabel,
  isEntityTab,
  legacyTab,
} from "@/components/oval/entity-navigation";
import { CompetitionFeeds } from "@/components/oval/competition/feeds";
import { CompetitionPeople } from "@/components/oval/competition/people";
import { CompetitionStats } from "@/components/oval/competition/stats";
import { CompetitionTable } from "@/components/oval/competition/table";
import { EntityFixtureCard } from "@/components/oval/entity-fixture-card";
import { MatchCentre } from "@/components/oval/match-centre/match-centre";
import { hubNow } from "@/lib/now";
import { getCompetition, getFixtures } from "@/server/feeds";
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
  if (tab === "match-centre") {
    return (
      <MatchCentre
        competitionName={getCompetition(competitionId)?.name ?? "Competition"}
        fixtures={getFixtures({ competition: competitionId })}
        now={hubNow().toISOString()}
      />
    );
  }
  if (tab === "table") return <CompetitionTable slug={competitionId} />;
  if (tab === "people") return <CompetitionPeople slug={competitionId} />;
  if (tab === "stats") return <CompetitionStats slug={competitionId} />;
  return <CompetitionFeeds slug={competitionId} />;
}
