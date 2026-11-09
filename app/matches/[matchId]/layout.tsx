import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { BreadcrumbLabel } from "@/components/oval/app-shell";
import { MatchHeader } from "@/components/oval/match/header";
import { hubNow } from "@/lib/now";
import { scoreLine } from "@/lib/rugby";
import { getMatch } from "@/server/feeds";

type Params = Promise<{ matchId: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const fixture = getMatch((await params).matchId);
  const title = fixture
    ? `${fixture.home.club.name} ${scoreLine(fixture) ?? "v"} ${fixture.away.club.name} | Oval Hub`
    : "Match | Oval Hub";
  return { title, openGraph: { title, type: "website" }, twitter: { card: "summary_large_image" } };
}

export default async function MatchLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Params;
}) {
  const fixture = getMatch((await params).matchId);
  if (!fixture) notFound();
  return (
    <>
      <BreadcrumbLabel
        segment={String(fixture.id)}
        label={`${fixture.home.club.name} v ${fixture.away.club.name}`}
      />
      <MatchHeader fixture={fixture} now={hubNow().toISOString()} />
      {children}
    </>
  );
}
