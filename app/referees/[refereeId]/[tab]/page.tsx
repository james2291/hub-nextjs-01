import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import {
  entityHref,
  entityTabLabel,
  isEntityTab,
  legacyTab,
} from "@/components/oval/entity-navigation";
import { EntityFixtureCard } from "@/components/oval/entity-fixture-card";
import { RefereeStats } from "@/components/oval/referee/stats";
import { refereeHeader } from "@/server/entities";

type Params = Promise<{ refereeId: string; tab: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { refereeId, tab } = await params;
  const label = entityTabLabel("referee", tab);
  const title = `${label} · ${refereeHeader(refereeId)?.title ?? "Referee"} | Oval Hub`;
  return { title, openGraph: { title, type: "website" }, twitter: { card: "summary_large_image" } };
}

export default async function RefereeTabPage({ params }: { params: Params }) {
  const { refereeId, tab } = await params;
  const replacement = legacyTab("referee", tab);
  if (replacement !== undefined) redirect(entityHref("referee", refereeId, replacement));
  if (!isEntityTab("referee", tab)) notFound();
  if (tab === "fixtures") return <EntityFixtureCard kind="referee" id={refereeId} />;
  return <RefereeStats slug={refereeId} />;
}
