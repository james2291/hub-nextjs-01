# Oval Hub (Next.js)

Oval Hub v2 prototype, ported from TanStack Start (Lovable) to **Next.js 16.4.5 App Router**. Same pages, same URLs, same look.

> **Temporary holds.** Three parts of this codebase stand in for APIs that aren't built yet:
>
> - **Data:** pages read the real 2025/26 RugbyViz feeds bundled in `src/server/feeds/2025-26/` (fixtures and results for PREM, Champions Cup and Challenge Cup; PREM standings). Players, officiating figures, team sheets, match events and video are Hub demo or illustrative data (`src/data/hub.ts`), labelled on the page. Both are replaced by the Hub API (`docs/openapi.yaml`) as it is built; the feed functions already return plain props so pages don't change.
> - **AI insights:** `POST /api/v1/insights` returns labelled placeholder text until the AWS Oval Insights API is live. Set `INSIGHTS_API_URL` to switch it on; no other code changes.
> - **Upstream routing:** `GET /api/v1/*` passes Oval Hub v2 upstream payloads through unchanged (`contract: "upstream-passthrough"`) until each endpoint gets a reshaper in `src/server/contract/reshape.ts`, which switches it to its `docs/openapi.yaml` body. Pages don't call it yet.
>
> AI text is generated and stored by the AWS Oval Insights API; the Hub only reads it.

## Run it

```sh
npm install
cp .env.example .env.local   # INSIGHTS_API_URL / INSIGHTS_API_KEY, or leave empty for placeholders
npm run dev                  # http://localhost:3000
npm run build && npm start   # production
npm run typecheck && npm run lint
npm test                     # Vitest: feed derivations and the handoff's check values
HUB_NOW=2026-05-16T14:30:00+01:00 npm run dev   # pin "now" to match the design screenshots
npm run check:routing        # v2 call map
npm run check:contract       # catalog vs spec, reshapers vs captured fixtures
npm run gen:api              # regenerate src/api/openapi.d.ts after editing docs/openapi.yaml
```

With no environment variables set, every page works and AI insight cards show labelled placeholder text. Upstream routes answer 503 until `OVAL_API_GATEWAY_URL` is set.

## Oval Hub v2 API routing

Pages still read `src/data/hub.ts`. `GET /api/v1/*` (other than the insights route) calls the same upstreams as Oval Hub v2 and returns those payloads unchanged. They are not yet mapped onto `docs/openapi.yaml`.

`GET /api/v1/routing` lists every binding, including calls v2 never had. RugbyViz goes to `{OVAL_API_GATEWAY_URL}/oval-proxy/`. Event search uses `RUGBYVIZ_API_URL`. Video uses Xeatre. See `.env.example`.

Ids must be numeric RugbyViz ids. `season=2025-26` is sent as season id `202501`. Check the map without a server:

```sh
npx tsx scripts/check-v2-routing.ts
```

## Layout

```
app/                         Next.js routes (server components: metadata, redirects, params)
  layout.tsx                 html shell, fonts, React Query provider
  page.tsx                   Home (/)
  next-opponent/page.tsx     server redirect to the next opponent's Head-to-head
  matches/[matchId]/[tab]/   match workspace (7 tabs)
  competitions|teams|players|referees/[id]/
    layout.tsx               entity header + tab bar (was TanStack <Outlet/>)
    page.tsx                 redirect to /match-room
    [tab]/page.tsx           tab content, per-tab metadata, legacy-slug redirects
  api/v1/insights/route.ts   AI insights: forwards to the AWS Oval Insights API (temporary placeholder until it exists)
  api/v1/[...path]/route.ts  Oval Hub v2 upstream routing (see below)
src/
  views/                     client page bodies for the non-entity pages
  components/oval/           product components (unchanged apart from "use client" + imports)
  components/oval/entity-navigation.ts   tab definitions, server-safe
  components/ui/             shadcn/Radix (unchanged)
  lib/link.tsx               router compatibility layer (see below)
  lib/ai-insights.ts         shared insight types + wire schema
  server/insights/client.server.ts  AWS Oval Insights API client + placeholder (server-only)
  server/upstream/           v2 call map and server-only upstream client
  data/hub.ts                static prototype data (TEMPORARY HOLD until the Hub API exists)
public/assets/               images (were imported from src/assets)
docs/openapi.yaml            API spec for every endpoint not yet built (OpenAPI 3.1)
```

## What changed in the port

| TanStack Start                                              | Next.js                                                                        |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `src/routes/*.tsx` file routes (27)                         | `app/**/page.tsx` + `layout.tsx`                                               |
| `head()`                                                    | `metadata` / `generateMetadata()`                                              |
| `beforeLoad` + `redirect()`                                 | `redirect()` in server pages; fixed URL in `next.config.ts`                    |
| `<Outlet />` in entity/match layouts                        | `children` in `layout.tsx`                                                     |
| `<Link to params search activeProps>`                       | `@/lib/link` renders `next/link` with the same props (47 call sites unchanged) |
| `useRouterState`, `useNavigate`                             | `usePathname`, `useSearchParams`, `useRouter`                                  |
| `createServerFn` + `useServerFn` (Lovable AI + cache table) | `POST /api/v1/insights` route handler reading the AWS Oval Insights API        |
| `import.meta.env.VITE_*` keys                               | Removed; only `INSIGHTS_API_URL` / `INSIGHTS_API_KEY` (server-only)            |
| `import img from "@/assets/x.jpg"`                          | `"/assets/x.jpg"` from `public/`                                               |
| Vite + `@lovable.dev/vite-tanstack-config`                  | Next.js + `@tailwindcss/postcss` (Tailwind 4 unchanged)                        |

Removed: `src/router.tsx`, `src/start.ts`, `src/server.ts`, `routeTree.gen.ts`, Lovable error capture, the Lovable AI gateway and the prototype's backend client. Sign-in is proposed as AWS Cognito, added in `proxy.ts` when it's built (plan Phase 0).

**Lovable:** this project can no longer be edited in Lovable.

## Verified

- `next build` and `tsc --noEmit` pass; `eslint` has 0 errors.
- All 280 URLs (every competition, team, player and referee tab, every match tab, legacy redirects) were loaded in both the original and this port: same final URL, same `<h1>`, same page text, no console errors. Screenshots of 8 key pages at desktop and mobile differ by under 0.3% of pixels.

## Fixes made during the port

- Active entity tab now shows its underline and bold (the original's classes clashed with the defaults, so only the colour changed).
- `MatchCentre` called hooks after an early return (rules-of-hooks bug).
- `/matches/:id` with no tab now redirects to the Overview tab (was blank).
- `/api/v1/insights` never fails the whole batch: each card gets `ready`, `pending`, `unavailable` or `placeholder`.
- The browser no longer sends prompt data for AI insights; it sends only subject, scope and season.

## Pages removed (8 Oct 2026)

The Matches library (`/matches`), Downloads (`/downloads`) and the pre-redesign legacy pages (`/reports`, `/event-search`, `/video-library`, `/teams-players`, `/competitions` index) were removed and now return 404. Match workspaces (`/matches/:id/:tab`) and competition workspaces (`/competitions/:id/:tab`) are unchanged. The remaining 273 URLs were re-verified: all load with no console errors.

## V3 upstream routing (8 Oct 2026)

Added `app/api/v1/[...path]/route.ts`, `src/server/upstream/` and `scripts/check-v2-routing.ts`.

- `next build` failed on two `noPropertyAccessFromIndexSignature` errors in `client.server.ts`; fixed (`headers["Authorization"]`).
- The routing check reports 35 routed reads, 11 with no v2 source (501) and 6 v2 calls deliberately not routed.
- Responses: `/routing` 200, missing env 503, slug instead of numeric id 422, no v2 source 501, unknown path 404. The Cognito id token is forwarded without the `Bearer ` prefix, as v2 does.

## Team availability removed (8 Oct 2026)

Team availability is out of scope. Removed: the Home Availability panel, the "Squad available" stat, player status (Available / Managed / Return to play) on squad lists, player headers and Cohesion, the `/teams/{teamId}/availability` routing gap, and from `docs/openapi.yaml` the availability endpoint, the `AvailabilityStatus` type and the squad `status` / `statusNote` fields.

## Next.js security update (9 Nov 2026)

`next` and `eslint-config-next` upgraded from 16.4.0 to 16.4.5: `next build` on 16.4.0 now stops with a known-vulnerability warning. Build, typecheck and lint pass on 16.4.5.

## Contract layer (9 Nov 2026)

Groundwork for reshaping the 33 routed spec endpoints (the "Map v2 source" set) onto `docs/openapi.yaml`. No endpoint is reshaped yet: there are no captured v2 payloads to map from, and field names are not guessed.

- `src/api/openapi.d.ts` is generated from the spec (`npm run gen:api`). A reshaper's return type is the operation's 200 body, so a wrong field name fails `tsc`.
- `src/server/contract/reshape.ts` holds reshapers by operationId. With one present, the route returns the contract body. If any upstream call fails, the route returns an `ApiError` instead. Without one, the route stays pass-through.
- `scripts/check-contract.ts` checks that every `spec: true` catalog route exists in the spec with the derived operationId, and that every reshaper has a routed spec route. It then runs each fixture in `fixtures/upstream/<operationId>/` through its reshaper and validates the result against the 200 schema (Ajv, JSON Schema 2020-12). See `fixtures/upstream/README.md` to capture one.
- `GET /api/v1/routing` now gives each route's `operationId` and `contract`, plus `progress` (33 routed spec endpoints, 0 reshaped).
- Pass-through bodies now include `request.params` / `request.query`, so a saved response is a complete fixture.
- Fixed: error bodies now match `ApiError`. The no-v2-source 501 used `code: "not_implemented"` (not in the enum) plus a top-level `hub` key (`additionalProperties: false`). It now sends `upstream_unavailable` with `details.reason: "no_v2_source"`. Reshaped endpoints map upstream 401/403/404/429 to their codes and anything else to 502. They never pass the upstream body through.
- Fixed: the catalog marked `GET user/home` as in the spec. The spec only has `PUT /user/home`, and the home page comes from `GET /user` (`homePath`).

- `docs/openapi.yaml`: the pin endpoints (`GET`/`POST /user/pins`, `DELETE /user/pins/{pinId}`, `PUT /user/home`) now sit in their own **User Pinned** section. The rest of the old "Session, pins and search" section is now "Session and search" (`GET /user` session info and `GET /search`).

Blocked before mapping can start:

1. **Upstream payloads.** Run with `OVAL_API_GATEWAY_URL` and a Cognito id token, then capture each endpoint into `fixtures/upstream/`.
2. **Hub id → RugbyViz id.** The spec takes slugs (`gallagher-prem`), but upstreams need numeric ids, so `/competitions/gallagher-prem/standings` answers 422 today. A slug ↔ `compId`/`teamId`/`playerId`/`officialId` source is needed (likely `list-competitions` / `returnteams` / `returnofficials`; confirm from payloads).
3. **Current season default.** The spec defaults `season` to the current season. The catalog needs it passed explicitly.

## Oval Hub redesign (9 Nov 2026)

Built from the design handoff in `design/oval-hub-handoff/` (spec `HANDOFF.md`, 22 screens). All 22 pages are rebuilt in the repo's own components; the prototype's `support.js` and inline styles are not used.

- **Tokens and type:** the handoff colours are theme tokens in `src/styles.css` (`bg-page`, `border-line`, `text-mute`, `bg-side`, `text-club`, `text-win`…); IBM Plex is self-hosted from `app/fonts/`.
- **Shell:** in the root layout (`src/components/oval/app-shell.tsx`, data from `src/server/shell.ts`). The Pin button stays alongside Downloads (User Pinned); the handoff's five pins are the defaults.
- **Routes:** entity Overview is the root (`/teams/harlequins`); tabs are `fixtures`, `table`, `people`, `stats`, `feeds`, `squad`. Matches are `/matches/{RugbyViz id}` with `video` and `stats`. Next opponent is `/opposition/{team}`; `/next-opponent` redirects. Old tab slugs redirect to the nearest tab.
- **"Now":** the real clock, or `HUB_NOW`. Home's day strip, the sidebar's next opponent, Next opponent and match states follow it. With the real clock after June 2026 the season is over, so Home opens on an empty day and Next opponent falls back to the Fixture Card.
- **Check values:** every figure in `HANDOFF.md` section 5 is a test in `src/server/feeds/feeds.test.ts`.
- **Links:** a crawl of 189 internal links from every page returned no errors.

Where the build differs from the screens on purpose:

- Team availability (Managed / Return to play, the Squad availability view) is left out: it was taken out of scope on 8 Oct.
- Home shows only competitions in the feeds, so the URC and Top 14 example groups are gone.
- Harlequins' crest reads "HQ" everywhere (the screens mix HQ and HAR).
- Player percentiles aren't invented: season figures show without percentiles until the player feed exists.
- Illustrative match data (momentum, stats, try and kick map) is tied to the real score so it never contradicts it; unplayed matches say so instead.
- Copy that guessed a player's or referee's pronouns uses neutral wording.

Feeds still needed for the demo and illustrative areas:

| Area                                                                                   | Feed                                |
| -------------------------------------------------------------------------------------- | ----------------------------------- |
| Player figures, percentiles, heatmap, clips; competition player list; team key players | Player stats feed                   |
| Squad selection, matchday 23, minutes per match                                        | Team sheets                         |
| Referee penalties, cards, set piece, advantage                                         | Officiating feed                    |
| Match momentum, top stats, timeline events, try and kick map                           | Event feed with x/y coordinates     |
| Match video, clips, key moments                                                        | Clip / video feed                   |
| Exports list, Downloads count                                                          | Exports API                         |
| Pool tables for the cups; standings by round                                           | EPCR standings; per-round standings |

## User API and pins (9 Nov 2026)

- Every `me` path in `docs/openapi.yaml` is now `user`: `GET /api/v1/user`, `GET`/`POST /api/v1/user/pins`, `DELETE /api/v1/user/pins/{pinId}`, `PUT /api/v1/user/home` (operationIds `get_user`, `get_user_pins`, …; schema `User`). The routing catalog and generated types follow.
- The User Pinned endpoints are built (`app/api/v1/user/`) to the contract: 201/409/422 on pin, 204/404 on unpin, max 20 pins. **Temporary hold:** with no sign-in or database yet, pins live in a signed httpOnly cookie (`src/server/user-pins.ts`, key `HUB_COOKIE_SECRET`), so they persist per browser, not across devices. Only that module changes when Cognito and storage arrive.
- The sidebar and Pin button read pins on the server and change them through the API, with optimistic updates that roll back on failure. Pins saved in the browser before this change are not carried over.

## UI/UX pass (9 Nov 2026)

- **Phones and tablets:** KPI strips go 2 → 3 → all columns; panels stack below the lg breakpoint; table panels scroll sideways (`Section minWidth`) with the league table's club column pinned; the Fixture Card becomes match cards with "Select assets"; tab rows fade at the edge; the match header stacks.
- **Accessibility:** `faint` and sidebar-label colours meet 4.5:1; visible focus ring on every control; ARIA table semantics for the league table, Fixture Card and shared rows; spoken labels for W/L form and coloured scores; Search returns focus on close; the phone menu is a modal dialog. axe-core (WCAG 2 A/AA) reports no violations on the main pages.
- **Unconnected actions** (reports, compare, publish, download, preview pack, clips, playlists) use `ComingSoonButton`: they look unavailable and say what they need.
- **Data:** league table columns sort (with `aria-sort`); the Fixture Card's filters, search and date order, Home's day and the Stats measure live in the URL (`useUrlState`), so views can be shared; bars show value, average and rank on hover.
- **States:** out of season, Home opens on the nearest matchday and says the season is complete; each section has a loading skeleton and an in-page error panel with Try again (shell and header stay).
- **Payload:** the search index loads when Search first opens (`/api/hub/search-index`), and match pages name themselves in the breadcrumb, so the shell data sent with every page shrank by about 15 KB.

Not done: pages are still rendered per request (the shell reads the hub clock and the pins cookie), so Competition, Team and Referee pages aren't cached yet.

## Match Centre and Live XML (9 Nov 2026)

- **Competition → Match Centre** (`/competitions/{id}/match-centre`, since moved to each match; see below): a fixture browser (completed/upcoming, team, round; `?match=` selects a fixture) and, for the selected fixture, Summary, Lineups, Kicking, Quarters, Player data and Live XML views. Score and match facts come from the fixtures feed; the views read the Hub's v2 routes (`/api/v1/matches/{id}/stats`, `/lineups`, `/player-stats`, `/live-xml`), the same RugbyViz widgets the v2 Match Centre used (catalogued in `src/server/upstream/catalog.ts`). Until those responses are reshaped, the views lay out the v2 payload generically and say so.
- **Every fixture** has a Match Centre link on the Fixture Card; Live XML downloads from the fixture's Match Centre and from Feeds (not the Fixture Card).
- **`GET /api/v1/matches/{matchId}/live-xml` meets its contract:** `application/xml`, `ETag`, `304` on `If-None-Match`, `Cache-Control: no-store`; add `?download=1` to save `{matchId}-live.xml`. Event XML/CSV (`download/{kind}`) are served as files the same way.
- Without `OVAL_API_GATEWAY_URL` the views say the data service isn't connected. The wiring was tested end to end against a local mock of the gateway.
- The prototype zip supplied for reference had no APIs (static demo data); it was used only for the Match Centre's layout and views. Discipline and Turnovers from the prototype need v2 parameters (event ids) that aren't in the catalogue yet, so they're not shown.

## Home is fixed (9 Nov 2026)

- Users can no longer make a pinned page their home screen: Home is always the matchday page. Removed the sidebar's "Set as home" buttons, the redirect to a chosen page and the pinned page's name beside Home.
- Removed `PUT /api/v1/user/home` (route and spec) and `homePath` from the `User` schema and the pins cookie. Cookies saved with a home page still load; the home page in them is ignored. Pins stay as sidebar shortcuts.

## Match Centre per fixture (10 Nov 2026)

- The Match Centre is now a tab on each match page (`/matches/{id}/match-centre`: Overview · Match Centre · Video · Stats) instead of a competition tab. It keeps the Summary, Lineups, Kicking, Quarters, Player data and Live XML views and the Live XML / Event XML / Event CSV downloads, for that fixture only.
- The Fixture Card's Match Centre arrow opens the fixture's Match Centre. Live XML is not on the Fixture Card: it's in each fixture's Match Centre and on Competition → Feeds.
- Old links redirect: `/competitions/{id}/match-centre?match={matchId}` → `/matches/{matchId}/match-centre`, and without a match to the competition's Fixture Card. The prototype's `/matches/{id}/player-data` now goes to the Match Centre.
- Since the loading skeletons (`loading.tsx`) were added, these redirects (and the other legacy-slug redirects) happen in the browser after the page streams, not as HTTP 307s. Moving them to `proxy.ts` would restore 307s if crawlers or link checkers need them.

## Fixture Card trimmed (10 Nov 2026)

- Columns are now Date · KO, Home, Result, Away, Round, the asset ticks and Match Centre. Removed: Live XML (it's in each fixture's Match Centre and on Competition → Feeds), Referee, and Venue with attendance. The phone cards and search follow (search is by team).
- Round shows just the number ("18"); pool games show the round number with the pool under it ("Champions Cup · Pool 3"); knockouts keep their name ("Semi-final"). The Round filter uses the same labels.

## Next steps (from the build plan)

1. Reshape each `/api/v1/*` pass-through response to its `docs/openapi.yaml` schema (`GET /api/v1/routing` lists them).
2. Replace `src/data/hub.ts` imports with React Query hooks in `src/api/` per endpoint (build plan section 6).
3. Move read-only sections to server components with `<Suspense>` as their endpoints land.
4. Migrate `@/lib/link` call sites to plain `next/link` + `buildHref()` / a typed `routes` helper over time.
5. 3 lint warnings remain from shadcn/prototype code in `src/components/ui` and `src/hooks`; fix as they are touched.
