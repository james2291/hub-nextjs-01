// Match Overview (prototype Match-Story). Score, half-time, date, venue and round are from the
// fixtures feed; momentum and top stats are ILLUSTRATIVE (src/lib/match-illustrative.ts) and the
// lineup shows positions until the event and team-sheet
// feeds exist. The timeline shows only what the feed knows. Server component.
import NextLink from "next/link";

import { PageBody } from "@/components/oval/app-shell";
import { MatchLineup } from "@/components/oval/match/lineup";
import { Momentum } from "@/components/oval/match/momentum";
import { DataNote, PanelGrid, Section } from "@/components/oval/primitives";
import { players } from "@/data/hub";
import { illustrativeStats, scoreBias } from "@/lib/match-illustrative";
import { STARTING } from "@/lib/positions";
import { CURRENT_USER } from "@/lib/user";
import { ukTime, type Fixture } from "@/lib/rugby";
import { cn } from "@/lib/utils";

function namesFor(clubSlug: string): Record<number, string> {
  const named: Record<number, string> = {};
  for (const player of players.filter((item) => item.teamId === clubSlug)) {
    const slot =
      STARTING.find((item) => item.label.toLowerCase() === player.position.toLowerCase()) ??
      (/flanker/i.test(player.position) ? STARTING[6] : undefined);
    if (slot && !named[slot.number]) named[slot.number] = player.name;
  }
  return named;
}

export function MatchOverview({ fixture, played }: { fixture: Fixture; played: boolean }) {
  const home = fixture.home.club;
  const away = fixture.away.club;
  const stats = illustrativeStats(fixture);
  const initialSide = away.slug === CURRENT_USER.clubSlug ? "away" : "home";
  const timeline: Array<{ minute: string; label: string; score: string | null; muted?: boolean }> =
    [
      {
        minute: "0′",
        label: `Kick-off · ${ukTime(fixture.dateTime)} UK`,
        score: "0–0",
        muted: true,
      },
      ...(fixture.home.ht !== null && fixture.away.ht !== null
        ? [
            {
              minute: "40′",
              label: "Half-time",
              score: `${fixture.home.ht}–${fixture.away.ht}`,
              muted: true,
            },
          ]
        : []),
      ...(fixture.scored
        ? [
            {
              minute: "80′",
              label: "Full time",
              score: `${fixture.home.score}–${fixture.away.score}`,
            },
          ]
        : []),
    ];

  return (
    <PageBody>
      {played ? (
        <>
          <DataNote label="ILLUSTRATIVE">
            Score, half-time, date, venue and round are from the feed. Momentum, match stats and the
            lineup are illustrative until the Hub API sends them.
          </DataNote>
          <Momentum
            matchId={fixture.id}
            home={home.name}
            away={away.name}
            bias={scoreBias(fixture)}
          />
        </>
      ) : (
        <DataNote>
          Not played yet. Kick-off {ukTime(fixture.dateTime)} UK. Momentum and match stats appear
          once the match has been played and the event feed is connected.
        </DataNote>
      )}
      <PanelGrid>
        {played && (
          <Section
            span={6}
            title="Top stats"
            meta={
              <span>
                <span className="text-club">{home.shortName}</span> v {away.shortName}
              </span>
            }
          >
            {stats.map((stat) => {
              const total = stat.home + stat.away || 1;
              return (
                <div
                  key={stat.label}
                  className="border-b border-line2 px-4 pb-1.5 pt-2 last:border-b-0"
                >
                  <div className="flex justify-between text-[13px]">
                    <span className="font-semibold tabular-nums">
                      {stat.home}
                      {stat.suffix ?? ""}
                    </span>
                    <span className="text-xs text-mute">{stat.label}</span>
                    <span className="tabular-nums">
                      {stat.away}
                      {stat.suffix ?? ""}
                    </span>
                  </div>
                  <div className="mt-1 flex gap-1">
                    <span
                      className="h-[3px] bg-club"
                      style={{ width: `${(stat.home / total) * 100}%` }}
                    />
                    <span
                      className="h-[3px] bg-[#A8A8A0]"
                      style={{ width: `${(stat.away / total) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </Section>
        )}
        <Section span={played ? 6 : 12} title="Timeline" meta="Score at each point">
          {timeline.map((row) => (
            <div
              key={row.minute + row.label}
              className={cn(
                "grid h-[35px] grid-cols-[48px_minmax(0,1fr)_60px] items-center gap-2.5 border-b border-line2 px-4",
                row.muted ? "bg-subtle" : "shadow-[inset_2px_0_0_var(--club)]",
              )}
            >
              <span className="font-mono text-xs text-mute">{row.minute}</span>
              <span>{row.label}</span>
              <span className="text-right font-semibold tabular-nums">{row.score}</span>
            </div>
          ))}
          <p className="px-4 py-3 text-xs text-mute">
            Tries, kicks and cards between these points need the event feed. Referee:{" "}
            {fixture.referee ? (
              <NextLink href={`/referees/${fixture.referee.slug}`} className="underline">
                {fixture.referee.name}
              </NextLink>
            ) : (
              "not in feed"
            )}
            .
          </p>
        </Section>
      </PanelGrid>

      <MatchLineup
        home={home}
        away={away}
        names={{ home: namesFor(home.slug), away: namesFor(away.slug) }}
        initial={initialSide}
      />
    </PageBody>
  );
}
