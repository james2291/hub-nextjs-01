"use client";

// TEMPORARY HOLD: seeded / illustrative figures until GET /api/v1/matches/{matchId}/stats is mapped.

// Match Stats, laid out like the Player Stats page: a profile of measures with bars (home side
// against the away side's marker), a scoring summary with the event list, then the try & kick map
// with team / event / half filters full width. ILLUSTRATIVE: locations are seeded per match until the Hub API sends x/y coordinates.
import { useMemo, useState } from "react";

import { DataNote, PanelGrid, Section } from "@/components/oval/primitives";
import { illustrativeStats } from "@/lib/match-illustrative";
import type { Fixture } from "@/lib/rugby";
import { seeded } from "@/lib/seeded";
import { cn } from "@/lib/utils";

type Side = "home" | "away";
type Kind = "Try" | "Kick" | "Line break";
type MapEvent = {
  id: number;
  minute: number;
  side: Side;
  kind: Kind;
  x: number;
  y: number;
  x2?: number;
  made?: boolean;
};

function events(fixture: Fixture): MapEvent[] {
  const random = seeded(fixture.id * 31);
  const list: MapEvent[] = [];
  let id = 0;
  for (const side of ["home", "away"] as const) {
    const attackRight = side === "home";
    // Counts follow the real score: about one try per 7 points, a conversion attempt per try plus a
    // penalty attempt or two. Positions are illustrative.
    const score = fixture[side].score ?? 0;
    const tries = Math.floor(score / 7);
    const penalties = Math.max(0, Math.round((score - tries * 7) / 3));
    for (let i = 0; i < tries; i += 1)
      list.push({
        id: id++,
        minute: 2 + Math.floor(random() * 78),
        side,
        kind: "Try",
        x: attackRight ? 95 : 5,
        y: 15 + random() * 70,
      });
    for (let i = 0; i < tries + penalties; i += 1)
      list.push({
        id: id++,
        minute: 2 + Math.floor(random() * 78),
        side,
        kind: "Kick",
        x: attackRight ? 55 + random() * 30 : 15 + random() * 30,
        y: 15 + random() * 70,
        made: i < tries ? random() > 0.15 : true,
      });
    const breaks = Math.max(1, Math.round(tries * 0.8));
    for (let i = 0; i < breaks; i += 1) {
      const start = attackRight ? 20 + random() * 40 : 40 + random() * 40;
      list.push({
        id: id++,
        minute: 2 + Math.floor(random() * 78),
        side,
        kind: "Line break",
        x: start,
        x2: attackRight ? start + 15 + random() * 30 : start - 15 - random() * 30,
        y: 15 + random() * 70,
      });
    }
  }
  return list.sort((a, b) => a.minute - b.minute);
}

function Toggle<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<[T, string]>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="text-xs text-mute">{label}</span>
      {options.map(([key, text]) => (
        <button
          key={key}
          type="button"
          aria-pressed={value === key}
          onClick={() => onChange(key)}
          className={cn(
            "h-[26px] min-h-0 rounded-[3px] border px-2.5 text-xs",
            value === key ? "border-ink bg-ink text-white" : "border-line bg-panel hover:bg-subtle",
          )}
        >
          {text}
        </button>
      ))}
    </span>
  );
}

export function MatchStats({ fixture, played }: { fixture: Fixture; played: boolean }) {
  const all = useMemo(() => events(fixture), [fixture]);
  const [team, setTeam] = useState<"both" | Side>("both");
  const [kind, setKind] = useState<"all" | Kind>("all");
  const [half, setHalf] = useState<"both" | "1" | "2">("both");
  const shown = all.filter(
    (event) =>
      (team === "both" || event.side === team) &&
      (kind === "all" || event.kind === kind) &&
      (half === "both" || (half === "1" ? event.minute <= 40 : event.minute > 40)),
  );
  const [selected, setSelected] = useState<number | null>(null);
  const active =
    all.find((event) => event.id === selected) ?? shown.find((event) => event.kind === "Try");
  const colour = (side: Side) => (side === "home" ? "var(--club)" : "var(--away)");
  const count = (side: Side, k: Kind) =>
    all.filter((event) => event.side === side && event.kind === k).length;
  const club = (side: Side) => fixture[side].club;
  if (!played) {
    return (
      <div className="px-4 pb-8 pt-5 md:px-6">
        <DataNote>
          Not played yet. The try and kick map appears once the match has been played and the event
          feed is connected.
        </DataNote>
      </div>
    );
  }

  const profile = illustrativeStats(fixture);

  return (
    <div className="flex flex-col gap-4 px-4 pb-8 pt-5 md:px-6">
      <DataNote label="ILLUSTRATIVE">
        Match figures, event locations and counts are illustrative until the Hub API sends the event
        feed with x/y coordinates. The score above is from the feed.
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
        <Section span={5} title="Scoring and breaks" meta={`${shown.length} shown`}>
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
          {active && (
            <div className="border-b border-line2 px-4 py-3">
              <div className="text-xs text-mute">Selected</div>
              <div className="font-semibold">
                {active.minute}′ {club(active.side).name} · {active.kind}
              </div>
            </div>
          )}
          <div className="max-h-[262px] overflow-y-auto">
            {shown.map((event) => (
              <button
                key={event.id}
                type="button"
                onClick={() => setSelected(event.id)}
                className={cn(
                  "grid h-8 w-full grid-cols-[36px_3px_minmax(0,1fr)_60px] items-center gap-2.5 border-b border-line2 px-4 text-left hover:bg-subtle",
                  active?.id === event.id && "bg-subtle",
                )}
              >
                <span className="text-right font-mono text-xs text-mute">{event.minute}′</span>
                <span className="h-4" style={{ background: colour(event.side) }} />
                <span>{event.kind === "Kick" ? "Kick at goal" : event.kind}</span>
                <span className="text-right text-xs text-mute">
                  {event.kind === "Kick" ? (event.made ? "Made" : "Missed") : ""}
                </span>
              </button>
            ))}
          </div>
        </Section>
      </PanelGrid>

      <Section title="Try & kick map" meta="Click any mark for its details">
        <div className="flex flex-wrap gap-4 border-b border-line2 px-4 py-2.5">
          <Toggle
            label="Team"
            value={team}
            onChange={setTeam}
            options={[
              ["both", "Both"],
              ["home", club("home").shortName],
              ["away", club("away").shortName],
            ]}
          />
          <Toggle
            label="Show"
            value={kind}
            onChange={setKind}
            options={[
              ["all", "All"],
              ["Try", "Tries"],
              ["Kick", "Kicks at goal"],
              ["Line break", "Line breaks"],
            ]}
          />
          <Toggle
            label="Half"
            value={half}
            onChange={setHalf}
            options={[
              ["both", "Both"],
              ["1", "1st"],
              ["2", "2nd"],
            ]}
          />
        </div>
        <div className="p-4">
          <div className="relative aspect-[744/434] w-full overflow-hidden lg:aspect-[5/2] rounded-[2px] bg-pitch">
            {Array.from({ length: 10 }, (_, index) => (
              <div
                key={index}
                className={cn("absolute inset-y-0 w-[5%]", index % 2 === 0 && "bg-pitch2")}
                style={{ left: `${index * 10}%` }}
              />
            ))}
            {[8.5, 26, 50, 74, 91.5].map((line) => (
              <div
                key={line}
                className="absolute inset-y-0 w-px bg-white/40"
                style={{ left: `${line}%` }}
              />
            ))}
            <span className="absolute left-2 top-2 text-[11px] text-white">
              {club("home").shortName} defend
            </span>
            <span className="absolute right-2 top-2 text-[11px] text-white">
              {club("home").shortName} attack →
            </span>
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="absolute inset-0 size-full"
            >
              {shown
                .filter((event) => event.kind === "Line break" && event.x2 !== undefined)
                .map((event) => (
                  <line
                    key={event.id}
                    x1={event.x}
                    y1={event.y}
                    x2={event.x2}
                    y2={event.y}
                    stroke={colour(event.side)}
                    strokeWidth={0.5}
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
            </svg>
            {shown.map((event) => {
              const left = event.kind === "Line break" ? (event.x2 ?? event.x) : event.x;
              const isActive = active?.id === event.id;
              return (
                <button
                  key={event.id}
                  type="button"
                  aria-label={`${event.minute}′ ${club(event.side).name} ${event.kind}`}
                  onClick={() => setSelected(event.id)}
                  className="absolute min-h-0 -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${left}%`, top: `${event.y}%` }}
                >
                  {event.kind === "Try" ? (
                    <span
                      className={cn(
                        "grid size-4 place-items-center rounded-full text-[8px] font-bold text-white",
                        isActive && "outline outline-2 outline-offset-2 outline-white",
                      )}
                      style={{ background: colour(event.side) }}
                    >
                      T
                    </span>
                  ) : event.kind === "Kick" ? (
                    <span
                      className={cn(
                        "block size-3 rotate-45 border-2",
                        isActive && "outline outline-2 outline-white",
                      )}
                      style={{
                        borderColor: colour(event.side),
                        background: event.made ? colour(event.side) : "white",
                      }}
                    />
                  ) : (
                    <span
                      className="block size-2 rounded-full"
                      style={{ background: colour(event.side) }}
                    />
                  )}
                </button>
              );
            })}
          </div>
          <div className="mt-2.5 flex flex-wrap gap-4 text-xs text-mute">
            <span>● Try</span>
            <span>◆ Kick made</span>
            <span>◇ Kick missed</span>
            <span>— Line break, start to finish</span>
            <span className="ml-auto">
              <span className="text-club">{club("home").shortName}</span> ·{" "}
              <span className="text-away">{club("away").shortName}</span>
            </span>
          </div>
        </div>
      </Section>
    </div>
  );
}
