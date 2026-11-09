"use client";

// Match momentum (ILLUSTRATIVE): five-minute bars, above the line the home side on top, below the
// away side. Territory or possession. Values are seeded per match until the event feed exists.
import { Play } from "lucide-react";
import NextLink from "next/link";
import { useMemo, useState } from "react";

import { seeded } from "@/lib/seeded";
import { cn } from "@/lib/utils";

export function Momentum({
  matchId,
  home,
  away,
  bias = 0,
}: {
  matchId: number;
  home: string;
  away: string;
  /** -1..1 tilt toward the side that scored more. */ bias?: number;
}) {
  const [mode, setMode] = useState<"Territory" | "Possession">("Territory");
  const bars = useMemo(() => {
    const random = seeded(matchId + (mode === "Territory" ? 0 : 7919));
    return Array.from({ length: 16 }, () =>
      Math.max(-45, Math.min(45, Math.round((random() * 2 - 1 + bias) * 32))),
    );
  }, [matchId, mode, bias]);
  const [selected, setSelected] = useState(9);
  const value = bars[selected] ?? 0;
  const start = selected * 5;

  return (
    <section className="overflow-hidden rounded border border-line bg-panel">
      <div className="flex h-10 items-center gap-3 border-b border-line2 px-4">
        <h2 className="text-[13px] font-semibold">Match momentum</h2>
        <span className="ml-auto hidden text-xs text-mute md:inline">
          Above the line: {home} on top · below: {away}
        </span>
        <div className="flex gap-1">
          {(["Territory", "Possession"] as const).map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={mode === item}
              onClick={() => setMode(item)}
              className={cn(
                "h-[26px] min-h-0 rounded-[3px] border px-2.5 text-xs",
                mode === item
                  ? "border-ink bg-ink text-white"
                  : "border-line bg-panel hover:bg-subtle",
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <div className="px-4 pt-4">
        <div className="relative grid h-[200px] grid-cols-16 gap-1.5">
          <span className="absolute inset-x-0 top-1/2 h-px bg-line" />
          <span className="absolute inset-y-0 left-1/2 border-l border-dashed border-faint" />
          <span className="absolute bottom-0 left-1/2 ml-1 text-[11px] text-mute">HT</span>
          {bars.map((bar, index) => (
            <button
              key={index}
              type="button"
              aria-label={`${index * 5}–${index * 5 + 5} minutes`}
              onClick={() => setSelected(index)}
              className={cn("relative h-full min-h-0", selected === index && "bg-subtle")}
            >
              <span
                className={cn(
                  "absolute inset-x-0",
                  bar >= 0 ? "bottom-1/2 bg-club/80" : "top-1/2 bg-[#77776F]",
                  selected === index && bar >= 0 && "bg-club",
                )}
                style={{ height: `${Math.abs(bar)}%` }}
              />
            </button>
          ))}
        </div>
        <div className="mt-1 flex justify-between font-mono text-[10px] text-faint">
          {[0, 10, 20, 30, 40, 50, 60, 70, 80].map((minute) => (
            <span key={minute}>{minute}′</span>
          ))}
        </div>
      </div>
      <div className="m-4 flex items-center gap-4 rounded-[3px] bg-subtle px-4 py-2.5">
        <span className="font-mono text-xs text-mute">
          {start}–{start + 5}′
        </span>
        <span>
          {value >= 0 ? home : away} {50 + Math.abs(Math.round(value / 1.2))}% {mode.toLowerCase()}
        </span>
        <NextLink
          href={`/matches/${matchId}/video`}
          className="ml-auto inline-flex h-7 items-center gap-1.5 rounded-[3px] border border-line bg-panel px-2.5 text-xs font-medium hover:bg-subtle"
        >
          <Play className="size-3 fill-ink" /> Play from {start}:00
        </NextLink>
      </div>
    </section>
  );
}
