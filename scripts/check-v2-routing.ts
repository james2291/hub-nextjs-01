import { listHubRoutes, resolveHubRoute, seasonKeyToSeasonId } from "../src/server/upstream/catalog";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

assert(seasonKeyToSeasonId("2025-26") === "202501", "2025-26 should become 202501");
assert(seasonKeyToSeasonId("2025-27") === null, "a broken season key should be rejected");

const standings = resolveHubRoute("GET", ["competitions", "1011", "standings"], new URLSearchParams("season=2025-26"));
assert(standings?.kind === "calls", "standings should route");
if (standings?.kind === "calls") {
  assert(standings.calls[0]?.path === "competitionstandings/1011", standings.calls[0]?.path ?? "missing competitionstandings");
  assert(standings.calls[1]?.path === "standing/search?compId=1011&seasonId=202501", standings.calls[1]?.path ?? "missing standing search");
}

const slug = resolveHubRoute("GET", ["competitions", "gallagher-prem", "standings"], new URLSearchParams());
assert(slug?.kind === "invalid", "a slug without compId should be rejected");

const kicks = resolveHubRoute("GET", ["matches", "288927", "stats"], new URLSearchParams("widget=actionlines&team=1229"));
assert(kicks?.kind === "calls" && kicks.calls[0]?.path.includes("eventId=6"), "action lines should use eventId 6");

const spatial = resolveHubRoute("GET", ["players", "252989", "spatial"], new URLSearchParams());
assert(spatial?.kind === "gap", "spatial has no v2 call");

const events = resolveHubRoute(
  "GET",
  ["events"],
  new URLSearchParams("compId=1011&seasonId=202501&teamId=1229&eventTypeId=6&player=1&username=analyst"),
);
assert(events?.kind === "calls" && events.calls[0]?.channel === "xeatre" && events.calls[0]?.eventSearchPath?.startsWith("alleventsearch/search?"), "event player search");

const index = listHubRoutes();
const routed = index.items.filter((item) => item.status === "routed");
const gaps = index.items.filter((item) => item.status === "no-v2-source");
assert(routed.length >= 25, `expected routed reads, got ${routed.length}`);
assert(gaps.length >= 8, `expected explicit gaps, got ${gaps.length}`);
console.log(`routed ${routed.length}, no v2 source ${gaps.length}, left on Cognito or unused ${index.notRouted.length}`);
