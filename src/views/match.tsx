"use client";

import { ArrowLeft } from "lucide-react";

import { AppShell, Panel } from "@/components/oval/app-shell";
import { CompetitionMatchDetail } from "@/components/oval/match-centre";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/link";
import { getMatch } from "@/lib/matches";

const tabs = ["overview", "video", "lineups", "stats", "player-data", "reports", "files-feeds"] as const;

export function MatchView({ matchId, tab }: { matchId: string; tab: string }) {
  const match = getMatch(matchId);
  if (!match) return <AppShell><Panel className="p-10 text-center">Match not found.</Panel></AppShell>;
  const safeTab = tabs.includes(tab as (typeof tabs)[number]) ? tab : "overview";
  return <AppShell><Button asChild variant="ghost" size="sm" className="mb-2 -ml-2"><Link to="/teams/$teamId/$tab" params={{ teamId: "harlequins", tab: "fixture-card" }}><ArrowLeft className="size-3.5"/>Back to Fixture Card</Link></Button><CompetitionMatchDetail competitionId={match.competition.id} entityName={match.competition.name} initialTab={safeTab} match={{ id: matchId, round: match.fixture.round, fixture: match.fixture.fixture, date: match.fixture.date, venue: match.fixture.venue, result: match.fixture.result }} /></AppShell>;
}
