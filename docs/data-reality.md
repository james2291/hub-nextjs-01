# Data reality: what is real on each page

**Real** = from the bundled RugbyViz 2025/26 feeds (`src/server/feeds/2025-26/`: fixtures and
results for PREM, Champions Cup and Challenge Cup; PREM standings). Correct, but a snapshot: it
does not update when a match is played.
**Demo** = hand-written sample data (`src/data/hub.ts`), plausible but not real.
**Illustrative** = generated per match (`src/lib/match-illustrative.ts`, `src/lib/seeded.ts`),
tied to the real score so it never contradicts it. Labelled ILLUSTRATIVE on the page.
**Upstream** = live from Oval Hub v2 through `/api/v1/*` when `OVAL_API_GATEWAY_URL` is set;
otherwise the panel says the data service is not connected.

`HUB_DEMO=1` (the default) reports this state on `/api/health`. As each source goes live, delete
the demo or illustrative code rather than hiding it behind the flag.

| Page                  | Real                                            | Demo                        | Illustrative                  | Upstream                                                   | Feed needed to finish                                     |
| --------------------- | ----------------------------------------------- | --------------------------- | ----------------------------- | ---------------------------------------------------------- | --------------------------------------------------------- |
| Home                  | Day strip, fixtures, scores, PREM table         | —                           | —                             | —                                                          | Live fixtures                                             |
| Sidebar / shell       | Next opponent                                   | User, club, default pins    | —                             | —                                                          | Cognito session, pins storage                             |
| Competition Overview  | Results, table, form                            | —                           | —                             | —                                                          | Live fixtures                                             |
| Competition Table     | PREM standings                                  | —                           | —                             | —                                                          | EPCR pool standings                                       |
| Competition People    | Clubs                                           | Player list                 | —                             | —                                                          | Player stats, squads                                      |
| Competition Stats     | Team rankings from results and standings        | —                           | —                             | —                                                          | Player stats (no player rankings yet)                     |
| Competition Feeds     | Fixture list                                    | Exports list                | —                             | Live XML, event XML/CSV                                    | Exports API                                               |
| Team Overview / Stats | Results, form, points, league comparison (PREM) | Key players (Overview)      | —                             | —                                                          | Player stats                                              |
| Team Squad            | —                                               | Squad, positions, minutes   | —                             | —                                                          | Team sheets                                               |
| Player pages          | Club, fixtures                                  | Season figures, profile     | Season heatmap (pitch zones)  | —                                                          | Player stats                                              |
| Referee pages         | Fixtures refereed                               | Penalties, cards, set piece | —                             | —                                                          | Officiating feed                                          |
| Fixture Card (all)    | Date, teams, result, round                      | —                           | —                             | —                                                          | Exports API (asset ticks select; Download is Coming soon) |
| Next opponent         | Fixture, head-to-head, form, table              | —                           | —                             | —                                                          | Clip / video feed (clip packs are Coming soon)            |
| Match Overview        | Score, half-time, date, venue, round, referee   | Lineup names                | Momentum, top stats           | —                                                          | Event feed, team sheets                                   |
| Match Centre          | Score, match facts                              | —                           | —                             | Summary, lineups, kicking, quarters, player data, Live XML | Reshapers (`check:contract`)                              |
| Match Video           | Fixture                                         | Clips, key moments          | —                             | AI summary (placeholder until live)                        | Clip / video feed                                         |
| Match Stats           | Score                                           | —                           | Match profile, scoring events | —                                                          | Event feed with x/y                                       |
| Search                | Competitions, clubs, referees, matches          | Players                     | —                             | —                                                          | `GET /api/v1/search`                                      |
