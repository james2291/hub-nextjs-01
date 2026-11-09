import type { Metadata } from "next";
import type { ReactNode } from "react";

import { NotFoundPanel } from "@/components/oval/detail";
import { EntityWorkspace } from "@/components/oval/entity-workspace";
import { getTeam } from "@/data/hub";

type Params = Promise<{ teamId: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const e = getTeam((await params).teamId);
  if (!e) return { title: "Team | Oval Hub", description: "Team analysis in Oval Hub." };
  const title = `${e.name} | Oval Hub`;
  const description = `${e.name} squad, form, performance metrics and match video in Oval Hub.`;
  return { title, description, openGraph: { title, description, type: "website" }, twitter: { card: "summary_large_image" } };
}

// Shared entity header + tab bar; each tab renders inside as `children` (was TanStack <Outlet />).
export default async function TeamLayout({ children, params }: { children: ReactNode; params: Params }) {
  const { teamId } = await params;
  const entity = getTeam(teamId);
  if (!entity) return <NotFoundPanel kind="Team" id={teamId} />;
  return <EntityWorkspace entityType="team" entity={entity}>{children}</EntityWorkspace>;
}
