import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { EntityWorkspace } from "@/components/oval/entity-workspace";
import { getTeam } from "@/data/hub";
import { teamHeader } from "@/server/entities";

type Params = Promise<{ teamId: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const header = teamHeader((await params).teamId);
  const title = `${header?.title ?? "Team"} | Oval Hub`;
  const description = header?.meta ?? "Team in Oval Hub.";
  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image" },
  };
}

// Entity header + tab row; each tab renders inside as `children`.
export default async function TeamLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Params;
}) {
  const { teamId } = await params;
  const header = teamHeader(teamId);
  if (!header) notFound();
  return (
    <EntityWorkspace header={header} legacy={getTeam(teamId)}>
      {children}
    </EntityWorkspace>
  );
}
