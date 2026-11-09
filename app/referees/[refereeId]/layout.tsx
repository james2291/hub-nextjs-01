import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { EntityWorkspace } from "@/components/oval/entity-workspace";
import { getReferee } from "@/data/hub";
import { refereeHeader } from "@/server/entities";

type Params = Promise<{ refereeId: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const header = refereeHeader((await params).refereeId);
  const title = `${header?.title ?? "Referee"} | Oval Hub`;
  const description = header?.meta ?? "Referee in Oval Hub.";
  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image" },
  };
}

// Entity header + tab row; each tab renders inside as `children`.
export default async function RefereeLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Params;
}) {
  const { refereeId } = await params;
  const header = refereeHeader(refereeId);
  if (!header) notFound();
  return (
    <EntityWorkspace header={header} legacy={getReferee(refereeId)}>
      {children}
    </EntityWorkspace>
  );
}
