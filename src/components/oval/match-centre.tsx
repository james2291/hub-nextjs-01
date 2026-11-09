"use client";

import { Link } from "@/lib/link";
import { Activity, ArrowLeft, CalendarDays, ChevronRight, Clock3, Filter, MapPin, Shield, UserRound } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Panel } from "@/components/oval/app-shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type CentreMatch = {
  id: string;
  round: string;
  fixture: string;
  date: string;
  venue?: string;
  result: string;
  involvement?: string;
  minutes?: number;
};

const analysisTabs = ["Overview", "Video", "Lineups", "Stats", "Player Data", "Reports", "Files & Feeds"] as const;

function splitFixture(fixture: string) {
  const [home = fixture, away = "Away team"] = fixture.split(" v ");
  return { home, away };
}

function splitScore(result: string) {
  if (result === "Upcoming") return null;
  const scores = result.split(/\s*[—–-]\s*/);
  if (scores.length !== 2) return null;
  return { home: scores[0], away: scores[1] };
}

function TeamMark({ name }: { name: string }) {
  const initials = name.split(" ").map((word) => word[0]).join("").slice(0, 3).toUpperCase();
  return <span className="grid size-11 shrink-0 place-items-center rounded-full border border-primary/20 bg-primary/10 font-display text-xs font-bold text-primary sm:size-14">{initials}</span>;
}

function DataUnavailable({ label }: { label: string }) {
  return <div className="flex min-h-28 flex-col items-center justify-center border border-dashed border-border bg-muted/25 p-4 text-center"><Activity className="size-4 text-muted-foreground" /><p className="mt-2 text-xs font-semibold">{label} not supplied</p><p className="mt-1 max-w-xs text-[11px] text-muted-foreground">This panel will populate when the connected match feed includes this data.</p></div>;
}

function CompetitionFixtureBrowser({ matches, entityName, competitionId }: { matches: CentreMatch[]; entityName: string; competitionId: string }) {
  const rounds = Array.from(new Set(matches.map((match) => match.round)));
  const teams = Array.from(new Set(matches.flatMap((match) => Object.values(splitFixture(match.fixture))))).sort();
  const [status, setStatus] = useState<"All" | "Completed" | "Upcoming" | "Live">("All");
  const [round, setRound] = useState("All rounds");
  const [team, setTeam] = useState("All teams");
  const filtered = matches.filter((match) => {
    const statusMatch = status === "All" || (status === "Upcoming" ? match.result === "Upcoming" : status === "Completed" ? match.result !== "Upcoming" : false);
    return statusMatch && (round === "All rounds" || match.round === round) && (team === "All teams" || match.fixture.includes(team));
  });

  if (!matches.length) return <Panel className="p-10 text-center"><Activity className="mx-auto size-7 text-primary" /><h3 className="mt-3 font-display text-lg font-bold">No matches available</h3><p className="mt-1 text-[13px] text-muted-foreground">No match-centre records are connected to {entityName} for this season.</p></Panel>;

  return <Panel className="overflow-hidden">
    <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
      <div><h3 className="font-display font-semibold">Fixtures &amp; results</h3><p className="text-[11px] text-muted-foreground">Select a match to open its full match centre page</p></div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[150px_180px_auto]">
        <select aria-label="Filter by team" value={team} onChange={(event) => setTeam(event.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-ring"><option>All teams</option>{teams.map((item) => <option key={item}>{item}</option>)}</select>
        <select aria-label="Filter by round" value={round} onChange={(event) => setRound(event.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-ring"><option>All rounds</option>{rounds.map((item) => <option key={item}>{item}</option>)}</select>
        <Filter className="hidden size-4 self-center text-muted-foreground lg:block" />
      </div>
    </div>
    <div className="flex gap-1 overflow-x-auto border-b border-border bg-muted/30 p-2">{(["All", "Live", "Upcoming", "Completed"] as const).map((item) => <Button key={item} variant={status === item ? "default" : "ghost"} size="sm" onClick={() => setStatus(item)} className="shrink-0 text-xs">{item}</Button>)}</div>
    {filtered.length ? <div className="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-3">{filtered.map((match) => {
      const names = splitFixture(match.fixture);
      const matchScore = splitScore(match.result);
      return <Button key={match.id} asChild variant="ghost" className="h-auto min-h-36 flex-col items-stretch justify-between rounded-none bg-card p-0 text-left hover:bg-muted/40">
        <Link to="/matches/$matchId/$tab" params={{ matchId: match.id, tab: "overview" }}>
          <span className="flex items-center justify-between bg-foreground px-3 py-1.5 text-[10px] font-semibold uppercase text-background"><span>{match.round}</span><span>{match.result === "Upcoming" ? "Scheduled" : "Full time"}</span></span>
          <span className="flex flex-1 items-center gap-3 px-3 py-4"><TeamMark name={names.home} /><span className="min-w-0 flex-1 text-center"><span className="block font-display text-xl font-bold">{matchScore ? `${matchScore.home} : ${matchScore.away}` : "v"}</span><span className="mt-1 block truncate text-[10px] text-muted-foreground">{names.home} · {names.away}</span></span><TeamMark name={names.away} /></span>
          <span className="flex items-center justify-between border-t border-border px-3 py-2 text-[10px] text-muted-foreground"><span>{match.date}</span><span className="max-w-[45%] truncate">{match.venue ?? "Venue not supplied"}</span></span>
        </Link>
      </Button>;
    })}</div> : <div className="p-8 text-center"><Filter className="mx-auto size-5 text-muted-foreground" /><p className="mt-2 text-xs font-semibold">No fixtures match these filters</p></div>}
  </Panel>;
}

export function CompetitionMatchDetail({ match, entityName, competitionId, initialTab = "overview" }: { match: CentreMatch; entityName: string; competitionId: string; initialTab?: string }) {
  const normalisedInitial = analysisTabs.find((item) => item.toLowerCase().replaceAll(" & ", "-").replaceAll(" ", "-") === initialTab) ?? "Overview";
  const [analysisTab, setAnalysisTab] = useState<(typeof analysisTabs)[number]>(normalisedInitial);
  const selectedTeams = splitFixture(match.fixture);
  const score = splitScore(match.result);
  return <div className="space-y-4">
    <Panel className="overflow-hidden">
      <div className="bg-foreground px-4 py-6 text-background sm:px-8">
        <div className="mb-5 flex flex-wrap items-center justify-center gap-2 text-[10px] uppercase text-background/65"><span>{match.round}</span><span>·</span><span>{match.venue ?? "Venue not supplied"}</span><span>·</span><span>{match.date}</span></div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-8">
          <div className="flex min-w-0 flex-col items-center gap-2 text-center sm:flex-row sm:text-left"><TeamMark name={selectedTeams.home} /><h3 className="text-sm font-bold sm:text-xl">{selectedTeams.home}</h3></div>
          <div className="text-center"><div className="font-display text-3xl font-bold tabular-nums sm:text-5xl">{score ? `${score.home} : ${score.away}` : "VS"}</div><span className={cn("mt-2 inline-flex rounded px-2 py-1 text-[9px] font-bold uppercase", score ? "bg-success text-primary-foreground" : "bg-highlight text-primary-foreground")}>{score ? "Full time" : "Scheduled"}</span></div>
          <div className="flex min-w-0 flex-col-reverse items-center gap-2 text-center sm:flex-row sm:justify-end sm:text-right"><h3 className="text-sm font-bold sm:text-xl">{selectedTeams.away}</h3><TeamMark name={selectedTeams.away} /></div>
        </div>
      </div>
      <div className="flex overflow-x-auto border-b border-border bg-muted/35 px-2 sm:px-4">{analysisTabs.map((item) => { const slug = item.toLowerCase().replaceAll(" & ", "-").replaceAll(" ", "-"); return <Button key={item} asChild variant="ghost" className={cn("h-11 shrink-0 rounded-none border-b-2 px-3 text-xs", analysisTab === item ? "border-foreground text-foreground" : "border-transparent text-muted-foreground")}><Link to="/matches/$matchId/$tab" params={{ matchId: match.id, tab: slug }} onClick={() => setAnalysisTab(item)}>{item}</Link></Button>; })}</div>
       {analysisTab === "Overview" ? <div className="p-4 sm:p-6">
        <div className="mb-4 grid gap-px bg-border sm:grid-cols-3"><div className="bg-card p-4"><CalendarDays className="size-4 text-primary" /><div className="mt-2 text-[10px] uppercase text-muted-foreground">Date</div><div className="mt-1 text-xs font-semibold">{match.date}</div></div><div className="bg-card p-4"><MapPin className="size-4 text-primary" /><div className="mt-2 text-[10px] uppercase text-muted-foreground">Venue</div><div className="mt-1 text-xs font-semibold">{match.venue ?? "Not supplied"}</div></div><div className="bg-card p-4"><Shield className="size-4 text-primary" /><div className="mt-2 text-[10px] uppercase text-muted-foreground">Competition</div><div className="mt-1 text-xs font-semibold">{entityName}</div></div></div>
        <div className="grid gap-3 lg:grid-cols-3"><DataUnavailable label="Attack comparison" /><DataUnavailable label="Possession and territory" /><DataUnavailable label="Defence comparison" /><DataUnavailable label="Rucks and mauls" /><DataUnavailable label="Penalties and discipline" /><DataUnavailable label="Set piece comparison" /></div>
      </div> : <div className="p-4 sm:p-6"><DataUnavailable label={analysisTab} /></div>}
    </Panel>
  </div>;
}

export function MatchCentre({ matches, entityName, playerMode = false, competitionId }: { matches: CentreMatch[]; entityName: string; playerMode?: boolean; competitionId?: string }) {
  // Hooks first: the prototype returned early before calling them (rules-of-hooks violation).
  const [selectedId, setSelectedId] = useState(matches[0]?.id ?? "");
  const selected = useMemo(() => matches.find((match) => match.id === selectedId) ?? matches[0], [matches, selectedId]);
  if (competitionId) return <CompetitionFixtureBrowser matches={matches} entityName={entityName} competitionId={competitionId} />;

  if (!selected) return <Panel className="p-10 text-center"><Activity className="mx-auto size-7 text-primary" /><h3 className="mt-3 font-display text-lg font-bold">No matches available</h3><p className="mt-1 text-[13px] text-muted-foreground">No match-centre records are connected to {entityName} for this season.</p></Panel>;

  return <div className="grid gap-4 xl:grid-cols-[minmax(300px,0.85fr)_minmax(0,1.5fr)]">
    <Panel className="overflow-hidden">
      <div className="border-b border-border p-4"><h3 className="font-display font-semibold">Fixtures &amp; results</h3><p className="text-[11px] text-muted-foreground">Select a match to open its centre view</p></div>
      <div className="divide-y divide-border">{matches.map((match) => <Button key={match.id} variant="ghost" onClick={() => setSelectedId(match.id)} className={cn("h-auto w-full justify-start rounded-none px-4 py-3 text-left hover:bg-muted/60", selected.id === match.id && "bg-primary/5")}>
        <span className={cn("size-2 shrink-0 rounded-full", match.result === "Upcoming" ? "bg-highlight" : "bg-success")} />
        <span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-semibold">{match.fixture}</span><span className="mt-0.5 block text-[11px] text-muted-foreground">{match.round} · {match.date}</span>{match.involvement && <span className="mt-1 block text-[11px] font-semibold text-primary">{match.involvement}</span>}</span>
        <span className="font-display text-xs font-bold">{match.result}</span><ChevronRight className="size-4 shrink-0 text-muted-foreground" />
      </Button>)}</div>
    </Panel>
    <Panel className="overflow-hidden">
      <div className="border-b border-border bg-muted/40 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><div className="text-[10px] font-semibold uppercase text-primary">{selected.round}</div><h3 className="mt-1 font-display text-lg font-bold">{selected.fixture}</h3></div><span className={cn("rounded px-2.5 py-1 text-[10px] font-bold uppercase", selected.result === "Upcoming" ? "bg-highlight/10 text-highlight" : "bg-success/12 text-success")}>{selected.result === "Upcoming" ? "Scheduled" : "Full time"}</span></div></div>
      <div className="grid gap-px bg-border sm:grid-cols-3"><div className="bg-card p-4"><CalendarDays className="size-4 text-primary" /><div className="mt-2 text-[10px] uppercase text-muted-foreground">Date</div><div className="mt-1 text-xs font-semibold">{selected.date}</div></div><div className="bg-card p-4"><MapPin className="size-4 text-primary" /><div className="mt-2 text-[10px] uppercase text-muted-foreground">Venue</div><div className="mt-1 text-xs font-semibold">{selected.venue ?? "Not supplied"}</div></div><div className="bg-card p-4">{playerMode ? <UserRound className="size-4 text-primary" /> : <Clock3 className="size-4 text-primary" />}<div className="mt-2 text-[10px] uppercase text-muted-foreground">{playerMode ? "Player minutes" : "Status"}</div><div className="mt-1 text-xs font-semibold">{playerMode && selected.minutes !== undefined ? `${selected.minutes} minutes` : selected.result === "Upcoming" ? "Awaiting kick-off" : "Complete"}</div></div></div>
      <div className="p-4"><h4 className="font-display text-sm font-semibold">Match analysis</h4>{selected.involvement ? <div className="mt-3 border-l-2 border-primary bg-primary/5 px-4 py-3"><div className="text-[10px] font-semibold uppercase text-primary">Highlighted involvement</div><p className="mt-1 text-[13px] font-semibold">{selected.involvement}</p></div> : null}<div className="mt-4 rounded-md border border-dashed border-border p-6 text-center"><p className="text-[13px] font-semibold">Detailed event timeline not connected</p><p className="mt-1 text-[11px] text-muted-foreground">The fixture record is available, but event-by-event analysis has not been supplied.</p></div></div>
    </Panel>
  </div>;
}

function buildXml(competitionName: string, fixture: string) {
  return `<feed status="unavailable" generated="${new Date().toISOString()}">\n  <competition>${competitionName}</competition>\n  <fixture>${fixture}</fixture>\n  <message>No live event payload supplied</message>\n</feed>\n`;
}

function LiveXmlCapture({ competitionName, fixture }: { competitionName: string; fixture: string }) {
  const [frequency, setFrequency] = useState(60);
  const [running, setRunning] = useState(false);
  const [saved, setSaved] = useState(0);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const save = useCallback(() => {
    const blob = new Blob([buildXml(competitionName, fixture)], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fixture.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-${Date.now()}.xml`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setSaved((count) => count + 1);
    setLastSavedAt(new Date().toLocaleTimeString());
  }, [competitionName, fixture]);

  useEffect(() => {
    if (!running) return;
    save();
    const timer = window.setInterval(save, Math.max(5, frequency) * 1000);
    return () => window.clearInterval(timer);
  }, [running, frequency, save]);

  useEffect(() => { setRunning(false); setSaved(0); setLastSavedAt(null); }, [fixture]);

  return <div className="border-t border-border bg-muted/30 p-4">
    <div className="flex flex-wrap items-center gap-3">
      <label className="flex items-center gap-2 text-xs font-semibold" htmlFor="xml-frequency">Set frequency
        <input id="xml-frequency" type="number" min={5} step={5} value={frequency} disabled={running} onChange={(event) => setFrequency(Number(event.target.value) || 5)} className="h-9 w-20 rounded-md border border-input bg-background px-2 text-xs tabular-nums outline-none focus:ring-1 focus:ring-ring disabled:opacity-60" />
        <span className="text-[11px] font-normal text-muted-foreground">seconds</span>
      </label>
      <Button size="sm" onClick={() => setRunning(true)} disabled={running} className="px-6 text-xs">Start</Button>
      <Button size="sm" variant="outline" onClick={() => setRunning(false)} disabled={!running} className="px-6 text-xs">Stop</Button>
      {running && <span className="flex items-center gap-2 text-[11px] font-semibold text-primary"><span className="relative flex size-2.5"><span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" /><span className="relative inline-flex size-2.5 rounded-full bg-primary" /></span>Saving every {Math.max(5, frequency)}s</span>}
    </div>
    <p className="mt-3 text-[11px] text-muted-foreground">{saved > 0 ? `${saved} file${saved === 1 ? "" : "s"} saved · last at ${lastSavedAt}. Files go to your browser's download location — set that to Desktop to save there.` : "Start capture to download the live XML on a repeating interval."}</p>
  </div>;
}

export function LiveXmlBrowser({ matches, competitionName }: { matches: CentreMatch[]; competitionName: string }) {
  const [selectedId, setSelectedId] = useState(matches[0]?.id ?? "");
  const selected = matches.find((match) => match.id === selectedId) ?? matches[0];
  const recent = matches.filter((match) => match.result !== "Upcoming");
  const upcoming = matches.filter((match) => match.result === "Upcoming");

  const MatchButton = ({ match }: { match: CentreMatch }) => <Button variant="ghost" onClick={() => setSelectedId(match.id)} className={cn("h-auto w-full justify-start rounded-none border-b border-border px-4 py-3 text-left last:border-b-0 hover:bg-muted/60", selected?.id === match.id && "bg-primary/5")}><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold">{match.fixture}</span><span className="text-[11px] text-muted-foreground">{match.date} · {match.round}</span></span><span className="text-[10px] font-bold text-muted-foreground">{match.result}</span><ChevronRight className="size-4 text-muted-foreground" /></Button>;

  return <div className="grid gap-4 xl:grid-cols-[minmax(300px,0.85fr)_minmax(0,1.5fr)]"><div className="space-y-4"><Panel className="p-4"><div className="flex items-center gap-2"><span className="size-2 rounded-full bg-muted-foreground" /><h3 className="font-display text-sm font-semibold">Live now</h3></div><p className="mt-3 text-[12px] text-muted-foreground">No live {competitionName} matches are currently connected.</p></Panel>{upcoming.length > 0 && <Panel className="overflow-hidden"><div className="border-b border-border px-4 py-3 text-[10px] font-semibold uppercase text-muted-foreground">Upcoming</div>{upcoming.map((match) => <MatchButton key={match.id} match={match} />)}</Panel>}{recent.length > 0 && <Panel className="overflow-hidden"><div className="border-b border-border px-4 py-3 text-[10px] font-semibold uppercase text-muted-foreground">Recent</div>{recent.map((match) => <MatchButton key={match.id} match={match} />)}</Panel>}</div><Panel className="overflow-hidden"><div className="flex items-center justify-between border-b border-border p-4"><div><div className="text-[10px] font-semibold uppercase text-primary">Live XML data</div><h3 className="mt-1 font-display font-semibold">{selected?.fixture ?? "Select a fixture"}</h3></div><Activity className="size-5 text-primary" /></div><div className="p-4"><div className="rounded-md bg-foreground p-5 font-mono text-[11px] leading-6 text-background"><span className="text-background/60">&lt;feed status=&quot;unavailable&quot;&gt;</span><br />&nbsp;&nbsp;&lt;competition&gt;{competitionName}&lt;/competition&gt;<br />&nbsp;&nbsp;&lt;fixture&gt;{selected?.fixture ?? ""}&lt;/fixture&gt;<br />&nbsp;&nbsp;&lt;message&gt;No live event payload supplied&lt;/message&gt;<br /><span className="text-background/60">&lt;/feed&gt;</span></div><p className="mt-3 text-[11px] text-muted-foreground">Fixture metadata is connected. Live event XML will appear here when a feed is active.</p></div>{selected && <LiveXmlCapture competitionName={competitionName} fixture={selected.fixture} />}</Panel></div>;
}