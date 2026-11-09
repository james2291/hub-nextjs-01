// TEMPORARY HOLD: positional match IDs (e.g. "gallagher-prem-0") from the prototype. Replaced by
// stable match IDs from GET /api/v1/matches/{matchId}; delete with src/data/hub.ts.

import { competitions } from "@/data/hub";

export function getMatch(matchId: string) {
  for (const competition of competitions) {
    const prefix = `${competition.id}-`;
    if (!matchId.startsWith(prefix)) continue;
    const index = Number(matchId.slice(prefix.length));
    const fixture = Number.isInteger(index) ? competition.fixtures[index] : undefined;
    if (fixture) return { competition, fixture, matchId, index };
  }
  return undefined;
}