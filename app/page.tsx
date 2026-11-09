import type { Metadata } from "next";

import { hubNow } from "@/lib/now";
import { getCompetitions, getFixtures, getStandings } from "@/server/feeds";
import { HomeView } from "@/views/home";

export const metadata: Metadata = {
  title: "Matchday | Oval Hub",
  description: "Matches in your competitions by day, with the Gallagher PREM table.",
  openGraph: {
    title: "Matchday | Oval Hub",
    description: "Matches in your competitions by day, with the Gallagher PREM table.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function Page() {
  return (
    <HomeView
      now={hubNow().toISOString()}
      fixtures={getFixtures()}
      standings={getStandings("gallagher-prem") ?? null}
      feedNames={getCompetitions().map((competition) => competition.longName)}
    />
  );
}
