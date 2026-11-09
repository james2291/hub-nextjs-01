"use client";

// League table (HANDOFF.md section 4, "Table"): #, Club, P, W, D, L, PD, BP, Pts, Last 5. The user's
// club is highlighted, a dashed play-off line sits under the last play-off place, club names link
// to the team (the next opponent to Next opponent). Compact on Home; the full Table tab adds
// PF/PA/TF/TA and click-to-sort column headings. ARIA table roles throughout.
import { ArrowDown, ArrowUp } from "lucide-react";
import NextLink from "next/link";
import { useState } from "react";

import { useClubHref, useShell } from "@/components/oval/app-shell";
import { ColourBar, FormLetters } from "@/components/oval/primitives";
import { signed } from "@/lib/rugby";
import { cn } from "@/lib/utils";
import type { StandingRow, Standings } from "@/server/feeds";

type SortKey =
  | "position"
  | "played"
  | "won"
  | "drawn"
  | "lost"
  | "pointsFor"
  | "pointsAgainst"
  | "pointsDiff"
  | "triesFor"
  | "triesAgainst"
  | "bonus"
  | "points";

type Column = {
  key: SortKey | "club" | "last5";
  label: string;
  title: string;
  full?: boolean;
  tone?: "mute" | "pd";
};

const COLUMNS: Column[] = [
  { key: "position", label: "#", title: "Position" },
  { key: "club", label: "Club", title: "Club" },
  { key: "played", label: "P", title: "Played" },
  { key: "won", label: "W", title: "Won" },
  { key: "drawn", label: "D", title: "Drawn" },
  { key: "lost", label: "L", title: "Lost" },
  { key: "pointsFor", label: "PF", title: "Points for", full: true, tone: "mute" },
  { key: "pointsAgainst", label: "PA", title: "Points against", full: true, tone: "mute" },
  { key: "pointsDiff", label: "PD", title: "Points difference", tone: "pd" },
  { key: "triesFor", label: "TF", title: "Tries for", full: true, tone: "mute" },
  { key: "triesAgainst", label: "TA", title: "Tries against", full: true, tone: "mute" },
  { key: "bonus", label: "BP", title: "Bonus points", tone: "mute" },
  { key: "points", label: "Pts", title: "League points" },
  { key: "last5", label: "Last 5", title: "Last five results, newest on the right" },
];

/** Measures where a lower number is better sort ascending first. */
const ASCENDING_FIRST: SortKey[] = ["position", "lost", "pointsAgainst", "triesAgainst"];

export function LeagueTable({
  standings,
  compact = false,
  limit,
}: {
  standings: Standings;
  compact?: boolean;
  limit?: number;
}) {
  const shell = useShell();
  const clubHref = useClubHref();
  const [sort, setSort] = useState<{ key: SortKey; ascending: boolean }>({
    key: "position",
    ascending: true,
  });
  const columns = COLUMNS.filter((column) => !compact || !column.full);
  const template = compact
    ? "22px minmax(0,1fr) 22px 22px 22px 22px 40px 26px 30px 66px"
    : "28px minmax(0,1fr) 34px 34px 34px 34px 44px 44px 50px 40px 40px 40px 44px 76px";
  const sorted = [...standings.rows].sort((a, b) => {
    const diff = (a[sort.key] as number) - (b[sort.key] as number);
    return (sort.ascending ? diff : -diff) || a.position - b.position;
  });
  const rows = limit ? sorted.slice(0, limit) : sorted;
  const leagueOrder = sort.key === "position" && sort.ascending;

  const toggle = (key: SortKey) =>
    setSort((current) =>
      current.key === key
        ? { key, ascending: !current.ascending }
        : { key, ascending: ASCENDING_FIRST.includes(key) },
    );

  const cellValue = (row: StandingRow, column: Column) => {
    if (column.key === "club" || column.key === "last5") return null;
    const value = row[column.key];
    return column.key === "pointsDiff" ? signed(value) : value;
  };

  return (
    <div
      role="table"
      aria-label={`${standings.competition.name} table`}
      aria-rowcount={rows.length + 1}
      className={compact ? "text-xs" : "text-[13px]"}
    >
      <div
        role="row"
        className={cn(
          "grid items-center gap-1.5 border-y border-line2 text-[11px] text-mute",
          compact ? "h-7 px-3.5" : "h-[30px] gap-2.5 border-t-0 px-4 font-medium",
        )}
        style={{ gridTemplateColumns: template }}
      >
        {columns.map((column) => {
          const sortable = !compact && column.key !== "club" && column.key !== "last5";
          const active = sortable && sort.key === column.key;
          return (
            <span
              key={column.key}
              role="columnheader"
              title={column.title}
              aria-sort={
                active
                  ? sort.ascending
                    ? "ascending"
                    : "descending"
                  : sortable
                    ? "none"
                    : undefined
              }
              className={cn(
                column.key !== "position" && column.key !== "club" && "text-right",
                column.key === "club" && !compact && "sticky left-0 z-10 bg-panel",
              )}
            >
              {sortable ? (
                <button
                  type="button"
                  onClick={() => toggle(column.key as SortKey)}
                  className={cn(
                    "inline-flex min-h-0 items-center gap-0.5 hover:text-ink",
                    active && "text-ink",
                  )}
                >
                  {column.label}
                  {active &&
                    (sort.ascending ? (
                      <ArrowUp aria-hidden="true" className="size-3" />
                    ) : (
                      <ArrowDown aria-hidden="true" className="size-3" />
                    ))}
                  <span className="sr-only">{column.title}, sort</span>
                </button>
              ) : (
                <>
                  <span
                    aria-hidden={
                      compact && column.key !== "club" && column.key !== "last5" ? true : undefined
                    }
                  >
                    {column.label}
                  </span>
                  {compact && column.key !== "club" && column.key !== "last5" && (
                    <span className="sr-only">{column.title}</span>
                  )}
                </>
              )}
            </span>
          );
        })}
      </div>
      {rows.map((row) => {
        const mine = row.club.slug === shell.clubSlug;
        return (
          <div
            key={row.club.id}
            role="row"
            className={cn(
              "grid h-[34px] items-center tabular-nums",
              compact ? "gap-1.5 px-3.5" : "gap-2.5 px-4",
              leagueOrder && row.position === standings.playOffPlaces
                ? "border-b border-dashed border-faint"
                : "border-b border-line2",
              mine && "bg-club-tint shadow-[inset_2px_0_0_var(--club)]",
            )}
            style={{ gridTemplateColumns: template }}
          >
            {columns.map((column) => {
              if (column.key === "club") {
                return (
                  <span
                    key="club"
                    role="rowheader"
                    className={cn(
                      "flex min-w-0 items-center gap-2",
                      !compact && "sticky left-0 z-10 -my-px self-stretch py-px",
                      !compact && (mine ? "bg-club-tint" : "bg-panel"),
                    )}
                  >
                    <ColourBar colour={row.club.colour} />
                    <NextLink
                      href={clubHref(row.club.slug)}
                      title={row.club.name}
                      className={cn(
                        "truncate hover:underline",
                        mine ? "font-semibold text-club" : "text-ink",
                      )}
                    >
                      {compact ? row.club.shortName : row.club.name}
                      {mine && <span className="sr-only"> (your club)</span>}
                    </NextLink>
                  </span>
                );
              }
              if (column.key === "last5") {
                return (
                  <span key="last5" role="cell" className="flex justify-end">
                    <FormLetters results={row.last5} />
                  </span>
                );
              }
              return (
                <span
                  key={column.key}
                  role="cell"
                  className={cn(
                    column.key === "position" ? "text-mute" : "text-right",
                    column.key === "points" && "font-semibold",
                    column.tone === "mute" && "text-mute",
                    column.tone === "pd" &&
                      (compact
                        ? "text-mute"
                        : row.pointsDiff > 0
                          ? "text-win"
                          : row.pointsDiff < 0
                            ? "text-loss"
                            : "text-mute"),
                  )}
                >
                  {cellValue(row, column)}
                </span>
              );
            })}
          </div>
        );
      })}
      {compact ? (
        <div className="px-3.5 py-2.5 text-[11px] leading-normal text-faint">
          Top {standings.playOffPlaces} go to the play-offs. BP = bonus points. Last 5 includes
          play-off matches, newest on the right.
          <br />
          Final 2025/26 standings from the standings feed. A table as it stood on a given day would
          need standings by round.
        </div>
      ) : (
        <div className="px-4 py-3 text-xs text-mute">
          PF/PA = points for/against · TF/TA = tries for/against · BP = bonus points. Last 5
          includes play-off matches, newest on the right. Click a column heading to sort. Source:
          standings feed.
        </div>
      )}
    </div>
  );
}

export function LeagueTableLink({ href, children }: { href: string; children: string }) {
  return (
    <NextLink href={href} className="text-xs text-mute underline hover:text-ink">
      {children}
    </NextLink>
  );
}
