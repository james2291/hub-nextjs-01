"use client";

import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";

import { Panel } from "@/components/oval/app-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { toWireItem, type AiInsightItem, type AiInsightResult } from "@/lib/ai-insights";
import { cn } from "@/lib/utils";

export type InsightPerspective = "neutral" | "team" | "player" | "referee";
export type InsightStat = { label: string; value: string };
export type InsightMatch = {
  id: string;
  title: string;
  meta: string;
  result?: "W" | "L" | "D";
  score?: string;
  positionGroup?: "forward" | "back";
  data: Record<string, unknown>;
};

const statKeys: Record<InsightPerspective | "player-forward" | "player-back", string[]> = {
  neutral: ["result", "venue", "points"],
  team: ["score", "result", "tries", "possession", "territory", "penalties", "lineBreaks", "missedTackles"],
  player: ["minutes", "started", "headline"],
  "player-forward": ["minutes", "carries", "tackles", "turnoversWon", "lineoutInvolvements", "headline"],
  "player-back": ["minutes", "metresMade", "lineBreaks", "defendersBeaten", "tries", "headline"],
  referee: ["totalPenalties", "yellowCards", "redCards", "penaltySplit", "scrumResets", "tmoReferrals", "cards"],
};

const statLabels: Record<string, string> = {
  result: "Result", venue: "Venue", points: "Points", score: "Score", tries: "Tries", possession: "Possession",
  territory: "Territory", penalties: "Penalties", lineBreaks: "Line breaks", missedTackles: "Missed tackles",
  minutes: "Minutes", started: "Role", headline: "Contribution", carries: "Carries", tackles: "Tackles",
  turnoversWon: "Turnovers", lineoutInvolvements: "Lineouts", metresMade: "Metres", defendersBeaten: "Defenders beaten",
  totalPenalties: "Total penalties", yellowCards: "Yellow cards", redCards: "Red cards", penaltySplit: "Penalty split",
  scrumResets: "Scrum resets", tmoReferrals: "TMO referrals", cards: "Cards",
};

export function getHeadlineStats(match: InsightMatch, perspective: InsightPerspective): InsightStat[] {
  const key = perspective === "player" && match.positionGroup ? `player-${match.positionGroup}` as const : perspective;
  return statKeys[key].flatMap((field) => {
    const value = match.data[field];
    if (value === undefined || value === null || value === "") return [];
    return [{ label: statLabels[field] ?? field, value: String(value) }];
  }).slice(0, perspective === "player" ? 4 : 3);
}

export function AIInsightCard({ title, summary, loading, error, placeholder, children, className }: { title: string; summary?: string | null | undefined; loading?: boolean | undefined; error?: boolean | undefined; placeholder?: boolean | undefined; children?: React.ReactNode; className?: string | undefined }) {
  return <Panel className={cn("overflow-hidden border-primary/20", className)}><div className="border-b border-primary/15 bg-primary/5 px-4 py-3"><div className="flex flex-wrap items-center gap-2"><Sparkles className="size-4 text-primary" /><h3 className="font-display text-sm font-bold">{title}</h3>{placeholder ? <span className="rounded border border-dashed border-muted-foreground/50 px-2 py-0.5 text-[9px] font-bold uppercase text-muted-foreground" title="Temporary hold until the Oval Insights API is connected">Placeholder</span> : <span className="rounded bg-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase text-primary">AI generated</span>}</div></div><div className="p-4">{loading ? <div className="space-y-2" aria-label="Generating AI insight"><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-11/12" /><Skeleton className="h-3 w-4/5" /></div> : error || !summary ? <p className="text-[13px] text-muted-foreground">Insights unavailable for this match</p> : <p className={cn("text-[13px] leading-6", placeholder ? "italic text-muted-foreground" : "text-foreground/90")}>{summary}</p>}{children}</div></Panel>;
}

export function MatchInsight({ match, perspective, summary, loading, error, placeholder }: { match: InsightMatch; perspective: InsightPerspective; summary?: string | null | undefined; loading?: boolean | undefined; error?: boolean | undefined; placeholder?: boolean | undefined }) {
  const stats = getHeadlineStats(match, perspective);
  return <AIInsightCard title={match.title} summary={summary} loading={loading} error={error} placeholder={placeholder}><div className="mt-2 text-[11px] text-muted-foreground">{match.meta}</div>{stats.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{stats.map((stat) => <span key={`${stat.label}-${stat.value}`} className="rounded border border-border bg-muted/60 px-2 py-1 text-[10px]"><span className="text-muted-foreground">{stat.label}</span> <strong className="ml-1 text-foreground">{stat.value}</strong></span>)}</div>}</AIInsightCard>;
}

async function fetchInsights(items: AiInsightItem[]): Promise<AiInsightResult[]> {
  const response = await fetch("/api/v1/insights", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: items.map(toWireItem) }) });
  if (!response.ok) throw new Error(`Insights request failed (${response.status})`);
  const body = (await response.json()) as { items: AiInsightResult[] };
  return body.items;
}

export function AIInsightSection({ title, overview, matches, perspective }: { title: string; overview: AiInsightItem; matches: Array<{ request: AiInsightItem; match: InsightMatch }>; perspective: InsightPerspective }) {
  const requests = [overview, ...matches.map((item) => item.request)];
  const query = useQuery({
    queryKey: ["ai-insights", ...requests.map((item) => item.cacheKey)],
    queryFn: () => fetchInsights(requests),
    staleTime: Infinity,
    retry: false,
  });
  const resultFor = (cacheKey: string) => query.data?.find((item) => item.cacheKey === cacheKey);
  const overviewResult = resultFor(overview.cacheKey);
  return <section className="mt-5" aria-label={title}><AIInsightCard title={title} summary={overviewResult?.summary} loading={query.isLoading} error={query.isError || Boolean(overviewResult?.error)} placeholder={overviewResult?.placeholder} /><div className="mt-3 grid gap-3 lg:grid-cols-2">{matches.map(({ request, match }) => { const result = resultFor(request.cacheKey); return <MatchInsight key={request.cacheKey} match={match} perspective={perspective} summary={result?.summary} loading={query.isLoading} error={query.isError || Boolean(result?.error)} placeholder={result?.placeholder} />; })}</div></section>;
}
