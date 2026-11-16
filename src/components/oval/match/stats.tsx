"use client";

// TEMPORARY HOLD: seeded / illustrative figures until GET /api/v1/matches/{matchId}/stats is mapped.

// Match Stats, laid out like the Player Stats page: a profile of measures with bars (home side
// against the away side's marker) beside a scoring summary with the event list. ILLUSTRATIVE:
// events are seeded per match (counts follow the real score) until the Hub API sends the event feed.
import { useMemo } from "react";

import { DataNote, PanelGrid, Section } from "@/components/oval/primitives";
import { illustrativeStats } from "@/lib/match-illustrative";
import type { Fixture } from "@/lib/rugby";
import { seeded } from "@/lib/seeded";
import { cn } from "@/lib/utils";

type Side = "home" | "away";
type Kind = "Try" | "Kick" | "Line break";
type MatchEvent = {
  id: number;
  minute: number;
  side: Side;
  kind: Kind;
  made?: boolean;
};

function events(fixture: Fixture): MatchEvent[] {
  const random = seeded(fixture.id * 31);
  const list: MatchEvent[] = [];
  let id = 0;
  for (const side of ["home", "away"] as const) {
    // Counts follow the real score: about one try per 7 points, a conversion attempt per try plus a
    // penalty attempt or two. Minutes are illustrative.
    const score = fixture[side].score ?? 0;
    const tries = Math.floor(score / 7);
    const penalties = Math.max(0, Math.round((score - tries * 7) / 3));
    for (let i = 0; i < tries; i += 1)
      list.push({
        id: id++,
        minute: 2 + Math.floor(random() * 78),
        side,
        kind: "Try",
      });
    for (let i = 0; i < tries + penalties; i += 1)
      list.push({
        id: id++,
        minute: 2 + Math.floor(random() * 78),
        side,
        kind: "Kick",
        made: i < tries ? random() > 0.15 : true,
      });
    const breaks = Math.max(1, Math.round(tries * 0.8));
    for (let i = 0; i < breaks; i += 1)
      list.push({ id: id++, minute: 2 + Math.floor(random() * 78), side, kind: "Line break" });
  }
  return list.sort((a, b) => a.minute - b.minute);
}

export function MatchStats({ fixture, played }: { fixture: Fixture; played: boolean }) {
  const all = useMemo(() => events(fixture), [fixture]);
  const colour = (side: Side) => (side === "home" ? "var(--club)" : "var(--away)");
  const count = (side: Side, k: Kind) =>
    all.filter((event) => event.side === side && event.kind === k).length;
  const club = (side: Side) => fixture[side].club;
  if (!played) {
    return (
      <div className="px-4 pb-8 pt-5 md:px-6">
        <DataNote>
          Not played yet. Match figures and scoring appear once the match has been played and the
          event feed is connected.
        </DataNote>
      </div>
    );
  }

  const profile = illustrativeStats(fixture);

  return (
    <div className="flex flex-col gap-4 px-4 pb-8 pt-5 md:px-6">
      <DataNote label="ILLUSTRATIVE">
        Match figures and the scoring list are illustrative until the Hub API sends the event feed.
        The score above is from the feed.
      </DataNote>
      <PanelGrid>
        <Section
          span={7}
          minWidth={480}
          title="Match profile"
          meta={`${club("home").shortName} v ${club("away").shortName}`}
        >
          <div className="grid h-[30px] grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_56px] items-center gap-2.5 border-b border-line2 px-4 text-[11px] font-medium text-mute">
            <span>Measure</span>
            <span />
            <span className="text-right">{club("home").shortName}</span>
          </div>
          {profile.map((stat) => {
            const max = stat.suffix === "%" ? 100 : Math.max(stat.home, stat.away) * 1.15 || 1;
            const ahead = stat.lowerIsBetter ? stat.home < stat.away : stat.home > stat.away;
            return (
              <div
                key={stat.label}
                className="grid min-h-[37px] grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_56px] items-center gap-2.5 border-b border-line2 px-4"
              >
                <span className="leading-tight">
                  {stat.label}
                  <span className="block text-[11px] text-faint">
                    {club("away").shortName} {stat.away}
                    {stat.suffix ?? ""}
                  </span>
                </span>
                <span
                  className="relative block h-2.5 bg-line2"
                  title={`${stat.label}: ${club("home").shortName} ${stat.home}${stat.suffix ?? ""}, ${club("away").shortName} ${stat.away}${stat.suffix ?? ""}`}
                >
                  <span
                    className={cn("absolute inset-y-0 left-0", ahead ? "bg-win" : "bg-compare")}
                    style={{ width: `${(stat.home / max) * 100}%` }}
                  />
                  <span
                    className="absolute -top-1 h-[18px] w-0.5 bg-ink"
                    style={{ left: `${(stat.away / max) * 100}%` }}
                  />
                </span>
                <span className="text-right font-semibold tabular-nums">
                  {stat.home}
                  {stat.suffix ?? ""}
                </span>
              </div>
            );
          })}
          <div className="flex flex-wrap gap-4 px-4 py-2.5 text-xs text-mute">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-3.5 bg-win" />
              {club("home").shortName} ahead
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-3.5 bg-compare" />
              {club("home").shortName} behind
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-0.5 bg-ink" />
              {club("away").shortName}
            </span>
          </div>
        </Section>
        <Section span={5} title="Scoring and breaks" meta={`${all.length} events`}>
          <div className="grid grid-cols-3 border-b border-line2">
            {(["Try", "Kick", "Line break"] as const).map((k) => (
              <div key={k} className="border-r border-line2 px-4 py-2.5 last:border-r-0">
                <div className="text-xs text-mute">
                  {k === "Kick" ? "Kicks at goal" : k === "Try" ? "Tries" : "Line breaks"}
                </div>
                <div className="font-medium">
                  <span className="text-club">{count("home", k)}</span>{" "}
                  <span className="text-xs text-mute">v</span>{" "}
                  <span className="text-away">{count("away", k)}</span>
                </div>
              </div>
            ))}
          </div>
          <ul className="max-h-[340px] overflow-y-auto">
            {all.map((event) => (
              <li
                key={event.id}
                className="grid h-8 w-full grid-cols-[36px_3px_minmax(0,1fr)_60px] items-center gap-2.5 border-b border-line2 px-4"
              >
                <span className="text-right font-mono text-xs text-mute">{event.minute}′</span>
                <span className="h-4" style={{ background: colour(event.side) }} />
                <span className="truncate">
                  {event.kind === "Kick" ? "Kick at goal" : event.kind}
                  <span className="sr-only">, {club(event.side).name}</span>
                </span>
                <span className="text-right text-xs text-mute">
                  {event.kind === "Kick" ? (event.made ? "Made" : "Missed") : ""}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex gap-4 px-4 py-2.5 text-xs text-mute">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-[3px] bg-club" />
              {club("home").shortName}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-[3px] bg-away" />
              {club("away").shortName}
            </span>
          </div>
        </Section>
      </PanelGrid>
    </div>
  );
}
