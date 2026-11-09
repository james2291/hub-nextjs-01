"use client";

// Home: the matchday page (HANDOFF.md section 4, "Home"). Centre column with a day strip and the
// day's matches grouped by competition; the league table in a 430px right column.
import { ChevronDown, ChevronLeft, ChevronRight, Play, Star } from "lucide-react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

import { useShell } from "@/components/oval/app-shell";
import { LeagueTable, LeagueTableLink } from "@/components/oval/league-table";
import { ColourBar, DataNote } from "@/components/oval/primitives";
import { usePins } from "@/lib/pins";
import { useUrlState } from "@/lib/url-state";
import {
  ukDate,
  ukDayKey,
  ukDayMonth,
  ukTime,
  type CompetitionRef,
  type Fixture,
} from "@/lib/rugby";
import { cn } from "@/lib/utils";
import type { Standings } from "@/server/feeds";

/** A match counts as played two hours after kick-off (the feed has no live state). */
const PLAYED_AFTER_MS = 2 * 60 * 60 * 1000;
const WINDOW = 4;

export type HomeProps = {
  /** ISO time the page treats as now (real clock, or HUB_NOW). */
  now: string;
  fixtures: Fixture[];
  standings: Standings | null;
  feedNames: string[];
};

export function HomeView({ now, fixtures, standings, feedNames }: HomeProps) {
  const shell = useShell();
  const { home } = usePins();
  const router = useRouter();
  // Open the user's chosen home page once per browser session; Home stays reachable after that.
  useEffect(() => {
    if (home && home !== "/" && !sessionStorage.getItem("oval-hub:home-visited")) {
      sessionStorage.setItem("oval-hub:home-visited", "1");
      router.replace(home);
    }
  }, [home, router]);

  const today = ukDayKey(now);
  const days = useMemo(() => {
    const keys = new Set(fixtures.map((fixture) => ukDayKey(fixture.dateTime)));
    keys.add(today);
    return [...keys].sort();
  }, [fixtures, today]);
  // Out of season (no matches today), open on the nearest matchday instead of an empty list.
  const matchDays = useMemo(
    () => new Set(fixtures.map((fixture) => ukDayKey(fixture.dateTime))),
    [fixtures],
  );
  const lastMatchDay = days.filter((day) => matchDays.has(day)).at(-1) ?? today;
  const defaultDay = useMemo(() => {
    if (matchDays.has(today)) return today;
    const distance = (day: string) => Math.abs(new Date(day).getTime() - new Date(today).getTime());
    return (
      [...matchDays].sort((a, b) => distance(a) - distance(b) || b.localeCompare(a))[0] ?? today
    );
  }, [matchDays, today]);
  const seasonOver = today > lastMatchDay;
  // The selected day is in the URL (?day=2026-05-16) so it can be shared and survives Back.
  const [selected, setSelected] = useUrlState<string>("day", defaultDay, days);
  const index = days.indexOf(selected);
  const start = Math.max(0, Math.min(index - WINDOW, days.length - (WINDOW * 2 + 1)));
  const visible = days.slice(start, start + WINDOW * 2 + 1);

  const dayFixtures = useMemo(
    () =>
      fixtures
        .filter((fixture) => ukDayKey(fixture.dateTime) === selected)
        .sort((a, b) => a.dateTime.localeCompare(b.dateTime)),
    [fixtures, selected],
  );
  const groups = useMemo(() => {
    const byCompetition = new Map<string, { competition: CompetitionRef; fixtures: Fixture[] }>();
    for (const fixture of dayFixtures) {
      const group = byCompetition.get(fixture.competition.slug) ?? {
        competition: fixture.competition,
        fixtures: [],
      };
      group.fixtures.push(fixture);
      byCompetition.set(fixture.competition.slug, group);
    }
    return [...byCompetition.values()];
  }, [dayFixtures]);

  const clubMatch = dayFixtures.find(
    (fixture) =>
      fixture.home.club.slug === shell.clubSlug || fixture.away.club.slug === shell.clubSlug,
  );
  const summary = [
    ukDate(`${selected}T12:00:00Z`),
    dayFixtures.length
      ? `${dayFixtures.length} ${dayFixtures.length === 1 ? "match" : "matches"} in your competitions`
      : "No matches in your competitions",
    ...(clubMatch
      ? [
          `${clubMatch.home.club.name} v ${clubMatch.away.club.name} at ${ukTime(clubMatch.dateTime)}`,
        ]
      : []),
  ].join(" · ");

  return (
    <div className="flex flex-col gap-4 px-4 pb-8 pt-5 md:px-6">
      <DataNote>
        {feedNamesLabel(feedNames)} 2025/26 feeds, viewed as matchday {ukDate(now)}, {ukTime(now)}.
        {seasonOver
          ? ` The 2025/26 season is complete: showing the last matchday, ${ukDate(`${lastMatchDay}T12:00:00Z`)}, and the final table.`
          : !matchDays.has(today) && selected === defaultDay
            ? ` No matches today: showing the nearest matchday.`
            : ""}
      </DataNote>
      <div className="flex flex-wrap items-baseline gap-3">
        <h1 className="text-xl font-semibold">Matchday</h1>
        <span className="text-mute">{summary}</span>
      </div>
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_430px]">
        <div className="flex min-w-0 flex-col gap-3">
          <section className="overflow-hidden rounded border border-line bg-panel">
            <div className="flex items-center gap-1.5 px-3 py-2.5">
              <StripArrow
                label="Previous day"
                disabled={index <= 0}
                onClick={() => setSelected(days[index - 1] ?? selected)}
              >
                <ChevronLeft className="size-4" />
              </StripArrow>
              <div className="flex flex-1 gap-1 overflow-hidden">
                {visible.map((day, position) => {
                  const active = day === selected;
                  // Phones show the selected day and two either side.
                  const far = Math.abs(position - visible.indexOf(selected)) > 2;
                  const date = `${day}T12:00:00Z`;
                  return (
                    <button
                      key={day}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setSelected(day)}
                      className={cn(
                        "flex h-11 min-w-0 flex-1 flex-col items-center justify-center gap-px rounded-[3px] text-[11px]",
                        active ? "bg-ink text-white" : "text-ink hover:bg-subtle",
                        far && "max-sm:hidden",
                      )}
                    >
                      <span>
                        {day === today
                          ? "Today"
                          : new Intl.DateTimeFormat("en-GB", {
                              weekday: "short",
                              timeZone: "Europe/London",
                            }).format(new Date(date))}
                      </span>
                      <span className="whitespace-nowrap font-semibold">{ukDayMonth(date)}</span>
                    </button>
                  );
                })}
              </div>
              <StripArrow
                label="Next day"
                disabled={index >= days.length - 1}
                onClick={() => setSelected(days[index + 1] ?? selected)}
              >
                <ChevronRight className="size-4" />
              </StripArrow>
            </div>
          </section>

          {groups.length === 0 && (
            <section className="rounded border border-line bg-panel px-4 py-8 text-center text-mute">
              No matches on this day in your competitions.
            </section>
          )}
          {groups.map((group) => (
            <MatchGroup
              key={group.competition.slug}
              competition={group.competition}
              fixtures={group.fixtures}
              now={now}
              clubSlug={shell.clubSlug}
            />
          ))}
        </div>

        {standings && (
          <section className="overflow-hidden rounded border border-line bg-panel">
            <div className="flex h-10 items-center justify-between px-3.5">
              <h2 className="text-[13px] font-semibold">
                <NextLink
                  href={`/competitions/${standings.competition.slug}`}
                  className="hover:underline"
                >
                  {standings.competition.name}
                </NextLink>{" "}
                table
              </h2>
              <LeagueTableLink href={`/competitions/${standings.competition.slug}/table`}>
                Full table
              </LeagueTableLink>
            </div>
            <LeagueTable standings={standings} compact />
          </section>
        )}
      </div>
    </div>
  );
}

function feedNamesLabel(names: string[]): string {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}

function StripArrow({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid h-11 w-[30px] shrink-0 place-items-center rounded-[3px] border border-line2 bg-panel text-ink hover:bg-subtle disabled:text-faint"
    >
      {children}
    </button>
  );
}

function MatchGroup({
  competition,
  fixtures,
  now,
  clubSlug,
}: {
  competition: CompetitionRef;
  fixtures: Fixture[];
  now: string;
  clubSlug: string;
}) {
  const [open, setOpen] = useState(true);
  const rounds = [...new Set(fixtures.map((fixture) => fixture.round))].join(", ");
  return (
    <section className="overflow-hidden rounded border border-line bg-panel">
      <div className="flex h-12 items-center gap-2.5 pl-4 pr-2">
        <NextLink
          href={`/competitions/${competition.slug}`}
          className="flex items-center gap-2.5 text-ink hover:underline"
        >
          <span className="grid size-6 place-items-center rounded-[3px] bg-subtle font-mono text-[9px] font-semibold text-mute">
            {competition.code}
          </span>
          <span className="font-semibold">{competition.name}</span>
        </NextLink>
        <span className="text-mute">{rounds}</span>
        <button
          type="button"
          aria-label="Show or hide matches"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="ml-auto flex h-8 items-center gap-2 px-2 text-xs text-mute"
        >
          {fixtures.length} {fixtures.length === 1 ? "match" : "matches"}
          <ChevronDown className={cn("size-3.5 transition-transform", !open && "-rotate-90")} />
        </button>
      </div>
      {open &&
        fixtures.map((fixture) => (
          <MatchRow key={fixture.id} fixture={fixture} now={now} clubSlug={clubSlug} />
        ))}
    </section>
  );
}

function MatchRow({ fixture, now, clubSlug }: { fixture: Fixture; now: string; clubSlug: string }) {
  const played = new Date(now).getTime() >= new Date(fixture.dateTime).getTime() + PLAYED_AFTER_MS;
  const mine = fixture.home.club.slug === clubSlug || fixture.away.club.slug === clubSlug;
  const [followed, toggleFollow] = useFollow(fixture.id, mine);
  const name = (slug: string) =>
    cn("truncate", slug === clubSlug ? "font-semibold text-club" : "text-ink");
  return (
    <div
      className={cn(
        "relative grid h-[46px] grid-cols-[34px_minmax(0,1fr)_72px_minmax(0,1fr)_44px] items-center gap-2.5 border-t border-line2 px-4",
        mine ? "bg-club-tint" : "hover:bg-subtle",
      )}
    >
      <NextLink
        href={`/matches/${fixture.id}`}
        aria-label={`${fixture.home.club.name} v ${fixture.away.club.name}`}
        className="absolute inset-0"
      />
      <span />
      <span className="flex min-w-0 items-center justify-end gap-2">
        <span className={name(fixture.home.club.slug)}>{fixture.home.club.name}</span>
        <ColourBar colour={fixture.home.club.colour} className="h-4" />
      </span>
      <span className="flex flex-col items-center leading-[1.2]">
        {played && fixture.scored ? (
          <>
            <span className="text-[15px] font-semibold tabular-nums">
              {fixture.home.score}–{fixture.away.score}
            </span>
            <span className="text-[10px] text-faint">FT</span>
          </>
        ) : (
          <span className="font-mono text-[13px] font-medium text-mute">
            {ukTime(fixture.dateTime)}
          </span>
        )}
      </span>
      <span className="flex min-w-0 items-center gap-2">
        <ColourBar colour={fixture.away.club.colour} className="h-4" />
        <span className={name(fixture.away.club.slug)}>{fixture.away.club.name}</span>
      </span>
      <span className="relative flex items-center justify-end gap-2.5">
        <Play
          aria-label="Video after the match"
          className="size-2.5 fill-[#D4D4CE] text-[#D4D4CE]"
        />
        <button
          type="button"
          aria-label={followed ? "Unfollow match" : "Follow match"}
          aria-pressed={followed}
          onClick={toggleFollow}
          className="grid min-h-0 place-items-center"
        >
          <Star className={cn("size-3.5", followed ? "fill-club text-club" : "text-faint")} />
        </button>
      </span>
    </div>
  );
}

// Followed matches, remembered in this browser. The user's club's matches start followed.
const FOLLOW_KEY = "oval-hub:followed:v1";
const followListeners = new Set<() => void>();

function readFollows(): Record<string, boolean> {
  try {
    return JSON.parse(window.localStorage.getItem(FOLLOW_KEY) ?? "{}") as Record<string, boolean>;
  } catch {
    return {};
  }
}

function useFollow(id: number, initial: boolean): [boolean, () => void] {
  const stored = useSyncExternalStore(
    (listener) => {
      followListeners.add(listener);
      return () => followListeners.delete(listener);
    },
    () => readFollows()[String(id)],
    () => undefined,
  );
  const followed = stored ?? initial;
  const toggle = () => {
    const next = { ...readFollows(), [String(id)]: !followed };
    try {
      window.localStorage.setItem(FOLLOW_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    followListeners.forEach((listener) => listener());
  };
  return [followed, toggle];
}
