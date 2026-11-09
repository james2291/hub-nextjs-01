"use client";

import { Link } from "@/lib/link";
import { Download } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { readHomePin } from "@/lib/pins";

import { PageBody, Panel, StatStrip } from "@/components/oval/app-shell";
import { Button } from "@/components/ui/button";
import { getNextFixture, getTeam } from "@/data/hub";
import { cn } from "@/lib/utils";



export function HomeView() {
  useEffect(() => {
    const home = readHomePin();
    if (home && home !== "/" && !sessionStorage.getItem("oval-hub:home-visited")) { sessionStorage.setItem("oval-hub:home-visited", "1"); window.location.replace(home); }
  }, []);
  const team = getTeam("harlequins");
  const next = getNextFixture("harlequins");
  if (!team || !next) return <PageBody><Panel className="p-8">Next fixture not supplied.</Panel></PageBody>;
  const opponent = next.opponent;
  const position = next.competition.standings.findIndex((row) => row.teamId === team.id) + 1;
  const standings = next.competition.standings.slice(0, 6);
  return <PageBody>
    <div className="mb-4 flex items-baseline gap-3"><h1 className="text-xl font-semibold">Semi-final week</h1><span className="text-xs text-muted-foreground">Tuesday 9 June · Harlequins · {position}th in {next.competition.name}, {team.stats[0]?.detail}</span></div>
    <div className="grid gap-px overflow-hidden rounded border border-border bg-border xl:grid-cols-12">
      <section className="bg-card xl:col-span-12"><PanelHeading title="Next match" meta={next.fixture.round}/><div className="flex flex-wrap items-baseline gap-3 border-b border-border px-4 py-3"><strong className="text-xl">{next.fixture.fixture}</strong><span className="text-xs text-muted-foreground">Sat 13 Jun · {next.fixture.venue} · kick-off in 4 days</span><Link to="/teams/$teamId/$tab" params={{ teamId: opponent?.id ?? "bath-rugby", tab: "head-to-head" }} className="ml-auto text-xs font-medium text-primary">Head-to-head</Link></div><ComparisonRow label="" left={opponent?.name ?? "Opponent"} right={team.name} header/><ComparisonRow label="League position" left={opponent?.position ?? "—"} right={team.position}/><ComparisonRow label="Points" left={opponent?.stats[0]?.detail.replace(" points", "") ?? "—"} right={team.stats[0]?.detail.replace(" points", "") ?? "—"}/><ComparisonRow label="Won · drawn · lost" left={opponent?.record ?? "Not supplied"} right={team.record}/><ComparisonRow label="Last 5 (newest first)" left={opponent?.form.join(" ") ?? "—"} right={team.form.join(" ")}/><ComparisonRow label="Points per match" left={opponent?.stats[1]?.detail.replace(" per match", "") ?? "—"} right={team.stats[1]?.detail.replace(" per match", "") ?? "—"}/><div className="border-t border-border px-4 py-2.5 text-xs text-muted-foreground">Last meeting 23 May: Harlequins 17–26 Bath (L). 12 clips tagged.</div></section>
    </div>

    <div className="my-4 flex items-baseline justify-between"><h2 className="text-[13px] font-semibold">Season 2025/26</h2><span className="text-xs text-muted-foreground">League figures are Gallagher PREM averages per team</span></div>
    <StatStrip stats={team.stats.slice(1,3).concat([{ label: "Tackle success", value: "86.4%", detail: "+4.0 pts on league 82.4%" }, { label: "Lineout retention", value: "88.0%", detail: "+1.9 pts on league 86.1%" }])}/>

    <div className="grid gap-px overflow-hidden rounded border border-border bg-border xl:grid-cols-12">
      <section className="bg-card xl:col-span-7"><PanelHeading title="Results" meta={<Link to="/teams/$teamId/$tab" params={{ teamId: team.id, tab: "fixture-card" }}>Fixture Card</Link>}/><div className="grid h-7 grid-cols-[80px_1fr_28px_70px_50px] items-center px-4 text-[11px] text-muted-foreground"><span>Date</span><span>Opponent</span><span/><span className="text-right">Score</span><span className="text-right">Clips</span></div>{team.recentMatches.map((match, index) => { const row = <><span className="text-muted-foreground">{match.date.replace(" 2026", "")}</span><span>{match.opponent}</span><span className={cn("font-mono", match.result === "W" ? "text-success" : match.result === "L" ? "text-destructive" : "text-muted-foreground")}>{match.result}</span><strong className="text-right">{match.score}</strong><span className="text-right text-muted-foreground">{match.clips}</span></>; const classes = "grid h-9 grid-cols-[80px_1fr_28px_70px_50px] items-center border-t border-border px-4 text-xs"; return index === 0 ? <Link key={match.date} to="/matches/$matchId/$tab" params={{ matchId: "gallagher-prem-0", tab: "overview" }} className={classes}>{row}</Link> : <div key={match.date} className={classes}>{row}</div>; })}</section>
      <section className="bg-card xl:col-span-5"><PanelHeading title={next.competition.name} meta="Top 4 to semi-finals"/><div className="grid h-7 grid-cols-[24px_1fr_repeat(5,32px)] items-center px-4 text-[11px] text-muted-foreground"><span>#</span><span>Team</span><span>P</span><span>W</span><span>D</span><span>L</span><span>Pts</span></div>{standings.map((row, index) => <Link key={row.teamId} to="/teams/$teamId/$tab" params={{ teamId: row.teamId, tab: "match-room" }} className={cn("grid h-9 grid-cols-[24px_1fr_repeat(5,32px)] items-center border-t border-border px-4 text-xs", row.teamId === team.id && "border-l-2 border-l-primary bg-primary/5")}><span>{index + 1}</span><span className={row.teamId === team.id ? "font-semibold" : ""}>{row.team}</span><span>{row.p}</span><span>{row.w}</span><span>{row.d}</span><span>{row.l}</span><strong>{row.pts}</strong></Link>)}</section>
    </div>

    <Panel className="mt-4 overflow-hidden"><PanelHeading title="Recent reports" meta={<Link to="/teams/$teamId/$tab" params={{ teamId: team.id, tab: "fixture-card" }}>Fixture Card</Link>}/><div className="grid h-7 grid-cols-[90px_1fr_110px_150px_70px_80px] items-center px-4 text-[11px] text-muted-foreground"><span>Type</span><span>Report</span><span>Formats</span><span>Owner</span><span>Date</span><span className="text-right">Status</span></div>{[["Match","Harlequins v Northampton · match pack","PDF CSV XML","James Molyneux","6 Jun","Ready"],["Team","Round 18 attacking trends","PDF · video","James Molyneux","6 Jun","Ready"],["Opposition","Bath opposition preview","PDF · video","Coaching group","9 Jun","Processing"]].map((row) => <div key={row[1]} className="grid min-h-9 grid-cols-[90px_1fr_110px_150px_70px_80px] items-center border-t border-border px-4 text-xs"><span className="text-muted-foreground">{row[0]}</span><span>{row[1]}</span><span className="font-mono text-[11px] text-muted-foreground">{row[2]}</span><span>{row[3]}</span><span className="text-muted-foreground">{row[4]}</span><span className={cn("text-right", row[5] === "Processing" && "text-highlight")}>{row[5]}</span></div>)}</Panel>
  </PageBody>;
}

function PanelHeading({ title, meta }: { title: string; meta: ReactNode }) { return <div className="flex h-10 items-center justify-between border-b border-border px-4"><h2 className="text-[13px] font-semibold">{title}</h2><span className="text-xs text-muted-foreground">{meta}</span></div>; }
function ComparisonRow({ label, left, right, header = false }: { label: string; left: string; right: string; header?: boolean }) { return <div className={cn("grid grid-cols-[1fr_120px_120px] items-center gap-3 border-b border-border px-4", header ? "h-7 text-[11px] text-muted-foreground" : "h-9 text-xs")}><span className="text-muted-foreground">{label}</span><span className="text-right">{left}</span><span className="text-right">{right}</span></div>; }
