"use client";

// Match momentum (ILLUSTRATIVE): a line through five-minute readings. Above the centre line the
// home side is on top, below it the away side. Territory or possession. Values are seeded per
// match until the event feed exists. Click or focus a five-minute block for its reading.
import { Play } from "lucide-react";
import NextLink from "next/link";
import { useId, useMemo, useState } from "react";

import { seeded } from "@/lib/seeded";
import { cn } from "@/lib/utils";

const BLOCKS = 16;
const W = 160;
const H = 100;

/** Smooth path through the points (Catmull-Rom converted to cubic Béziers). */
function smoothPath(points: Array<[number, number]>): string {
  let d = `M ${points[0]?.[0] ?? 0} ${points[0]?.[1] ?? 0}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    if (!p0 || !p1 || !p2 || !p3) continue;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${c1[0]} ${c1[1]}, ${c2[0]} ${c2[1]}, ${p2[0]} ${p2[1]}`;
  }
  return d;
}

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
  const clip = useId();
  const [mode, setMode] = useState<"Territory" | "Possession">("Territory");
  const values = useMemo(() => {
    const random = seeded(matchId + (mode === "Territory" ? 0 : 7919));
    return Array.from({ length: BLOCKS }, () =>
      Math.max(-45, Math.min(45, Math.round((random() * 2 - 1 + bias) * 32))),
    );
  }, [matchId, mode, bias]);
  const [selected, setSelected] = useState(9);
  const value = values[selected] ?? 0;
  const start = selected * 5;
  const share = (reading: number) => 50 + Math.abs(Math.round(reading / 1.2));

  const points = values.map((reading, index): [number, number] => [
    index * 10 + 5,
    H / 2 - reading,
  ]);
  const line = smoothPath([
    [0, points[0]?.[1] ?? H / 2],
    ...points,
    [W, points.at(-1)?.[1] ?? H / 2],
  ]);
  const area = `${line} L ${W} ${H / 2} L 0 ${H / 2} Z`;

  return (
    <section className="overflow-hidden rounded border border-line bg-panel">
      <div className="flex min-h-10 flex-wrap items-center gap-x-3 gap-y-1 border-b border-line2 px-4 py-2">
        <h2 className="text-[13px] font-semibold">Match momentum</h2>
        <span className="ml-auto hidden text-xs text-mute md:inline">
          Above the line: {home} on top · below: {away}
        </span>
        <div className="flex gap-1 max-md:ml-auto">
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
        <div className="relative h-[200px]">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            aria-hidden="true"
            className="absolute inset-0 size-full"
          >
            <defs>
              <clipPath id={`${clip}-top`}>
                <rect x="0" y="0" width={W} height={H / 2} />
              </clipPath>
              <clipPath id={`${clip}-bottom`}>
                <rect x="0" y={H / 2} width={W} height={H / 2} />
              </clipPath>
            </defs>
            {[25, 75].map((y) => (
              <line
                key={y}
                x1="0"
                x2={W}
                y1={y}
                y2={y}
                stroke="var(--line2)"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            ))}
            <path d={area} fill="var(--club)" fillOpacity="0.14" clipPath={`url(#${clip}-top)`} />
            <path d={area} fill="#77776F" fillOpacity="0.16" clipPath={`url(#${clip}-bottom)`} />
            <line
              x1="0"
              x2={W}
              y1={H / 2}
              y2={H / 2}
              stroke="var(--line)"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1={W / 2}
              x2={W / 2}
              y1="0"
              y2={H}
              stroke="var(--faint)"
              strokeWidth="1"
              strokeDasharray="3 3"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={line}
              fill="none"
              stroke="var(--club)"
              strokeWidth="2"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              clipPath={`url(#${clip}-top)`}
            />
            <path
              d={line}
              fill="none"
              stroke="#55554F"
              strokeWidth="2"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              clipPath={`url(#${clip}-bottom)`}
            />
          </svg>
          <span className="absolute left-0 top-0 text-[11px] text-club">{home}</span>
          <span className="absolute bottom-0 left-0 text-[11px] text-mute">{away}</span>
          <span className="absolute bottom-0 left-1/2 ml-1 text-[11px] text-mute">HT</span>
          <div className="absolute inset-0 grid grid-cols-16">
            {values.map((reading, index) => (
              <button
                key={index}
                type="button"
                aria-pressed={selected === index}
                aria-label={`${index * 5}–${index * 5 + 5} minutes: ${reading >= 0 ? home : away} ${share(reading)}% ${mode.toLowerCase()}`}
                title={`${index * 5}–${index * 5 + 5}′: ${reading >= 0 ? home : away} on top (${share(reading)}% ${mode.toLowerCase()}, illustrative)`}
                onClick={() => setSelected(index)}
                className={cn(
                  "relative h-full min-h-0",
                  selected === index ? "bg-ink/5" : "hover:bg-ink/[0.03]",
                )}
              >
                <span
                  className={cn(
                    "absolute left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-panel",
                    reading >= 0 ? "bg-club" : "bg-[#55554F]",
                    selected === index ? "size-3" : "size-1.5 border-0",
                  )}
                  style={{ top: `${H / 2 - reading}%` }}
                />
              </button>
            ))}
          </div>
        </div>
        <div className="mt-1 flex justify-between font-mono text-[10px] text-faint">
          {[0, 10, 20, 30, 40, 50, 60, 70, 80].map((minute) => (
            <span key={minute}>{minute}′</span>
          ))}
        </div>
      </div>
      <div className="m-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[3px] bg-subtle px-4 py-2.5">
        <span className="font-mono text-xs text-mute">
          {start}–{start + 5}′
        </span>
        <span>
          {value >= 0 ? home : away} {share(value)}% {mode.toLowerCase()}
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
