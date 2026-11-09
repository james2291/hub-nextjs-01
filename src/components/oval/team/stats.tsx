// Team Stats (prototype Team-Stats): each measure against the league average with the club's rank
// and the best club, plus a home/away split. Server component.
import { PageBody } from "@/components/oval/app-shell";
import {
  ClubLabel,
  DataNote,
  KpiStrip,
  PanelGrid,
  PanelLink,
  Section,
  type Kpi,
} from "@/components/oval/primitives";
import { ordinal, perMatch, recordFor, recordLabel, signed } from "@/lib/rugby";
import {
  getClub,
  getFixtures,
  getStandings,
  rankInStandings,
  standingOf,
  type StandingRow,
} from "@/server/feeds";
import { clubHrefs } from "@/server/links";

export function TeamStats({ slug }: { slug: string }) {
  const club = getClub(slug);
  const standings = getStandings("gallagher-prem");
  const row = standingOf(slug);
  if (!club) return null;
  if (!row || !standings) {
    return (
      <PageBody>
        <DataNote>
          League comparisons need a standings feed. Only Gallagher PREM has one, and {club.name}{" "}
          isn&apos;t in it.
        </DataNote>
      </PageBody>
    );
  }
  const href = clubHrefs();
  const rows = standings.rows;
  const total = rows.length;
  const avg = (pick: (r: StandingRow) => number) =>
    rows.reduce((sum, r) => sum + pick(r), 0) / total;
  const leagueGames = getFixtures({ competition: "gallagher-prem" }).filter(
    (fixture) => !fixture.knockout,
  );
  const kpis: Kpi[] = [
    { label: "Points", value: row.points, detail: `${ordinal(row.position)} of ${total}` },
    {
      label: "Points per match",
      value: perMatch(row.pointsFor, row.played).toFixed(1),
      detail: `League ${perMatch(
        avg((r) => r.pointsFor),
        row.played,
      ).toFixed(1)}`,
    },
    {
      label: "Tries per match",
      value: perMatch(row.triesFor, row.played).toFixed(1),
      detail: `League ${perMatch(
        avg((r) => r.triesFor),
        row.played,
      ).toFixed(1)}`,
    },
    {
      label: "Bonus points",
      value: row.bonus,
      detail: `${row.triesBonus} try · ${row.losingBonus} losing`,
    },
  ];

  const measures: Array<{
    label: string;
    pick: (r: StandingRow) => number;
    lowerIsBetter?: boolean;
    signed?: boolean;
  }> = [
    { label: "Points", pick: (r) => r.points },
    { label: "Points for", pick: (r) => r.pointsFor },
    { label: "Points against", pick: (r) => r.pointsAgainst, lowerIsBetter: true },
    { label: "Points difference", pick: (r) => r.pointsDiff, signed: true },
    { label: "Tries for", pick: (r) => r.triesFor },
    { label: "Tries against", pick: (r) => r.triesAgainst, lowerIsBetter: true },
    { label: "Try bonus points", pick: (r) => r.triesBonus },
    { label: "Losing bonus points", pick: (r) => r.losingBonus },
  ];

  const own = leagueGames.filter(
    (fixture) => fixture.home.club.slug === slug || fixture.away.club.slug === slug,
  );
  const home = recordFor(
    own.filter((fixture) => fixture.home.club.slug === slug),
    slug,
  );
  const away = recordFor(
    own.filter((fixture) => fixture.away.club.slug === slug),
    slug,
  );
  const split: Array<[string, string, string]> = [
    ["Record", recordLabel(home), recordLabel(away)],
    ["Points for", String(home.pointsFor), String(away.pointsFor)],
    ["Points against", String(home.pointsAgainst), String(away.pointsAgainst)],
    [
      "Points per match",
      perMatch(home.pointsFor, home.played).toFixed(1),
      perMatch(away.pointsFor, away.played).toFixed(1),
    ],
  ];
  const columns = "minmax(0,1fr) 80px 80px 90px minmax(0,1.4fr)";

  return (
    <PageBody>
      <KpiStrip items={kpis} />
      <PanelGrid>
        <Section
          span={8}
          minWidth={640}
          title={`${club.name} v the PREM`}
          meta={<PanelLink href="/competitions/gallagher-prem/stats">Compare every club</PanelLink>}
        >
          <div
            className="grid h-[30px] items-center gap-2.5 border-b border-line2 px-4 text-[11px] font-medium text-mute"
            style={{ gridTemplateColumns: columns }}
          >
            <span>Measure</span>
            <span className="text-right">{club.name}</span>
            <span className="text-right">PREM avg</span>
            <span className="text-right">Rank</span>
            <span>Best club</span>
          </div>
          {measures.map((measure) => {
            const best = [...rows].sort((a, b) =>
              measure.lowerIsBetter
                ? measure.pick(a) - measure.pick(b)
                : measure.pick(b) - measure.pick(a),
            )[0];
            const value = measure.pick(row);
            return (
              <div
                key={measure.label}
                className="grid h-[35px] items-center gap-2.5 border-b border-line2 px-4 last:border-b-0"
                style={{ gridTemplateColumns: columns }}
              >
                <span>{measure.label}</span>
                <span className="text-right font-semibold text-club tabular-nums">
                  {measure.signed ? signed(value) : value}
                </span>
                <span className="text-right text-mute tabular-nums">
                  {avg(measure.pick).toFixed(1)}
                </span>
                <span className="text-right">
                  {ordinal(rankInStandings(rows, slug, measure.pick, measure.lowerIsBetter))}{" "}
                  <span className="text-faint">of {total}</span>
                </span>
                {best && (
                  <span className="flex min-w-0 items-center gap-2">
                    <ClubLabel club={best.club} href={href(best.club.slug)} />
                    <span className="text-mute tabular-nums">
                      {measure.signed
                        ? signed(measure.pick(best)).replace("+", "")
                        : measure.pick(best)}
                    </span>
                  </span>
                )}
              </div>
            );
          })}
        </Section>
        <Section span={4} title="Home and away" meta="Regular season">
          <div className="grid h-[30px] grid-cols-[minmax(0,1fr)_100px_100px] items-center gap-2.5 border-b border-line2 px-4 text-[11px] font-medium text-mute">
            <span />
            <span className="text-right">Home</span>
            <span className="text-right">Away</span>
          </div>
          {split.map(([label, h, a]) => (
            <div
              key={label}
              className="grid h-[35px] grid-cols-[minmax(0,1fr)_100px_100px] items-center gap-2.5 border-b border-line2 px-4 last:border-b-0"
            >
              <span className="text-mute">{label}</span>
              <span className="text-right tabular-nums">{h}</span>
              <span className="text-right tabular-nums">{a}</span>
            </div>
          ))}
        </Section>
      </PanelGrid>
      <p className="text-xs text-mute">
        From the standings and fixtures feeds. Carry, tackle, ruck and set-piece measures arrive
        with the match stats feed.
      </p>
    </PageBody>
  );
}
