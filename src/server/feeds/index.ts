// Feed-backed model for the 2025/26 season, built from the RugbyViz fixtures/results and standings
// feeds in ./2025-26. Server-side only: pages call these functions and pass plain props to client
// components. When the Hub API (docs/openapi.yaml) is built, these functions become API calls and
// the return shapes stay the same.
import challengeCup from "./2025-26/1026_202501_fixturesresults.json";
import championsCup from "./2025-26/1008_202501_fixturesresults.json";
import prem from "./2025-26/1011_202501_fixturesresults.json";
// File is named 1001 but holds competition 1011 (Gallagher PREM).
import premStandings from "./2025-26/1001_202501_standings.json";
import {
  slugify,
  textOn,
  type ClubRef,
  type CompetitionRef,
  type Fixture,
  type OfficialRef,
  type ResultLetter,
} from "@/lib/rugby";

type RawTeam = {
  id: number;
  name: string;
  shortName: string;
  abbreviatedName: string | null;
  teamColour: string | null;
  score: { finalScore: number | null; htScore: number | null } | null;
};

type RawFixture = {
  id: number;
  dateTime: string;
  competition: { id: number };
  round: number | null;
  roundTypeId: number;
  title: string;
  groupName: string | null;
  attendance: number | null;
  homeTeam: RawTeam;
  awayTeam: RawTeam;
  venue: { name: string } | null;
  officials: Array<{ id: number; name: string; role: string }>;
};

type RawStandingRow = {
  team: { id: number };
  position: number;
  points: number;
  won: number;
  lost: number;
  drawn: number;
  played: number;
  pointsFor: number;
  pointsAgainst: number;
  pointsDiff: number;
  triesFor: number;
  triesAgainst: number;
  triesBonus: number;
  losingBonus: number;
  bonus: number;
};

type RawStandings = {
  competition: { id: number };
  groups: RawStandingRow[];
  form: Array<{
    team: { id: number };
    matches: Array<{ matchId: number; matchDate: string; result: string }>;
  }>;
};

export const SEASON = { key: "2025-26", label: "2025/26", rugbyvizId: 202501 } as const;

export const competitionRefs: CompetitionRef[] = [
  {
    id: 1011,
    slug: "gallagher-prem",
    name: "Gallagher PREM",
    longName: "Gallagher PREM",
    code: "GP",
  },
  {
    id: 1008,
    slug: "champions-cup",
    name: "Champions Cup",
    longName: "EPCR Champions Cup",
    code: "CC",
  },
  {
    id: 1026,
    slug: "challenge-cup",
    name: "Challenge Cup",
    longName: "EPCR Challenge Cup",
    code: "CH",
  },
];

const rawFixtures: RawFixture[] = [
  ...(prem as RawFixture[]),
  ...(championsCup as RawFixture[]),
  ...(challengeCup as RawFixture[]),
];

/** Crest codes that differ from the feed's abbreviatedName (club convention, as in the design). */
const CREST_OVERRIDES: Record<string, string> = { harlequins: "HQ" };

const KNOCKOUT_LABELS: Record<string, string> = {
  R16: "Round of 16",
  QF: "Quarter-final",
  SF: "Semi-final",
  TF: "Final",
};

function mostCommon(values: string[]): string | null {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  let best: string | null = null;
  let bestCount = 0;
  for (const [value, count] of counts) {
    if (count > bestCount) {
      best = value;
      bestCount = count;
    }
  }
  return best;
}

function buildClubs(): Map<number, ClubRef> {
  const seen = new Map<number, RawTeam>();
  const homeColours = new Map<number, string[]>();
  const anyColours = new Map<number, string[]>();
  for (const fixture of rawFixtures) {
    for (const [team, home] of [
      [fixture.homeTeam, true],
      [fixture.awayTeam, false],
    ] as const) {
      seen.set(team.id, team);
      if (!team.teamColour) continue;
      anyColours.set(team.id, [...(anyColours.get(team.id) ?? []), team.teamColour.toUpperCase()]);
      if (home)
        homeColours.set(team.id, [
          ...(homeColours.get(team.id) ?? []),
          team.teamColour.toUpperCase(),
        ]);
    }
  }
  const clubs = new Map<number, ClubRef>();
  for (const [id, team] of seen) {
    const slug = slugify(team.name);
    const colour =
      mostCommon(homeColours.get(id) ?? []) ?? mostCommon(anyColours.get(id) ?? []) ?? "#66665F";
    const code =
      CREST_OVERRIDES[slug] ?? (team.abbreviatedName || team.shortName.slice(0, 3)).toUpperCase();
    clubs.set(id, {
      id,
      slug,
      name: team.name,
      shortName: team.shortName,
      code,
      colour,
      onColour: textOn(colour),
    });
  }
  return clubs;
}

const clubsById = buildClubs();
const clubsBySlug = new Map([...clubsById.values()].map((club) => [club.slug, club]));
const competitionsById = new Map(
  competitionRefs.map((competition) => [competition.id, competition]),
);

function roundLabel(raw: RawFixture): string {
  if (raw.roundTypeId === 2) return KNOCKOUT_LABELS[raw.title] ?? raw.title;
  if (raw.groupName && raw.groupName !== "0") return `${raw.groupName} · R${raw.title}`;
  return `Round ${raw.title}`;
}

function toFixture(raw: RawFixture): Fixture {
  const competition = competitionsById.get(raw.competition.id);
  const home = clubsById.get(raw.homeTeam.id);
  const away = clubsById.get(raw.awayTeam.id);
  if (!competition || !home || !away)
    throw new Error(`Fixture ${raw.id} references unknown competition or club`);
  const referee = raw.officials.find((official) => official.role === "referee");
  const homeScore = raw.homeTeam.score?.finalScore ?? null;
  const awayScore = raw.awayTeam.score?.finalScore ?? null;
  return {
    id: raw.id,
    competition,
    dateTime: raw.dateTime,
    round: roundLabel(raw),
    roundNumber: raw.roundTypeId === 2 ? null : raw.round,
    knockout: raw.roundTypeId === 2,
    home: { club: home, score: homeScore, ht: raw.homeTeam.score?.htScore ?? null },
    away: { club: away, score: awayScore, ht: raw.awayTeam.score?.htScore ?? null },
    venue: raw.venue?.name ?? "Venue not in feed",
    attendance: raw.attendance,
    referee: referee ? { id: referee.id, slug: slugify(referee.name), name: referee.name } : null,
    scored: homeScore !== null && awayScore !== null,
  };
}

const fixtures: Fixture[] = rawFixtures
  .map(toFixture)
  .sort((a, b) => b.dateTime.localeCompare(a.dateTime));

// ---- Competitions ----------------------------------------------------------------------------

export function getCompetitions(): CompetitionRef[] {
  return competitionRefs;
}

export function getCompetition(slug: string): CompetitionRef | undefined {
  return competitionRefs.find((competition) => competition.slug === slug);
}

// ---- Fixtures --------------------------------------------------------------------------------

export type FixtureFilter = { competition?: string; club?: string; referee?: string };

/** Fixtures newest first, optionally filtered by competition, club or referee slug. */
export function getFixtures(filter: FixtureFilter = {}): Fixture[] {
  return fixtures.filter(
    (fixture) =>
      (!filter.competition || fixture.competition.slug === filter.competition) &&
      (!filter.club ||
        fixture.home.club.slug === filter.club ||
        fixture.away.club.slug === filter.club) &&
      (!filter.referee || fixture.referee?.slug === filter.referee),
  );
}

export function getMatch(id: string | number): Fixture | undefined {
  const numeric = Number(id);
  return fixtures.find((fixture) => fixture.id === numeric);
}

/** The club's first fixture kicking off at or after `now`. */
export function getNextFixture(clubSlug: string, now: Date): Fixture | undefined {
  const at = now.toISOString();
  return [...getFixtures({ club: clubSlug })].reverse().find((fixture) => fixture.dateTime >= at);
}

/** The club's fixtures that kicked off before `now`, newest first. */
export function getPastFixtures(clubSlug: string, now: Date): Fixture[] {
  const at = now.toISOString();
  return getFixtures({ club: clubSlug }).filter((fixture) => fixture.dateTime < at);
}

// ---- Clubs -----------------------------------------------------------------------------------

export function getClubs(): ClubRef[] {
  return [...clubsById.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function getClub(slug: string): ClubRef | undefined {
  return clubsBySlug.get(slug);
}

/** The club's most common home venue across the feeds. */
export function homeVenueOf(clubSlug: string): string | null {
  return mostCommon(
    getFixtures({ club: clubSlug })
      .filter((fixture) => fixture.home.club.slug === clubSlug)
      .map((fixture) => fixture.venue),
  );
}

/** Competitions the club appears in, in feed order. */
export function competitionsOf(clubSlug: string): CompetitionRef[] {
  const ids = new Set(getFixtures({ club: clubSlug }).map((fixture) => fixture.competition.id));
  return competitionRefs.filter((competition) => ids.has(competition.id));
}

/** The club's last stage in a competition, e.g. "Round of 16", or "Pool" when it went no further. */
export function furthestStage(clubSlug: string, competitionSlug: string): string | null {
  const games = getFixtures({ club: clubSlug, competition: competitionSlug });
  if (!games.length) return null;
  const knockout = games.find((fixture) => fixture.knockout);
  return knockout ? knockout.round : "Pool stage";
}

// ---- Standings -------------------------------------------------------------------------------

export type StandingRow = {
  position: number;
  club: ClubRef;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  pointsFor: number;
  pointsAgainst: number;
  pointsDiff: number;
  triesFor: number;
  triesAgainst: number;
  triesBonus: number;
  losingBonus: number;
  bonus: number;
  points: number;
  /** Last five results, oldest first (newest on the right). Includes play-off matches. */
  last5: ResultLetter[];
};

export type Standings = {
  competition: CompetitionRef;
  rows: StandingRow[];
  playOffPlaces: number;
  asOf: "end-of-season";
};

const standingsByCompetition = new Map<number, Standings>();
{
  const raw = premStandings as RawStandings;
  const competition = competitionsById.get(raw.competition.id);
  if (competition) {
    const form = new Map(raw.form.map((entry) => [entry.team.id, entry.matches]));
    const rows = raw.groups
      .map((row): StandingRow | null => {
        const club = clubsById.get(row.team.id);
        if (!club) return null;
        const last5 = (form.get(row.team.id) ?? [])
          .slice(0, 5)
          .map((match) => match.result as ResultLetter)
          .reverse();
        return {
          position: row.position,
          club,
          played: row.played,
          won: row.won,
          drawn: row.drawn,
          lost: row.lost,
          pointsFor: row.pointsFor,
          pointsAgainst: row.pointsAgainst,
          pointsDiff: row.pointsDiff,
          triesFor: row.triesFor,
          triesAgainst: row.triesAgainst,
          triesBonus: row.triesBonus,
          losingBonus: row.losingBonus,
          bonus: row.bonus,
          points: row.points,
          last5,
        };
      })
      .filter((row): row is StandingRow => row !== null)
      .sort((a, b) => a.position - b.position);
    standingsByCompetition.set(competition.id, {
      competition,
      rows,
      playOffPlaces: 4,
      asOf: "end-of-season",
    });
  }
}

/** End-of-season standings. Only Gallagher PREM has a standings feed. */
export function getStandings(competitionSlug: string): Standings | undefined {
  const competition = getCompetition(competitionSlug);
  return competition ? standingsByCompetition.get(competition.id) : undefined;
}

/**
 * 1-based rank of a club on a standings measure. Ties are broken by league position, as in the
 * design (Harlequins and Gloucester both scored 64 tries; Gloucester, 8th, ranks above).
 */
export function rankInStandings(
  rows: StandingRow[],
  clubSlug: string,
  pick: (row: StandingRow) => number,
  lowerIsBetter = false,
): number {
  const ordered = [...rows].sort(
    (a, b) => (lowerIsBetter ? pick(a) - pick(b) : pick(b) - pick(a)) || a.position - b.position,
  );
  return ordered.findIndex((row) => row.club.slug === clubSlug) + 1;
}

export function standingOf(
  clubSlug: string,
  competitionSlug = "gallagher-prem",
): StandingRow | undefined {
  return getStandings(competitionSlug)?.rows.find((row) => row.club.slug === clubSlug);
}

// ---- Referees --------------------------------------------------------------------------------

export type RefereeSummary = OfficialRef & {
  matches: number;
  byCompetition: Array<{ competition: CompetitionRef; matches: number }>;
};

export function getReferees(): RefereeSummary[] {
  const bySlug = new Map<string, OfficialRef>();
  for (const fixture of fixtures)
    if (fixture.referee) bySlug.set(fixture.referee.slug, fixture.referee);
  return [...bySlug.values()]
    .map((official) => summarise(official))
    .sort((a, b) => b.matches - a.matches || a.name.localeCompare(b.name));
}

function summarise(official: OfficialRef): RefereeSummary {
  const games = getFixtures({ referee: official.slug });
  return {
    ...official,
    matches: games.length,
    byCompetition: competitionRefs
      .map((competition) => ({
        competition,
        matches: games.filter((fixture) => fixture.competition.id === competition.id).length,
      }))
      .filter((entry) => entry.matches > 0),
  };
}

export function getReferee(slug: string): RefereeSummary | undefined {
  const official = fixtures.find((fixture) => fixture.referee?.slug === slug)?.referee;
  return official ? summarise(official) : undefined;
}
