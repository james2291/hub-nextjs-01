"use client";

// Match header (prototype Match-Story): crests, clubs, score, full-time line and the Overview /
// Video / Stats tabs. Score, date, venue and round come from the fixtures feed.
import NextLink from "next/link";
import { usePathname } from "next/navigation";

import { useClubHref } from "@/components/oval/app-shell";
import { Crest } from "@/components/oval/primitives";
import { ukDate, ukTime, type Fixture } from "@/lib/rugby";
import { cn } from "@/lib/utils";

export const MATCH_TABS = [
  { label: "Overview", slug: "" },
  { label: "Video", slug: "video" },
  { label: "Stats", slug: "stats" },
];

export function MatchHeader({ fixture, now }: { fixture: Fixture; now: string }) {
  const pathname = usePathname() ?? "";
  const clubHref = useClubHref();
  const base = `/matches/${fixture.id}`;
  const played =
    new Date(now).getTime() > new Date(fixture.dateTime).getTime() + 2 * 60 * 60 * 1000;
  const status = played
    ? fixture.scored
      ? "Full time"
      : "No score in feed"
    : `Kick-off ${ukTime(fixture.dateTime)}`;
  const line = [
    status,
    ukDate(fixture.dateTime).replace(/ \d{4}$/, ""),
    fixture.venue,
    fixture.round,
    fixture.attendance ? fixture.attendance.toLocaleString("en-GB") : null,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <section className="border-b border-line bg-panel px-4 pt-4 md:px-6">
      <div className="grid grid-cols-2 items-center gap-x-4 gap-y-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <div className="flex min-w-0 items-center gap-3">
          <Crest
            code={fixture.home.club.code}
            colour={fixture.home.club.colour}
            onColour={fixture.home.club.onColour}
            className="max-sm:hidden"
          />
          <div className="min-w-0">
            <NextLink
              href={clubHref(fixture.home.club.slug)}
              className="block truncate text-sm font-semibold hover:underline sm:text-xl"
            >
              {fixture.home.club.name}
            </NextLink>
            <div className="hidden text-xs text-mute sm:block">Home</div>
          </div>
        </div>
        <div className="order-first col-span-2 text-center sm:order-none sm:col-span-1 sm:max-w-[480px]">
          <h1 className="text-2xl font-semibold leading-none tabular-nums sm:text-[32px]">
            {played && fixture.scored ? (
              <>
                {fixture.home.score} <span className="text-faint">–</span> {fixture.away.score}
              </>
            ) : (
              <span className="font-mono text-2xl text-mute">{ukTime(fixture.dateTime)}</span>
            )}
          </h1>
          <div className="mt-1.5 text-[11px] text-mute sm:text-xs">
            {line}
            {played && fixture.home.ht !== null && fixture.away.ht !== null
              ? ` · HT ${fixture.home.ht}–${fixture.away.ht}`
              : ""}
          </div>
          <NextLink
            href={`/competitions/${fixture.competition.slug}`}
            className="text-xs text-mute underline hover:text-ink"
          >
            {fixture.competition.name}
          </NextLink>
        </div>
        <div className="flex min-w-0 items-center justify-end gap-3 text-right">
          <div className="min-w-0">
            <NextLink
              href={clubHref(fixture.away.club.slug)}
              className="block truncate text-sm font-semibold hover:underline sm:text-xl"
            >
              {fixture.away.club.name}
            </NextLink>
            <div className="hidden text-xs text-mute sm:block">Away</div>
          </div>
          <Crest
            code={fixture.away.club.code}
            colour={fixture.away.club.colour}
            onColour={fixture.away.club.onColour}
            className="max-sm:hidden"
          />
        </div>
      </div>
      <nav
        aria-label="Match sections"
        className="mt-3 flex gap-[22px] overflow-x-auto max-md:pr-8 max-md:[mask-image:linear-gradient(to_right,black_80%,transparent)]"
      >
        {MATCH_TABS.map((tab) => {
          const href = tab.slug ? `${base}/${tab.slug}` : base;
          const active = pathname === href;
          return (
            <NextLink
              key={tab.label}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "-mb-px flex h-[38px] items-center border-b-2 px-0.5",
                active
                  ? "border-ink font-medium text-ink"
                  : "border-transparent text-mute hover:text-ink",
              )}
            >
              {tab.label}
            </NextLink>
          );
        })}
      </nav>
    </section>
  );
}
