import { describe, expect, it } from "vitest";

import { legacyRedirect } from "@/lib/legacy-routes";

describe("legacyRedirect", () => {
  it("maps legacy entity tabs", () => {
    expect(legacyRedirect("/teams/harlequins/players")).toBe("/teams/harlequins/squad");
    expect(legacyRedirect("/competitions/gallagher-prem/live-xml")).toBe(
      "/competitions/gallagher-prem/feeds",
    );
    expect(legacyRedirect("/referees/christophe-ridley/match-room")).toBe(
      "/referees/christophe-ridley",
    );
  });

  it("maps legacy match tabs", () => {
    expect(legacyRedirect("/matches/289001/lineups")).toBe("/matches/289001");
    expect(legacyRedirect("/matches/289001/player-data")).toBe("/matches/289001/match-centre");
  });

  it("leaves current and unknown URLs alone", () => {
    expect(legacyRedirect("/teams/harlequins/squad")).toBeNull();
    expect(legacyRedirect("/teams/harlequins")).toBeNull();
    expect(legacyRedirect("/teams/harlequins/players/extra")).toBeNull();
    expect(legacyRedirect("/opposition/bath/players")).toBeNull();
    expect(legacyRedirect("/teams/harlequins/constructor")).toBeNull();
  });
});
