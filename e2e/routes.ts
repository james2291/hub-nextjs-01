// Key pages the suite visits. 289001 is a played Gallagher PREM fixture in the bundled feeds
// (with HUB_NOW = 2026-05-16); 289015 is a later one.
export const KEY_ROUTES = [
  "/",
  "/next-opponent",
  "/teams/harlequins",
  "/teams/harlequins/fixtures",
  "/teams/harlequins/squad",
  "/teams/harlequins/stats",
  "/competitions/gallagher-prem",
  "/competitions/gallagher-prem/fixtures",
  "/competitions/gallagher-prem/table",
  "/competitions/gallagher-prem/people",
  "/competitions/gallagher-prem/stats",
  "/competitions/gallagher-prem/feeds",
  "/referees/christophe-ridley",
  "/referees/christophe-ridley/fixtures",
  "/players/marcus-smith",
  "/players/marcus-smith/stats",
  "/matches/289001",
  "/matches/289001/match-centre",
  "/matches/289001/video",
  "/matches/289001/stats",
  "/matches/289015",
];

/** Pages audited with axe and at phone width. */
export const CORE_ROUTES = [
  "/",
  "/teams/harlequins",
  "/competitions/gallagher-prem/table",
  "/players/marcus-smith",
  "/matches/289001",
];
