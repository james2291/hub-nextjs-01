// Shared rugby types and pure helpers. Client-safe: no feed data is imported here.
// The feed-backed model is built in src/server/feeds and passed to pages as plain props.

export type ResultLetter = "W" | "D" | "L";

export type CompetitionRef = {
  id: number;
  slug: string;
  /** Display name, e.g. "Gallagher PREM", "Champions Cup". */
  name: string;
  /** Long name for data notes, e.g. "EPCR Champions Cup". */
  longName: string;
  /** Crest code, e.g. "GP". */
  code: string;
};

export type ClubRef = {
  id: number;
  slug: string;
  name: string;
  shortName: string;
  /** Crest code in upper case, e.g. "NTN". */
  code: string;
  /** Club colour: the club's most common home teamColour across the feeds. */
  colour: string;
  /** Text colour that reads on `colour`. */
  onColour: string;
};

export type OfficialRef = { id: number; slug: string; name: string };

export type FixtureSide = { club: ClubRef; score: number | null; ht: number | null };

export type Fixture = {
  id: number;
  competition: CompetitionRef;
  /** UTC ISO timestamp. Display with the UK helpers below. */
  dateTime: string;
  /** e.g. "Round 16", "Pool 3 · R4", "Round of 16", "Final". */
  round: string;
  /** League or pool round number; null for knockouts. */
  roundNumber: number | null;
  knockout: boolean;
  home: FixtureSide;
  away: FixtureSide;
  venue: string;
  attendance: number | null;
  referee: OfficialRef | null;
  /** True when the feed has a final score for both sides. */
  scored: boolean;
};

export type ClubRecord = {
  played: number;
  won: number;
  drawn: number;
  lost: number;
  pointsFor: number;
  pointsAgainst: number;
};

const UK = "Europe/London";

function part(date: Date, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: UK, ...options }).format(date);
}

/** "16:00" in UK time. */
export function ukTime(iso: string | Date): string {
  return part(new Date(iso), { hour: "2-digit", minute: "2-digit", hour12: false });
}

/** "Sat 16 May 2026" in UK time. */
export function ukDate(iso: string | Date): string {
  const date = new Date(iso);
  return `${part(date, { weekday: "short" })} ${part(date, { day: "numeric" })} ${part(date, { month: "short" })} ${part(date, { year: "numeric" })}`;
}

/** "16 May" in UK time. */
export function ukDayMonth(iso: string | Date): string {
  const date = new Date(iso);
  return `${part(date, { day: "numeric" })} ${part(date, { month: "short" })}`;
}

/** "2026-05-16": the UK calendar day, for grouping by day. */
export function ukDayKey(iso: string | Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: UK,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

export function sideOf(fixture: Fixture, clubSlug: string): "home" | "away" | null {
  if (fixture.home.club.slug === clubSlug) return "home";
  if (fixture.away.club.slug === clubSlug) return "away";
  return null;
}

/** W/D/L from the club's side, or null if the club didn't play or there's no score. */
export function resultFor(fixture: Fixture, clubSlug: string): ResultLetter | null {
  const side = sideOf(fixture, clubSlug);
  if (!side || !fixture.scored) return null;
  const own = fixture[side].score ?? 0;
  const other = fixture[side === "home" ? "away" : "home"].score ?? 0;
  return own > other ? "W" : own < other ? "L" : "D";
}

export function opponentOf(fixture: Fixture, clubSlug: string): ClubRef | null {
  const side = sideOf(fixture, clubSlug);
  if (!side) return null;
  return fixture[side === "home" ? "away" : "home"].club;
}

/** Played, won, drawn, lost and points for/against from the club's side, over scored fixtures. */
export function recordFor(fixtures: Fixture[], clubSlug: string): ClubRecord {
  const record: ClubRecord = {
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    pointsFor: 0,
    pointsAgainst: 0,
  };
  for (const fixture of fixtures) {
    const side = sideOf(fixture, clubSlug);
    const result = resultFor(fixture, clubSlug);
    if (!side || !result) continue;
    record.played += 1;
    if (result === "W") record.won += 1;
    else if (result === "D") record.drawn += 1;
    else record.lost += 1;
    record.pointsFor += fixture[side].score ?? 0;
    record.pointsAgainst += fixture[side === "home" ? "away" : "home"].score ?? 0;
  }
  return record;
}

/** "6W 0D 12L". */
export function recordLabel(record: Pick<ClubRecord, "won" | "drawn" | "lost">): string {
  return `${record.won}W ${record.drawn}D ${record.lost}L`;
}

/** Value per match to one decimal, e.g. 24.9. */
export function perMatch(total: number, matches: number): number {
  return matches ? Math.round((total / matches) * 10) / 10 : 0;
}

/** 1-based rank of `value` among `values` (highest first unless `ascending`). Ties share a rank. */
export function rankOf(value: number, values: number[], ascending = false): number {
  return values.filter((other) => (ascending ? other < value : other > value)).length + 1;
}

export function ordinal(n: number): string {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  return `${n}${n % 10 === 1 ? "st" : n % 10 === 2 ? "nd" : n % 10 === 3 ? "rd" : "th"}`;
}

/** "+157", "−141" (true minus sign), "0". */
export function signed(n: number): string {
  return n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : "0";
}

/** "26–17", or null when unscored. */
export function scoreLine(fixture: Fixture): string | null {
  return fixture.scored ? `${fixture.home.score}–${fixture.away.score}` : null;
}

export function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Dark text on light colours, white otherwise (WCAG relative luminance). */
export function textOn(hex: string): string {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!match?.[1]) return "#FFFFFF";
  const value = parseInt(match[1], 16);
  const channel = (shift: number) => {
    const c = ((value >> shift) & 255) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const luminance = 0.2126 * channel(16) + 0.7152 * channel(8) + 0.0722 * channel(0);
  return luminance > 0.45 ? "#18181B" : "#FFFFFF";
}
