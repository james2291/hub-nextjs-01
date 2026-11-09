import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import {
  entityHref,
  entityTabLabel,
  isEntityTab,
  legacyTab,
} from "@/components/oval/entity-navigation";
import { EntityFixtureCard } from "@/components/oval/entity-fixture-card";
import { TeamSquadPage } from "@/components/oval/team/squad-page";
import { TeamStats } from "@/components/oval/team/stats";
import { teamHeader } from "@/server/entities";

type Params = Promise<{ teamId: string; tab: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { teamId, tab } = await params;
  const label = entityTabLabel("team", tab);
  const title = `${label} · ${teamHeader(teamId)?.title ?? "Team"} | Oval Hub`;
  return { title, openGraph: { title, type: "website" }, twitter: { card: "summary_large_image" } };
}

export default async function TeamTabPage({ params }: { params: Params }) {
  const { teamId, tab } = await params;
  const replacement = legacyTab("team", tab);
  if (replacement !== undefined) redirect(entityHref("team", teamId, replacement));
  if (!isEntityTab("team", tab)) notFound();
  if (tab === "fixtures") return <EntityFixtureCard kind="team" id={teamId} />;
  if (tab === "squad") return <TeamSquadPage slug={teamId} />;
  return <TeamStats slug={teamId} />;
}
