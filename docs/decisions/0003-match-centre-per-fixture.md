# 0003. Match Centre is a tab on each match

**Status:** Accepted (10 Nov 2026)

## Context

The Match Centre was first built as a competition tab with a fixture picker
(`/competitions/{id}/match-centre?match=`). Analysts reach it from a fixture, and everything in it
(summary, lineups, kicking, quarters, player data, Live XML) is about one match.

## Decision

The Match Centre is `/matches/{matchId}/match-centre`, beside Overview, Video and Stats. The
Fixture Card's arrow opens it. Live XML is in each fixture's Match Centre and on Competition →
Feeds, not on the Fixture Card.

## Consequences

- The old competition URL redirects to the match (with `?match=`) or to the Fixture Card.
- The Match Centre views read `/api/v1/matches/{id}/*`. Until each is reshaped they lay out the v2
  payload generically (`match-centre/upstream-view.tsx`) and say so.
