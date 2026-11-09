import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import {
  entityHref,
  entityTabLabel,
  isEntityTab,
  legacyTab,
} from "@/components/oval/entity-navigation";
import { LegacyTabContent } from "@/components/oval/entity-tabs";
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
  return <LegacyTabContent tab={tab} />;
}
