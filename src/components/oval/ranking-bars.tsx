"use client";

// Ranking bars with a measure switcher, a league-average marker and the user's club in red
// (HANDOFF.md section 4, "Competition Stats").
import NextLink from "next/link";
import { useState } from "react";

import { useClubHref, useShell } from "@/components/oval/app-shell";
import { signed } from "@/lib/rugby";
import { cn } from "@/lib/utils";

export type RankingMeasure = {
  key: string;
  label: string;
  values: Array<{ slug: string; name: string; value: number }>;
  signed?: boolean;
  lowerIsBetter?: boolean;
};

export function RankingBars({
  measures,
  averageLabel,
}: {
  measures: RankingMeasure[];
  averageLabel: string;
}) {
  const shell = useShell();
  const clubHref = useClubHref();
  const [key, setKey] = useState(measures[0]?.key ?? "");
  const measure = measures.find((item) => item.key === key) ?? measures[0];
  if (!measure) return null;
  const rows = [...measure.values].sort((a, b) =>
    measure.lowerIsBetter ? a.value - b.value : b.value - a.value,
  );
  const average = rows.reduce((sum, row) => sum + row.value, 0) / Math.max(1, rows.length);
  const min = Math.min(0, ...rows.map((row) => row.value));
  const max = Math.max(...rows.map((row) => row.value), 1);
  const span = max - min || 1;
  const position = (value: number) => ((value - min) / span) * 100;
  const format = (value: number) => (measure.signed ? signed(Math.round(value)) : String(value));

  return (
    <>
      <div className="flex h-10 items-center gap-3 border-b border-line2 px-4">
        <h2 className="text-[13px] font-semibold">Club rankings</h2>
        <div role="tablist" aria-label="Measure" className="ml-auto flex flex-wrap gap-1">
          {measures.map((item) => (
            <button
              key={item.key}
              role="tab"
              type="button"
              aria-selected={item.key === measure.key}
              onClick={() => setKey(item.key)}
              className={cn(
                "h-[26px] min-h-0 rounded-[3px] border px-2.5 text-xs",
                item.key === measure.key
                  ? "border-ink bg-ink text-white"
                  : "border-line bg-panel text-ink hover:bg-subtle",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <div className="px-4 pb-3 pt-2.5">
        <div className="mb-1.5 text-xs text-mute">
          {measure.label} · {averageLabel}{" "}
          <span className="font-semibold text-ink">
            {measure.signed
              ? signed(Math.round(average * 10) / 10)
              : (Math.round(average * 10) / 10).toFixed(1)}
          </span>
        </div>
        {rows.map((row, index) => {
          const mine = row.slug === shell.clubSlug;
          const zero = position(0);
          const end = position(row.value);
          return (
            <div
              key={row.slug}
              className="grid h-[34px] grid-cols-[24px_180px_minmax(0,1fr)_48px] items-center gap-3"
            >
              <span className="text-mute">{index + 1}</span>
              <NextLink
                href={clubHref(row.slug)}
                className={cn("truncate hover:underline", mine && "font-semibold text-club")}
              >
                {row.name}
              </NextLink>
              <span className="relative block h-3 bg-[#EDEDE9]">
                <span
                  className={cn("absolute inset-y-0", mine ? "bg-club" : "bg-[#A8A8A0]")}
                  style={{ left: `${Math.min(zero, end)}%`, width: `${Math.abs(end - zero)}%` }}
                />
                <span
                  aria-hidden="true"
                  className="absolute -top-1 h-5 w-0.5 bg-ink"
                  style={{ left: `${position(average)}%` }}
                />
              </span>
              <span className="text-right font-semibold tabular-nums">{format(row.value)}</span>
            </div>
          );
        })}
        <div className="mt-2 flex gap-4 text-xs text-mute">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-3.5 bg-club" />
            {shell.user.clubName}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-3.5 bg-[#A8A8A0]" />
            Other clubs
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-0.5 bg-ink" />
            {averageLabel.replace(/ average$/, "")} average
          </span>
        </div>
      </div>
    </>
  );
}
