# 0004. Team availability is out of scope

**Status:** Accepted (8 Oct 2026)

## Context

The prototype and the design screens showed player availability (Available / Managed / Return to
play) on Home, squads, player headers and Cohesion. That is medical and selection information
with its own owners, permissions and data source.

## Decision

The Hub does not show availability. It was removed from the UI and from `docs/openapi.yaml`
(the endpoint, `AvailabilityStatus`, and squad `status` / `statusNote`).

## Consequences

Where a design screen shows availability, the build leaves it out on purpose. Bringing it back
needs a data owner and an access model first, then a new decision record.
