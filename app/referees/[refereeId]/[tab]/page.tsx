import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { entityTabLabel, isEntityTab } from "@/components/oval/entity-navigation";
import { EntityTabPage } from "@/components/oval/entity-tabs";
import { getReferee } from "@/data/hub";

type Params = Promise<{ refereeId: string; tab: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { refereeId, tab } = await params;
  const entity = getReferee(refereeId);
  const label = entityTabLabel("referee", tab);
  const title = `${label} · ${entity?.name ?? "Referee"} | Oval Hub`;
  const description = `${label} for ${entity?.name ?? "the selected referee"} in Oval Hub.`;
  return { title, description, openGraph: { title, description, type: "website" }, twitter: { card: "summary_large_image" } };
}

export default async function RefereeTabPage({ params }: { params: Params }) {
  const { refereeId, tab } = await params;
  // Legacy tab slugs from earlier prototype versions (was TanStack beforeLoad).
  if (tab === "video-library") redirect(`/referees/${refereeId}/match-room`);
  if (tab === "reports") redirect(`/referees/${refereeId}/referee-stats`);
  return <EntityTabPage tab={isEntityTab("referee", tab) ? tab : "match-room"} />;
}
