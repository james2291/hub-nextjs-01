// Next opponent (prototype Opposition): the user's club against an opponent, "as of now" (hub
// clock). Kick-off, last meeting, records, referee, season so far, preview pack and both clubs'
// last six matches, all from the fixtures feeds up to now. Server component.
import NextLink from "next/link";

import { PageBody } from "@/components/oval/app-shell";
import { PreviewPack } from "@/components/oval/opposition/preview-pack";
import {
  Crest,
  DataNote,
  FormLetters,
  KpiStrip,
  PanelGrid,
  ResultMark,
  Section,
  type Kpi,
} from "@/components/oval/primitives";
import { hubNow } from "@/lib/now";
import { CURRENT_USER } from "@/lib/user";
import {
  opponentOf,
  perMatch,
  recordFor,
  resultFor,
  sideOf,
  ukDate,
  ukDayMonth,
  ukTime,
  type ClubRef,
  type Fixture,
} from "@/lib/rugby";
import { getClub, getFixtures } from "@/server/feeds";

function placeName(name: string) {
  return name.split(" ")[0] ?? name;
}

function possessive(name: string) {
  return name.endsWith("s") ? `${name}'` : `${name}'s`;
}

export function Opposition({ slug }: { slug: string }) {
  const opponent = getClub(slug);
  const mine = getClub(CURRENT_USER.clubSlug);
  if (!opponent || !mine) return null;
  const now = hubNow();
  const at = now.toISOString();
  const before = (fixture: Fixture) => fixture.dateTime < at && fixture.scored;
  const meeting = (fixture: Fixture) =>
    sideOf(fixture, mine.slug) !== null && sideOf(fixture, opponent.slug) !== null;
  const next = [...getFixtures({ club: mine.slug })]
    .reverse()
    .find((fixture) => fixture.dateTime >= at && meeting(fixture));
  const last = getFixtures({ club: mine.slug }).find(
    (fixture) => before(fixture) && meeting(fixture),
  );
  const premBefore = (club: string) =>
    getFixtures({ club, competition: "gallagher-prem" }).filter(before);
  const record = (club: string) => recordFor(premBefore(club), club);
  const oppRecord = record(opponent.slug);
  const myRecord = record(mine.slug);
  const referee = next?.referee;
  const refGames = referee ? getFixtures({ referee: referee.slug }).filter(before) : [];
  const homeWins = refGames.filter(
    (fixture) => (fixture.home.score ?? 0) > (fixture.away.score ?? 0),
  ).length;
  const lastSix = (club: string) => getFixtures({ club }).filter(before).slice(0, 6);
  const lastFive = (club: string) =>
    premBefore(club)
      .slice(0, 5)
      .map((fixture) => resultFor(fixture, club))
      .filter((result): result is "W" | "D" | "L" => result !== null)
      .reverse();

  const kpis: Kpi[] = [];
  if (next)
    kpis.push({
      label: "Kick-off",
      value: ukTime(next.dateTime),
      detail: `${ukDate(next.dateTime).replace(/ \d{4}$/, "")} · ${next.venue}`,
    });
  if (last) {
    const winner = (last.home.score ?? 0) >= (last.away.score ?? 0) ? last.home : last.away;
    const loser = winner === last.home ? last.away : last.home;
    kpis.push({
      label: "Last meeting",
      value: `${winner.club.shortName} ${winner.score}–${loser.score} ${loser.club.shortName}`,
      detail: `${ukDayMonth(last.dateTime)} · ${last.round} · ${last.venue}`,
    });
  }
  kpis.push({
    label: `${placeName(opponent.name)} PREM record`,
    value: `${oppRecord.won}–${oppRecord.drawn}–${oppRecord.lost}`,
    detail: `${mine.name} ${myRecord.won}–${myRecord.drawn}–${myRecord.lost}`,
  });
  if (referee)
    kpis.push({
      label: `Referee ${referee.name.split(" ").at(-1)}`,
      value: `${refGames.length} matches`,
      detail: `Home side won ${homeWins} of ${refGames.length}`,
    });

  const cupRun = getFixtures({ club: opponent.slug })
    .filter((fixture) => before(fixture) && fixture.knockout)
    .reverse()
    .map(
      (fixture) =>
        `${fixture.round.toLowerCase()} ${resultFor(fixture, opponent.slug) === "W" ? "win" : `defeat ${sideOf(fixture, opponent.slug) === "home" ? "to" : "at"} ${placeName(opponentOf(fixture, opponent.slug)?.name ?? "")}`}`,
    );
  const lastLine = last
    ? (() => {
        const winner = (last.home.score ?? 0) >= (last.away.score ?? 0) ? last.home : last.away;
        const loser = winner === last.home ? last.away : last.home;
        return `${winner.club.shortName} ${winner.score}–${loser.score} ${loser.club.shortName}`;
      })()
    : "";
  const pack = [
    ...(last
      ? [
          {
            title: "Last meeting review",
            detail: `${ukDayMonth(last.dateTime)} · ${last.venue} · ${lastLine}`,
          },
        ]
      : []),
    {
      title: `${possessive(placeName(opponent.name))} recent form`,
      detail: "Last 6 matches across competitions",
    },
    ...(cupRun.length
      ? [{ title: "Cup run", detail: cupRun.join(", ").replace(/^./, (c) => c.toUpperCase()) }]
      : []),
    { title: "Set piece", detail: "Lineout and scrum clips" },
    ...(referee
      ? [
          {
            title: `Referee: ${referee.name}`,
            detail: `${refGames.length} matches this season · home side won ${homeWins}`,
          },
        ]
      : []),
  ];

  return (
    <>
      <section className="border-b border-line bg-panel px-4 pt-4 md:px-6">
        <div className="flex items-center gap-3">
          <Crest code={opponent.code} colour={opponent.colour} onColour={opponent.onColour} />
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold leading-[1.2]">{opponent.name}</h1>
            <div className="text-xs text-mute">
              {next
                ? `Next opponent · ${next.competition.name} ${next.round} · ${ukDate(next.dateTime).replace(/ \d{4}$/, "")}, ${ukTime(next.dateTime)} · ${next.venue}${referee ? ` · Referee ${referee.name}` : ""}`
                : `No upcoming fixture against ${mine.name} in the feeds`}
            </div>
          </div>
          <NextLink
            href={`/teams/${opponent.slug}`}
            className="inline-flex h-[30px] items-center rounded-[3px] border border-line px-3 font-medium hover:bg-subtle"
          >
            Team page
          </NextLink>
        </div>
        <nav className="mt-3 flex">
          <span className="-mb-px flex h-[38px] items-center border-b-2 border-ink px-0.5 font-medium">
            Head-to-head v {mine.name}
          </span>
        </nav>
      </section>
      <PageBody>
        <DataNote>
          Viewed as {ukDate(now)}, {ukTime(now)}. All figures are from the fixtures feeds up to that
          point.
        </DataNote>
        <KpiStrip items={kpis} />
        <PanelGrid>
          <Section
            span={6}
            minWidth={420}
            title="Season so far"
            meta={`Gallagher PREM${next ? `, before ${next.round}` : ""}`}
          >
            <div
              role="row"
              className="grid h-[30px] grid-cols-[minmax(0,1fr)_120px_120px] items-center gap-2.5 border-b border-line2 px-4 text-[11px] font-medium text-mute"
            >
              <span />
              <span className="text-right">{mine.name}</span>
              <span className="text-right">{opponent.name}</span>
            </div>
            {[
              [
                "PREM record",
                `${myRecord.won}–${myRecord.drawn}–${myRecord.lost}`,
                `${oppRecord.won}–${oppRecord.drawn}–${oppRecord.lost}`,
              ],
              [
                "Points for per match",
                perMatch(myRecord.pointsFor, myRecord.played).toFixed(1),
                perMatch(oppRecord.pointsFor, oppRecord.played).toFixed(1),
              ],
              [
                "Points against per match",
                perMatch(myRecord.pointsAgainst, myRecord.played).toFixed(1),
                perMatch(oppRecord.pointsAgainst, oppRecord.played).toFixed(1),
              ],
            ].map(([label, a, b]) => (
              <div
                key={label}
                className="grid h-[35px] grid-cols-[minmax(0,1fr)_120px_120px] items-center gap-2.5 border-b border-line2 px-4"
              >
                <span className="text-mute">{label}</span>
                <span className="text-right tabular-nums">{a}</span>
                <span className="text-right tabular-nums">{b}</span>
              </div>
            ))}
            <div className="grid h-[35px] grid-cols-[minmax(0,1fr)_120px_120px] items-center gap-2.5 px-4">
              <span className="text-mute">Last 5 PREM</span>
              <span className="flex justify-end">
                <FormLetters results={lastFive(mine.slug)} />
              </span>
              <span className="flex justify-end">
                <FormLetters results={lastFive(opponent.slug)} />
              </span>
            </div>
          </Section>
          <Section
            span={6}
            title="Build the preview pack"
            meta="Choose what goes to coaches and players"
          >
            <PreviewPack items={pack} />
          </Section>
        </PanelGrid>
        <PanelGrid>
          {[opponent, mine].map((club) => (
            <Section
              key={club.slug}
              span={6}
              minWidth={480}
              title={`${possessive(placeName(club.name))} last 6`}
              meta="All competitions"
            >
              <LastSix club={club} fixtures={lastSix(club.slug)} />
            </Section>
          ))}
        </PanelGrid>
      </PageBody>
    </>
  );
}

function LastSix({ club, fixtures }: { club: ClubRef; fixtures: Fixture[] }) {
  return (
    <>
      <div
        role="row"
        className="grid h-[30px] grid-cols-[60px_minmax(0,1fr)_20px_56px] items-center gap-2.5 border-b border-line2 px-4 text-[11px] font-medium text-mute"
      >
        <span>Date</span>
        <span>Match</span>
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
          <span className="truncate">
            {sideOf(fixture, club.slug) === "home" ? "v" : "at"}{" "}
            {opponentOf(fixture, club.slug)?.name}{" "}
            <span className="text-faint">
              · {fixture.competition.name} {fixture.round}
            </span>
          </span>
          <ResultMark result={resultFor(fixture, club.slug)} className="text-[11px]" />
          <span className="text-right tabular-nums">
            {fixture.home.score}–{fixture.away.score}
          </span>
        </NextLink>
      ))}
    </>
  );
}
