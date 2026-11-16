import { expect, test } from "@playwright/test";

test("health endpoint reports ok", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.status()).toBe(200);
  expect(await response.json()).toMatchObject({ status: "ok" });
});

test("user pins: list, add, remove", async ({ request }) => {
  const list = await request.get("/api/v1/user/pins");
  expect(list.status()).toBe(200);
  const before = (await list.json()) as { items: Array<{ id: string; path: string }> };
  expect(before.items.length).toBeGreaterThan(0);

  const added = await request.post("/api/v1/user/pins", {
    data: { path: "/referees/e2e-test-pin", label: "E2E pin" },
  });
  expect([200, 201]).toContain(added.status());
  const pin = (await added.json()) as { id: string; path: string };
  expect(pin.path).toBe("/referees/e2e-test-pin");

  const removed = await request.delete(`/api/v1/user/pins/${pin.id}`);
  expect([200, 204]).toContain(removed.status());
  const after = (await (await request.get("/api/v1/user/pins")).json()) as typeof before;
  expect(after.items.some((item) => item.id === pin.id)).toBe(false);
});

test("pins reject a non-app path", async ({ request }) => {
  const response = await request.post("/api/v1/user/pins", {
    data: { path: "https://example.com", label: "Elsewhere" },
  });
  expect(response.status()).toBe(422);
});

test("live XML without an upstream is a 503 problem, not a crash", async ({ request }) => {
  const response = await request.get("/api/v1/matches/289001/live-xml");
  expect([200, 429, 503]).toContain(response.status());
  if (response.status() === 503) {
    expect(await response.json()).toMatchObject({ error: expect.anything() });
  }
});

test("security headers are set", async ({ request }) => {
  const response = await request.get("/");
  const headers = response.headers();
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(headers["x-powered-by"]).toBeUndefined();
});

test("legacy tab slugs redirect with 307", async ({ request }) => {
  const response = await request.get("/matches/289001/lineups", { maxRedirects: 0 });
  expect(response.status()).toBe(307);
  expect(response.headers()["location"]).toMatch(/\/matches\/289001$/);
});

test("live XML is rate limited per client and match", async ({ request }) => {
  const url = "/api/v1/matches/289002/live-xml";
  const headers = { "x-forwarded-for": "203.0.113.7" };
  await request.get(url, { headers });
  const second = await request.get(url, { headers });
  expect(second.status()).toBe(429);
  expect(second.headers()["retry-after"]).toBeDefined();
});
