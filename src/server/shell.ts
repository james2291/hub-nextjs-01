// Data the app shell needs on every page: the next opponent, the latest match, default pins and
// display names for breadcrumbs. Built on the server from the feeds and the hub clock.
import { players } from "@/data/hub";
import { hubNow } from "@/lib/now";
import { CURRENT_USER } from "@/lib/user";
import {
  getClubs,
  getCompetitions,
  getFixtures,
  getNextFixture,
  getPastFixtures,
  getReferees,
} from "@/server/feeds";
import { opponentOf, type Fixture } from "@/lib/rugby";

export type ShellLink = { label: string; href: string };

export type ShellData = {
  user: { name: string; clubName: string; roleLabel: string };
  /** Sidebar "Next opponent": opponent's place name, e.g. "Exeter". Null when the season has no more fixtures. */
  nextOpponent: ShellLink | null;
  /** Slug of the next opponent: links to that club go to Next opponent (HANDOFF.md section 7). */
  nextOpponentSlug: string | null;
  /** The signed-in user's club slug. */
  clubSlug: string;
  /** Sidebar "Matches": the user's club's latest match. */
  latestMatch: ShellLink | null;
  fixtureCardHref: string;
  /** User Pinned: the user's pins (read from the pins store by the root layout). */
  pins: Array<{ id: string; path: string; label: string; order: number }>;
  /** Path segment → display name, for breadcrumbs. */
  names: Record<string, string>;
  downloadsHref: string;
};

/** "Exeter Chiefs" → "Exeter": the place part of a club name. */
export function placeName(name: string): string {
  return name.split(" ")[0] ?? name;
}

function matchLabel(fixture: Fixture, clubSlug: string): string {
  const opponent = opponentOf(fixture, clubSlug);
  const round =
    fixture.roundNumber !== null && !fixture.knockout ? `R${fixture.roundNumber}` : fixture.round;
  return opponent
    ? `${round} v ${placeName(opponent.name)}`
    : `${fixture.home.club.name} v ${fixture.away.club.name}`;
}

export function getShellData(): Omit<ShellData, "pins"> {
  const now = hubNow();
  const club = CURRENT_USER.clubSlug;
  const next = getNextFixture(club, now);
  const opponent = next ? opponentOf(next, club) : null;
  const latest = getPastFixtures(club, now)[0];

  const names: Record<string, string> = {
    teams: "Teams",
    competitions: "Competitions",
    players: "Players",
    referees: "Referees",
    matches: "Matches",
    opposition: "Next opponent",
    fixtures: "Fixture Card",
    table: "Table",
    people: "Teams & players",
    stats: "Stats",
    feeds: "Feeds",
    squad: "Squad",
    video: "Video",
  };
  for (const entry of getClubs()) names[entry.slug] = entry.name;
  for (const entry of getCompetitions()) names[entry.slug] = entry.name;
  for (const entry of getReferees()) names[entry.slug] = entry.name;
  for (const entry of players) names[entry.id] = entry.name;

  return {
    user: {
      name: CURRENT_USER.name,
      clubName: CURRENT_USER.clubName,
      roleLabel: CURRENT_USER.roleLabel,
    },
    nextOpponent:
      next && opponent
        ? { label: placeName(opponent.name), href: `/opposition/${opponent.slug}` }
        : null,
    nextOpponentSlug: opponent?.slug ?? null,
    clubSlug: club,
    latestMatch: latest ? { label: matchLabel(latest, club), href: `/matches/${latest.id}` } : null,
    fixtureCardHref: `/teams/${club}/fixtures`,
    names,
    downloadsHref: "/competitions/gallagher-prem/feeds",
  };
}

/** The handoff's five default pins, until the user changes their pins. */
export function defaultPinEntries(): Array<{ path: string; label: string }> {
  const club = CURRENT_USER.clubSlug;
  const lastLeagueGame = getFixtures({ club, competition: "gallagher-prem" }).find(
    (fixture) => !fixture.knockout,
  );
  return [
    { label: CURRENT_USER.clubName, path: `/teams/${club}` },
    { label: "Gallagher PREM", path: "/competitions/gallagher-prem" },
    { label: "Marcus Smith", path: "/players/marcus-smith" },
    { label: "Christophe Ridley", path: "/referees/christophe-ridley" },
    ...(lastLeagueGame
      ? [{ label: matchLabel(lastLeagueGame, club), path: `/matches/${lastLeagueGame.id}` }]
      : []),
  ];
}
