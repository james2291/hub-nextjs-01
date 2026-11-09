"use client";

import { Link } from "@/lib/link";
import { ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

import { Panel } from "@/components/oval/app-shell";
import { Button } from "@/components/ui/button";
import { getTeam, players, type Competition } from "@/data/hub";
import { cn } from "@/lib/utils";

type TeamMetricValue = { teamId: string; team: string; total: number | null; average: number | null; suffix: string };

function toNumber(value: string | undefined) {
  if (!value) return null;
  const match = value.replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function suffixOf(value: string | undefined) {
  return value && value.includes("%") ? "%" : "";
}

function teamMetricOptions(competition: Competition) {
  const labels = new Set<string>();
  competition.standings.forEach((row) => {
    const team = getTeam(row.teamId);
    team?.stats.forEach((stat) => { if (toNumber(stat.value) !== null) labels.add(stat.label); });
    team?.performance.forEach((item) => { if (toNumber(item.value) !== null) labels.add(item.label); });
  });
  return ["League points", ...Array.from(labels)];
}

function metricValues(competition: Competition, metric: string): TeamMetricValue[] {
  return competition.standings.map((row) => {
    if (metric === "League points") return { teamId: row.teamId, team: row.team, total: row.pts, average: row.p ? Number((row.pts / row.p).toFixed(1)) : null, suffix: "" };
    const team = getTeam(row.teamId);
    const stat = team?.stats.find((item) => item.label === metric);
    const perf = team?.performance.find((item) => item.label === metric);
    const source = stat ?? perf;
    const total = toNumber(source?.value);
    const average = stat ? toNumber(stat.detail) : total;
    return { teamId: row.teamId, team: row.team, total, average, suffix: suffixOf(source?.value) };
  });
}

function Dial({ label, value, progress, tone }: { label: string; value: string; progress: number; tone: "primary" | "highlight" }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.max(0, Math.min(100, progress)) / 100) * circumference;
  return <div className="text-center">
    <div className="relative mx-auto grid size-24 place-items-center">
      <svg viewBox="0 0 96 96" className="size-24 -rotate-90">
        <circle cx="48" cy="48" r={radius} fill="transparent" strokeWidth="8" className="stroke-muted" />
        <circle cx="48" cy="48" r={radius} fill="transparent" strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} className={tone === "primary" ? "stroke-primary" : "stroke-highlight"} />
      </svg>
      <span className="absolute font-display text-base font-bold">{value}</span>
    </div>
    <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
  </div>;
}

function playerMetricOptions() {
  const counts = new Map<string, number>();
  players.forEach((player) => player.stats.forEach((stat) => { if (toNumber(stat.value) !== null) counts.set(stat.label, (counts.get(stat.label) ?? 0) + 1); }));
  return Array.from(counts.entries()).filter(([, count]) => count > 1).map(([label]) => label);
}

export function CompetitionPeople({ competition }: { competition: Competition }) {
  const teamMetrics = useMemo(() => teamMetricOptions(competition), [competition]);
  const playerMetrics = useMemo(() => playerMetricOptions(), []);
  const [metric, setMetric] = useState(teamMetrics[0] ?? "League points");
  const [mode, setMode] = useState<"Total" | "Average">("Total");
  const [teamFilter, setTeamFilter] = useState("All teams");
  const [topTenMetric, setTopTenMetric] = useState("All metrics");

  const rows = useMemo(() => metricValues(competition, metric)
    .map((row) => ({ ...row, value: mode === "Total" ? row.total : row.average }))
    .sort((a, b) => (b.value ?? -Infinity) - (a.value ?? -Infinity)), [competition, metric, mode]);
  const supplied = rows.filter((row) => row.value !== null);
  const max = supplied.length ? Math.max(...supplied.map((row) => row.value as number)) : 0;
  const average = supplied.length ? supplied.reduce((sum, row) => sum + (row.value as number), 0) / supplied.length : 0;
  const suffix = supplied[0]?.suffix ?? "";

  const teamIds = competition.standings.map((row) => row.teamId);
  const competitionPlayers = useMemo(() => players.filter((player) => teamIds.includes(player.teamId)), [teamIds]);
  const rankPlayers = (label: string) => competitionPlayers
    .map((player) => ({ player, value: toNumber(player.stats.find((stat) => stat.label === label)?.value) }))
    .filter((entry): entry is { player: (typeof competitionPlayers)[number]; value: number } => entry.value !== null)
    .sort((a, b) => b.value - a.value);
  const shownMetrics = topTenMetric === "All metrics" ? playerMetrics : playerMetrics.filter((item) => item === topTenMetric);
  const dials = competition.trends.slice(0, 2);

  return <div className="space-y-8">
    <div className="border-b border-border pb-4">
      <div className="text-[10px] font-semibold uppercase text-primary">Entity view</div>
      <h2 className="mt-1 font-display text-xl font-bold">Teams and Players</h2>
      <p className="mt-1 text-[12px] text-muted-foreground">{competition.name} · {competition.season} · {competition.standings.length} connected clubs</p>
    </div>

    <section className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h3 className="font-display text-lg font-bold">Teams</h3>
          <p className="text-[11px] text-muted-foreground">Club comparison across the competition on the selected metric.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-md bg-muted p-1">{(["Total", "Average"] as const).map((item) => <Button key={item} variant="ghost" size="sm" onClick={() => setMode(item)} className={cn("h-7 rounded text-xs", mode === item ? "bg-card shadow-sm" : "text-muted-foreground")}>{item}</Button>)}</div>
          <select aria-label="Filter by team" value={teamFilter} onChange={(event) => setTeamFilter(event.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-ring"><option>All teams</option>{competition.standings.map((row) => <option key={row.teamId}>{row.team}</option>)}</select>
          <select aria-label="Select team metric" value={metric} onChange={(event) => setMetric(event.target.value)} className="h-9 min-w-44 rounded-md border border-input bg-background px-3 text-xs font-semibold outline-none focus:ring-1 focus:ring-ring">{teamMetrics.map((item) => <option key={item}>{item}</option>)}</select>
        </div>
      </div>

    <div className="grid gap-4 xl:grid-cols-12">
      <Panel className="overflow-hidden xl:col-span-8">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-4">
          <h3 className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground">{metric} vs competition average</h3>
          <span className="text-[10px] font-bold uppercase text-muted-foreground">{supplied.length ? `Competition average: ${average.toFixed(1)}${suffix}` : "Metric not supplied"}</span>
        </div>
        <div className="space-y-4 p-5">
          {rows.map((row) => {
            const dimmed = teamFilter !== "All teams" && row.team !== teamFilter;
            const width = row.value !== null && max ? Math.max(4, ((row.value as number) / max) * 100) : 0;
            const averageLeft = max ? (average / max) * 100 : 0;
            return <Link key={row.teamId} to="/teams/$teamId/$tab" params={{ teamId: row.teamId, tab: "match-room" }} className={cn("block space-y-1.5", dimmed && "opacity-35")}>
              <div className="flex items-center justify-between text-xs font-bold"><span>{row.team}</span><span className="tabular-nums">{row.value !== null ? `${row.value}${suffix}` : "Not supplied"}</span></div>
              <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
                <div className={cn("absolute inset-y-0 left-0", (row.value ?? 0) >= average ? "bg-primary" : "bg-primary/35")} style={{ width: `${width}%` }} />
                {supplied.length > 0 && <div className="absolute inset-y-0 w-px bg-foreground/30" style={{ left: `${averageLeft}%` }} />}
              </div>
            </Link>;
          })}
        </div>
        <div className="border-t border-border bg-muted/40 px-5 py-3 text-[11px] text-muted-foreground">Bars compare each club on the selected metric. The vertical marker is the competition average.</div>
      </Panel>

      <div className="space-y-4 xl:col-span-4">
        <Panel className="p-5">
          <h3 className="mb-4 font-display text-xs font-bold uppercase tracking-wider text-muted-foreground">Competition shape</h3>
          {dials.length ? <div className="flex items-center justify-around">{dials.map((trend, index) => <Dial key={trend.label} label={trend.label} value={trend.value} progress={trend.progress} tone={index === 0 ? "highlight" : "primary"} />)}</div> : <p className="text-[12px] text-muted-foreground">No competition trend data is connected.</p>}
        </Panel>
      </div>
      </div>
    </section>

    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2 border-t border-border pt-6">
        <div>
          <h3 className="font-display text-lg font-bold">Players</h3>
          <p className="text-[11px] text-muted-foreground">Top 10 players across the competition on each connected metric.</p>
        </div>
        {playerMetrics.length > 0 && <select aria-label="Filter top 10 metric" value={topTenMetric} onChange={(event) => setTopTenMetric(event.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-xs font-semibold outline-none focus:ring-1 focus:ring-ring"><option>All metrics</option>{playerMetrics.map((item) => <option key={item}>{item}</option>)}</select>}
      </div>

    {shownMetrics.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {shownMetrics.map((metricLabel) => {
        const ranked = rankPlayers(metricLabel).slice(0, 10);
        const leader = ranked[0]?.value ?? 0;
        return <Panel key={metricLabel} className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h4 className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground">{metricLabel}</h4>
            <span className="text-[10px] font-bold uppercase text-muted-foreground">Top {ranked.length}</span>
          </div>
          {ranked.length ? <ol className="divide-y divide-border">{ranked.map((entry, index) => {
            const team = getTeam(entry.player.teamId);
            const dimmed = teamFilter !== "All teams" && team?.name !== teamFilter;
            return <li key={entry.player.id}>
              <Link to="/players/$playerId/$tab" params={{ playerId: entry.player.id, tab: "match-room" }} className={cn("flex items-center gap-3 px-4 py-2.5 hover:bg-muted/60", dimmed && "opacity-35")}>
                <span className="w-5 text-[11px] font-bold tabular-nums text-muted-foreground/60">{String(index + 1).padStart(2, "0")}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold">{entry.player.name}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">{entry.player.position} · {team?.name ?? "Club not supplied"}</span>
                  <span className="mt-1 block h-1.5 w-full overflow-hidden rounded-full bg-muted"><span className="block h-full bg-primary" style={{ width: `${leader ? Math.max(6, ((entry.value as number) / leader) * 100) : 0}%` }} /></span>
                </span>
                <span className="text-[13px] font-bold tabular-nums">{entry.value}</span>
              </Link>
            </li>;
          })}</ol> : <p className="p-6 text-center text-[12px] text-muted-foreground">No player records carry this metric.</p>}
        </Panel>;
      })}
    </div> : <Panel className="p-8 text-center text-[12px] text-muted-foreground">No player metrics are connected for this competition.</Panel>}
    </section>
  </div>;
}
