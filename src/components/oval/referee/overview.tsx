// Referee Overview (prototype Referee): appointments and home-win KPIs from the feeds, recent
// appointments, and a discipline panel that stays DEMO DATA until the officiating feed exists.
import NextLink from "next/link";

import { PageBody } from "@/components/oval/app-shell";
import { KpiStrip, PanelGrid, PanelLink, Section, type Kpi } from "@/components/oval/primitives";
import { getReferee as getDemoReferee } from "@/data/hub";
import { perMatch, scoreLine, ukDayMonth, type Fixture } from "@/lib/rugby";
import { getFixtures, getReferee } from "@/server/feeds";

const SHORT: Record<string, string> = { "gallagher-prem": "PREM" };
const STAGE_ORDER = ["Final", "Semi-final", "Quarter-final", "Round of 16"];

function points(fixture: Fixture) {
  return (fixture.home.score ?? 0) + (fixture.away.score ?? 0);
}

/** The appointment with the latest knockout stage; PREM ahead of the cups on a tie. */
function biggest(fixtures: Fixture[]): Fixture | undefined {
  const knockouts = fixtures.filter((fixture) => fixture.knockout);
  return knockouts.sort(
    (a, b) =>
      STAGE_ORDER.indexOf(a.round) - STAGE_ORDER.indexOf(b.round) ||
      (a.competition.slug === "gallagher-prem" ? -1 : 1),
  )[0];
}

export function RefereeOverview({ slug }: { slug: string }) {
  const referee = getReferee(slug);
  if (!referee) return null;
  const games = getFixtures({ referee: slug });
  const prem = games.filter(
    (fixture) => fixture.competition.slug === "gallagher-prem" && fixture.scored,
  );
  const leagueRegular = getFixtures({ competition: "gallagher-prem" }).filter(
    (fixture) => !fixture.knockout && fixture.scored,
  );
  const leagueHomeWins = leagueRegular.filter(
    (fixture) => (fixture.home.score ?? 0) > (fixture.away.score ?? 0),
  ).length;
  const premHomeWins = prem.filter(
    (fixture) => (fixture.home.score ?? 0) > (fixture.away.score ?? 0),
  ).length;
  const top = biggest(games);
  const demo = getDemoReferee(slug);

  const kpis: Kpi[] = [
    {
      label: "Appointments",
      value: referee.matches,
      detail: referee.byCompetition
        .map(
          (entry) => `${SHORT[entry.competition.slug] ?? entry.competition.name} ${entry.matches}`,
        )
        .join(" · "),
    },
  ];
  if (prem.length) {
    kpis.push(
      {
        label: "Home wins, PREM games",
        value: `${premHomeWins} of ${prem.length}`,
        detail: `League average ${Math.round((leagueHomeWins / leagueRegular.length) * 100)}%`,
      },
      {
        label: "Points per PREM match",
        value: perMatch(
          prem.reduce((sum, fixture) => sum + points(fixture), 0),
          prem.length,
        ).toFixed(1),
        detail: `League ${perMatch(
          leagueRegular.reduce((sum, fixture) => sum + points(fixture), 0),
          leagueRegular.length,
        ).toFixed(1)}`,
      },
    );
  }
  if (top) {
    kpis.push({
      label: "Biggest appointment",
      value: `${SHORT[top.competition.slug] ?? top.competition.name} ${top.round.toLowerCase()}`,
      detail: `${top.home.club.name} ${scoreLine(top) ?? "v"} ${top.away.club.name}`,
    });
  }

  const discipline = demo
    ? [
        [
          "Penalties per match",
          demo.stats.find((stat) => stat.label === "Penalties")?.value ?? "–",
        ],
        [
          "Yellow cards per match",
          demo.stats.find((stat) => stat.label === "Yellow cards")?.value ?? "–",
        ],
        ["Red cards", demo.stats.find((stat) => stat.label === "Red cards")?.value ?? "–"],
        [
          "Scrum reset rate",
          demo.setPiece.find((item) => item.label === "Scrum reset rate")?.value ?? "–",
        ],
        [
          "Advantage played",
          demo.setPiece.find((item) => item.label === "Advantage played")?.value ?? "–",
        ],
      ]
    : [];

  return (
    <PageBody>
      <KpiStrip items={kpis} />
      <PanelGrid>
        <Section
          span={8}
          minWidth={640}
          title="Recent appointments"
          meta={<PanelLink href={`/referees/${slug}/fixtures`}>Fixture Card</PanelLink>}
        >
          <div className="grid h-[30px] grid-cols-[70px_minmax(0,1.3fr)_minmax(0,1.1fr)_60px_80px] items-center gap-2.5 border-b border-line2 px-4 text-[11px] font-medium text-mute">
            <span>Date</span>
            <span>Match</span>
            <span>Competition</span>
            <span className="text-right">Score</span>
            <span className="text-right">Attendance</span>
          </div>
          {games.slice(0, 9).map((fixture) => (
            <NextLink
              key={fixture.id}
              href={`/matches/${fixture.id}`}
              className="grid h-[35px] grid-cols-[70px_minmax(0,1.3fr)_minmax(0,1.1fr)_60px_80px] items-center gap-2.5 border-b border-line2 px-4 last:border-b-0 hover:bg-subtle"
            >
              <span className="text-mute">{ukDayMonth(fixture.dateTime)}</span>
              <span className="truncate">
                {fixture.home.club.name} v {fixture.away.club.name}
              </span>
              <span className="truncate text-mute">
                {fixture.competition.name} · {fixture.round}
              </span>
              <span className="text-right tabular-nums">{scoreLine(fixture) ?? "–"}</span>
              <span className="text-right text-mute tabular-nums">
                {fixture.attendance?.toLocaleString("en-GB") ?? "–"}
              </span>
            </NextLink>
          ))}
        </Section>
        <Section
          span={4}
          title="Discipline"
          meta={<span className="font-mono text-[11px] font-medium text-club">DEMO DATA</span>}
        >
          {discipline.map(([label, value]) => (
            <div
              key={label}
              className="flex h-[37px] items-center justify-between border-b border-line2 px-4"
            >
              <span className="text-mute">{label}</span>
              <span className="font-semibold tabular-nums">{value}</span>
            </div>
          ))}
          <p className="px-4 py-3 text-xs text-mute">
            {discipline.length
              ? "Penalty and card figures need the officiating feed."
              : "No officiating figures for this referee until the officiating feed exists."}{" "}
            <NextLink href={`/referees/${slug}/stats`} className="underline">
              Stats
            </NextLink>
          </p>
        </Section>
      </PanelGrid>
    </PageBody>
  );
}
