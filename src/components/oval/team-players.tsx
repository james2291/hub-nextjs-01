"use client";

import { Link } from "@/lib/link";
import { Check, ChevronRight, Search, Shirt, UserRound, UsersRound } from "lucide-react";
import { useMemo, useState } from "react";

import { Panel } from "@/components/oval/app-shell";
import { Button } from "@/components/ui/button";
import { getPlayer, type Player, type Team } from "@/data/hub";
import { cn } from "@/lib/utils";

type SquadView = "Lineup" | "Player";
type PositionFilter = "All" | "Props" | "Hookers" | "Locks" | "Back row" | "Half-backs" | "Centres" | "Back three";

const positionFilters: PositionFilter[] = ["All", "Props", "Hookers", "Locks", "Back row", "Half-backs", "Centres", "Back three"];

type LineupSlot = {
  number: number;
  role: string;
  group: Exclude<PositionFilter, "All">;
};

const lineupSlots: LineupSlot[] = [
  { number: 1, role: "Loosehead prop", group: "Props" },
  { number: 2, role: "Hooker", group: "Hookers" },
  { number: 3, role: "Tighthead prop", group: "Props" },
  { number: 4, role: "Lock", group: "Locks" },
  { number: 5, role: "Lock", group: "Locks" },
  { number: 6, role: "Blindside flanker", group: "Back row" },
  { number: 7, role: "Openside flanker", group: "Back row" },
  { number: 8, role: "Number 8", group: "Back row" },
  { number: 9, role: "Scrum-half", group: "Half-backs" },
  { number: 10, role: "Fly-half", group: "Half-backs" },
  { number: 11, role: "Left wing", group: "Back three" },
  { number: 12, role: "Inside centre", group: "Centres" },
  { number: 13, role: "Outside centre", group: "Centres" },
  { number: 14, role: "Right wing", group: "Back three" },
  { number: 15, role: "Fullback", group: "Back three" },
  { number: 16, role: "Replacement hooker", group: "Hookers" },
  { number: 17, role: "Replacement prop", group: "Props" },
  { number: 18, role: "Replacement prop", group: "Props" },
  { number: 19, role: "Replacement lock", group: "Locks" },
  { number: 20, role: "Replacement back row", group: "Back row" },
  { number: 21, role: "Replacement scrum-half", group: "Half-backs" },
  { number: 22, role: "Replacement back", group: "Centres" },
  { number: 23, role: "Replacement back", group: "Back three" },
];

export function TeamPlayersSection({ team }: { team: Team }) {
  const [view, setView] = useState<SquadView>("Lineup");
  const [positionFilter, setPositionFilter] = useState<PositionFilter>("All");
  const [query, setQuery] = useState("");
  const squad = useMemo(() => team.squad.map(getPlayer).filter((player): player is Player => Boolean(player)), [team.squad]);
  const visible = useMemo(() => squad.filter((player) => matchesPositionFilter(player, positionFilter) && player.name.toLowerCase().includes(query.toLowerCase())), [positionFilter, query, squad]);

  return (
    <>
      <div className="mb-4">
        <div className="text-[10px] font-semibold uppercase text-primary">Entity view</div>
        <h2 className="mt-1 font-display text-xl font-bold">Players</h2>
        <p className="mt-1 text-[12px] text-muted-foreground">Lineup involvement and player records for {team.name}.</p>
      </div>
      {squad.length ? <Panel className="overflow-hidden">
        <PlayersToolbar view={view} setView={setView} positionFilter={positionFilter} setPositionFilter={setPositionFilter} query={query} setQuery={setQuery} visibleCount={visible.length} />
        {view === "Lineup" ? <LineupMatrix team={team} players={squad} positionFilter={positionFilter} query={query} /> : <PlayerRosterTable players={visible} />}
        {view === "Player" && visible.length === 0 && <div className="border-t border-border p-8 text-center text-[13px] text-muted-foreground">No players match these filters.</div>}
      </Panel> : <Panel className="p-10 text-center"><UserRound className="mx-auto size-7 text-primary" /><h3 className="mt-3 font-display text-lg font-bold">Players</h3><p className="mx-auto mt-1 max-w-md text-[13px] text-muted-foreground">Detailed squad records are not connected for this club yet.</p></Panel>}
    </>
  );
}

export function TeamCohesion({ team }: { team: Team }) {
  const [published, setPublished] = useState(false);
  const squad = useMemo(() => team.squad.map(getPlayer).filter((player): player is Player => Boolean(player)), [team.squad]);
  return <>
    <div className="mb-4"><div className="text-[10px] font-semibold uppercase text-primary">Entity view</div><h2 className="mt-1 font-display text-xl font-bold">Cohesion</h2><p className="mt-1 text-[12px] text-muted-foreground">Team selection and combinations for {team.name}.</p></div>
    {squad.length ? <TeamSelection players={squad} published={published} onPublish={() => setPublished(true)} /> : <Panel className="p-10 text-center text-[13px] text-muted-foreground">Squad records are not supplied for {team.name}.</Panel>}
  </>;
}

function TeamSelection({ players, published, onPublish }: { players: Player[]; published: boolean; onPublish: () => void }) {
  const starters = lineupSlots.slice(0, 15);
  const replacements = lineupSlots.slice(15);
  return <Panel className="mb-4 overflow-hidden">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3"><div><h3 className="text-sm font-semibold">Team selection</h3><p className="text-xs text-muted-foreground">Connected players are placed by position. Unfilled shirts remain explicit.</p></div><Button size="sm" variant={published ? "outline" : "dark"} onClick={onPublish} disabled={published}>{published ? <><Check className="size-3.5"/>Team published</> : "Publish team"}</Button></div>
    <div className="grid gap-px bg-border lg:grid-cols-[1.4fr_1fr]">
      <div className="bg-pitch-frame p-3"><div className="grid min-h-[430px] grid-cols-3 content-between gap-2 border border-pitch-line/60 bg-pitch p-3 shadow-inner">
        {starters.map((slot, index) => { const player = players.find((item) => matchesPositionFilter(item, slot.group)); return <div key={slot.number} className={cn("flex min-h-12 items-center gap-2 border border-white/30 bg-foreground/85 px-2 text-background", index === 0 && "col-start-1")}><span className="font-mono text-xs font-semibold">{slot.number}</span><span className="min-w-0"><strong className="block truncate text-[11px]">{player?.name ?? "Unfilled"}</strong><span className="block truncate text-[9px] text-background/65">{slot.role}</span></span></div>; })}
      </div></div>
      <div className="bg-card"><div className="border-b border-border px-4 py-3 text-xs font-semibold">Replacements 16–23</div>{replacements.map((slot) => { const player = players.find((item) => matchesPositionFilter(item, slot.group)); return <div key={slot.number} className="grid min-h-10 grid-cols-[30px_1fr_auto] items-center gap-2 border-b border-border px-4 text-xs last:border-0"><span className="font-mono font-semibold">{slot.number}</span><span><strong className="block">{player?.name ?? "Unfilled"}</strong><span className="text-[10px] text-muted-foreground">{slot.role}</span></span>{player ? null : <span className="text-[10px] text-muted-foreground">Not connected</span>}</div>; })}</div>
    </div>
  </Panel>;
}

function PlayersToolbar({ view, setView, positionFilter, setPositionFilter, query, setQuery, visibleCount }: { view: SquadView; setView: (view: SquadView) => void; positionFilter: PositionFilter; setPositionFilter: (filter: PositionFilter) => void; query: string; setQuery: (query: string) => void; visibleCount: number }) {
  return (
    <div className="flex flex-col gap-3 border-b border-border bg-card p-4 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex h-9 overflow-hidden rounded-md border border-border bg-background p-0.5" aria-label="Players view">
          {(["Lineup", "Player"] as SquadView[]).map((item) => <Button key={item} type="button" variant={view === item ? "secondary" : "ghost"} size="sm" className="h-8 rounded px-3" onClick={() => setView(item)}>{item === "Lineup" ? <Shirt className="size-3.5" /> : <UsersRound className="size-3.5" />}{item}</Button>)}
        </div>
        <label>
          <span className="sr-only">Position group</span>
          <select aria-label="Position group" value={positionFilter} onChange={(event) => setPositionFilter(event.target.value as PositionFilter)} className="h-9 min-w-40 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-ring">
            {positionFilters.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <span className="rounded border border-border bg-muted px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground">{view === "Lineup" && positionFilter === "All" && !query ? "Matchday 1–23" : `${visibleCount} connected`}</span>
      </div>
      <label className="flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3 xl:w-64">
        <Search className="size-3.5 text-muted-foreground" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search players" className="w-full bg-transparent text-sm outline-none" />
      </label>
    </div>
  );
}

function LineupMatrix({ team, players, positionFilter, query }: { team: Team; players: Player[]; positionFilter: PositionFilter; query: string }) {
  const matches = team.recentMatches.slice(0, 5);
  const emptyColumns = Array.from({ length: Math.max(0, 5 - matches.length) });
  const playersByShirt = new Map(players.map((player, index) => [inferShirtNumber(player, index), player]));
  const normalizedQuery = query.trim().toLowerCase();
  const visibleSlots = lineupSlots.filter((slot) => {
    const player = playersByShirt.get(slot.number);
    const matchesGroup = positionFilter === "All" || slot.group === positionFilter;
    const matchesQuery = !normalizedQuery || player?.name.toLowerCase().includes(normalizedQuery) || slot.role.toLowerCase().includes(normalizedQuery) || String(slot.number) === normalizedQuery;
    return matchesGroup && matchesQuery;
  });
  return (
    <div className="bg-background">
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-2 text-[10px] text-muted-foreground"><span><strong className="text-foreground">Matchday squad</strong> · Starting XV and replacements</span><span>{visibleSlots.length} slots</span></div>
      <div className="overflow-x-auto">
       <div className="min-w-[1180px]">
        <div className="sticky top-0 z-10 grid grid-cols-[150px_repeat(5,minmax(210px,1fr))] border-b border-border bg-muted text-[10px] font-bold uppercase tracking-normal text-muted-foreground">
          <div className="px-3 py-2">Shirt / position</div>
          {matches.map((match) => <div key={`${match.opponent}-${match.date}`} className="border-l border-border px-3 py-1.5"><div className="flex items-center justify-between gap-2"><div className="min-w-0"><div className="truncate text-foreground">vs {match.opponent}</div><div className="text-[9px] font-semibold text-muted-foreground">{match.date}</div></div><span className={resultBadgeClass(match.result)}>{match.result}</span></div><div className="font-display text-xs text-foreground">{match.score}</div></div>)}
          {emptyColumns.map((_, index) => <div key={`empty-${index}`} className="border-l border-border px-3 py-2 text-muted-foreground">No match</div>)}
        </div>
        {visibleSlots.map((slot) => {
          const player = playersByShirt.get(slot.number);
          return <div key={slot.number} className={cn("grid min-h-10 grid-cols-[150px_repeat(5,minmax(210px,1fr))] border-b border-border text-xs", slot.number === 16 && "border-t-2 border-t-primary/30")}><div className="flex items-center gap-2 bg-muted/20 px-3 py-1"><span className={cn("grid size-6 shrink-0 place-items-center rounded font-display text-[11px] font-bold", slot.number <= 15 ? "bg-primary text-primary-foreground" : "border border-border bg-background text-foreground")}>{slot.number}</span><span className="min-w-0"><span className="block truncate text-[11px] font-semibold text-foreground">{slot.role}</span><span className="block text-[9px] text-muted-foreground">{slot.number <= 15 ? "Starter" : "Replacement"}</span></span></div>{matches.map((match) => <LineupMatchCell key={`${slot.number}-${match.opponent}`} player={player} match={match} />)}{emptyColumns.map((_, cellIndex) => <div key={`${slot.number}-empty-${cellIndex}`} className="border-l border-border px-3 py-2 text-muted-foreground">—</div>)}</div>;
        })}
        {visibleSlots.length === 0 && <div className="p-8 text-center text-[13px] text-muted-foreground">No lineup slots match these filters.</div>}
      </div>
      </div>
    </div>
  );
}

function LineupMatchCell({ player, match }: { player: Player | undefined; match: Team["recentMatches"][number] }) {
  if (!player) return <div className="flex items-center border-l border-border px-3 py-1 text-[10px] text-muted-foreground">Not connected</div>;
  const log = player.matchLog.find((entry) => entry.opponent === match.opponent);
  const minutes = log?.mins ?? 0;
  return <div className="border-l border-border px-3 py-1"><Link to="/players/$playerId/$tab" params={{ playerId: player.id, tab: "match-room" }} className="group flex min-h-8 items-center justify-between gap-2"><span className="min-w-0 truncate text-[11px] font-semibold group-hover:text-primary">{player.name}</span><span className={cn("shrink-0 font-display text-[11px] font-bold tabular-nums", !minutes && "text-muted-foreground")}>{minutes ? `${minutes}′` : "DNP"}</span></Link></div>;
}

function PlayerRosterTable({ players }: { players: Player[] }) {
  const maxApps = Math.max(1, ...players.map((player) => player.apps));
  return (
    <div className="bg-muted/70 p-3">
      <div className="overflow-x-auto rounded-md bg-background">
        <div className="min-w-[900px]">
          <div className="grid grid-cols-[120px_130px_140px_minmax(220px,1fr)_90px_minmax(220px,1fr)_40px] items-center border-b border-border px-4 py-3 text-[10px] font-bold uppercase text-muted-foreground"><span>Headshot</span><span>Shirt no.</span><span>Pos. group</span><span>Name</span><span>Age</span><span>All positions %</span><span /></div>
          {players.map((player, index) => {
            const percent = Math.max(5, Math.min(100, Math.round((player.apps / maxApps) * 100)));
            return <Link key={player.id} to="/players/$playerId/$tab" params={{ playerId: player.id, tab: "match-room" }} className="grid grid-cols-[120px_130px_140px_minmax(220px,1fr)_90px_minmax(220px,1fr)_40px] items-center border-b border-border px-4 py-3 text-xs transition-colors hover:bg-muted/60"><span><span className="grid size-9 place-items-center rounded-full bg-primary/10 font-display font-bold text-primary">{player.initials}</span></span><span className="flex items-center gap-2"><Shirt className="size-7 text-foreground" /><span className="font-display text-sm font-bold">{inferShirtNumber(player, index)}</span></span><span>{specificPositionGroup(player)}</span><span><span className="font-semibold">{player.name}</span><span className="mt-0.5 block text-[10px] text-muted-foreground">{player.position}</span></span><span>{player.age}</span><span className="flex items-center gap-2"><span className="relative h-5 flex-1 overflow-hidden rounded bg-muted"><span className="absolute inset-y-0 left-0 rounded bg-primary/20" style={{ width: `${percent}%` }} /></span><strong className="w-10 text-right tabular-nums">{percent}%</strong></span><ChevronRight className="size-4 text-muted-foreground" /></Link>;
          })}
        </div>
      </div>
      <div className="flex items-center justify-between px-4 py-3 text-[11px] text-muted-foreground"><span>Showing {players.length} connected player{players.length === 1 ? "" : "s"}</span><span>All squad records</span></div>
    </div>
  );
}

function matchesPositionFilter(player: Player, filter: PositionFilter) {
  if (filter === "All") return true;
  const position = player.position.toLowerCase();
  if (filter === "Props") return position.includes("prop");
  if (filter === "Hookers") return position.includes("hooker");
  if (filter === "Locks") return position.includes("lock");
  if (filter === "Back row") return ["flanker", "number 8", "back row"].some((item) => position.includes(item));
  if (filter === "Half-backs") return ["scrum-half", "fly-half"].some((item) => position.includes(item));
  if (filter === "Centres") return position.includes("centre") || position.includes("center");
  return ["wing", "fullback", "full-back"].some((item) => position.includes(item));
}

function specificPositionGroup(player: Player) {
  const position = player.position.toLowerCase();
  if (position.includes("prop")) return "Props";
  if (position.includes("hooker")) return "Hookers";
  if (position.includes("lock")) return "Locks";
  if (["flanker", "number 8", "back row"].some((item) => position.includes(item))) return "Back row";
  if (["scrum-half", "fly-half"].some((item) => position.includes(item))) return "Half-backs";
  if (position.includes("centre") || position.includes("center")) return "Centres";
  if (["wing", "fullback", "full-back"].some((item) => position.includes(item))) return "Back three";
  return "Other";
}

function inferShirtNumber(player: Player, index: number) {
  const position = player.position.toLowerCase();
  if (position.includes("prop")) return index % 2 === 0 ? 1 : 3;
  if (position.includes("hooker")) return 2;
  if (position.includes("lock")) return index % 2 === 0 ? 4 : 5;
  if (position.includes("flanker")) return index % 2 === 0 ? 6 : 7;
  if (position.includes("number 8") || position.includes("back row")) return 8;
  if (position.includes("scrum-half")) return 9;
  if (position.includes("fly-half")) return 10;
  if (position.includes("centre") || position.includes("center")) return index % 2 === 0 ? 12 : 13;
  if (position.includes("wing")) return index % 2 === 0 ? 11 : 14;
  if (position.includes("fullback") || position.includes("full-back")) return 15;
  return index + 1;
}

function resultBadgeClass(result: "W" | "L" | "D") {
  return cn("rounded px-2 py-0.5 text-[10px] font-bold", result === "W" ? "bg-success/12 text-success" : result === "L" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground");
}
