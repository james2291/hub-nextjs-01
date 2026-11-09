import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { EntityWorkspace } from "@/components/oval/entity-workspace";
import { getCompetition } from "@/data/hub";
import { competitionHeader } from "@/server/entities";

type Params = Promise<{ competitionId: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const header = competitionHeader((await params).competitionId);
  const title = `${header?.title ?? "Competition"} | Oval Hub`;
  const description = header?.meta ?? "Competition in Oval Hub.";
  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image" },
  };
}

// Entity header + tab row; each tab renders inside as `children`.
export default async function CompetitionLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Params;
}) {
  const { competitionId } = await params;
  const header = competitionHeader(competitionId);
  if (!header) notFound();
  return (
    <EntityWorkspace header={header} legacy={getCompetition(competitionId)}>
      {children}
    </EntityWorkspace>
  );
}
