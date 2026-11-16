"use client";

// Match lineup: the XV on a pitch with the front row at the top and the back three at the bottom,
// plus replacements, with a toggle for which team to look at. Positions only until team sheets
// are in the feeds; names show where the Hub has the player.
import { useState } from "react";

import { PanelGrid, Section } from "@/components/oval/primitives";
import { BENCH, STARTING } from "@/lib/positions";
import type { ClubRef } from "@/lib/rugby";
import { cn } from "@/lib/utils";

type Side = "home" | "away";
export type LineupNames = Record<Side, Record<number, string>>;

export function MatchLineup({
  home,
  away,
  names,
  initial,
}: {
  home: ClubRef;
  away: ClubRef;
  names: LineupNames;
  initial: Side;
}) {
  const [side, setSide] = useState<Side>(initial);
  const club = side === "home" ? home : away;
  const named = names[side];
  return (
    <PanelGrid>
      <Section
        span={8}
        title={`${club.name} XV`}
        meta={
          <div
            role="radiogroup"
            aria-label="Team"
            className="flex rounded-[3px] border border-line p-0.5"
          >
            {(
              [
                ["home", home],
                ["away", away],
              ] as const
            ).map(([key, item]) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={side === key}
                onClick={() => setSide(key)}
                className={cn(
                  "h-[26px] min-h-0 rounded-[2px] px-2.5 text-xs",
                  side === key ? "bg-ink font-medium text-white" : "text-ink hover:bg-subtle",
                )}
              >
                {item.shortName}
              </button>
            ))}
          </div>
        }
      >
        <div className="p-4">
          <div className="relative aspect-[760/460] w-full overflow-hidden rounded-[2px] bg-pitch">
            {[12.5, 37.5, 62.5, 87.5].map((band) => (
              <div
                key={band}
                className="absolute inset-x-0 h-[12.5%] bg-pitch2"
                style={{ top: `${band}%` }}
              />
            ))}
            <span className="absolute right-3 top-2 text-[11px] text-white">Attacking ↑</span>
            {STARTING.map((slot) => (
              <span
                key={slot.number}
                className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5"
                style={{ left: `${slot.x}%`, top: `${slot.y * 0.92 + 4}%` }}
              >
                <span
                  className="grid size-[26px] place-items-center rounded-full bg-white text-xs font-semibold"
                  style={{ color: club.colour === "#FFFFFF" ? "#18181B" : club.colour }}
                >
                  {slot.number}
                </span>
                <span className="whitespace-nowrap rounded-[2px] bg-ink/85 px-1.5 text-[11px] text-white max-sm:hidden">
                  {named[slot.number] ?? slot.label}
                </span>
              </span>
            ))}
          </div>
          <p className="mt-2.5 text-xs text-mute">
            Front row at the top, back three at the bottom. Names show where the Hub has the player;
            positions stand in for the rest until team sheets are in the feeds.
          </p>
        </div>
      </Section>
      <Section span={4} title={`${club.shortName} replacements`} meta="8 named">
        {BENCH.map((slot) => (
          <div
            key={slot.number}
            className="grid h-[35px] grid-cols-[32px_minmax(0,1fr)] items-center gap-2.5 border-b border-line2 px-4 last:border-b-0"
          >
            <span className="font-semibold tabular-nums">{slot.number}</span>
            <span>{named[slot.number] ?? slot.label}</span>
          </div>
        ))}
      </Section>
    </PanelGrid>
  );
}
