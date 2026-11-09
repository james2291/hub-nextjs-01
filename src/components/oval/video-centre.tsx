"use client";

import { Download, ListVideo, Pause, Play, Plus, Search, SkipBack, SkipForward } from "lucide-react";
import { useMemo, useState } from "react";

import { Panel } from "@/components/oval/app-shell";
import { Button } from "@/components/ui/button";
import { competitions, teams, type Competition, type Player, type Referee, type Team } from "@/data/hub";
import { cn } from "@/lib/utils";

export type VideoCentreSubject =
  | { mode: "competition"; competition: Competition }
  | { mode: "team"; team: Team }
  | { mode: "player"; player: Player }
  | { mode: "referee"; referee: Referee };
type VideoCentreProps = VideoCentreSubject & { initialGroup?: string | undefined; lastMatches?: number | undefined };

type VideoEvent = {
  id: string;
  title: string;
  subject: string;
  match: string;
  date: string;
  time: string;
  duration: string;
  eventGroup: string;
};

export const teamEventGroups = ["Lineouts", "Scrums", "Mauls", "Lineout Launches", "Restart Receptions", "Kicks", "Carries", "Tackles", "Penalties"];
export const playerEventGroups = ["Carries", "Kicks", "Tackles", "Penalties", "Line breaks", "Defenders beaten", "Tries"];
const competitionEventGroups = ["Tries", "Lineouts", "Scrums", "Kicks", "Carries", "Tackles", "Penalties"];
export const refereeEventGroups = ["Penalties", "Scrum penalties", "Lineout penalties", "Ruck offences", "Offside", "Foul play", "Cards", "Advantages", "TMO reviews"];

function isForward(position: string) {
  return ["prop", "hooker", "lock", "flanker", "number 8", "back row"].some((item) => position.toLowerCase().includes(item));
}

function sequenceTime(matchIndex: number, eventIndex: number) {
  const minutes = Math.min(78, 2 + matchIndex * 9 + eventIndex * 6);
  const seconds = (eventIndex * 17 + matchIndex * 11) % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function buildTeamEvents(team: Team, eventGroup: string, last?: number): VideoEvent[] {
  return team.recentMatches.slice(0, last ?? undefined).flatMap((match, matchIndex) => {
    const count = Math.max(2, Math.min(5, Math.ceil(match.clips / 4)));
    return Array.from({ length: count }, (_, eventIndex) => ({
      id: `${team.id}-${match.date}-${eventGroup}-${eventIndex}`,
      title: eventGroup,
      subject: team.name,
      match: `${team.name} v ${match.opponent}`,
      date: match.date,
      time: sequenceTime(matchIndex, eventIndex),
      duration: eventGroup === "Mauls" ? "0:34" : eventGroup === "Lineout Launches" ? "0:22" : "0:18",
      eventGroup,
    }));
  });
}

function buildPlayerEvents(player: Player, eventGroup: string, last?: number): VideoEvent[] {
  const clipEvents = last ? [] : player.clips.map((clip, index) => ({
    id: `${player.id}-clip-${index}`,
    title: clip.title,
    subject: player.name,
    match: clip.match,
    date: player.matchLog[index]?.date ?? "Date not supplied",
    time: sequenceTime(index, 0),
    duration: clip.length,
    eventGroup,
  }));
  const logEvents = player.matchLog.slice(0, last ?? undefined).flatMap((entry, matchIndex) => Array.from({ length: Math.max(1, Math.min(3, Math.ceil(entry.mins / 30))) }, (_, eventIndex) => ({
    id: `${player.id}-${entry.date}-${eventGroup}-${eventIndex}`,
    title: eventGroup,
    subject: player.name,
    match: `v ${entry.opponent}`,
    date: entry.date,
    time: sequenceTime(matchIndex, eventIndex),
    duration: "0:16",
    eventGroup,
  })));
  return clipEvents.length ? [...clipEvents, ...logEvents] : logEvents;
}

function buildCompetitionEvents(competition: Competition, eventGroup: string, last?: number): VideoEvent[] {
  return competition.fixtures.slice(0, last ?? undefined).map((fixture, index) => ({
    id: `${competition.id}-${fixture.date}-${fixture.fixture}-${index}-${eventGroup}`,
    title: eventGroup,
    subject: competition.name,
    match: fixture.fixture,
    date: fixture.date,
    time: sequenceTime(index, 0),
    duration: "0:18",
    eventGroup,
  }));
}

function buildRefereeEvents(referee: Referee, eventGroup: string, last?: number): VideoEvent[] {
  return referee.appointments.slice(0, last ?? undefined).map((appointment, index) => ({
    id: `${referee.id}-${appointment.date}-${eventGroup}`,
    title: eventGroup,
    subject: referee.name,
    match: appointment.fixture,
    date: appointment.date,
    time: sequenceTime(index, 0),
    duration: "0:18",
    eventGroup,
  }));
}

function contextFromProps(props: VideoCentreSubject, last?: number) {
  const base = rawContext(props, last);
  return { ...base, buildEvents: (group: string) => thin(base.buildEvents(group), group) };
}

function rawContext(props: VideoCentreSubject, last?: number) {
  if (props.mode === "competition") {
    const competition = props.competition;
    return {
      title: `${competition.name} Events Video Centre`,
      competitionName: competition.name,
      teamName: "All teams",
      playerName: "All players",
      refereeName: "All referees",
      groups: competitionEventGroups,
      initialGroup: "Tries",
      buildEvents: (group: string) => buildCompetitionEvents(competition, group, last),
      statLine: `${competition.fixtures.length} matches · connected event index`,
    };
  }
  if (props.mode === "team") {
    const team = props.team;
    const competition = competitions.find((item) => item.id === team.competitionId) ?? competitions[0];
    return {
      title: `${team.name} Video Centre`,
      description: `Event search and video review filtered to ${team.name}.`,
      competitionName: competition?.name ?? "Competition not supplied",
      teamName: team.name,
      playerName: "All players",
      refereeName: "All referees",
      groups: teamEventGroups,
      initialGroup: "Lineouts",
      buildEvents: (group: string) => buildTeamEvents(team, group, last),
      statLine: `${team.recentMatches.length} matches · ${team.recentMatches.reduce((total, match) => total + match.clips, 0)} clips`,
    };
  }

  if (props.mode === "referee") {
    const referee = props.referee;
    return {
      title: `${referee.name} Events Video Centre`,
      competitionName: "All competitions",
      teamName: "All teams",
      playerName: "All players",
      refereeName: referee.name,
      groups: refereeEventGroups,
      initialGroup: "Penalties",
      buildEvents: (group: string) => buildRefereeEvents(referee, group, last),
      statLine: `${referee.appointments.length} appointments · connected event index`,
    };
  }

  const player = props.player;
  const team = teams.find((item) => item.id === player.teamId);
  const competition = competitions.find((item) => item.id === team?.competitionId) ?? competitions[0];
  return {
    title: `${player.name} Video Centre`,
    description: `Event search and video review filtered to ${player.name}.`,
    competitionName: competition?.name ?? "Competition not supplied",
    teamName: team?.name ?? "Team not supplied",
    playerName: player.name,
    refereeName: "All referees",
    groups: playerEventGroups,
    initialGroup: isForward(player.position) ? "Carries" : "Kicks",
    buildEvents: (group: string) => buildPlayerEvents(player, group, last),
    statLine: `${player.matchLog.length} matches · ${player.clips.length} tagged clips`,
  };
}

function thin(events: VideoEvent[], group: string) {
  const seed = [...group].reduce((total, char) => total + char.charCodeAt(0), 0);
  const keep = 0.45 + (seed % 11) / 20;
  return events.filter((_, index) => index === 0 || ((index * 37 + seed) % 100) / 100 < keep);
}

export function countEvents(subject: VideoCentreSubject, group: string, last: number) {
  return contextFromProps(subject, last).buildEvents(group).length;
}

export function VideoCentre(props: VideoCentreProps) {
  const [last, setLast] = useState<number | undefined>(props.lastMatches);
  const context = useMemo(() => contextFromProps(props, last), [props, last]);
  const [eventGroup, setEventGroup] = useState(props.initialGroup && context.groups.includes(props.initialGroup) ? props.initialGroup : context.initialGroup);
  const [query, setQuery] = useState("");
  const events = useMemo(() => context.buildEvents(eventGroup), [context, eventGroup]);
  const filtered = useMemo(() => events.filter((event) => `${event.title} ${event.subject} ${event.match} ${event.date}`.toLowerCase().includes(query.toLowerCase())), [events, query]);
  const [selectedId, setSelectedId] = useState("");
  const selected = filtered.find((event) => event.id === selectedId) ?? filtered[0];

  return <div className="space-y-4">
    <Panel className="p-3">
      <div className="grid gap-2 md:grid-cols-7">
        <label className="space-y-1 md:col-span-2"><span className="text-[10px] font-semibold uppercase text-muted-foreground">Competition</span><select defaultValue={context.competitionName} aria-label="Competition filter" className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs font-semibold outline-none focus:ring-1 focus:ring-ring"><option>{context.competitionName}</option></select></label>
        <label className="space-y-1"><span className="text-[10px] font-semibold uppercase text-muted-foreground">Season</span><select defaultValue="2025/26" aria-label="Season filter" className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs font-semibold outline-none focus:ring-1 focus:ring-ring"><option>2025/26</option></select></label>
        <label className="space-y-1"><span className="text-[10px] font-semibold uppercase text-muted-foreground">Team</span><select defaultValue={context.teamName} aria-label="Team filter" className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs font-semibold outline-none focus:ring-1 focus:ring-ring"><option>{context.teamName}</option></select></label>
        <label className="space-y-1"><span className="text-[10px] font-semibold uppercase text-muted-foreground">Player</span><select defaultValue={context.playerName} aria-label="Player filter" className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs font-semibold outline-none focus:ring-1 focus:ring-ring"><option>{context.playerName}</option></select></label>
        <label className="space-y-1"><span className="text-[10px] font-semibold uppercase text-muted-foreground">Referee</span><select defaultValue={context.refereeName} aria-label="Referee filter" className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs font-semibold outline-none focus:ring-1 focus:ring-ring"><option>{context.refereeName}</option></select></label>
        <div className="space-y-1"><span className="text-[10px] font-semibold uppercase text-muted-foreground">Action</span><Button className="h-9 w-full text-xs"><Search className="size-3.5" /> Search</Button></div>
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-[minmax(180px,240px)_160px_1fr]">
        <label className="space-y-1"><span className="text-[10px] font-semibold uppercase text-muted-foreground">Event group</span><select value={eventGroup} onChange={(event) => { setEventGroup(event.target.value); setSelectedId(""); }} aria-label="Event group filter" className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs font-semibold outline-none focus:ring-1 focus:ring-ring">{context.groups.map((group) => <option key={group}>{group}</option>)}</select></label>
        <label className="space-y-1"><span className="text-[10px] font-semibold uppercase text-muted-foreground">Matches</span><select value={last ?? "all"} onChange={(event) => { setLast(event.target.value === "all" ? undefined : Number(event.target.value)); setSelectedId(""); }} aria-label="Matches filter" className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs font-semibold outline-none focus:ring-1 focus:ring-ring"><option value="all">All matches</option>{[1, 3, 4, 5, 6].map((n) => <option key={n} value={n}>Last {n}</option>)}</select></label>
        <label className="space-y-1"><span className="text-[10px] font-semibold uppercase text-muted-foreground">Search events</span><span className="flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3"><Search className="size-3.5 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search match, date or event" className="w-full bg-transparent text-xs outline-none" /></span></label>
      </div>
    </Panel>

    <div className="grid min-h-[620px] gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
      <Panel className="flex min-h-0 flex-col overflow-hidden">
        <div className="flex items-center justify-between bg-primary/70 px-4 py-3 text-primary-foreground">
          <div><h3 className="font-display text-sm font-semibold">Event search</h3><p className="mt-1 text-[10px] opacity-80">{context.statLine}</p></div>
          <ListVideo className="size-4" />
        </div>
        <div className="grid grid-cols-2 gap-2 border-b border-border p-3"><Button variant="outline" size="sm" disabled><Plus className="size-3.5" /> Playlist</Button><Button variant="outline" size="sm" disabled><Download className="size-3.5" /> Download</Button></div>
        <div className="border-b border-border px-4 py-3 text-[11px] font-semibold text-primary">{selected?.match ?? context.title}</div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {filtered.length ? filtered.map((event) => <Button key={event.id} type="button" variant="ghost" onClick={() => setSelectedId(event.id)} aria-pressed={selected?.id === event.id} className={cn("grid h-auto w-full grid-cols-[32px_1fr_auto] items-center justify-normal gap-2 rounded-none border-b border-border px-3 py-2.5 text-left text-xs", selected?.id === event.id && "bg-primary/10 text-foreground hover:bg-primary/10")}>
            <span className="grid size-7 place-items-center rounded-md border border-border bg-card"><Play className="ml-0.5 size-3 fill-current" /></span>
            <span className="min-w-0"><span className="block truncate font-semibold">{event.title}</span><span className="block truncate text-[10px] text-muted-foreground">{event.subject}</span></span>
            <span className="font-display text-[11px] tabular-nums">{event.time}</span>
          </Button>) : <div className="p-6 text-center text-[12px] text-muted-foreground">No events match these filters.</div>}
        </div>
      </Panel>

      <Panel className="overflow-hidden">
        <div className="border-b border-border px-4 py-3 text-center text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{selected?.match ?? context.title}</span>{selected ? <span> · {selected.date}</span> : null}
        </div>
        <div className="grid aspect-video min-h-[360px] place-items-center bg-foreground text-background">
          <div className="text-center">{props.initialGroup && selected ? <div className="mb-3 text-xs opacity-80">Preloaded · {eventGroup} · {last ? `last ${last} matches` : "all matches"} · {filtered.length} clips</div> : null}<Button variant="secondary" size="lg" className="shadow-lg"><Play className="ml-0.5 size-5 fill-current" /> Play</Button></div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 border-t border-border p-3">
          {(["-45m", "-5m", "-10s"] as const).map((control) => <Button key={control} variant="outline" size="sm" className="h-7 text-[11px]"><SkipBack className="size-3" /> {control}</Button>)}
          <Button variant="outline" size="icon" className="size-7"><SkipBack className="size-3" /></Button>
          <Button variant="dark" size="icon" className="size-8"><Pause className="size-3.5" /></Button>
          <Button variant="outline" size="icon" className="size-7"><SkipForward className="size-3" /></Button>
          {(["+10s", "+5m", "+45m"] as const).map((control) => <Button key={control} variant="outline" size="sm" className="h-7 text-[11px]">{control} <SkipForward className="size-3" /></Button>)}
        </div>
        <div className="grid gap-3 border-t border-border p-4 md:grid-cols-3">
          <div><div className="text-[10px] font-semibold uppercase text-muted-foreground">Selected event</div><div className="mt-1 text-sm font-semibold">{selected?.title ?? "Not supplied"}</div></div>
          <div><div className="text-[10px] font-semibold uppercase text-muted-foreground">Match</div><div className="mt-1 text-sm font-semibold">{selected?.match ?? "Not supplied"}</div></div>
          <div><div className="text-[10px] font-semibold uppercase text-muted-foreground">Clip length</div><div className="mt-1 text-sm font-semibold">{selected?.duration ?? "Not supplied"}</div></div>
        </div>
      </Panel>
    </div>
  </div>;
}
