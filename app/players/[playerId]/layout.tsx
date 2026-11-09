import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { EntityWorkspace } from "@/components/oval/entity-workspace";
import { getPlayer } from "@/data/hub";
import { playerHeader } from "@/server/entities";

type Params = Promise<{ playerId: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const header = playerHeader((await params).playerId);
  const title = `${header?.title ?? "Player"} | Oval Hub`;
  const description = header?.meta ?? "Player in Oval Hub.";
  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image" },
  };
}

// Entity header + tab row; each tab renders inside as `children`.
export default async function PlayerLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Params;
}) {
  const { playerId } = await params;
  const header = playerHeader(playerId);
  if (!header) notFound();
  return (
    <EntityWorkspace header={header} legacy={getPlayer(playerId)}>
      {children}
    </EntityWorkspace>
  );
}
