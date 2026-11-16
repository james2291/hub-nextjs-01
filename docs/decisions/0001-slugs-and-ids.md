# 0001. URLs use slugs; numeric RugbyViz ids stay server-side

**Status:** Accepted (9 Nov 2026)

## Context

RugbyViz and the v2 upstreams key everything by numeric ids (`compId`, `teamId`, `officialId`,
season `202501`). Analysts share links, and `/teams/harlequins` reads better than `/teams/2371`.

## Decision

Competitions, teams, players and referees use slugs in URLs and in `docs/openapi.yaml`
(`gallagher-prem`, `harlequins`). The server maps slugs to numeric ids: today in
`src/server/feeds/index.ts`; for the API layer, in the reshapers. Matches are the exception:
`/matches/{RugbyViz match id}`, because there is no stable human name for a fixture.

## Consequences

- The slug ↔ id map must exist before reshaped endpoints work. Until then the pass-through
  routes answer 422 for slugs (`/api/v1/competitions/gallagher-prem/standings`).
- Likely sources: `list-competitions`, `returnteams`, `returnofficials`. Confirm from captured
  payloads (`fixtures/upstream/`).
- A renamed club needs a redirect from the old slug.
