// "Check values" from design/oval-hub-handoff/HANDOFF.md section 5, plus the derived figures it
// asks to be tested (club colour, record, points per match, ranks).
import { describe, expect, it } from "vitest";

import {
  furthestStage,
  getClub,
  getFixtures,
  getMatch,
  getNextFixture,
  getReferee,
  getStandings,
  homeVenueOf,
  standingOf,
} from "@/server/feeds";
import {
  perMatch,
  rankOf,
  recordFor,
  recordLabel,
  resultFor,
  scoreLine,
  signed,
  textOn,
  ukDate,
  ukTime,
} from "@/lib/rugby";

describe("Harlequins in the Gallagher PREM standings", () => {
  const row = standingOf("harlequins");
  it("9th, 31 pts, 6W 0D 12L", () => {
    expect(row?.position).toBe(9);
    expect(row?.points).toBe(31);
    expect(row && recordLabel(row)).toBe("6W 0D 12L");
  });
  it("PF 448, PA 589, PD −141", () => {
    expect(row?.pointsFor).toBe(448);
    expect(row?.pointsAgainst).toBe(589);
    expect(row && signed(row.pointsDiff)).toBe("−141");
  });
  it("tries 64 for, 90 against, bonus 7", () => {
    expect(row?.triesFor).toBe(64);
    expect(row?.triesAgainst).toBe(90);
    expect(row?.bonus).toBe(7);
  });
  it("last five newest on the right", () => {
    expect(row?.last5).toEqual(["L", "W", "W", "L", "W"]);
  });
});

describe("Harlequins in the Champions Cup", () => {
  const games = getFixtures({ club: "harlequins", competition: "champions-cup" });
  it("3W 2L", () => {
    expect(recordLabel(recordFor(games, "harlequins"))).toBe("3W 0D 2L");
  });
  it("lost 17–26 to Sale in the round of 16", () => {
    const r16 = games.find((fixture) => fixture.round === "Round of 16");
    expect(r16?.home.club.name).toBe("Harlequins");
    expect(r16?.away.club.name).toBe("Sale Sharks");
    expect(r16 && scoreLine(r16)).toBe("17–26");
    expect(r16 && resultFor(r16, "harlequins")).toBe("L");
    expect(furthestStage("harlequins", "champions-cup")).toBe("Round of 16");
  });
});

describe("PREM play-offs", () => {
  const prem = getFixtures({ competition: "gallagher-prem" });
  it("final: Northampton 26–17 Exeter, Allianz Stadium, 20 Jun 2026", () => {
    const final = prem.find((fixture) => fixture.round === "Final");
    expect(final?.home.club.name).toBe("Northampton Saints");
    expect(final?.away.club.name).toBe("Exeter Chiefs");
    expect(final && scoreLine(final)).toBe("26–17");
    expect(final?.venue).toBe("Allianz Stadium");
    expect(final && ukDate(final.dateTime)).toBe("Sat 20 Jun 2026");
  });
  it("semi-finals: Northampton 45–31 Leicester; Bath 26–27 Exeter", () => {
    const semis = prem
      .filter((fixture) => fixture.round === "Semi-final")
      .map(
        (fixture) =>
          `${fixture.home.club.shortName} ${scoreLine(fixture)} ${fixture.away.club.shortName}`,
      );
    expect(semis.sort()).toEqual(["Bath 26–27 Chiefs", "Saints 45–31 Tigers"]);
  });
});

describe("Christophe Ridley", () => {
  it("14 matches: PREM 10, Champions Cup 3, Challenge Cup 1", () => {
    const ref = getReferee("christophe-ridley");
    expect(ref?.matches).toBe(14);
    expect(ref?.byCompetition.map((entry) => `${entry.competition.name} ${entry.matches}`)).toEqual(
      ["Gallagher PREM 10", "Champions Cup 3", "Challenge Cup 1"],
    );
  });
});

describe("now = Sat 16 May 2026, 14:30 UK", () => {
  const now = new Date("2026-05-16T14:30:00+01:00");
  it("next match Harlequins v Exeter Chiefs, Round 16, 16:00, Allianz Stadium, referee Matthew Carley", () => {
    const next = getNextFixture("harlequins", now);
    expect(next?.home.club.name).toBe("Harlequins");
    expect(next?.away.club.name).toBe("Exeter Chiefs");
    expect(next?.round).toBe("Round 16");
    expect(next && ukTime(next.dateTime)).toBe("16:00");
    expect(next?.venue).toBe("Allianz Stadium");
    expect(next?.referee?.name).toBe("Matthew Carley");
  });
});

describe("derived figures", () => {
  it("club colour is the most common home kit colour; crest codes", () => {
    const quins = getClub("harlequins");
    expect(quins?.code).toBe("HQ");
    expect(getClub("northampton-saints")?.code).toBe("NTN");
    expect(quins?.colour).toMatch(/^#[0-9A-F]{6}$/);
    for (const fixture of getFixtures({ club: "harlequins" })) {
      if (fixture.home.club.slug === "harlequins")
        expect(fixture.home.club.colour).toBe(quins?.colour);
    }
  });
  it("text reads on the club colour", () => {
    expect(textOn("#FFFFFF")).toBe("#18181B");
    expect(textOn("#1A237E")).toBe("#FFFFFF");
  });
  it("home venue", () => {
    expect(homeVenueOf("harlequins")).toBe("Twickenham Stoop");
  });
  it("whole-season record across the three feeds: 23 matches, 9 won, 0 drawn, 14 lost", () => {
    const record = recordFor(getFixtures({ club: "harlequins" }), "harlequins");
    expect(record.played).toBe(23);
    expect(recordLabel(record)).toBe("9W 0D 14L");
  });
  it("points per match", () => {
    const rows = getStandings("gallagher-prem")?.rows ?? [];
    expect(rows).toHaveLength(10);
    const quins = rows.find((row) => row.club.slug === "harlequins");
    expect(quins && perMatch(quins.pointsFor, quins.played)).toBe(24.9);
  });
  it("ranks share ties and support ascending measures", () => {
    const rows = getStandings("gallagher-prem")?.rows ?? [];
    const quins = rows.find((row) => row.club.slug === "harlequins");
    if (!quins) throw new Error("Harlequins missing");
    expect(
      rankOf(
        quins.points,
        rows.map((row) => row.points),
      ),
    ).toBe(9);
    expect(
      rankOf(
        quins.pointsAgainst,
        rows.map((row) => row.pointsAgainst),
        true,
      ),
    ).toBeGreaterThan(0);
    expect(rankOf(5, [5, 5, 3])).toBe(1);
  });
  it("missing score: Cheetahs v Ulster, 11 Jan, Challenge Cup", () => {
    const game = getMatch(288450);
    expect(game?.competition.name).toBe("Challenge Cup");
    expect(game?.scored).toBe(false);
    expect(game && scoreLine(game)).toBeNull();
  });
});
