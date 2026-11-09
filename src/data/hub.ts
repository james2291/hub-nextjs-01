// TEMPORARY HOLD: static prototype data. Every page section that reads this file is replaced by a
// Hub API call (docs/openapi.yaml) as the API is built. Do not add new data here; delete the file
// when nothing imports it.

export type EntityKind = "competition" | "team" | "player" | "referee";

export type Competition = {
  id: string;
  name: string;
  season: string;
  stage: string;
  status: string;
  matches: number;
  rounds: number;
  pointsScored: string;
  pointsPerMatch: string;
  tries: string;
  triesPerMatch: string;
  ballInPlay: string;
  ballInPlayDelta: string;
  standings: Array<{ teamId: string; team: string; p: number; w: number; d: number; l: number; pts: number }>;
  fixtures: Array<{ round: string; fixture: string; date: string; venue: string; result: string }>;
  trends: Array<{ label: string; value: string; progress: number }>;
};

export type Team = {
  id: string;
  name: string;
  competitionId: string;
  position: string;
  record: string;
  venue: string;
  coach: string;
  nextFixture: string;
  form: string[];
  stats: Array<{ label: string; value: string; detail: string }>;
  performance: Array<{ label: string; value: string; progress: number }>;
  recentMatches: Array<{ opponent: string; score: string; date: string; result: "W" | "L" | "D"; clips: number }>;
  squad: string[];
};

export type Player = {
  id: string;
  name: string;
  initials: string;
  teamId: string;
  position: string;
  age: number;
  height: string;
  apps: number;
  mins: number;
  stats: Array<{ label: string; value: string; detail: string }>;
  contribution: Array<{ label: string; value: number }>;
  matchLog: Array<{ opponent: string; date: string; mins: number; headline: string }>;
  clips: Array<{ title: string; match: string; length: string }>;
};

export type Referee = {
  id: string;
  name: string;
  panel: string;
  union: string;
  matches: number;
  stats: Array<{ label: string; value: string; detail: string }>;
  penaltyBreakdown: Array<{ label: string; value: number }>;
  setPiece: Array<{ label: string; value: string; progress: number }>;
  appointments: Array<{ fixture: string; date: string; competition: string; penalties: number; cards: string }>;
};

export const competitions: Competition[] = [
  {
    id: "gallagher-prem",
    name: "Gallagher PREM",
    season: "2025/26",
    stage: "Round 18",
    status: "Regular season complete",
    matches: 90,
    rounds: 18,
    pointsScored: "5,184",
    pointsPerMatch: "57.6 per match",
    tries: "648",
    triesPerMatch: "7.2 per match",
    ballInPlay: "38:42",
    ballInPlayDelta: "+01:18 vs 24/25",
    standings: [
      { teamId: "bath-rugby", team: "Bath Rugby", p: 18, w: 14, d: 2, l: 2, pts: 71 },
      { teamId: "leicester-tigers", team: "Leicester Tigers", p: 18, w: 12, d: 1, l: 5, pts: 62 },
      { teamId: "sale-sharks", team: "Sale Sharks", p: 18, w: 11, d: 1, l: 6, pts: 59 },
      { teamId: "harlequins", team: "Harlequins", p: 18, w: 10, d: 1, l: 7, pts: 56 },
      { teamId: "bristol-bears", team: "Bristol Bears", p: 18, w: 9, d: 1, l: 8, pts: 50 },
      { teamId: "saracens", team: "Saracens", p: 18, w: 9, d: 0, l: 9, pts: 47 },
      { teamId: "northampton-saints", team: "Northampton Saints", p: 18, w: 8, d: 1, l: 9, pts: 44 },
      { teamId: "gloucester-rugby", team: "Gloucester Rugby", p: 18, w: 7, d: 1, l: 10, pts: 39 },
      { teamId: "exeter-chiefs", team: "Exeter Chiefs", p: 18, w: 6, d: 1, l: 11, pts: 34 },
    ],
    fixtures: [
      { round: "Round 18", fixture: "Harlequins v Northampton Saints", date: "6 Jun 2026", venue: "Twickenham Stoop", result: "38 — 31" },
      { round: "Round 18", fixture: "Bath Rugby v Sale Sharks", date: "6 Jun 2026", venue: "The Rec", result: "24 — 17" },
      { round: "Round 18", fixture: "Saracens v Bristol Bears", date: "7 Jun 2026", venue: "StoneX Stadium", result: "19 — 22" },
      { round: "Semi-final", fixture: "Bath Rugby v Harlequins", date: "13 Jun 2026", venue: "The Rec", result: "Upcoming" },
      { round: "Semi-final", fixture: "Leicester Tigers v Sale Sharks", date: "14 Jun 2026", venue: "Mattioli Woods", result: "Upcoming" },
      { round: "Round 17", fixture: "Gloucester Rugby v Harlequins", date: "30 May 2026", venue: "Kingsholm", result: "21 — 29" },
      { round: "Round 17", fixture: "Bristol Bears v Bath Rugby", date: "30 May 2026", venue: "Ashton Gate", result: "27 — 33" },
      { round: "Round 17", fixture: "Sale Sharks v Exeter Chiefs", date: "31 May 2026", venue: "Salford Community Stadium", result: "30 — 14" },
      { round: "Round 17", fixture: "Northampton Saints v Saracens", date: "31 May 2026", venue: "cinch Stadium at Franklin's Gardens", result: "26 — 26" },
      { round: "Round 17", fixture: "Leicester Tigers v Newcastle Red Bulls", date: "31 May 2026", venue: "Mattioli Woods", result: "41 — 10" },
    ],
    trends: [
      { label: "Points per match", value: "57.6", progress: 82 },
      { label: "Tackle success", value: "82.4%", progress: 74 },
      { label: "Scrum retention", value: "91.8%", progress: 91 },
      { label: "Lineout retention", value: "86.1%", progress: 84 },
    ],
  },
  {
    id: "prem-rugby-cup",
    name: "Premiership Rugby Cup",
    season: "2025/26",
    stage: "Pool stage",
    status: "In progress",
    matches: 44,
    rounds: 6,
    pointsScored: "2,310",
    pointsPerMatch: "52.5 per match",
    tries: "301",
    triesPerMatch: "6.8 per match",
    ballInPlay: "36:20",
    ballInPlayDelta: "-00:42 vs PREM",
    standings: [
      { teamId: "harlequins", team: "Harlequins", p: 4, w: 3, d: 0, l: 1, pts: 15 },
      { teamId: "bristol-bears", team: "Bristol Bears", p: 4, w: 3, d: 0, l: 1, pts: 14 },
      { teamId: "gloucester-rugby", team: "Gloucester Rugby", p: 4, w: 2, d: 1, l: 1, pts: 12 },
      { teamId: "exeter-chiefs", team: "Exeter Chiefs", p: 4, w: 1, d: 0, l: 3, pts: 6 },
    ],
    fixtures: [
      { round: "Pool 2", fixture: "Harlequins v Exeter Chiefs", date: "21 Feb 2026", venue: "Twickenham Stoop", result: "33 — 12" },
      { round: "Pool 2", fixture: "Bristol Bears v Gloucester Rugby", date: "22 Feb 2026", venue: "Ashton Gate", result: "27 — 27" },
      { round: "Pool 2", fixture: "Gloucester Rugby v Harlequins", date: "1 Mar 2026", venue: "Kingsholm", result: "Upcoming" },
    ],
    trends: [
      { label: "Points per match", value: "52.5", progress: 76 },
      { label: "Academy minutes", value: "41%", progress: 41 },
      { label: "Scrum retention", value: "89.4%", progress: 89 },
      { label: "Lineout retention", value: "83.7%", progress: 83 },
    ],
  },
  {
    id: "champions-cup",
    name: "Investec Champions Cup",
    season: "2025/26",
    stage: "Round 4",
    status: "Knockouts pending",
    matches: 96,
    rounds: 4,
    pointsScored: "4,704",
    pointsPerMatch: "49.0 per match",
    tries: "572",
    triesPerMatch: "6.0 per match",
    ballInPlay: "37:55",
    ballInPlayDelta: "+00:34 vs 24/25",
    standings: [
      { teamId: "leicester-tigers", team: "Leicester Tigers", p: 4, w: 4, d: 0, l: 0, pts: 19 },
      { teamId: "bath-rugby", team: "Bath Rugby", p: 4, w: 3, d: 0, l: 1, pts: 16 },
      { teamId: "harlequins", team: "Harlequins", p: 4, w: 2, d: 0, l: 2, pts: 11 },
      { teamId: "saracens", team: "Saracens", p: 4, w: 2, d: 0, l: 2, pts: 10 },
    ],
    fixtures: [
      { round: "Round 4", fixture: "Harlequins v Toulouse", date: "18 Jan 2026", venue: "Twickenham Stoop", result: "25 — 29" },
      { round: "Round 4", fixture: "Leinster v Bath Rugby", date: "18 Jan 2026", venue: "Aviva Stadium", result: "18 — 21" },
      { round: "Last 16", fixture: "Leicester Tigers v La Rochelle", date: "4 Apr 2026", venue: "Mattioli Woods", result: "Upcoming" },
    ],
    trends: [
      { label: "Points per match", value: "49.0", progress: 70 },
      { label: "Tackle success", value: "84.9%", progress: 85 },
      { label: "Kick metres", value: "1,204", progress: 78 },
      { label: "Lineout retention", value: "88.2%", progress: 88 },
    ],
  },
];

export const teams: Team[] = [
  {
    id: "harlequins",
    name: "Harlequins",
    competitionId: "gallagher-prem",
    position: "4th",
    record: "10 W · 1 D · 7 L",
    venue: "Twickenham Stoop",
    coach: "Danny Wilson",
    nextFixture: "Bath Rugby (a) · 13 Jun 2026",
    form: ["W", "W", "L", "W", "D"],
    stats: [
      { label: "League position", value: "4th", detail: "56 points" },
      { label: "Points for", value: "612", detail: "34.0 per match" },
      { label: "Tries scored", value: "84", detail: "4.7 per match" },
    ],
    performance: [
      { label: "Carry metres per match", value: "512", progress: 86 },
      { label: "Tackle success", value: "86.4%", progress: 86 },
      { label: "Ruck effectiveness", value: "94.1%", progress: 94 },
      { label: "Lineout retention", value: "88.0%", progress: 88 },
      { label: "Scrum retention", value: "92.6%", progress: 92 },
    ],
    recentMatches: [
      { opponent: "Northampton Saints", score: "38 — 31", date: "6 Jun 2026", result: "W", clips: 18 },
      { opponent: "Saracens", score: "22 — 19", date: "30 May 2026", result: "W", clips: 14 },
      { opponent: "Bath Rugby", score: "17 — 26", date: "23 May 2026", result: "L", clips: 12 },
      { opponent: "Sale Sharks", score: "29 — 24", date: "16 May 2026", result: "W", clips: 16 },
      { opponent: "Bristol Bears", score: "21 — 21", date: "9 May 2026", result: "D", clips: 11 },
    ],
    squad: ["marcus-smith", "alex-dombrandt", "danny-care", "tyrone-green", "will-evans"],
  },
  {
    id: "northampton-saints",
    name: "Northampton Saints",
    competitionId: "gallagher-prem",
    position: "7th",
    record: "8 W · 1 D · 9 L",
    venue: "cinch Stadium at Franklin's Gardens",
    coach: "Phil Dowson",
    nextFixture: "Gloucester Rugby (h) · 13 Jun 2026",
    form: ["L", "W", "W", "L", "L"],
    stats: [
      { label: "League position", value: "7th", detail: "44 points" },
      { label: "Points for", value: "558", detail: "31.0 per match" },
      { label: "Tries scored", value: "76", detail: "4.2 per match" },
    ],
    performance: [
      { label: "Carry metres per match", value: "486", progress: 80 },
      { label: "Tackle success", value: "83.1%", progress: 83 },
      { label: "Ruck effectiveness", value: "92.4%", progress: 92 },
      { label: "Lineout retention", value: "85.2%", progress: 85 },
      { label: "Scrum retention", value: "90.1%", progress: 90 },
    ],
    recentMatches: [
      { opponent: "Harlequins", score: "31 — 38", date: "6 Jun 2026", result: "L", clips: 15 },
      { opponent: "Exeter Chiefs", score: "34 — 20", date: "30 May 2026", result: "W", clips: 13 },
      { opponent: "Saracens", score: "27 — 24", date: "23 May 2026", result: "W", clips: 12 },
      { opponent: "Leicester Tigers", score: "18 — 33", date: "16 May 2026", result: "L", clips: 10 },
    ],
    squad: ["fin-smith"],
  },
  {
    id: "bath-rugby",
    name: "Bath Rugby",
    competitionId: "gallagher-prem",
    position: "1st",
    record: "14 W · 2 D · 2 L",
    venue: "The Recreation Ground",
    coach: "Johann van Graan",
    nextFixture: "Harlequins (h) · 13 Jun 2026",
    form: ["W", "W", "W", "D", "W"],
    stats: [
      { label: "League position", value: "1st", detail: "71 points" },
      { label: "Points for", value: "684", detail: "38.0 per match" },
      { label: "Tries scored", value: "96", detail: "5.3 per match" },
    ],
    performance: [
      { label: "Carry metres per match", value: "548", progress: 92 },
      { label: "Tackle success", value: "88.2%", progress: 88 },
      { label: "Ruck effectiveness", value: "95.0%", progress: 95 },
      { label: "Lineout retention", value: "90.4%", progress: 90 },
      { label: "Scrum retention", value: "93.8%", progress: 93 },
    ],
    recentMatches: [
      { opponent: "Sale Sharks", score: "24 — 17", date: "6 Jun 2026", result: "W", clips: 16 },
      { opponent: "Harlequins", score: "26 — 17", date: "23 May 2026", result: "W", clips: 14 },
      { opponent: "Bristol Bears", score: "30 — 30", date: "16 May 2026", result: "D", clips: 12 },
    ],
    squad: ["ollie-lawrence"],
  },
  {
    id: "leicester-tigers",
    name: "Leicester Tigers",
    competitionId: "gallagher-prem",
    position: "2nd",
    record: "12 W · 1 D · 5 L",
    venue: "Mattioli Woods Welford Road",
    coach: "Michael Cheika",
    nextFixture: "Sale Sharks (h) · 14 Jun 2026",
    form: ["W", "L", "W", "W", "W"],
    stats: [
      { label: "League position", value: "2nd", detail: "62 points" },
      { label: "Points for", value: "640", detail: "35.6 per match" },
      { label: "Tries scored", value: "88", detail: "4.9 per match" },
    ],
    performance: [
      { label: "Carry metres per match", value: "524", progress: 88 },
      { label: "Tackle success", value: "87.0%", progress: 87 },
      { label: "Ruck effectiveness", value: "93.6%", progress: 93 },
      { label: "Lineout retention", value: "89.1%", progress: 89 },
      { label: "Scrum retention", value: "94.2%", progress: 94 },
    ],
    recentMatches: [
      { opponent: "Gloucester Rugby", score: "41 — 12", date: "6 Jun 2026", result: "W", clips: 17 },
      { opponent: "Northampton Saints", score: "33 — 18", date: "16 May 2026", result: "W", clips: 15 },
    ],
    squad: [],
  },
  {
    id: "saracens",
    name: "Saracens",
    competitionId: "gallagher-prem",
    position: "6th",
    record: "9 W · 0 D · 9 L",
    venue: "StoneX Stadium",
    coach: "Mark McCall",
    nextFixture: "Exeter Chiefs (a) · 13 Jun 2026",
    form: ["L", "L", "W", "L", "W"],
    stats: [
      { label: "League position", value: "6th", detail: "47 points" },
      { label: "Points for", value: "572", detail: "31.8 per match" },
      { label: "Tries scored", value: "72", detail: "4.0 per match" },
    ],
    performance: [
      { label: "Carry metres per match", value: "468", progress: 78 },
      { label: "Tackle success", value: "89.4%", progress: 89 },
      { label: "Ruck effectiveness", value: "92.0%", progress: 92 },
      { label: "Lineout retention", value: "87.3%", progress: 87 },
      { label: "Scrum retention", value: "91.0%", progress: 91 },
    ],
    recentMatches: [
      { opponent: "Bristol Bears", score: "19 — 22", date: "7 Jun 2026", result: "L", clips: 11 },
      { opponent: "Harlequins", score: "19 — 22", date: "30 May 2026", result: "L", clips: 13 },
    ],
    squad: ["ben-earl"],
  },
  {
    id: "sale-sharks",
    name: "Sale Sharks",
    competitionId: "gallagher-prem",
    position: "3rd",
    record: "11 W · 1 D · 6 L",
    venue: "Salford Community Stadium",
    coach: "Alex Sanderson",
    nextFixture: "Leicester Tigers (a) · 14 Jun 2026",
    form: ["L", "W", "W", "W", "L"],
    stats: [
      { label: "League position", value: "3rd", detail: "59 points" },
      { label: "Points for", value: "596", detail: "33.1 per match" },
      { label: "Tries scored", value: "80", detail: "4.4 per match" },
    ],
    performance: [
      { label: "Carry metres per match", value: "498", progress: 83 },
      { label: "Tackle success", value: "85.7%", progress: 85 },
      { label: "Ruck effectiveness", value: "93.0%", progress: 93 },
      { label: "Lineout retention", value: "86.6%", progress: 86 },
      { label: "Scrum retention", value: "92.1%", progress: 92 },
    ],
    recentMatches: [
      { opponent: "Bath Rugby", score: "17 — 24", date: "6 Jun 2026", result: "L", clips: 12 },
      { opponent: "Harlequins", score: "24 — 29", date: "16 May 2026", result: "L", clips: 10 },
    ],
    squad: [],
  },
  {
    id: "bristol-bears",
    name: "Bristol Bears",
    competitionId: "gallagher-prem",
    position: "5th",
    record: "9 W · 1 D · 8 L",
    venue: "Ashton Gate",
    coach: "Pat Lam",
    nextFixture: "Saracens (h) · 13 Jun 2026",
    form: ["W", "D", "L", "W", "W"],
    stats: [
      { label: "League position", value: "5th", detail: "50 points" },
      { label: "Points for", value: "648", detail: "36.0 per match" },
      { label: "Tries scored", value: "92", detail: "5.1 per match" },
    ],
    performance: [
      { label: "Carry metres per match", value: "561", progress: 95 },
      { label: "Tackle success", value: "80.2%", progress: 80 },
      { label: "Ruck effectiveness", value: "94.4%", progress: 94 },
      { label: "Lineout retention", value: "84.8%", progress: 84 },
      { label: "Scrum retention", value: "89.6%", progress: 89 },
    ],
    recentMatches: [
      { opponent: "Saracens", score: "22 — 19", date: "7 Jun 2026", result: "W", clips: 13 },
      { opponent: "Harlequins", score: "21 — 21", date: "9 May 2026", result: "D", clips: 11 },
    ],
    squad: [],
  },
  {
    id: "gloucester-rugby",
    name: "Gloucester Rugby",
    competitionId: "gallagher-prem",
    position: "8th",
    record: "7 W · 1 D · 10 L",
    venue: "Kingsholm Stadium",
    coach: "George Skivington",
    nextFixture: "Northampton Saints (a) · 13 Jun 2026",
    form: ["L", "L", "W", "L", "D"],
    stats: [
      { label: "League position", value: "8th", detail: "39 points" },
      { label: "Points for", value: "504", detail: "28.0 per match" },
      { label: "Tries scored", value: "64", detail: "3.6 per match" },
    ],
    performance: [
      { label: "Carry metres per match", value: "442", progress: 74 },
      { label: "Tackle success", value: "81.5%", progress: 81 },
      { label: "Ruck effectiveness", value: "90.8%", progress: 90 },
      { label: "Lineout retention", value: "83.4%", progress: 83 },
      { label: "Scrum retention", value: "88.7%", progress: 88 },
    ],
    recentMatches: [
      { opponent: "Leicester Tigers", score: "12 — 41", date: "6 Jun 2026", result: "L", clips: 9 },
    ],
    squad: [],
  },
  {
    id: "exeter-chiefs",
    name: "Exeter Chiefs",
    competitionId: "gallagher-prem",
    position: "9th",
    record: "6 W · 1 D · 11 L",
    venue: "Sandy Park",
    coach: "Rob Baxter",
    nextFixture: "Saracens (h) · 13 Jun 2026",
    form: ["L", "L", "L", "W", "L"],
    stats: [
      { label: "League position", value: "9th", detail: "34 points" },
      { label: "Points for", value: "486", detail: "27.0 per match" },
      { label: "Tries scored", value: "60", detail: "3.3 per match" },
    ],
    performance: [
      { label: "Carry metres per match", value: "430", progress: 72 },
      { label: "Tackle success", value: "79.8%", progress: 79 },
      { label: "Ruck effectiveness", value: "90.1%", progress: 90 },
      { label: "Lineout retention", value: "82.0%", progress: 82 },
      { label: "Scrum retention", value: "87.4%", progress: 87 },
    ],
    recentMatches: [
      { opponent: "Northampton Saints", score: "20 — 34", date: "30 May 2026", result: "L", clips: 8 },
    ],
    squad: [],
  },
];

export const players: Player[] = [
  {
    id: "marcus-smith",
    name: "Marcus Smith",
    initials: "MS",
    teamId: "harlequins",
    position: "Fly-half",
    age: 27,
    height: "1.78m",
    apps: 17,
    mins: 1268,
    stats: [
      { label: "Points", value: "182", detail: "10.7 per match" },
      { label: "Goal success", value: "84%", detail: "58 of 69" },
      { label: "Carries", value: "147", detail: "412 metres" },
      { label: "Try assists", value: "14", detail: "Competition 2nd" },
    ],
    contribution: [
      { label: "Attack", value: 88 },
      { label: "Kicking", value: 92 },
      { label: "Defence", value: 66 },
      { label: "Discipline", value: 79 },
    ],
    matchLog: [
      { opponent: "Northampton Saints", date: "6 Jun 2026", mins: 80, headline: "19 pts · 2 try assists" },
      { opponent: "Saracens", date: "30 May 2026", mins: 80, headline: "12 pts · 7 carries" },
      { opponent: "Bath Rugby", date: "23 May 2026", mins: 68, headline: "7 pts · 4 kicks in play" },
      { opponent: "Sale Sharks", date: "16 May 2026", mins: 80, headline: "14 pts · 1 try" },
    ],
    clips: [
      { title: "Cross-field kick assist", match: "v Northampton Saints", length: "0:24" },
      { title: "Try under the posts", match: "v Sale Sharks", length: "0:31" },
      { title: "Touchfinder from own 22", match: "v Saracens", length: "0:18" },
    ],
  },
  {
    id: "alex-dombrandt",
    name: "Alex Dombrandt",
    initials: "AD",
    teamId: "harlequins",
    position: "Number 8",
    age: 29,
    height: "1.93m",
    apps: 16,
    mins: 1202,
    stats: [
      { label: "Carries", value: "148", detail: "421 metres" },
      { label: "Tries", value: "9", detail: "0.6 per match" },
      { label: "Defenders beaten", value: "34", detail: "2.1 per match" },
      { label: "Tackles", value: "162", detail: "88% success" },
    ],
    contribution: [
      { label: "Attack", value: 91 },
      { label: "Carrying", value: 94 },
      { label: "Defence", value: 78 },
      { label: "Set piece", value: 72 },
    ],
    matchLog: [
      { opponent: "Northampton Saints", date: "6 Jun 2026", mins: 78, headline: "14 carries · 1 try" },
      { opponent: "Saracens", date: "30 May 2026", mins: 80, headline: "11 carries · 12 tackles" },
      { opponent: "Bath Rugby", date: "23 May 2026", mins: 72, headline: "9 carries · 38 metres" },
    ],
    clips: [
      { title: "Pick and go score", match: "v Northampton Saints", length: "0:22" },
      { title: "Line break from base", match: "v Bath Rugby", length: "0:29" },
    ],
  },
  {
    id: "danny-care",
    name: "Danny Care",
    initials: "DC",
    teamId: "harlequins",
    position: "Scrum-half",
    age: 39,
    height: "1.75m",
    apps: 15,
    mins: 846,
    stats: [
      { label: "Try assists", value: "18", detail: "Competition 1st" },
      { label: "Box kicks", value: "96", detail: "71% contestable" },
      { label: "Passes", value: "684", detail: "45.6 per match" },
      { label: "Tries", value: "5", detail: "0.3 per match" },
    ],
    contribution: [
      { label: "Attack", value: 84 },
      { label: "Kicking", value: 80 },
      { label: "Tempo", value: 93 },
      { label: "Defence", value: 61 },
    ],
    matchLog: [
      { opponent: "Northampton Saints", date: "6 Jun 2026", mins: 55, headline: "2 try assists" },
      { opponent: "Saracens", date: "30 May 2026", mins: 60, headline: "9 box kicks" },
    ],
    clips: [{ title: "Sniping try off the ruck", match: "v Saracens", length: "0:20" }],
  },
  {
    id: "tyrone-green",
    name: "Tyrone Green",
    initials: "TG",
    teamId: "harlequins",
    position: "Fullback",
    age: 28,
    height: "1.83m",
    apps: 18,
    mins: 1396,
    stats: [
      { label: "Carry metres", value: "1,204", detail: "66.9 per match" },
      { label: "Tries", value: "12", detail: "0.7 per match" },
      { label: "Kick returns", value: "87", detail: "512 metres" },
      { label: "Defenders beaten", value: "48", detail: "2.7 per match" },
    ],
    contribution: [
      { label: "Attack", value: 95 },
      { label: "Counter", value: 90 },
      { label: "Aerial", value: 76 },
      { label: "Defence", value: 71 },
    ],
    matchLog: [
      { opponent: "Northampton Saints", date: "6 Jun 2026", mins: 80, headline: "96 metres · 1 try" },
      { opponent: "Bristol Bears", date: "9 May 2026", mins: 80, headline: "112 metres" },
    ],
    clips: [{ title: "Counter-attack from 22", match: "v Bristol Bears", length: "0:34" }],
  },
  {
    id: "will-evans",
    name: "Will Evans",
    initials: "WE",
    teamId: "harlequins",
    position: "Flanker",
    age: 28,
    height: "1.85m",
    apps: 14,
    mins: 994,
    stats: [
      { label: "Turnovers won", value: "24", detail: "Competition 1st" },
      { label: "Tackles", value: "198", detail: "91% success" },
      { label: "Jackal attempts", value: "61", detail: "39% won" },
      { label: "Carries", value: "88", detail: "196 metres" },
    ],
    contribution: [
      { label: "Breakdown", value: 96 },
      { label: "Defence", value: 89 },
      { label: "Attack", value: 64 },
      { label: "Discipline", value: 70 },
    ],
    matchLog: [
      { opponent: "Saracens", date: "30 May 2026", mins: 80, headline: "3 turnovers · 17 tackles" },
      { opponent: "Sale Sharks", date: "16 May 2026", mins: 72, headline: "2 turnovers" },
    ],
    clips: [{ title: "Match-sealing jackal", match: "v Saracens", length: "0:16" }],
  },
  {
    id: "fin-smith",
    name: "Fin Smith",
    initials: "FS",
    teamId: "northampton-saints",
    position: "Fly-half",
    age: 24,
    height: "1.80m",
    apps: 17,
    mins: 1310,
    stats: [
      { label: "Points", value: "164", detail: "9.6 per match" },
      { label: "Goal success", value: "88%", detail: "52 of 59" },
      { label: "Kicks in play", value: "212", detail: "12.5 per match" },
      { label: "Try assists", value: "11", detail: "0.6 per match" },
    ],
    contribution: [
      { label: "Kicking", value: 94 },
      { label: "Attack", value: 82 },
      { label: "Defence", value: 63 },
      { label: "Discipline", value: 84 },
    ],
    matchLog: [
      { opponent: "Harlequins", date: "6 Jun 2026", mins: 80, headline: "16 pts · 6 of 7 goals" },
      { opponent: "Exeter Chiefs", date: "30 May 2026", mins: 74, headline: "14 pts" },
    ],
    clips: [{ title: "50:22 from halfway", match: "v Harlequins", length: "0:19" }],
  },
  {
    id: "ollie-lawrence",
    name: "Ollie Lawrence",
    initials: "OL",
    teamId: "bath-rugby",
    position: "Centre",
    age: 27,
    height: "1.85m",
    apps: 18,
    mins: 1402,
    stats: [
      { label: "Carry metres", value: "1,512", detail: "84.0 per match" },
      { label: "Tries", value: "11", detail: "0.6 per match" },
      { label: "Defenders beaten", value: "62", detail: "3.4 per match" },
      { label: "Offloads", value: "29", detail: "1.6 per match" },
    ],
    contribution: [
      { label: "Carrying", value: 97 },
      { label: "Attack", value: 90 },
      { label: "Defence", value: 81 },
      { label: "Discipline", value: 76 },
    ],
    matchLog: [
      { opponent: "Sale Sharks", date: "6 Jun 2026", mins: 80, headline: "104 metres · 1 try" },
      { opponent: "Harlequins", date: "23 May 2026", mins: 80, headline: "88 metres" },
    ],
    clips: [{ title: "Midfield break and offload", match: "v Harlequins", length: "0:26" }],
  },
  {
    id: "ben-earl",
    name: "Ben Earl",
    initials: "BE",
    teamId: "saracens",
    position: "Back row",
    age: 28,
    height: "1.85m",
    apps: 18,
    mins: 1428,
    stats: [
      { label: "Tackles", value: "204", detail: "94% success" },
      { label: "Carries", value: "171", detail: "486 metres" },
      { label: "Turnovers won", value: "16", detail: "0.9 per match" },
      { label: "Tries", value: "7", detail: "0.4 per match" },
    ],
    contribution: [
      { label: "Defence", value: 95 },
      { label: "Carrying", value: 88 },
      { label: "Breakdown", value: 82 },
      { label: "Discipline", value: 80 },
    ],
    matchLog: [
      { opponent: "Bristol Bears", date: "7 Jun 2026", mins: 80, headline: "19 tackles · 12 carries" },
      { opponent: "Harlequins", date: "30 May 2026", mins: 80, headline: "16 tackles" },
    ],
    clips: [{ title: "Dominant tackle in the 22", match: "v Bristol Bears", length: "0:15" }],
  },
];

export const referees: Referee[] = [
  {
    id: "karl-dickson",
    name: "Karl Dickson",
    panel: "Elite panel",
    union: "RFU",
    matches: 14,
    stats: [
      { label: "Matches", value: "14", detail: "2025/26 season" },
      { label: "Penalties", value: "21.4", detail: "Average per match" },
      { label: "Yellow cards", value: "0.9", detail: "Average per match" },
      { label: "Red cards", value: "2", detail: "This season" },
    ],
    penaltyBreakdown: [
      { label: "Breakdown", value: 38 },
      { label: "Scrum", value: 22 },
      { label: "Offside", value: 19 },
      { label: "Foul play", value: 11 },
      { label: "Lineout", value: 10 },
    ],
    setPiece: [
      { label: "Scrum reset rate", value: "18%", progress: 18 },
      { label: "Maul penalty rate", value: "9%", progress: 9 },
      { label: "Advantage played", value: "72%", progress: 72 },
    ],
    appointments: [
      { fixture: "Harlequins v Northampton Saints", date: "6 Jun 2026", competition: "Gallagher PREM", penalties: 19, cards: "1 yellow" },
      { fixture: "Bath Rugby v Bristol Bears", date: "16 May 2026", competition: "Gallagher PREM", penalties: 24, cards: "2 yellow" },
      { fixture: "Saracens v Leicester Tigers", date: "2 May 2026", competition: "Gallagher PREM", penalties: 21, cards: "None" },
    ],
  },
  {
    id: "luke-pearce",
    name: "Luke Pearce",
    panel: "Elite panel",
    union: "RFU",
    matches: 12,
    stats: [
      { label: "Matches", value: "12", detail: "2025/26 season" },
      { label: "Penalties", value: "18.9", detail: "Average per match" },
      { label: "Yellow cards", value: "1.2", detail: "Average per match" },
      { label: "Red cards", value: "1", detail: "This season" },
    ],
    penaltyBreakdown: [
      { label: "Breakdown", value: 34 },
      { label: "Offside", value: 24 },
      { label: "Scrum", value: 20 },
      { label: "Foul play", value: 13 },
      { label: "Lineout", value: 9 },
    ],
    setPiece: [
      { label: "Scrum reset rate", value: "14%", progress: 14 },
      { label: "Maul penalty rate", value: "12%", progress: 12 },
      { label: "Advantage played", value: "78%", progress: 78 },
    ],
    appointments: [
      { fixture: "Sale Sharks v Harlequins", date: "16 May 2026", competition: "Gallagher PREM", penalties: 17, cards: "1 yellow" },
      { fixture: "Exeter Chiefs v Saracens", date: "25 Apr 2026", competition: "Gallagher PREM", penalties: 20, cards: "None" },
    ],
  },
  {
    id: "christophe-ridley",
    name: "Christophe Ridley",
    panel: "Elite panel",
    union: "RFU",
    matches: 11,
    stats: [
      { label: "Matches", value: "11", detail: "2025/26 season" },
      { label: "Penalties", value: "20.2", detail: "Average per match" },
      { label: "Yellow cards", value: "1.0", detail: "Average per match" },
      { label: "Red cards", value: "0", detail: "This season" },
    ],
    penaltyBreakdown: [
      { label: "Breakdown", value: 31 },
      { label: "Scrum", value: 26 },
      { label: "Offside", value: 21 },
      { label: "Lineout", value: 12 },
      { label: "Foul play", value: 10 },
    ],
    setPiece: [
      { label: "Scrum reset rate", value: "21%", progress: 21 },
      { label: "Maul penalty rate", value: "8%", progress: 8 },
      { label: "Advantage played", value: "69%", progress: 69 },
    ],
    appointments: [
      { fixture: "Bristol Bears v Saracens", date: "7 Jun 2026", competition: "Gallagher PREM", penalties: 22, cards: "1 yellow" },
      { fixture: "Harlequins v Bath Rugby", date: "23 May 2026", competition: "Gallagher PREM", penalties: 18, cards: "None" },
    ],
  },
];

export const getCompetition = (id: string) => competitions.find((item) => item.id === id);
export const getTeam = (id: string) => teams.find((item) => item.id === id);
export const getPlayer = (id: string) => players.find((item) => item.id === id);
export const getReferee = (id: string) => referees.find((item) => item.id === id);

export type NextFixture = {
  competition: Competition;
  fixture: Competition["fixtures"][number];
  home: Team | undefined;
  away: Team | undefined;
  opponent: Team | undefined;
};

export function getNextFixture(teamId: string): NextFixture | undefined {
  const team = getTeam(teamId);
  if (!team) return undefined;
  for (const competition of competitions) {
    const fixture = competition.fixtures.find((item) => item.result === "Upcoming" && item.fixture.split(" v ").includes(team.name));
    if (!fixture) continue;
    const [homeName, awayName] = fixture.fixture.split(" v ");
    const home = teams.find((item) => item.name === homeName);
    const away = teams.find((item) => item.name === awayName);
    return { competition, fixture, home, away, opponent: home?.id === team.id ? away : home };
  }
  return undefined;
}

export type SearchEntity = {
  id: string;
  kind: EntityKind;
  name: string;
  detail: string;
  meta: string;
};

export const searchEntities: SearchEntity[] = [
  ...competitions.map((competition) => ({
    id: competition.id,
    kind: "competition" as const,
    name: competition.name,
    detail: `${competition.season} · ${competition.stage}`,
    meta: `${competition.standings.length} teams · ${competition.matches} matches`,
  })),
  ...teams.map((team) => ({
    id: team.id,
    kind: "team" as const,
    name: team.name,
    detail: `${getCompetition(team.competitionId)?.name ?? "Competition"} · ${team.position}`,
    meta: team.record,
  })),
  ...players.map((player) => ({
    id: player.id,
    kind: "player" as const,
    name: player.name,
    detail: `${getTeam(player.teamId)?.name ?? "Club"} · ${player.position}`,
    meta: `${player.stats[0]?.value ?? ""} ${player.stats[0]?.label.toLowerCase() ?? ""}`.trim(),
  })),
  ...referees.map((referee) => ({
    id: referee.id,
    kind: "referee" as const,
    name: referee.name,
    detail: `${referee.union} · ${referee.panel}`,
    meta: `${referee.matches} matches · ${referee.stats[1]?.value ?? ""} pens/g`,
  })),
];
