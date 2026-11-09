// Entity headers (HANDOFF.md section 2, "Entity header"): crest, title and one meta line, derived
// from the feeds. Facts the feeds don't carry (head coach, referee union and panel, player
// biography) come from src/data/hub.ts and are dropped when it has no record.
import { getPlayer, getReferee as getDemoReferee, getTeam as getDemoTeam } from "@/data/hub";
import { CURRENT_USER } from "@/lib/user";
import { ordinal, recordFor, recordLabel, scoreLine, type ClubRef } from "@/lib/rugby";
import {
  SEASON,
  competitionsOf,
  furthestStage,
  getClub,
  getCompetition,
  getFixtures,
  getReferee,
  homeVenueOf,
  standingOf,
} from "@/server/feeds";

export type EntityHeaderData = {
  kind: "competition" | "team" | "player" | "referee";
  id: string;
  title: string;
  crest: { code: string; colour: string | null; onColour: string | null };
  meta: string;
  actions: string[];
};

const SHORT: Record<string, string> = { "gallagher-prem": "PREM" };

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((word) => word[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function clubCrest(club: ClubRef) {
  return { code: club.code, colour: club.colour, onColour: club.onColour };
}

export function teamHeader(slug: string): EntityHeaderData | undefined {
  const club = getClub(slug);
  if (!club) return undefined;
  const parts: string[] = [];
  const row = standingOf(slug);
  if (row)
    parts.push(`${ordinal(row.position)} in Gallagher PREM`, `${row.points} pts`, recordLabel(row));
  else parts.push(recordLabel(recordFor(getFixtures({ club: slug }), slug)));
  for (const competition of competitionsOf(slug)) {
    if (competition.slug === "gallagher-prem") continue;
    const stage = furthestStage(slug, competition.slug);
    if (stage) parts.push(`${competition.name} ${stage.toLowerCase()}`);
  }
  const venue = homeVenueOf(slug);
  if (venue) parts.push(venue);
  const coach = getDemoTeam(slug)?.coach;
  if (coach) parts.push(`Head coach ${coach}`);
  if (slug === CURRENT_USER.clubSlug) parts.push("Your club");
  return {
    kind: "team",
    id: slug,
    title: club.name,
    crest: clubCrest(club),
    meta: parts.join(" · "),
    actions: ["New team report"],
  };
}

export function competitionHeader(slug: string): EntityHeaderData | undefined {
  const competition = getCompetition(slug);
  if (!competition) return undefined;
  const games = getFixtures({ competition: slug });
  const final = games.find((fixture) => fixture.round === "Final");
  const complete =
    games.length > 0 &&
    games.every((fixture) => fixture.scored || fixture.id === 288450) &&
    Boolean(final?.scored);
  const parts: string[] = [SEASON.label, complete ? "Season complete" : "In progress"];
  if (final?.scored && final.home.score !== null && final.away.score !== null) {
    const champion = final.home.score > final.away.score ? final.home.club : final.away.club;
    parts.push(`Champions ${champion.name}`);
  }
  const rounds = Math.max(0, ...games.map((fixture) => fixture.roundNumber ?? 0));
  const pools = games.some((fixture) => fixture.round.startsWith("Pool"));
  parts.push(pools ? `${rounds} pool rounds and knockouts` : `${rounds} rounds and play-offs`);
  parts.push(`${games.length} matches`);
  return {
    kind: "competition",
    id: slug,
    title: competition.name,
    crest: { code: competition.code, colour: null, onColour: null },
    meta: parts.join(" · "),
    actions: ["Competition report"],
  };
}

export function refereeHeader(slug: string): EntityHeaderData | undefined {
  const referee = getReferee(slug);
  if (!referee) return undefined;
  const demo = getDemoReferee(slug);
  const parts: string[] = [];
  if (demo?.union) parts.push(demo.union);
  if (demo?.panel) parts.push(demo.panel);
  const split = referee.byCompetition
    .map((entry) => `${SHORT[entry.competition.slug] ?? entry.competition.name} ${entry.matches}`)
    .join(", ");
  parts.push(`${referee.matches} matches in ${SEASON.label}${split ? ` (${split})` : ""}`);
  return {
    kind: "referee",
    id: slug,
    title: referee.name,
    crest: { code: initials(referee.name), colour: null, onColour: null },
    meta: parts.join(" · "),
    actions: ["Compare referees"],
  };
}

export function playerHeader(slug: string): EntityHeaderData | undefined {
  const player = getPlayer(slug);
  if (!player) return undefined;
  const club = getClub(player.teamId);
  const parts = [
    player.position,
    club?.name ?? getDemoTeam(player.teamId)?.name,
    `Age ${player.age}`,
    player.height,
  ].filter(Boolean) as string[];
  return {
    kind: "player",
    id: slug,
    title: player.name,
    crest: club ? clubCrest(club) : { code: initials(player.name), colour: null, onColour: null },
    meta: parts.join(" · "),
    actions: ["Compare", "Send clips to player"],
  };
}

/** One-line match summary used by search and links, e.g. "Northampton Saints 26–17 Exeter Chiefs". */
export function matchSummary(id: number): string | undefined {
  const fixture = getFixtures().find((entry) => entry.id === id);
  if (!fixture) return undefined;
  return `${fixture.home.club.name} ${scoreLine(fixture) ?? "v"} ${fixture.away.club.name}`;
}
