import type { Metadata } from "next";
import type { ReactNode } from "react";

import { NotFoundPanel } from "@/components/oval/detail";
import { EntityWorkspace } from "@/components/oval/entity-workspace";
import { getPlayer } from "@/data/hub";

type Params = Promise<{ playerId: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const e = getPlayer((await params).playerId);
  if (!e) return { title: "Player | Oval Hub", description: "Player analysis in Oval Hub." };
  const title = `${e.name} | Oval Hub`;
  const description = `${e.name} season statistics, form, match log and key clips in Oval Hub.`;
  return { title, description, openGraph: { title, description, type: "website" }, twitter: { card: "summary_large_image" } };
}

// Shared entity header + tab bar; each tab renders inside as `children` (was TanStack <Outlet />).
export default async function PlayerLayout({ children, params }: { children: ReactNode; params: Params }) {
  const { playerId } = await params;
  const entity = getPlayer(playerId);
  if (!entity) return <NotFoundPanel kind="Player" id={playerId} />;
  return <EntityWorkspace entityType="player" entity={entity}>{children}</EntityWorkspace>;
}
