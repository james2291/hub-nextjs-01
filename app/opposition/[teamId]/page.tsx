import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Opposition } from "@/components/oval/opposition/opposition";
import { getClub } from "@/server/feeds";

type Params = Promise<{ teamId: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const club = getClub((await params).teamId);
  const title = `${club?.name ?? "Opponent"} · Next opponent | Oval Hub`;
  return { title, openGraph: { title, type: "website" }, twitter: { card: "summary_large_image" } };
}

export default async function OppositionPage({ params }: { params: Params }) {
  const slug = (await params).teamId;
  if (!getClub(slug)) notFound();
  return <Opposition slug={slug} />;
}
