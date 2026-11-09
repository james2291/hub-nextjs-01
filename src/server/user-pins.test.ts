import { describe, expect, it } from "vitest";

import { decodePins, encodePins, isHubPath, makePins } from "@/server/user-pins";

describe("User Pinned cookie store", () => {
  const state = {
    pins: makePins([{ path: "/teams/harlequins", label: "Harlequins" }]),
    homePath: "/teams/harlequins",
  };

  it("round-trips a signed state", () => {
    expect(decodePins(encodePins(state))).toEqual(state);
  });
  it("rejects a tampered payload or signature", () => {
    const [payload, signature] = encodePins(state).split(".");
    const forged = Buffer.from(JSON.stringify({ pins: [], homePath: "/x" })).toString("base64url");
    expect(decodePins(`${forged}.${signature}`)).toBeNull();
    expect(decodePins(`${payload}.nope`)).toBeNull();
    expect(decodePins(undefined)).toBeNull();
  });
  it("gives pins stable ids and orders", () => {
    const pins = makePins([
      { path: "/a", label: "A" },
      { path: "/b", label: "B" },
    ]);
    expect(pins.map((pin) => pin.order)).toEqual([0, 1]);
    expect(makePins([{ path: "/a", label: "A" }])[0]?.id).toBe(pins[0]?.id);
  });
  it("only accepts Hub page paths", () => {
    expect(isHubPath("/teams/harlequins/fixtures")).toBe(true);
    expect(isHubPath("//evil.example")).toBe(false);
    expect(isHubPath("https://evil.example")).toBe(false);
    expect(isHubPath("/api/v1/user/pins")).toBe(false);
  });
});
