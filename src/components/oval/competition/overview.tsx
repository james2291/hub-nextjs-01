// Competition Overview (prototype Comp-Overview): champions and headline figures, play-offs, last
// round, top four plus the user's club, season leaders by club and biggest wins. Server component.
import NextLink from "next/link";

import { PageBody } from "@/components/oval/app-shell";
import {
  ClubLabel,
  ColourBar,
  KpiStrip,
  PanelGrid,
  PanelLink,
  Section,
  type Kpi,
} from "@/components/oval/primitives";
import { CURRENT_USER } from "@/lib/user";
import { perMatch, signed, ukDate, type Fixture } from "@/lib/rugby";
import { cn } from "@/lib/utils";
import { getCompetition, getFixtures, getStandings, type StandingRow } from "@/server/feeds";
import { clubHrefs } from "@/server/links";

function shortDay(iso: string) {
  return ukDate(iso).replace(/ \d{4}$/, "");
}

export function winnerSide(fixture: Fixture): "home" | "away" | null {
  if (
    !fixture.scored ||
    fixture.home.score === null ||
    fixture.away.score === null ||
    fixture.home.score === fixture.away.score
  )
    return null;
  return fixture.home.score > fixture.away.score ? "home" : "away";
}

export function CompetitionOverview({ slug }: { slug: string }) {
  const competition = getCompetition(slug);
  if (!competition) return null;
  const href = clubHrefs();
  const all = getFixtures({ competition: slug });
  const regular = all.filter((fixture) => !fixture.knockout);
  const knockouts = all.filter((fixture) => fixture.knockout).reverse();
  const scoredRegular = regular.filter((fixture) => fixture.scored);
  const final = knockouts.find((fixture) => fixture.round === "Final");
  const finalWinner = final ? winnerSide(final) : null;
  const champion = final && finalWinner ? final[finalWinner].club : null;
  const totalPoints = scoredRegular.reduce(
    (sum, fixture) => sum + (fixture.home.score ?? 0) + (fixture.away.score ?? 0),
    0,
  );
  const homeWins = scoredRegular.filter((fixture) => winnerSide(fixture) === "home").length;
  const standings = getStandings(slug);
  const leagueStage = !regular.some((fixture) => fixture.round.startsWith("Pool"));

  const kpis: Kpi[] = [
    {
      label: "Champions",
      value: champion ? champion.name : "Not decided",
      detail: final ? `${final.venue} · ${shortDay(final.dateTime)}` : "Final not in feed",
    },
    {
      label: "Matches",
      value: all.length,
      detail: `${regular.length} ${leagueStage ? "regular season" : "pool"} · ${knockouts.length} ${leagueStage ? "play-offs" : "knockout"}`,
    },
    {
      label: "Points per match",
      value: perMatch(totalPoints, scoredRegular.length).toFixed(1),
      detail: `${totalPoints.toLocaleString("en-GB")} in the ${leagueStage ? "regular season" : "pool stage"}`,
    },
    {
      label: "Home wins",
      value: `${Math.round((homeWins / Math.max(1, scoredRegular.length)) * 100)}%`,
      detail: `${homeWins} of ${scoredRegular.length} ${leagueStage ? "regular-season" : "pool"} matches`,
    },
  ];

  const lastRoundNumber = Math.max(0, ...regular.map((fixture) => fixture.roundNumber ?? 0));
  const lastRound = regular.filter((fixture) => fixture.roundNumber === lastRoundNumber);
  const lastRoundLabel =
    lastRound[0]?.round.replace(/^Pool \d+ · R/, "Pool round ") ?? `Round ${lastRoundNumber}`;

  const biggest = [...scoredRegular]
    .map((fixture) => ({
      fixture,
      margin: Math.abs((fixture.home.score ?? 0) - (fixture.away.score ?? 0)),
    }))
    .sort(
      (a, b) => b.margin - a.margin || (a.fixture.roundNumber ?? 0) - (b.fixture.roundNumber ?? 0),
    )
    .slice(0, 5);

  return (
    <PageBody>
      <KpiStrip items={kpis} />

      <PanelGrid>
        <KnockoutsPanel slug={slug} span={4} />

        <Section
          span={4}
          minWidth={420}
          title={`${lastRoundLabel} results`}
          meta={lastRound[0] ? shortDay(lastRound[0].dateTime) : null}
        >
          <div className="grid h-[30px] grid-cols-[minmax(0,1fr)_56px_minmax(0,1fr)] items-center gap-2.5 border-b border-line2 px-4 text-[11px] font-medium text-mute">
            <span className="text-right">Home</span>
            <span />
            <span>Away</span>
          </div>
          {lastRound.map((fixture) => {
            const winner = winnerSide(fixture);
            return (
              <NextLink
                key={fixture.id}
                href={`/matches/${fixture.id}`}
                className="grid h-[35px] grid-cols-[minmax(0,1fr)_56px_minmax(0,1fr)] items-center gap-2.5 border-b border-line2 px-4 last:border-b-0 hover:bg-subtle"
              >
                <span className={cn("truncate text-right", winner === "home" && "font-semibold")}>
                  {fixture.home.club.name}
                </span>
                <span className="text-center font-semibold tabular-nums">
                  {fixture.scored ? `${fixture.home.score}–${fixture.away.score}` : "v"}
                </span>
                <span className={cn("truncate", winner === "away" && "font-semibold")}>
                  {fixture.away.club.name}
                </span>
              </NextLink>
            );
          })}
        </Section>

        <Section
          span={4}
          title={standings ? `Top four and ${CURRENT_USER.clubName}` : "Table"}
          meta={
            standings ? (
              <PanelLink href={`/competitions/${slug}/table`}>Full table</PanelLink>
            ) : undefined
          }
        >
          {standings ? (
            <TopFour rows={standings.rows} href={href} />
          ) : (
            <p className="px-4 py-6 text-mute">No standings feed for this competition yet.</p>
          )}
        </Section>
      </PanelGrid>

      <PanelGrid>
        <Section span={5} minWidth={460} title="Season leaders by club" meta="Standings feed">
          {standings ? (
            <Leaders rows={standings.rows} href={href} />
          ) : (
            <p className="px-4 py-6 text-mute">Needs a standings feed for this competition.</p>
          )}
        </Section>
        <Section
          span={7}
          minWidth={560}
          title="Biggest wins"
          meta={leagueStage ? "Regular season" : "Pool stage"}
        >
          <div className="grid h-[30px] grid-cols-[100px_minmax(0,1fr)_64px_minmax(0,1fr)_56px] items-center gap-2.5 border-b border-line2 px-4 text-[11px] font-medium text-mute">
            <span>Round</span>
            <span className="text-right">Home</span>
            <span />
            <span>Away</span>
            <span className="text-right">Margin</span>
          </div>
          {biggest.map(({ fixture, margin }) => {
            return (
              <NextLink
                key={fixture.id}
                href={`/matches/${fixture.id}`}
                className="grid h-[35px] grid-cols-[100px_minmax(0,1fr)_64px_minmax(0,1fr)_56px] items-center gap-2.5 border-b border-line2 px-4 last:border-b-0 hover:bg-subtle"
              >
                <span className="truncate text-mute">{fixture.round}</span>
                <span className="truncate text-right">{fixture.home.club.name}</span>
                <span className="text-center font-semibold tabular-nums">
                  {fixture.home.score}–{fixture.away.score}
                </span>
                <span className="truncate">{fixture.away.club.name}</span>
                <span className="text-right text-mute tabular-nums">{margin}</span>
              </NextLink>
            );
          })}
        </Section>
      </PanelGrid>
    </PageBody>
  );
}

/** Play-offs (league) or knockouts (cups), oldest first, winners in bold. */
export function KnockoutsPanel({ slug, span }: { slug: string; span: number }) {
  const all = getFixtures({ competition: slug });
  const leagueStage = !all.some((fixture) => fixture.round.startsWith("Pool"));
  const knockouts = all.filter((fixture) => fixture.knockout).reverse();
  return (
    <Section
      span={span}
      title={leagueStage ? "Play-offs" : "Knockouts"}
      meta={<PanelLink href={`/competitions/${slug}/fixtures`}>Fixture Card</PanelLink>}
    >
      {knockouts.slice(-7).map((fixture) => {
        const winner = winnerSide(fixture);
        return (
          <NextLink
            key={fixture.id}
            href={`/matches/${fixture.id}`}
            className="block border-b border-line2 px-4 py-2.5 last:border-b-0 hover:bg-subtle"
          >
            <div className="mb-1 flex justify-between gap-3 text-[11px] text-mute">
              <span>{fixture.round}</span>
              <span className="truncate">
                {shortDay(fixture.dateTime)} · {fixture.venue}
              </span>
            </div>
            {(["home", "away"] as const).map((side) => (
              <div key={side} className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "flex min-w-0 items-center gap-2",
                    winner === side && "font-medium",
                  )}
                >
                  <ColourBar colour={fixture[side].club.colour} />
                  <span className="truncate">{fixture[side].club.name}</span>
                </span>
                <span className={cn("tabular-nums", winner === side && "font-medium")}>
                  {fixture[side].score ?? "–"}
                </span>
              </div>
            ))}
          </NextLink>
        );
      })}
      {knockouts.length === 0 && (
        <p className="px-4 py-6 text-mute">No knockout matches in the feed.</p>
      )}
    </Section>
  );
}

function TopFour({ rows, href }: { rows: StandingRow[]; href: (slug: string) => string }) {
  const mine = rows.find((row) => row.club.slug === CURRENT_USER.clubSlug);
  const shown = rows.slice(0, 4).concat(mine && mine.position > 4 ? [mine] : []);
  return (
    <>
      <div className="grid h-[30px] grid-cols-[24px_minmax(0,1fr)_40px] items-center gap-2.5 border-b border-line2 px-4 text-[11px] font-medium text-mute">
        <span>#</span>
        <span>Club</span>
        <span className="text-right">Pts</span>
      </div>
      {shown.map((row) => {
        const isMine = row.club.slug === CURRENT_USER.clubSlug;
        return (
          <div
            key={row.club.id}
            className={cn(
              "grid h-[35px] grid-cols-[24px_minmax(0,1fr)_40px] items-center gap-2.5 border-b border-line2 px-4 last:border-b-0",
              isMine && "bg-club-tint shadow-[inset_2px_0_0_var(--club)]",
            )}
          >
            <span className="text-mute">{row.position}</span>
            <ClubLabel club={row.club} href={href(row.club.slug)} />
            <span className="text-right font-semibold tabular-nums">{row.points}</span>
          </div>
        );
      })}
    </>
  );
}

function Leaders({ rows, href }: { rows: StandingRow[]; href: (slug: string) => string }) {
  const best = (pick: (row: StandingRow) => number, lowest = false) =>
    [...rows].sort(
      (a, b) => (lowest ? pick(a) - pick(b) : pick(b) - pick(a)) || a.position - b.position,
    )[0];
  const measures: Array<{
    label: string;
    row: StandingRow | undefined;
    value: (row: StandingRow) => string;
  }> = [
    { label: "Most tries", row: best((row) => row.triesFor), value: (row) => String(row.triesFor) },
    {
      label: "Fewest tries conceded",
      row: best((row) => row.triesAgainst, true),
      value: (row) => String(row.triesAgainst),
    },
    {
      label: "Best points difference",
      row: best((row) => row.pointsDiff),
      value: (row) => signed(row.pointsDiff),
    },
    {
      label: "Most bonus points",
      row: best((row) => row.bonus),
      value: (row) => String(row.bonus),
    },
    {
      label: "Most losing bonus points",
      row: best((row) => row.losingBonus),
      value: (row) => String(row.losingBonus),
    },
  ];
  return (
    <>
      <div className="grid h-[30px] grid-cols-[190px_minmax(0,1fr)_50px] items-center gap-2.5 border-b border-line2 px-4 text-[11px] font-medium text-mute">
        <span>Measure</span>
        <span>Club</span>
        <span />
      </div>
      {measures.map(
        (measure) =>
          measure.row && (
            <div
              key={measure.label}
              className="grid h-[35px] grid-cols-[190px_minmax(0,1fr)_50px] items-center gap-2.5 border-b border-line2 px-4 last:border-b-0"
            >
              <span className="text-mute">{measure.label}</span>
              <ClubLabel club={measure.row.club} href={href(measure.row.club.slug)} />
              <span className="text-right font-semibold tabular-nums">
                {measure.value(measure.row)}
              </span>
            </div>
          ),
      )}
    </>
  );
}
