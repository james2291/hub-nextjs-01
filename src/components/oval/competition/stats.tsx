// Competition Stats (prototype Comp-Stats): club ranking bars and season totals. Server component.
import { PageBody } from "@/components/oval/app-shell";
import { PanelGrid, Section } from "@/components/oval/primitives";
import { RankingBars, type RankingMeasure } from "@/components/oval/ranking-bars";
import { DataNote } from "@/components/oval/primitives";
import { perMatch } from "@/lib/rugby";
import { getCompetition, getFixtures, getStandings, type StandingRow } from "@/server/feeds";

const SHORT: Record<string, string> = { "gallagher-prem": "PREM" };

export function CompetitionStats({ slug }: { slug: string }) {
  const competition = getCompetition(slug);
  const standings = getStandings(slug);
  if (!competition) return null;
  if (!standings) {
    return (
      <PageBody>
        <DataNote>Club rankings need a standings feed for {competition.name}.</DataNote>
      </PageBody>
    );
  }
  const measure = (
    key: string,
    label: string,
    pick: (row: StandingRow) => number,
    options: Partial<RankingMeasure> = {},
  ): RankingMeasure => ({
    key,
    label,
    values: standings.rows.map((row) => ({
      slug: row.club.slug,
      name: row.club.name,
      value: pick(row),
    })),
    ...options,
  });
  const measures = [
    measure("points", "Points", (row) => row.points),
    measure("pd", "Points difference", (row) => row.pointsDiff, { signed: true }),
    measure("tf", "Tries for", (row) => row.triesFor),
    measure("ta", "Tries against", (row) => row.triesAgainst, { lowerIsBetter: true }),
    measure("bonus", "Bonus points", (row) => row.bonus),
    measure("lbp", "Losing bonus points", (row) => row.losingBonus),
  ];

  const regular = getFixtures({ competition: slug }).filter(
    (fixture) => !fixture.knockout && fixture.scored,
  );
  const points = regular.reduce(
    (sum, fixture) => sum + (fixture.home.score ?? 0) + (fixture.away.score ?? 0),
    0,
  );
  const tries = standings.rows.reduce((sum, row) => sum + row.triesFor, 0);
  const homeWins = regular.filter(
    (fixture) => (fixture.home.score ?? 0) > (fixture.away.score ?? 0),
  ).length;
  const draws = regular.filter((fixture) => fixture.home.score === fixture.away.score).length;
  const totals: Array<[string, string, string]> = [
    ["Matches", String(regular.length), "regular season"],
    [
      "Points",
      points.toLocaleString("en-GB"),
      `${perMatch(points, regular.length).toFixed(1)} per match`,
    ],
    ["Tries", String(tries), `${perMatch(tries, regular.length).toFixed(1)} per match`],
    [
      "Home wins",
      String(homeWins),
      `${Math.round((homeWins / Math.max(1, regular.length)) * 100)}% of matches`,
    ],
    ["Draws", String(draws), "regular season"],
    [
      "Try bonus points",
      String(standings.rows.reduce((sum, row) => sum + row.triesBonus, 0)),
      "all clubs",
    ],
    [
      "Losing bonus points",
      String(standings.rows.reduce((sum, row) => sum + row.losingBonus, 0)),
      "all clubs",
    ],
  ];

  return (
    <PageBody>
      <PanelGrid>
        <section className="col-span-12 min-w-0 bg-panel xl:col-span-8">
          <RankingBars
            measures={measures}
            averageLabel={`${SHORT[slug] ?? competition.name} average`}
          />
        </section>
        <Section
          span={4}
          title="Season totals"
          meta="Regular season"
          className="max-xl:col-span-12"
        >
          {totals.map(([label, value, detail]) => (
            <div
              key={label}
              className="flex h-[37px] items-center justify-between border-b border-line2 px-4 last:border-b-0"
            >
              <span className="text-mute">{label}</span>
              <span>
                <span className="font-semibold tabular-nums">{value}</span>{" "}
                <span className="text-xs text-faint">{detail}</span>
              </span>
            </div>
          ))}
        </Section>
      </PanelGrid>
      <p className="text-xs text-mute">
        From the standings and fixtures feeds. Carry, tackle and set-piece measures arrive with the
        match stats feed.
      </p>
    </PageBody>
  );
}
