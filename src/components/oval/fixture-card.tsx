"use client";

import { Link } from "@/lib/link";
import { ArrowRight, Download, RotateCcw, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Panel } from "@/components/oval/app-shell";
import { Button } from "@/components/ui/button";
import type { Competition, Player, Referee, Team } from "@/data/hub";
import { cn } from "@/lib/utils";

const views = ["Default", "Videos", "Reports", "Files"] as const;
type ViewKey = (typeof views)[number];

const viewColumns: Record<ViewKey, string[]> = {
  Default: ["TX", "Report CSV", "Team XML", "Events XML"],
  Videos: ["TX", "Tight", "Wide"],
  Reports: ["Report CSV", "Report PDF"],
  Files: ["Team XML", "Events XML", "Events CSV", "Events JSON"],
};

export type FixtureCardRow = {
  id: string;
  matchId: string | null;
  competitionId: string | null;
  competition: string;
  home: string;
  away: string;
  score: string | null;
  round: string;
  date: string;
  venue: string;
  status: string;
};

function splitFixture(fixture: string) {
  const parts = fixture.split(/\s+v\s+/i);
  return { home: parts[0]?.trim() ?? fixture, away: parts[1]?.trim() ?? "" };
}

export function competitionFixtureRows(competition: Competition): FixtureCardRow[] {
  return competition.fixtures.map((fixture, index) => {
    const { home, away } = splitFixture(fixture.fixture);
    const completed = !/upcoming|tbc/i.test(fixture.result);
    return {
      id: `${competition.id}-${index}`,
      matchId: `${competition.id}-${index}`,
      competitionId: competition.id,
      competition: competition.name,
      home,
      away,
      score: completed ? fixture.result : null,
      round: fixture.round,
      date: fixture.date,
      venue: fixture.venue,
      status: completed ? "Finalised" : "Scheduled",
    };
  });
}

function includesTeam(fixture: string, teamName: string) {
  const { home, away } = splitFixture(fixture);
  return home === teamName || away === teamName;
}

function findFixture(competitions: Competition[], teamName: string, opponent: string, date: string) {
  return competitions.flatMap((competition) => competition.fixtures.map((fixture, index) => ({ competition, fixture, index }))).find(({ fixture }) => fixture.date === date && includesTeam(fixture.fixture, teamName) && includesTeam(fixture.fixture, opponent));
}

export function teamFixtureRows(team: Team, competitions: Competition[], season: string): FixtureCardRow[] {
  const seasonCompetitions = competitions.filter((competition) => competition.season === season);
  const connected = seasonCompetitions.flatMap((competition) => competitionFixtureRows(competition).filter((row) => row.home === team.name || row.away === team.name));
  const connectedKeys = new Set(connected.map((row) => `${row.date}:${row.home}:${row.away}`));
  const recent = team.recentMatches.flatMap((match, index) => {
    const found = findFixture(seasonCompetitions, team.name, match.opponent, match.date);
    if (found) return [];
    const key = `${match.date}:${team.name}:${match.opponent}`;
    if (connectedKeys.has(key)) return [];
    return [{ id: `team-${team.id}-${index}`, matchId: null, competitionId: null, competition: "Competition not supplied", home: team.name, away: match.opponent, score: match.score, round: "Round not supplied", date: match.date, venue: "Venue not supplied", status: "Finalised" }];
  });
  return [...connected, ...recent];
}

export function playerFixtureRows(player: Player, team: Team | undefined, competitions: Competition[], season: string): FixtureCardRow[] {
  const seasonCompetitions = competitions.filter((competition) => competition.season === season);
  return player.matchLog.map((entry, index) => {
    const teamName = team?.name ?? "Team not supplied";
    const found = findFixture(seasonCompetitions, teamName, entry.opponent, entry.date);
    if (found) return competitionFixtureRows(found.competition)[found.index] ?? fallbackPlayerRow(player, teamName, entry, index);
    return fallbackPlayerRow(player, teamName, entry, index);
  });
}

function fallbackPlayerRow(player: Player, teamName: string, entry: Player["matchLog"][number], index: number): FixtureCardRow {
  return { id: `player-${player.id}-${index}`, matchId: null, competitionId: null, competition: "Competition not supplied", home: teamName, away: entry.opponent, score: null, round: "Appearance", date: entry.date, venue: "Venue not supplied", status: "Finalised" };
}

export function refereeFixtureRows(referee: Referee, competitions: Competition[], season: string): FixtureCardRow[] {
  const seasonCompetitions = competitions.filter((competition) => competition.season === season);
  return referee.appointments.map((appointment, index) => {
    const found = seasonCompetitions.flatMap((competition) => competition.fixtures.map((fixture, fixtureIndex) => ({ competition, fixture, fixtureIndex }))).find(({ fixture }) => fixture.fixture === appointment.fixture && fixture.date === appointment.date);
    if (found) return competitionFixtureRows(found.competition)[found.fixtureIndex] ?? fallbackRefereeRow(referee, appointment, index);
    return fallbackRefereeRow(referee, appointment, index);
  });
}

function fallbackRefereeRow(referee: Referee, appointment: Referee["appointments"][number], index: number): FixtureCardRow {
  const { home, away } = splitFixture(appointment.fixture);
  return { id: `referee-${referee.id}-${index}`, matchId: null, competitionId: null, competition: appointment.competition, home, away, score: null, round: "Appointment", date: appointment.date, venue: "Venue not supplied", status: "Finalised" };
}

export function CompetitionFixtureCard({ competition }: { competition: Competition }) {
  const rows = useMemo(() => competitionFixtureRows(competition), [competition]);
  return <FixtureCard rows={rows} />;
}

export function FixtureCard({ rows }: { rows: FixtureCardRow[] }) {
  const [view, setView] = useState<ViewKey>("Default");
  const [status, setStatus] = useState("All results");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const columns = viewColumns[view];
  const filtered = rows.filter((row) => {
    const matchesStatus = status === "All results" || row.status === status;
    const text = `${row.home} ${row.away} ${row.round} ${row.venue}`.toLowerCase();
    return matchesStatus && (!query.trim() || text.includes(query.trim().toLowerCase()));
  });
  const selectedCount = Object.values(selected).filter(Boolean).length;

  const toggle = (key: string) => setSelected((current) => ({ ...current, [key]: !current[key] }));
  const toggleColumn = (column: string) => {
    const keys = filtered.map((row) => `${row.id}:${column}`);
    const allOn = keys.every((key) => selected[key]);
    setSelected((current) => {
      const next = { ...current };
      keys.forEach((key) => { next[key] = !allOn; });
      return next;
    });
  };

  return <div className="space-y-4">
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <select aria-label="Filter by status" value={status} onChange={(event) => setStatus(event.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-ring">
          <option>All results</option><option>Finalised</option><option>Scheduled</option>
        </select>
        <select aria-label="Select asset view" value={view} onChange={(event) => setView(event.target.value as ViewKey)} className="h-9 rounded-md border border-input bg-background px-3 text-xs font-semibold outline-none focus:ring-1 focus:ring-ring">
          {views.map((item) => <option key={item}>{item}</option>)}
        </select>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input aria-label="Search fixtures" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search team, round or venue" className="h-9 w-64 rounded-md border border-input bg-background pl-8 pr-3 text-xs outline-none focus:ring-1 focus:ring-ring" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setSelected({})}><RotateCcw className="size-3.5" />Clear</Button>
        <Button size="sm" disabled={selectedCount === 0}><Download className="size-3.5" />Download{selectedCount ? ` ${selectedCount}` : ""}</Button>
      </div>
    </div>

    <Panel className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-250 border-collapse text-left">
          <thead>
            <tr className="h-10 border-b border-border bg-muted/40">
              <th className="px-4">Date</th>
              <th className="px-3">Home</th>
              <th className="px-3 text-center">Result</th>
              <th className="px-3">Away</th>
              <th className="px-3">Round</th>
              <th className="px-3">Competition</th>
              <th className="px-3">Status</th>
              {columns.map((column) => <th key={column} className="px-3 text-center">
                <button type="button" onClick={() => toggleColumn(column)} className="text-[10px] font-medium hover:text-primary">{column}</button>
              </th>)}
              <th className="px-4 text-center">Match Centre</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => <tr key={row.id} className="h-11 border-b border-border/60 transition-colors last:border-0 hover:bg-primary/5">
              <td className="whitespace-nowrap px-4 text-[11px] text-muted-foreground">{row.date}</td>
              <td className="px-3 text-[13px] font-bold">{row.home}</td>
              <td className="px-3 text-center">{row.score && row.score !== "Upcoming" ? <span className="inline-block rounded-[2px] bg-foreground px-2 py-1 font-mono text-xs font-bold tabular-nums text-background">{row.score}</span> : <span className="inline-block rounded-[2px] bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">{row.score ?? "Upcoming"}</span>}</td>
              <td className="px-3 text-[13px] font-medium">{row.away || "Opponent not supplied"}</td>
              <td className="px-3 text-[12px] text-muted-foreground">{row.round}</td>
              <td className="px-3 text-[12px] text-muted-foreground">{row.competition}</td>
              <td className="px-3"><span className={cn("text-[10px] font-bold uppercase tracking-wider", row.status === "Finalised" ? "text-success" : "text-primary")}>{row.status}</span></td>
              {columns.map((column) => {
                const key = `${row.id}:${column}`;
                return <td key={column} className="px-3 py-3 text-center">
                  <input type="checkbox" aria-label={`${column} for ${row.home} v ${row.away}`} checked={Boolean(selected[key])} onChange={() => toggle(key)} className="size-4 accent-primary" />
                </td>;
              })}
              <td className="px-4 py-3 text-center">
                {row.competitionId && row.matchId ? <Link to="/matches/$matchId/$tab" params={{ matchId: row.matchId, tab: "overview" }} className="inline-grid size-7 place-items-center rounded bg-foreground text-background hover:bg-primary" aria-label={`Open ${row.home} v ${row.away} in Match Centre`}>
                  <ArrowRight className="size-3.5" />
                </Link> : <span className="text-muted-foreground">—</span>}
              </td>
            </tr>)}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && <p className="p-8 text-center text-[12px] text-muted-foreground">No fixtures match these filters.</p>}
      <div className="border-t border-border bg-muted/40 px-4 py-3 text-[11px] text-muted-foreground">Tick the assets you need, then download. Column headers select the whole column. Asset availability reflects what each match has connected.</div>
    </Panel>
  </div>;
}
