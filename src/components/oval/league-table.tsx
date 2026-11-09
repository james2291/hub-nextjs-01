"use client";

// League table (HANDOFF.md section 4, "Table"): #, Club, P, W, D, L, PD, BP, Pts, Last 5. The user's
// club is highlighted, a dashed play-off line sits under the last play-off place, club names link
// to the team (the next opponent to Next opponent). Used on Home (compact) and Competition Table.
import NextLink from "next/link";

import { useClubHref, useShell } from "@/components/oval/app-shell";
import { ColourBar, FormLetters } from "@/components/oval/primitives";
import { signed } from "@/lib/rugby";
import { cn } from "@/lib/utils";
import type { Standings } from "@/server/feeds";

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
  const rows = limit ? standings.rows.slice(0, limit) : standings.rows;
  const columns = compact
    ? "22px minmax(0,1fr) 22px 22px 22px 22px 40px 26px 30px 66px"
    : "28px minmax(0,1fr) 34px 34px 34px 34px 44px 44px 50px 40px 40px 40px 44px 76px";
  return (
    <div
      role="table"
      aria-label={`${standings.competition.name} table`}
      className={compact ? "text-xs" : "text-[13px]"}
    >
      <div
        role="row"
        className={cn(
          "grid items-center gap-1.5 border-y border-line2 text-[11px] text-mute",
          compact ? "h-7 px-3.5" : "h-[30px] gap-2.5 border-t-0 px-4 font-medium",
        )}
        style={{ gridTemplateColumns: columns }}
      >
        <span>#</span>
        <span className={compact ? undefined : "sticky left-0 z-10 bg-panel"}>Club</span>
        <span className="text-right">P</span>
        <span className="text-right">W</span>
        <span className="text-right">D</span>
        <span className="text-right">L</span>
        {!compact && (
          <>
            <span className="text-right">PF</span>
            <span className="text-right">PA</span>
          </>
        )}
        <span className="text-right">PD</span>
        {!compact && (
          <>
            <span className="text-right">TF</span>
            <span className="text-right">TA</span>
          </>
        )}
        <span className="text-right">BP</span>
        <span className="text-right">Pts</span>
        <span className="text-right">Last 5</span>
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
              row.position === standings.playOffPlaces
                ? "border-b border-dashed border-faint"
                : "border-b border-line2",
              mine && "bg-club-tint shadow-[inset_2px_0_0_var(--club)]",
            )}
            style={{ gridTemplateColumns: columns }}
          >
            <span className="text-mute">{row.position}</span>
            <span
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
              </NextLink>
            </span>
            <span className="text-right">{row.played}</span>
            <span className="text-right">{row.won}</span>
            <span className="text-right">{row.drawn}</span>
            <span className="text-right">{row.lost}</span>
            {!compact && (
              <>
                <span className="text-right text-mute">{row.pointsFor}</span>
                <span className="text-right text-mute">{row.pointsAgainst}</span>
              </>
            )}
            <span
              className={cn(
                "text-right",
                compact
                  ? "text-mute"
                  : row.pointsDiff > 0
                    ? "text-win"
                    : row.pointsDiff < 0
                      ? "text-loss"
                      : "text-mute",
              )}
            >
              {signed(row.pointsDiff)}
            </span>
            {!compact && (
              <>
                <span className="text-right text-mute">{row.triesFor}</span>
                <span className="text-right text-mute">{row.triesAgainst}</span>
              </>
            )}
            <span className="text-right text-mute">{row.bonus}</span>
            <span className="text-right font-semibold">{row.points}</span>
            <span className="flex justify-end">
              <FormLetters results={row.last5} />
            </span>
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
          includes play-off matches, newest on the right. Source: standings feed.
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
