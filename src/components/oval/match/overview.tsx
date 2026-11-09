// Match Overview (prototype Match-Story). Score, half-time, date, venue and round are from the
// fixtures feed; momentum, top stats and the lineup are ILLUSTRATIVE until the event and team-sheet
// feeds exist. The timeline shows only what the feed knows. Server component.
import NextLink from "next/link";

import { PageBody } from "@/components/oval/app-shell";
import { Momentum } from "@/components/oval/match/momentum";
import { DataNote, PanelGrid, Section } from "@/components/oval/primitives";
import { players } from "@/data/hub";
import { BENCH, STARTING } from "@/lib/positions";
import { CURRENT_USER } from "@/lib/user";
import { ukTime, type Fixture } from "@/lib/rugby";
import { seeded } from "@/lib/seeded";
import { cn } from "@/lib/utils";

const MEASURES: Array<{ label: string; base: number; spread: number; suffix?: string }> = [
  { label: "Possession", base: 50, spread: 8, suffix: "%" },
  { label: "Territory", base: 50, spread: 10, suffix: "%" },
  { label: "Carries", base: 120, spread: 25 },
  { label: "Metres made", base: 550, spread: 120 },
  { label: "Line breaks", base: 4, spread: 3 },
  { label: "Defenders beaten", base: 19, spread: 6 },
  { label: "Tackles made", base: 150, spread: 25 },
  { label: "Turnovers won", base: 6, spread: 3 },
  { label: "Penalties conceded", base: 10, spread: 3 },
];

/** -1..1: how far the real score leans to the home side. */
function scoreBias(fixture: Fixture): number {
  const home = fixture.home.score ?? 0;
  const away = fixture.away.score ?? 0;
  return home + away ? (home - away) / (home + away) : 0;
}

function topStats(fixture: Fixture) {
  const random = seeded(fixture.id);
  const bias = scoreBias(fixture);
  return MEASURES.map((measure) => {
    const lean =
      measure.label === "Penalties conceded" || measure.label === "Tackles made" ? -bias : bias;
    const a = Math.max(
      0,
      Math.round(measure.base + ((random() * 2 - 1) * 0.5 + lean * 0.6) * measure.spread),
    );
    const b =
      measure.suffix === "%"
        ? 100 - a
        : Math.max(0, Math.round(measure.base + (random() * 2 - 1) * measure.spread));
    return { ...measure, home: a, away: b };
  });
}

export function MatchOverview({ fixture, played }: { fixture: Fixture; played: boolean }) {
  const home = fixture.home.club;
  const away = fixture.away.club;
  const stats = topStats(fixture);
  const lineupClub = [home, away].find((club) => club.slug === CURRENT_USER.clubSlug) ?? home;
  const roster = players.filter((player) => player.teamId === lineupClub.slug);
  const named = new Map<number, string>();
  for (const player of roster) {
    const slot =
      STARTING.find((item) => item.label.toLowerCase() === player.position.toLowerCase()) ??
      (/flanker/i.test(player.position) ? STARTING[6] : undefined);
    if (slot && !named.has(slot.number)) named.set(slot.number, player.name);
  }
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

      <PanelGrid>
        <Section
          span={8}
          title={`${lineupClub.name} XV`}
          meta="Positions; names where the Hub has the player"
        >
          <div className="p-4">
            <div className="relative aspect-[760/420] w-full overflow-hidden rounded-[2px] bg-pitch">
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
                  style={{ left: `${slot.x}%`, top: `${100 - slot.y * 0.9 - 5}%` }}
                >
                  <span className="grid size-[26px] place-items-center rounded-full bg-white text-xs font-semibold text-club">
                    {slot.number}
                  </span>
                  <span className="whitespace-nowrap rounded-[2px] bg-ink/85 px-1.5 text-[11px] text-white max-sm:hidden">
                    {named.get(slot.number) ?? slot.label}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </Section>
        <Section span={4} title="Replacements" meta="8 named">
          {BENCH.map((slot) => (
            <div
              key={slot.number}
              className="grid h-[35px] grid-cols-[32px_minmax(0,1fr)] items-center gap-2.5 border-b border-line2 px-4"
            >
              <span className="font-semibold tabular-nums">{slot.number}</span>
              <span>{slot.label}</span>
            </div>
          ))}
          <p className="px-4 py-3 text-xs text-mute">
            Names show where the Hub has the player. Positions stand in for the rest until team
            sheets are in the feeds.
          </p>
        </Section>
      </PanelGrid>
    </PageBody>
  );
}
