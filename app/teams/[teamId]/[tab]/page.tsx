import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { entityTabLabel, isEntityTab } from "@/components/oval/entity-navigation";
import { EntityTabPage } from "@/components/oval/entity-tabs";
import { getTeam } from "@/data/hub";

type Params = Promise<{ teamId: string; tab: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { teamId, tab } = await params;
  const entity = getTeam(teamId);
  const label = entityTabLabel("team", tab);
  const title = `${label} · ${entity?.name ?? "Team"} | Oval Hub`;
  const description = `${label} for ${entity?.name ?? "the selected team"} in Oval Hub.`;
  return { title, description, openGraph: { title, description, type: "website" }, twitter: { card: "summary_large_image" } };
}

export default async function TeamTabPage({ params }: { params: Params }) {
  const { teamId, tab } = await params;
  // Legacy tab slugs from earlier prototype versions (was TanStack beforeLoad).
  if (tab === "teams-players") redirect(`/teams/${teamId}/players`);
  if (tab === "competitions") redirect(`/teams/${teamId}/match-room`);
  if (tab === "video-library") redirect(`/teams/${teamId}/fixture-card`);
  if (tab === "head-to-head" && teamId === "harlequins") redirect(`/teams/${teamId}/match-room`);
  return <EntityTabPage tab={isEntityTab("team", tab) ? tab : "match-room"} />;
}
