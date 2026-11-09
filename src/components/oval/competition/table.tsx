// Competition Table tab (prototype Competition): champions, leaders, the user's club and tries,
// then the full table beside the play-offs. Server component; the table itself is client.
import { PageBody } from "@/components/oval/app-shell";
import { KnockoutsPanel, winnerSide } from "@/components/oval/competition/overview";
import { LeagueTable } from "@/components/oval/league-table";
import { DataNote, KpiStrip, PanelGrid, Section, type Kpi } from "@/components/oval/primitives";
import { CURRENT_USER } from "@/lib/user";
import { ordinal, perMatch, scoreLine } from "@/lib/rugby";
import { getCompetition, getFixtures, getStandings } from "@/server/feeds";

export function CompetitionTable({ slug }: { slug: string }) {
  const competition = getCompetition(slug);
  const standings = getStandings(slug);
  if (!competition) return null;
  if (!standings) {
    return (
      <PageBody>
        <DataNote>
          No standings feed for {competition.name} yet. Pool tables need the EPCR standings feed.
        </DataNote>
      </PageBody>
    );
  }
  const final = getFixtures({ competition: slug }).find((fixture) => fixture.round === "Final");
  const winner = final ? winnerSide(final) : null;
  const leader = standings.rows[0];
  const mine = standings.rows.find((row) => row.club.slug === CURRENT_USER.clubSlug);
  const lastPlayOff = standings.rows[standings.playOffPlaces - 1];
  const tries = standings.rows.reduce((sum, row) => sum + row.triesFor, 0);
  const regular = getFixtures({ competition: slug }).filter((fixture) => !fixture.knockout).length;
  const kpis: Kpi[] = [];
  if (final && winner) {
    const loser = winner === "home" ? "away" : "home";
    kpis.push({
      label: "Champions",
      value: final[winner].club.name,
      detail: `Beat ${final[loser].club.name} ${final[winner].score}–${final[loser].score} in the final`,
    });
  } else if (final)
    kpis.push({ label: "Final", value: scoreLine(final) ?? "Not played", detail: final.venue });
  if (leader)
    kpis.push({
      label: "League leaders",
      value: leader.club.name,
      detail: `${leader.points} pts after ${leader.played} rounds`,
    });
  if (mine) {
    kpis.push({
      label: CURRENT_USER.clubName,
      value: ordinal(mine.position),
      detail: `${mine.points} pts${lastPlayOff && mine.position > standings.playOffPlaces ? ` · ${lastPlayOff.points - mine.points} behind ${ordinal(standings.playOffPlaces)}` : ""}`,
    });
  }
  kpis.push({
    label: "Tries",
    value: tries,
    detail: `${perMatch(tries, regular).toFixed(1)} per match, regular season`,
  });

  return (
    <PageBody>
      <KpiStrip items={kpis} />
      <PanelGrid>
        <Section
          span={9}
          title={`${competition.name} 2025/26`}
          meta={`Top ${standings.playOffPlaces} go to the play-offs`}
        >
          <LeagueTable standings={standings} />
        </Section>
        <KnockoutsPanel slug={slug} span={3} />
      </PanelGrid>
    </PageBody>
  );
}
