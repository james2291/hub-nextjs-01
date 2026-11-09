// Maps each Hub /api/v1 read onto the Oval Hub v2 call that feeds it.
//
// V2 has two authenticated channels, both on API Gateway:
//   rugbyviz — {gateway}/oval-proxy/…   (Cognito id token; the lambda adds RugbyViz auth)
//   aws      — {gateway}/…              (list-files, presign, user, competitions)
// alleventsearch is the exception: v2 built a direct RugbyViz URL and handed it to Xeatre.
//
// Responses are the upstream payloads unless src/server/contract/reshape.ts has a reshaper for the
// route's operationId, in which case the route answers with the docs/openapi.yaml body.

import { fileContractRoutes, operationIdFor, reshaperFor } from "@/server/contract/reshape";

export type UpstreamChannel = "rugbyviz" | "rugbyviz-direct" | "aws" | "xeatre";

export type UpstreamCall = {
  channel: UpstreamChannel;
  path: string;
  source: string;
  /** Relative RugbyViz path. The Xeatre client sends it as an absolute eventSearchUrl. */
  eventSearchPath?: string;
};

export type BuildResult = { calls: UpstreamCall[]; note?: string } | { error: string };

type Params = Record<string, string>;

type RoutedDef = {
  method: "GET";
  pattern: string;
  status: "routed";
  /** False when the path exists so a v2 call is reachable but is not in docs/openapi.yaml. */
  spec: boolean;
  upstream: string[];
  build: (params: Params, query: URLSearchParams) => BuildResult;
};

type GapDef = {
  method: "GET";
  pattern: string;
  status: "no-v2-source";
  spec: boolean;
  upstream: [];
  gap: string;
};

export type RouteDef = RoutedDef | GapDef;

export type RouteResolution =
  | { kind: "calls"; hub: string; pattern: string; params: Params; spec: boolean; calls: UpstreamCall[]; note?: string }
  | { kind: "gap"; hub: string; spec: boolean; message: string }
  | { kind: "invalid"; message: string };

const SHEET_NAMES: Record<string, string> = {
  allPlayer: "allPlayerSeason",
  matchByMatch: "playersByMatch",
  lineoutCatch: "lineoutCatches",
  turnoverConceded: "turnoversConceded",
  turnoverWon: "turnoversWon",
  penaltiesConceded: "penaltyConceded",
};

/** RugbyViz season ids in the api examples are {startYear}01, e.g. 2025-26 → 202501. */
export function seasonKeyToSeasonId(season: string): string | null {
  const match = /^(\d{4})-(\d{2})$/.exec(season);
  if (!match) return null;
  const start = Number(match[1]);
  const end = Number(match[2]);
  if (end !== (start + 1) % 100) return null;
  return `${match[1]}01`;
}

function ok(calls: UpstreamCall[], note?: string): BuildResult {
  return note === undefined ? { calls } : { calls, note };
}

function call(channel: UpstreamChannel, path: string, source: string, eventSearchPath?: string): UpstreamCall {
  return eventSearchPath === undefined ? { channel, path, source } : { channel, path, source, eventSearchPath };
}

function qs(entries: Record<string, string | null | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(entries)) {
    if (value) params.set(key, value);
  }
  const text = params.toString();
  return text ? `?${text}` : "";
}

function language(query: URLSearchParams): string {
  return query.get("language") || "en";
}

function numeric(value: string | undefined, label: string): { id: string } | { error: string } {
  if (!value || !/^\d+$/.test(value)) {
    return { error: `${label} must be the numeric RugbyViz id. Hub slugs are not mapped to those ids yet.` };
  }
  return { id: value };
}

function scope(
  params: Params,
  query: URLSearchParams,
): { compId: string | null; seasonId: string | null } | { error: string } {
  const fromPath = params["competitionId"];
  const compId = query.get("compId") ?? (fromPath && /^\d+$/.test(fromPath) ? fromPath : null);
  const explicitSeason = query.get("seasonId");
  if (explicitSeason) return { compId, seasonId: explicitSeason };
  const season = query.get("season");
  if (!season) return { compId, seasonId: null };
  const seasonId = seasonKeyToSeasonId(season);
  if (!seasonId) return { error: "season must look like 2025-26, or pass seasonId (RugbyViz, for example 202501)." };
  return { compId, seasonId };
}

function compSeason(params: Params, query: URLSearchParams): { compId: string; seasonId: string } | { error: string } {
  const read = scope(params, query);
  if ("error" in read) return read;
  if (!read.compId || !read.seasonId) {
    return {
      error: "This v2 call needs a RugbyViz compId and seasonId. Pass compId and seasonId, or a numeric competition id and season=2025-26.",
    };
  }
  return { compId: read.compId, seasonId: read.seasonId };
}

function matchPattern(pattern: string, segments: string[]): Params | null {
  const parts = pattern.split("/");
  if (parts.length !== segments.length) return null;
  const params: Params = {};
  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index];
    const segment = segments[index];
    if (part === undefined || segment === undefined) return null;
    if (part.startsWith(":")) params[part.slice(1)] = segment;
    else if (part !== segment) return null;
  }
  return params;
}

function competitionReads(params: Params, query: URLSearchParams): BuildResult {
  const ids = compSeason(params, query);
  if ("error" in ids) return ids;
  const pair = qs({ compId: ids.compId, seasonId: ids.seasonId });
  return ok([
    call("rugbyviz", `competitionteams${pair}`, "CompetitionPage/service/competitionReportService.js"),
    call("rugbyviz", `team/search${pair}`, "EventsCentrePage/services/eventsService.jsx"),
  ]);
}

function standings(params: Params, query: URLSearchParams): BuildResult {
  const ids = compSeason(params, query);
  if ("error" in ids) return ids;
  const pair = qs({ compId: ids.compId, seasonId: ids.seasonId });
  return ok(
    [
      call("rugbyviz", `competitionstandings/${ids.compId}`, "CompetitionPage/service/positionsStandingsService.js"),
      call("rugbyviz", `standing/search${pair}`, "src/_shared/Components/Standings.jsx"),
    ],
    "V2 reads both competitionstandings/{compId} and standing/search. The table UI uses standing/search.",
  );
}

function fixtures(params: Params, query: URLSearchParams): BuildResult {
  const ids = compSeason(params, query);
  if ("error" in ids) return ids;
  return ok([
    call(
      "rugbyviz",
      `fixtureresult/search${qs({ compId: ids.compId, seasonId: ids.seasonId })}`,
      "CompetitionPage/service/fixturesService.js",
    ),
  ]);
}

function trends(params: Params, query: URLSearchParams): BuildResult {
  const ids = compSeason(params, query);
  if ("error" in ids) return ids;
  const pair = qs({ compId: ids.compId, seasonId: ids.seasonId });
  return ok([
    call("rugbyviz", `pointsummary${pair}`, "CompetitionPage/service/insightsService.js"),
    call("rugbyviz", `possessionsummary${pair}`, "src/_shared/services/sharedServices.ts"),
    call("rugbyviz", `matchperformancedatasummary${pair}`, "src/_shared/services/sharedServices.ts"),
  ]);
}

function teamRankings(params: Params, query: URLSearchParams): BuildResult {
  const ids = compSeason(params, query);
  if ("error" in ids) return ids;
  return ok([
    call("rugbyviz", `teaminsights${qs({ compId: ids.compId, seasonId: ids.seasonId })}`, "TeamPage/services/teamServices.ts"),
  ]);
}

function playerLeaders(params: Params, query: URLSearchParams): BuildResult {
  const ids = compSeason(params, query);
  if ("error" in ids) return ids;
  return ok([
    call("rugbyviz", `playertop20s${qs({ compId: ids.compId, seasonId: ids.seasonId })}`, "CompetitionPage/service/insightsService.js"),
  ]);
}

function teamIdOf(params: Params): { id: string } | { error: string } {
  return numeric(params["teamId"], "teamId");
}

function teamSearch(params: Params, path: "teamsearch/search" | "teamsearchmatches/search" | "teamsearchhistorical/search", source: string): BuildResult {
  const team = teamIdOf(params);
  if ("error" in team) return team;
  return ok([call("rugbyviz", `${path}${qs({ teamId: team.id })}`, source)]);
}

function competitions(query: URLSearchParams): BuildResult {
  const company = query.get("company");
  if (company) {
    return ok([
      call("aws", `get-users-competitions${qs({ companyName: company })}`, "src/_layout/services/sharedServices.js"),
    ]);
  }
  return ok([call("aws", "list-competitions", "LandingPage/services/landingServices.js")]);
}

function seasonStats(params: Params): BuildResult {
  const team = teamIdOf(params);
  if ("error" in team) return team;
  const teamQuery = qs({ teamId: team.id });
  return ok(
    [
      call("rugbyviz", `teamsearch/search${teamQuery}`, "TeamPage/services/teamServices.ts"),
      call("rugbyviz", `teamsearchhistorical/search${teamQuery}`, "TeamPage/services/teamServices.ts"),
    ],
    "V2 loads current team search and teamsearchhistorical as two calls.",
  );
}

function byCompetition(params: Params, query: URLSearchParams): BuildResult {
  const team = teamIdOf(params);
  if ("error" in team) return team;
  const read = scope(params, query);
  if ("error" in read) return read;
  if (!read.seasonId) return { error: "teamcompetitionsplayed needs seasonId, or season=2025-26." };
  return ok([
    call("rugbyviz", `teamcompetitionsplayed/${team.id}${qs({ seasonId: read.seasonId })}`, "TeamPage/services/teamServices.ts"),
  ]);
}


function playerFixtures(params: Params): BuildResult {
  const player = numeric(params["playerId"], "playerId");
  if ("error" in player) return player;
  return ok([call("rugbyviz", `playerfixtures/search${qs({ playerId: player.id })}`, "PlayerPage/service/playerService.js")]);
}

function official(params: Params): BuildResult {
  const referee = numeric(params["refereeId"], "refereeId");
  if ("error" in referee) return referee;
  return ok([
    call("rugbyviz", `officialsearch/search${qs({ officialId: referee.id })}`, "RefereePage/services/refereeService.jsx"),
  ]);
}

function penalties(params: Params, query: URLSearchParams): BuildResult {
  const ids = compSeason(params, query);
  if ("error" in ids) return ids;
  const pair = qs({ compId: ids.compId, seasonId: ids.seasonId });
  return ok(
    [
      call("rugbyviz", `penaltyawardedsummary${pair}`, "RefereePage/services/refereeService.jsx"),
      call("rugbyviz", `penaltyawardedcompetitionsummary${pair}`, "RefereePage/services/refereeService.jsx"),
    ],
    "V2 referee pages load competition penalty summaries. They are not filtered by official id.",
  );
}

function matchStats(params: Params, query: URLSearchParams): BuildResult {
  const match = numeric(params["matchId"], "matchId");
  if ("error" in match) return match;
  const widget = query.get("widget") ?? "matchstats";
  const lang = language(query);
  const propertyTypeId = query.get("propertyTypeId");
  const source = "matchCentrePage/services/centreServices.ts";
  if (widget === "matchstats") {
    return ok([call("rugbyviz", `matchstats/${match.id}${qs({ aggregates: query.get("aggregates") ?? "all" })}`, source)]);
  }
  if (widget === "category") {
    return ok([
      call(
        "rugbyviz",
        `internalwidget/matchstats/${match.id}${qs({ category: query.get("category") ?? "all", language: lang, propertyTypeId })}`,
        source,
      ),
    ]);
  }
  if (widget === "top") {
    const statId = query.get("statId");
    const homeAway = query.get("homeAway");
    if (!statId || !homeAway) return { error: "widget=top needs statId and homeAway, matching v2 getTopFives." };
    return ok([
      call(
        "rugbyviz",
        `internalwidget/playertopmatchstats/${match.id}${qs({ statId, homeAway, top: query.get("top") ?? "5", language: lang })}`,
        source,
      ),
    ]);
  }
  if (widget === "kicks") return ok([call("rugbyviz", `internalwidget/playerkickstats/${match.id}`, source)]);
  if (widget === "quarters") {
    return ok([
      call("rugbyviz", `internalwidget/matchquarters/${match.id}${qs({ quarter: query.get("quarter") ?? "all", language: lang })}`, source),
    ]);
  }
  if (widget === "actionpoints" || widget === "actionlines") {
    const team = query.get("team");
    if (!team) return { error: "widget=actionpoints needs team. actionlines uses eventId 6." };
    const eventId = widget === "actionlines" ? "6" : query.get("eventId");
    if (!eventId) return { error: "widget=actionpoints needs eventId." };
    return ok([
      call(
        "rugbyviz",
        `internalwidget/actionpoints/search${qs({ matchId: match.id, team, eventId, propertyTypeId, language: widget === "actionpoints" ? lang : null })}`,
        source,
      ),
    ]);
  }
  if (widget === "turnover") {
    const team = query.get("team");
    const eventId = query.get("eventId");
    if (!team || !eventId) return { error: "widget=turnover needs team and eventId." };
    return ok([
      call(
        "rugbyviz",
        `internalwidget/penaltyturnovertime/${match.id}${qs({ team, eventId, propertyTypeId, language: lang })}`,
        source,
      ),
    ]);
  }
  return { error: "widget must be matchstats, category, top, kicks, quarters, actionpoints, actionlines, or turnover." };
}

function matchPath(params: Params, path: string, source: string): BuildResult {
  const match = numeric(params["matchId"], "matchId");
  if ("error" in match) return match;
  return ok([call("rugbyviz", path.replace("{matchId}", match.id), source)]);
}

function liveXml(params: Params, query: URLSearchParams): BuildResult {
  const match = numeric(params["matchId"], "matchId");
  if ("error" in match) return match;
  const lang = language(query);
  const suffix = lang === "fr" ? qs({ language: "fr" }) : "";
  return ok(
    [call("rugbyviz", `teammatcheventxml/${match.id}${suffix}`, "CompetitionPage/LiveXMLPage/LiveXMLPage.jsx")],
    "V2 appends language=fr only. Other languages call the path with no query.",
  );
}

function download(params: Params, query: URLSearchParams): BuildResult {
  const match = numeric(params["matchId"], "matchId");
  if ("error" in match) return match;
  const kind = params["kind"];
  const lang = language(query);
  const suffix = qs({ language: lang });
  const source = "src/_shared/hooks/useDownload.js";
  if (kind === "xml") return ok([call("rugbyviz", `xmlmatchevents/${match.id}${suffix}`, source)]);
  if (kind === "csv") return ok([call("rugbyviz", `matcheventscsv/${match.id}${suffix}`, source)]);
  if (kind === "superscout") return ok([call("rugbyviz", `superscout/${match.id}`, source)]);
  if (kind === "events") return ok([call("rugbyviz", `matcheventsplus/${match.id}${suffix}`, source)]);
  return { error: "kind must be xml, csv, superscout, or events." };
}

function files(params: Params, query: URLSearchParams): BuildResult {
  if (query.get("source") === "s3") {
    return ok([call("aws", "list-files", "src/_shared/services/sharedServices.ts")]);
  }
  const lang = language(query);
  const teamId = query.get("teamId");
  const playerId = query.get("playerId");
  const officialId = query.get("officialId");
  const read = scope(params, query);
  if ("error" in read) return read;
  const entityCount = [teamId, playerId, officialId].filter(Boolean).length;
  if (read.compId && read.seasonId && entityCount === 0) {
    return ok([
      call(
        "rugbyviz",
        `filelocationsdetroit/search${qs({ seasonId: read.seasonId, compId: read.compId, isPerformanceLevel: "1", language: lang })}`,
        "src/_shared/services/sharedServices.ts",
      ),
    ]);
  }
  if (!read.compId && !read.seasonId && entityCount === 1) {
    return ok([
      call(
        "rugbyviz",
        `filelocationsdetroit/search${qs({ teamId, playerId, officialId, isPerformanceLevel: "1", language: lang })}`,
        "src/_shared/services/sharedServices.ts",
      ),
    ]);
  }
  return {
    error:
      "filelocationsdetroit needs either compId and seasonId, or exactly one of teamId, playerId, officialId. Pass source=s3 for the v2 list-files call.",
  };
}

function fileDownload(params: Params, query: URLSearchParams): BuildResult {
  const key = query.get("key") ?? params["fileId"];
  if (!key) return { error: "A file key is required, as v2 presigned-url?key=." };
  const report = query.get("report") === "1";
  return ok([
    call(
      "aws",
      `${report ? "presigned-report-url" : "presigned-url"}${qs({ key })}`,
      report ? "src/_shared/services/sharedServices.ts getReportsPresign" : "src/_shared/services/sharedServices.ts getPresign",
    ),
  ]);
}

function reports(params: Params, query: URLSearchParams): BuildResult {
  const type = query.get("type") ?? "list";
  const lang = language(query);
  if (type === "list") {
    const id = query.get("id");
    const entity = query.get("entity");
    if (id && entity) {
      const key = entity === "player" ? "playerId" : entity === "team" ? "teamId" : entity === "referee" ? "officialId" : null;
      if (!key) return { error: "entity must be player, team, or referee." };
      return ok([call("aws", `list-season-reports${qs({ [key]: id })}`, "CompetitionPage/service/reportsService.js")]);
    }
    const ids = compSeason(params, query);
    if ("error" in ids) return ids;
    return ok([
      call("aws", `list-season-reports${qs({ compId: ids.compId, seasonId: ids.seasonId })}`, "CompetitionPage/service/reportsService.js"),
    ]);
  }
  const ids = compSeason(params, query);
  if ("error" in ids) return ids;
  if (type === "player") {
    const requested = query.get("sheetType") ?? "allPlayerSeason";
    const sheetType = SHEET_NAMES[requested] ?? requested;
    return ok([
      call(
        "rugbyviz",
        `playerseasonreport${qs({ compId: ids.compId, seasonId: ids.seasonId, sheetType, language: lang })}`,
        "CompetitionPage/service/reportsService.js",
      ),
    ]);
  }
  if (type === "team") {
    return ok([
      call(
        "rugbyviz",
        `teamseasonreport${qs({ compId: ids.compId, seasonId: ids.seasonId, language: lang })}`,
        "CompetitionPage/service/reportsService.js",
      ),
    ]);
  }
  if (type === "referee") {
    return ok([
      call(
        "rugbyviz",
        `refereeseasonreport${qs({ compId: ids.compId, seasonId: ids.seasonId, language: lang })}`,
        "CompetitionPage/service/reportsService.js",
      ),
    ]);
  }
  return { error: "type must be list, player, team, or referee." };
}

function events(query: URLSearchParams): BuildResult {
  const compId = query.get("compId");
  const seasonId = query.get("seasonId");
  const teamId = query.get("teamId");
  const eventTypeId = query.get("eventTypeId");
  if (!compId || !seasonId || !teamId || !eventTypeId) {
    return { error: "alleventsearch needs compId, seasonId, teamId, and eventTypeId, matching the v2 event search." };
  }
  const path = `alleventsearch/search${qs({
    compId,
    seasonId,
    teamId,
    eventTypeId,
    playerId: query.get("playerId"),
    propertyTypeId: query.get("propertyTypeId"),
  })}`;
  if (query.get("player") === "1") {
    const username = query.get("username");
    if (!username) return { error: "player=1 needs username. V2 then asks Xeatre for a player URL." };
    return ok(
      [
        call(
          "xeatre",
          `custom/10.player.php${qs({ userName: username, eventLeadIn: query.get("lead") ?? "5", eventLeadOut: query.get("lag") ?? "5" })}`,
          "EventsCentrePage/EventsCentre.jsx",
          path,
        ),
      ],
      "V2 did not call alleventsearch from the browser. It passed that URL to Xeatre as eventSearchUrl.",
    );
  }
  return ok([call("rugbyviz-direct", path, "EventsCentrePage/EventsCentre.jsx")]);
}

function videoSearch(query: URLSearchParams): BuildResult {
  const subtitle = query.get("subtitle");
  if (subtitle) {
    return ok([
      call(
        "xeatre",
        `archive/search.php${qs({ subtitle, Exactly: "true", pageLimit: "1000", pageOffset: "0" })}`,
        "src/_shared/services/sharedServices.ts getCompSeasonArchive",
      ),
    ]);
  }
  const matchIds = query.get("matchIds");
  if (matchIds) {
    return ok([
      call("xeatre", `custom/10.checkMatchIdsInArchive.php${qs({ matchIds })}`, "src/_shared/services/sharedServices.ts getArchiveFromMatchIds"),
    ]);
  }
  return { error: "Pass subtitle or matchIds. V2 uses those two Xeatre archive lookups." };
}

function matchVideo(params: Params): BuildResult {
  const match = numeric(params["matchId"], "matchId");
  if ("error" in match) return match;
  return ok([
    call(
      "xeatre",
      `archive/search.php?${new URLSearchParams({ "metadata[MatchId]": match.id, Exactly: "true" }).toString()}`,
      "src/_shared/services/sharedServices.ts getArchiveId",
    ),
  ]);
}

function playback(params: Params): BuildResult {
  const asset = params["assetId"];
  if (!asset) return { error: "assetId is required." };
  return ok([
    call("xeatre", `archive/details.php${qs({ id: asset })}`, "src/_shared/services/sharedServices.ts getArchiveDetails"),
  ]);
}

function search(query: URLSearchParams): BuildResult {
  const directory = query.get("directory");
  if (directory === "teams") return ok([call("rugbyviz", "returnteams", "ModalSearch/services/modalSearchService.js")]);
  if (directory === "officials") return ok([call("rugbyviz", "returnofficials", "ModalSearch/services/modalSearchService.js")]);
  const q = query.get("q");
  if (!q) return { error: "Pass q, or directory=teams, or directory=officials." };
  return ok([
    call("rugbyviz", `search${qs({ q, type: query.get("type") })}`, "ModalSearch/services/modalSearchService.js"),
  ]);
}

function currentUser(query: URLSearchParams): BuildResult {
  const username = query.get("username");
  if (!username) return { error: "V2 calls get-user?username=. Pass username until the Cognito session supplies it." };
  return ok([call("aws", `get-user${qs({ username })}`, "src/_shared/authentication/helpers.ts")]);
}

const gap = (pattern: string, message: string, spec = true): GapDef => ({
  method: "GET",
  pattern,
  status: "no-v2-source",
  spec,
  upstream: [],
  gap: message,
});

export const hubRoutes: RouteDef[] = [
  { method: "GET", pattern: "user", status: "routed", spec: true, upstream: ["aws get-user?username="], build: (_params, query) => currentUser(query) },
  gap("user/pins", "V2 kept pins in the browser (localStorage), so there is no v2 source. The Hub serves this itself: app/api/v1/user/pins (temporary cookie store until sign-in and storage exist)."),
  gap("user/home", "The v2 home page is not stored on an API. The spec only has PUT /user/home (served by the Hub, app/api/v1/user/home); the home page is read from GET /user.", false),
  { method: "GET", pattern: "search", status: "routed", spec: true, upstream: ["rugbyviz search", "rugbyviz returnteams", "rugbyviz returnofficials"], build: (_p, query) => search(query) },
  { method: "GET", pattern: "competitions", status: "routed", spec: true, upstream: ["aws list-competitions", "aws get-users-competitions"], build: (_p, query) => competitions(query) },
  { method: "GET", pattern: "competitions/:competitionId/standings", status: "routed", spec: true, upstream: ["rugbyviz competitionstandings/{compId}", "rugbyviz standing/search"], build: standings },
  { method: "GET", pattern: "competitions/:competitionId/rounds", status: "routed", spec: true, upstream: ["rugbyviz fixtureresult/search"], build: fixtures },
  { method: "GET", pattern: "competitions/:competitionId/trends", status: "routed", spec: true, upstream: ["rugbyviz pointsummary", "rugbyviz possessionsummary", "rugbyviz matchperformancedatasummary"], build: trends },
  { method: "GET", pattern: "competitions/:competitionId/team-rankings", status: "routed", spec: true, upstream: ["rugbyviz teaminsights"], build: teamRankings },
  { method: "GET", pattern: "competitions/:competitionId/player-leaders", status: "routed", spec: true, upstream: ["rugbyviz playertop20s"], build: playerLeaders },
  { method: "GET", pattern: "competitions/:competitionId", status: "routed", spec: true, upstream: ["rugbyviz competitionteams", "rugbyviz team/search"], build: competitionReads },
  { method: "GET", pattern: "teams/:teamId/next-fixture", status: "routed", spec: true, upstream: ["rugbyviz teamsearchmatches/search"], build: (params) => teamSearch(params, "teamsearchmatches/search", "TeamPage/services/teamServices.ts") },
  { method: "GET", pattern: "teams/:teamId/form", status: "routed", spec: true, upstream: ["rugbyviz teamsearchmatches/search"], build: (params) => teamSearch(params, "teamsearchmatches/search", "LandingPage/services/landingServices.js") },
  { method: "GET", pattern: "teams/:teamId/season-stats/by-competition", status: "routed", spec: true, upstream: ["rugbyviz teamcompetitionsplayed/{teamId}"], build: byCompetition },
  { method: "GET", pattern: "teams/:teamId/season-stats", status: "routed", spec: true, upstream: ["rugbyviz teamsearch/search", "rugbyviz teamsearchhistorical/search"], build: (params) => seasonStats(params) },
  gap("teams/:teamId/squad", "V2 has no squad-list call. Lineups come from internalwidget/playerlineups/{matchId} on the match route."),
  gap("teams/:teamId/lineup-history", "The v2 app never calls last5lineups. That path exists only in api-examples."),
  { method: "GET", pattern: "teams/:teamId/head-to-head", status: "routed", spec: true, upstream: ["rugbyviz teamsearchmatches/search"], build: (params) => teamSearch(params, "teamsearchmatches/search", "TeamPage/services/teamServices.ts") },
  gap("teams/:teamId/selections/:matchId", "Publishing a team sheet is local state in v2. There is no selection API."),
  { method: "GET", pattern: "teams/:teamId", status: "routed", spec: true, upstream: ["rugbyviz teaminfo is not called; teamsearch/search is"], build: (params) => teamSearch(params, "teamsearch/search", "TeamPage/services/teamServices.ts") },
  { method: "GET", pattern: "players/:playerId/season-stats", status: "no-v2-source", spec: true, upstream: [], gap: "The v2 player page only calls playerfixtures/search. playercareerstats is in api-examples and is not called by the app." },
  { method: "GET", pattern: "players/:playerId/appearances", status: "routed", spec: true, upstream: ["rugbyviz playerfixtures/search"], build: playerFixtures },
  gap("players/:playerId/spatial", "V2 has no spatial or pitch-coordinate API."),
  { method: "GET", pattern: "players/:playerId", status: "routed", spec: true, upstream: ["rugbyviz playerfixtures/search"], build: playerFixtures },
  { method: "GET", pattern: "referees/:refereeId/season-stats", status: "routed", spec: true, upstream: ["rugbyviz penaltyawardedsummary", "rugbyviz penaltyawardedcompetitionsummary"], build: penalties },
  { method: "GET", pattern: "referees/:refereeId/appointments", status: "routed", spec: true, upstream: ["rugbyviz officialsearch/search"], build: official },
  { method: "GET", pattern: "referees/:refereeId", status: "routed", spec: true, upstream: ["rugbyviz officialsearch/search"], build: official },
  { method: "GET", pattern: "matches/:matchId/stats", status: "routed", spec: true, upstream: ["rugbyviz matchstats/{id}", "rugbyviz internalwidget/*"], build: matchStats },
  { method: "GET", pattern: "matches/:matchId/lineups", status: "routed", spec: true, upstream: ["rugbyviz internalwidget/playerlineups/{id}"], build: (params) => matchPath(params, "internalwidget/playerlineups/{matchId}", "matchCentrePage/services/centreServices.ts") },
  { method: "GET", pattern: "matches/:matchId/player-stats", status: "routed", spec: true, upstream: ["rugbyviz internalwidget/playerstats/{id}"], build: (params, query) => {
    const match = numeric(params["matchId"], "matchId");
    if ("error" in match) return match;
    return ok([call("rugbyviz", `internalwidget/playerstats/${match.id}${qs({ language: language(query) })}`, "matchCentrePage/services/centreServices.ts")]);
  } },
  { method: "GET", pattern: "matches/:matchId/video", status: "routed", spec: true, upstream: ["xeatre archive/search.php?metadata[MatchId]"], build: matchVideo },
  { method: "GET", pattern: "matches/:matchId/files", status: "routed", spec: true, upstream: ["rugbyviz filelocationsdetroit/search", "aws list-files"], build: files },
  gap("matches/:matchId/reports", "The v2 app never calls matchreport/{id}. Season reports are GET /api/v1/reports. Per-match event files are GET /api/v1/matches/{matchId}/download/events."),
  { method: "GET", pattern: "matches/:matchId/live-xml", status: "routed", spec: true, upstream: ["rugbyviz teammatcheventxml/{matchId}"], build: liveXml },
  { method: "GET", pattern: "matches/:matchId/download/:kind", status: "routed", spec: false, upstream: ["rugbyviz xmlmatchevents", "matcheventscsv", "superscout", "matcheventsplus"], build: download },
  { method: "GET", pattern: "matches/:matchId", status: "routed", spec: true, upstream: ["rugbyviz internalwidget/match/{id}"], build: (params) => matchPath(params, "internalwidget/match/{matchId}", "matchCentrePage/services/centreServices.ts") },
  { method: "GET", pattern: "matches", status: "routed", spec: true, upstream: ["rugbyviz fixtureresult/search"], build: (params, query) => fixtures(params, query) },
  gap("live/matches", "V2 polls teammatcheventxml for one match. It has no live-match list."),
  { method: "GET", pattern: "events/groups", status: "routed", spec: true, upstream: ["rugbyviz returneventinfo?type=union"], build: (_p, query) => ok([call("rugbyviz", `returneventinfo${qs({ type: "union", language: language(query) })}`, "src/_shared/services/sharedServices.ts")]) },
  gap("events/summary", "V2 does not have an event-count summary. returneventinfo is the group list, routed at /events/groups."),
  { method: "GET", pattern: "events", status: "routed", spec: true, upstream: ["rugbyviz-direct alleventsearch/search", "xeatre custom/10.player.php"], build: (_p, query) => events(query) },
  { method: "GET", pattern: "video/search", status: "routed", spec: false, upstream: ["xeatre archive/search.php", "xeatre custom/10.checkMatchIdsInArchive.php"], build: (_p, query) => videoSearch(query) },
  { method: "GET", pattern: "video/:assetId/playback", status: "routed", spec: true, upstream: ["xeatre archive/details.php"], build: playback },
  gap("playlists", "V2 playlists are not backed by an API in this repo."),
  { method: "GET", pattern: "files/:fileId/download", status: "routed", spec: true, upstream: ["aws presigned-url", "aws presigned-report-url"], build: fileDownload },
  { method: "GET", pattern: "reports", status: "routed", spec: true, upstream: ["aws list-season-reports", "rugbyviz playerseasonreport", "teamseasonreport", "refereeseasonreport"], build: reports },
];

export const notRoutedInV2 = [
  { call: "POST sign-in", reason: "Replaced by the proposed Cognito sign-in. The password endpoint is not proxied." },
  { call: "PUT set-password", reason: "Replaced by Cognito. Not proxied." },
  { call: "PUT refesh-access-token", reason: "V2 token refresh (path spelled refesh). Cognito refreshes the session instead." },
  { call: "GET user-settings / PUT user-settings", reason: "V2 preference JSON. The Hub spec stores pins and home separately, and v2 has no such API." },
  { call: "GET updates", reason: "V2 settings changelog. No Hub page reads it." },
  { call: "POST/PUT/DELETE pins, selections, playlists, exports", reason: "No v2 API. Exports in v2 are immediate downloads, routed at /matches/{id}/download/{kind}." },
] as const;

export function listHubRoutes() {
  const items = hubRoutes.map((route) => ({
    method: route.method,
    path: `/api/v1/${route.pattern}`,
    ...(route.spec ? { operationId: operationIdFor(route.pattern) } : {}),
    spec: route.spec,
    status: route.status,
    contract: route.status === "routed" && (reshaperFor(route.pattern) || fileContractRoutes.has(route.pattern)) ? "openapi" : route.status === "routed" ? "upstream-passthrough" : "none",
    upstream: route.upstream,
    ...(route.status === "no-v2-source" ? { gap: route.gap } : {}),
  }));
  const toMap = items.filter((item) => item.spec && item.status === "routed");
  return {
    progress: {
      routedSpecEndpoints: toMap.length,
      reshaped: toMap.filter((item) => item.contract === "openapi").length,
    },
    items,
    notRouted: notRoutedInV2,
  };
}

export function resolveHubRoute(method: string, segments: string[], query: URLSearchParams): RouteResolution | null {
  if (method !== "GET") return null;
  for (const route of hubRoutes) {
    const params = matchPattern(route.pattern, segments);
    if (!params) continue;
    const hub = `GET /api/v1/${route.pattern}`;
    if (route.status === "no-v2-source") return { kind: "gap", hub, spec: route.spec, message: route.gap };
    const built = route.build(params, query);
    if ("error" in built) return { kind: "invalid", message: built.error };
    const base = { kind: "calls" as const, hub, pattern: route.pattern, params, spec: route.spec, calls: built.calls };
    return built.note === undefined ? base : { ...base, note: built.note };
  }
  return null;
}
