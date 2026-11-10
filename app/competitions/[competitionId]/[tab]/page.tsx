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
import { getMatch } from "@/server/feeds";
import { competitionHeader } from "@/server/entities";

type Params = Promise<{ competitionId: string; tab: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { competitionId, tab } = await params;
  const label = entityTabLabel("competition", tab);
  const title = `${label} · ${competitionHeader(competitionId)?.title ?? "Competition"} | Oval Hub`;
  return { title, openGraph: { title, type: "website" }, twitter: { card: "summary_large_image" } };
}

export default async function CompetitionTabPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { competitionId, tab } = await params;
  // The Match Centre moved to each fixture (/matches/{id}/match-centre); old links still land.
  if (tab === "match-centre") {
    const match = (await searchParams)["match"];
    const fixture = typeof match === "string" ? getMatch(match) : undefined;
    redirect(
      fixture
        ? `/matches/${fixture.id}/match-centre`
        : entityHref("competition", competitionId, "fixtures"),
    );
  }
  const replacement = legacyTab("competition", tab);
  if (replacement !== undefined) redirect(entityHref("competition", competitionId, replacement));
  if (!isEntityTab("competition", tab)) notFound();
  if (tab === "fixtures") return <EntityFixtureCard kind="competition" id={competitionId} />;
  if (tab === "table") return <CompetitionTable slug={competitionId} />;
  if (tab === "people") return <CompetitionPeople slug={competitionId} />;
  if (tab === "stats") return <CompetitionStats slug={competitionId} />;
  return <CompetitionFeeds slug={competitionId} />;
}
