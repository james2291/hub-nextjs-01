import type { Metadata } from "next";
import type { ReactNode } from "react";

import { NotFoundPanel } from "@/components/oval/detail";
import { EntityWorkspace } from "@/components/oval/entity-workspace";
import { getReferee } from "@/data/hub";

type Params = Promise<{ refereeId: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const e = getReferee((await params).refereeId);
  if (!e) return { title: "Referee | Oval Hub", description: "Referee analysis in Oval Hub." };
  const title = `${e.name} | Oval Hub`;
  const description = `${e.name} appointments, penalty tendencies and card averages in Oval Hub.`;
  return { title, description, openGraph: { title, description, type: "website" }, twitter: { card: "summary_large_image" } };
}

// Shared entity header + tab bar; each tab renders inside as `children` (was TanStack <Outlet />).
export default async function RefereeLayout({ children, params }: { children: ReactNode; params: Params }) {
  const { refereeId } = await params;
  const entity = getReferee(refereeId);
  if (!entity) return <NotFoundPanel kind="Referee" id={refereeId} />;
  return <EntityWorkspace entityType="referee" entity={entity}>{children}</EntityWorkspace>;
}
