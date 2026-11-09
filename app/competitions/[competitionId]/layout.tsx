import type { Metadata } from "next";
import type { ReactNode } from "react";

import { NotFoundPanel } from "@/components/oval/detail";
import { EntityWorkspace } from "@/components/oval/entity-workspace";
import { getCompetition } from "@/data/hub";

type Params = Promise<{ competitionId: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const e = getCompetition((await params).competitionId);
  if (!e) return { title: "Competition | Oval Hub", description: "Competition analysis in Oval Hub." };
  const title = `${e.name} | Oval Hub`;
  const description = `${e.name} ${e.season} standings, fixtures and performance trends.`;
  return { title, description, openGraph: { title, description, type: "website" }, twitter: { card: "summary_large_image" } };
}

// Shared entity header + tab bar; each tab renders inside as `children` (was TanStack <Outlet />).
export default async function CompetitionLayout({ children, params }: { children: ReactNode; params: Params }) {
  const { competitionId } = await params;
  const entity = getCompetition(competitionId);
  if (!entity) return <NotFoundPanel kind="Competition" id={competitionId} />;
  return <EntityWorkspace entityType="competition" entity={entity}>{children}</EntityWorkspace>;
}
