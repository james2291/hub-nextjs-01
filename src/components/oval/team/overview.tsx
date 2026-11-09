// Team Overview (prototype Team-Overview): headline KPIs, the club against the league, last five
// league results, the club's cup run and key players (demo). Server component.
import NextLink from "next/link";

import { PageBody } from "@/components/oval/app-shell";
import {
  DataNote,
  KpiStrip,
  PanelGrid,
  PanelLink,
  ResultMark,
  Section,
  type Kpi,
} from "@/components/oval/primitives";
import { players } from "@/data/hub";
import {
  opponentOf,
  ordinal,
  perMatch,
  recordFor,
  recordLabel,
  resultFor,
  sideOf,
  signed,
  ukDayMonth,
  type Fixture,
} from "@/lib/rugby";
import { cn } from "@/lib/utils";
import {
  competitionsOf,
  furthestStage,
  getClub,
  getFixtures,
  getStandings,
  rankInStandings,
  standingOf,
  type StandingRow,
} from "@/server/feeds";

type Measure = {
  label: string;
  value: number;
  league: number;
  rank: number;
  max: number;
  lowerIsBetter: boolean;
  decimals: number;
};

/** The club's measures against the league average per club (standings feed). */
export function leagueMeasures(row: StandingRow, rows: StandingRow[]): Measure[] {
  const avg = (pick: (r: StandingRow) => number) =>
    rows.reduce((sum, r) => sum + pick(r), 0) / rows.length;
  const make = (
    label: string,
    pick: (r: StandingRow) => number,
    lowerIsBetter: boolean,
    decimals = 1,
  ): Measure => ({
    label,
    value: pick(row),
    league: avg(pick),
    rank: rankInStandings(rows, row.club.slug, pick, lowerIsBetter),
    max: Math.max(...rows.map(pick)),
    lowerIsBetter,
    decimals,
  });
  return [
    make("Points for per match", (r) => r.pointsFor / r.played, false),
    make("Points against per match", (r) => r.pointsAgainst / r.played, true),
    make("Tries for per match", (r) => r.triesFor / r.played, false),
    make("Tries against per match", (r) => r.triesAgainst / r.played, true),
    make("Bonus points", (r) => r.bonus, false, 0),
  ];
}

function opponentLine(fixture: Fixture, club: string) {
  const opponent = opponentOf(fixture, club);
  return `${sideOf(fixture, club) === "home" ? "v" : "at"} ${opponent?.name ?? ""}`;
}

export function TeamOverview({ slug }: { slug: string }) {
  const club = getClub(slug);
  if (!club) return null;
  const standings = getStandings("gallagher-prem");
  const row = standingOf(slug);
  const cups = competitionsOf(slug).filter((competition) => competition.slug !== "gallagher-prem");
  const allFixtures = getFixtures({ club: slug });

  const kpis: Kpi[] = [];
  if (row && standings) {
    const lastPlayOff = standings.rows[standings.playOffPlaces - 1];
    kpis.push(
      {
        label: "League position",
        value: ordinal(row.position),
        detail: `${row.points} pts${lastPlayOff && row.position > standings.playOffPlaces ? ` · ${lastPlayOff.points - row.points} behind ${ordinal(standings.playOffPlaces)}` : ""}`,
      },
      {
        label: "PREM record",
        value: `${row.won}–${row.drawn}–${row.lost}`,
        detail: "Won–drawn–lost",
      },
      {
        label: "Points difference",
        value: signed(row.pointsDiff),
        detail: `${row.pointsFor} for · ${row.pointsAgainst} against`,
        tone: row.pointsDiff < 0 ? "loss" : row.pointsDiff > 0 ? "win" : "mute",
      },
      { label: "Tries", value: row.triesFor, detail: `${row.triesAgainst} conceded` },
    );
  } else {
    const record = recordFor(allFixtures, slug);
    kpis.push(
      {
        label: "Record",
        value: recordLabel(record),
        detail: `${record.played} matches in these feeds`,
      },
      {
        label: "Points for",
        value: record.pointsFor,
        detail: `${perMatch(record.pointsFor, record.played).toFixed(1)} per match`,
      },
      {
        label: "Points against",
        value: record.pointsAgainst,
        detail: `${perMatch(record.pointsAgainst, record.played).toFixed(1)} per match`,
      },
    );
  }
  for (const cup of cups.slice(0, 2)) {
    const games = getFixtures({ club: slug, competition: cup.slug });
    const record = recordFor(games, slug);
    const exit = games.find((fixture) => fixture.knockout && resultFor(fixture, slug) === "L");
    const exitText = exit
      ? ` · lost ${exit[sideOf(exit, slug) ?? "home"].score}–${exit[sideOf(exit, slug) === "home" ? "away" : "home"].score} to ${(opponentOf(exit, slug)?.name ?? "").split(" ")[0]}`
      : "";
    kpis.push({
      label: cup.name,
      value: furthestStage(slug, cup.slug) ?? "",
      detail: `${record.won}W ${record.lost}L${exitText}`,
    });
  }

  const leagueResults = getFixtures({ club: slug, competition: "gallagher-prem" })
    .filter((fixture) => fixture.scored)
    .slice(0, 5);
  const cup = cups[0];
  const cupGames = cup ? getFixtures({ club: slug, competition: cup.slug }) : [];
  const pools = [
    ...new Set(cupGames.map((fixture) => fixture.round.match(/^(Pool \d+)/)?.[1]).filter(Boolean)),
  ];
  const stage = cup ? furthestStage(slug, cup.slug) : null;
  const roster = players.filter((player) => player.teamId === slug);

  return (
    <PageBody>
      <KpiStrip items={kpis} />

      {row && standings && (
        <PanelGrid>
          <Section span={8} title="Against the league" meta="Gallagher PREM 2025/26">
            <AgainstLeague
              measures={leagueMeasures(row, standings.rows)}
              clubShort={club.shortName}
              total={standings.rows.length}
            />
          </Section>
          <Section
            span={4}
            title="Last 5 PREM results"
            meta={<PanelLink href={`/teams/${slug}/fixtures`}>Fixture Card</PanelLink>}
          >
            <ResultsTable fixtures={leagueResults} club={slug} />
          </Section>
        </PanelGrid>
      )}

      <PanelGrid>
        {cup && (
          <Section
            span={roster.length ? 6 : 12}
            title={cup.name}
            meta={[...pools, stage && stage !== "Pool stage" ? stage.toLowerCase() : null]
              .filter(Boolean)
              .join(" and ")}
          >
            <div
              role="row"
              className="grid h-[30px] grid-cols-[70px_minmax(0,1fr)_24px_60px] items-center gap-2.5 border-b border-line2 px-4 text-[11px] font-medium text-mute"
            >
              <span>Date</span>
              <span>Round</span>
              <span />
              <span className="text-right">Score</span>
            </div>
            {cupGames.map((fixture) => (
              <NextLink
                key={fixture.id}
                href={`/matches/${fixture.id}`}
                className="grid h-[35px] grid-cols-[70px_minmax(0,1fr)_24px_60px] items-center gap-2.5 border-b border-line2 px-4 last:border-b-0 hover:bg-subtle"
              >
                <span className="text-mute">{ukDayMonth(fixture.dateTime)}</span>
                <span className="truncate">
                  {fixture.round} · {opponentLine(fixture, slug)}
                </span>
                <ResultMark result={resultFor(fixture, slug)} className="text-[11px]" />
                <span className="text-right tabular-nums">
                  {fixture.scored ? `${fixture.home.score}–${fixture.away.score}` : "–"}
                </span>
              </NextLink>
            ))}
          </Section>
        )}
        {roster.length > 0 && (
          <Section
            span={cup ? 6 : 12}
            title="Key players"
            meta={<span className="font-mono text-[11px] font-medium text-club">DEMO DATA</span>}
          >
            <div
              role="row"
              className="grid h-[30px] grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_50px] items-center gap-2.5 border-b border-line2 px-4 text-[11px] font-medium text-mute"
            >
              <span>Player</span>
              <span>Position</span>
              <span className="text-right">Apps</span>
            </div>
            {roster.map((player) => (
              <div
                key={player.id}
                className="grid h-[35px] grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_50px] items-center gap-2.5 border-b border-line2 px-4 last:border-b-0"
              >
                <NextLink href={`/players/${player.id}`} className="truncate hover:underline">
                  {player.name}
                </NextLink>
                <span className="text-mute">{player.position}</span>
                <span className="text-right tabular-nums">{player.apps}</span>
              </div>
            ))}
          </Section>
        )}
      </PanelGrid>
      {!row && (
        <DataNote>
          Only Gallagher PREM has a standings feed, so league comparisons are shown for PREM clubs.
        </DataNote>
      )}
    </PageBody>
  );
}

function AgainstLeague({
  measures,
  clubShort,
  total,
}: {
  measures: Measure[];
  clubShort: string;
  total: number;
}) {
  const columns = "190px minmax(0,1fr) 60px 60px 70px 44px";
  return (
    <>
      <div
        role="row"
        className="grid h-[30px] items-center gap-2.5 border-b border-line2 px-4 text-[11px] font-medium text-mute"
        style={{ gridTemplateColumns: columns }}
      >
        <span>Measure</span>
        <span />
        <span className="text-right">{clubShort}</span>
        <span className="text-right">League</span>
        <span className="text-right">Diff</span>
        <span className="text-right">Rank</span>
      </div>
      {measures.map((measure) => {
        const diff =
          Number(measure.value.toFixed(measure.decimals)) - Number(measure.league.toFixed(1));
        const better = measure.lowerIsBetter ? diff < 0 : diff > 0;
        const scale = (value: number) => `${Math.min(100, (value / (measure.max * 1.25)) * 100)}%`;
        return (
          <div
            key={measure.label}
            className="grid h-[35px] items-center gap-2.5 border-b border-line2 px-4"
            style={{ gridTemplateColumns: columns }}
          >
            <span className="truncate">{measure.label}</span>
            <span className="relative block h-3.5">
              <span className="absolute inset-x-0 top-1.5 h-0.5 bg-line2" />
              <span
                className="absolute left-0 top-1 h-1.5 bg-ink"
                style={{ width: scale(measure.value) }}
              />
              <span
                className="absolute top-0 h-3.5 w-0.5 bg-club"
                style={{ left: scale(measure.league) }}
              />
            </span>
            <span className="text-right tabular-nums">
              {measure.value.toFixed(measure.decimals)}
            </span>
            <span className="text-right text-mute tabular-nums">{measure.league.toFixed(1)}</span>
            <span
              className={cn(
                "text-right tabular-nums",
                diff === 0 ? "text-mute" : better ? "text-win" : "text-loss",
              )}
            >
              {signed(Math.round(diff * 10) / 10)}
            </span>
            <span className="text-right text-mute">{ordinal(measure.rank)}</span>
          </div>
        );
      })}
      <div className="px-4 py-2 text-xs text-mute">
        <span className="mr-1 inline-block h-3 w-0.5 bg-club align-middle" />
        league average per club. Rank is out of {total}. Standings feed.
      </div>
    </>
  );
}

function ResultsTable({ fixtures, club }: { fixtures: Fixture[]; club: string }) {
  return (
    <>
      <div
        role="row"
        className="grid h-[30px] grid-cols-[60px_minmax(0,1fr)_20px_56px] items-center gap-2.5 border-b border-line2 px-4 text-[11px] font-medium text-mute"
      >
        <span>Date</span>
        <span>Opponent</span>
        <span />
        <span className="text-right">Score</span>
      </div>
      {fixtures.map((fixture) => (
        <NextLink
          key={fixture.id}
          href={`/matches/${fixture.id}`}
          className="grid h-[35px] grid-cols-[60px_minmax(0,1fr)_20px_56px] items-center gap-2.5 border-b border-line2 px-4 last:border-b-0 hover:bg-subtle"
        >
          <span className="text-mute">{ukDayMonth(fixture.dateTime)}</span>
          <span className="truncate">{opponentLine(fixture, club)}</span>
          <ResultMark result={resultFor(fixture, club)} className="text-[11px]" />
          <span className="text-right tabular-nums">
            {fixture.home.score}–{fixture.away.score}
          </span>
        </NextLink>
      ))}
    </>
  );
}
