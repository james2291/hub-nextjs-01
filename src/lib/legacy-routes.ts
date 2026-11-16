// Tab slugs from the TanStack Start prototype and the 7-tab match workspace, mapped to the
// current tabs ("" = Overview). proxy.ts answers these with a 307 before any page renders, so the
// pages themselves only know the current slugs. Plain module: no React, no data, safe in proxy.ts.

type EntityKind = "competition" | "team" | "player" | "referee";

// The Matches tab became Fixture Card everywhere; dropped tabs go to the closest remaining tab.
const LEGACY_TABS: Record<EntityKind, Record<string, string>> = {
  competition: {
    "match-room": "",
    "fixture-card": "fixtures",
    "video-centre": "fixtures",
    "live-xml": "feeds",
    players: "people",
    reports: "stats",
    competitions: "",
    "video-library": "fixtures",
  },
  team: {
    "match-room": "",
    "fixture-card": "fixtures",
    players: "squad",
    "teams-players": "squad",
    cohesion: "squad",
    clips: "fixtures",
    "video-centre": "fixtures",
    "video-library": "fixtures",
    reports: "stats",
    competitions: "",
    "head-to-head": "",
  },
  player: {
    "match-room": "",
    "fixture-card": "fixtures",
    clips: "fixtures",
    "video-centre": "fixtures",
    "player-stats": "stats",
  },
  referee: {
    "match-room": "",
    "fixture-card": "fixtures",
    clips: "fixtures",
    "video-centre": "fixtures",
    "referee-stats": "stats",
  },
};

// Match tabs: Overview / Match Centre / Video / Stats.
const LEGACY_MATCH_TABS: Record<string, string> = {
  overview: "",
  lineups: "",
  "player-data": "match-centre",
  reports: "video",
  "files-feeds": "video",
};

const BASES: Record<string, EntityKind> = {
  competitions: "competition",
  teams: "team",
  players: "player",
  referees: "referee",
};

/**
 * The current URL for a legacy tab URL, or null. Query strings are left to the caller.
 * `/teams/harlequins/players` → `/teams/harlequins/squad`; `/matches/1/lineups` → `/matches/1`.
 */
export function legacyRedirect(pathname: string): string | null {
  const [, base, id, tab, ...rest] = pathname.split("/");
  if (!base || !id || !tab || rest.length > 0) return null;
  const table =
    base === "matches" ? LEGACY_MATCH_TABS : BASES[base] ? LEGACY_TABS[BASES[base]] : null;
  const replacement = table && Object.hasOwn(table, tab) ? table[tab] : undefined;
  if (replacement === undefined) return null;
  return `/${base}/${id}${replacement ? `/${replacement}` : ""}`;
}
