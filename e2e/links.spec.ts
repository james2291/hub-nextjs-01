import { expect, test } from "@playwright/test";

import { KEY_ROUTES } from "./routes";

// Every internal link on the key pages resolves (redirects followed). API links may be 503 (or 429 from the Live XML rate limit)
// when the upstream is not configured, which is the expected state in CI.
test("internal links resolve", async ({ page, request }) => {
  test.setTimeout(180_000);
  const links = new Set<string>();
  for (const path of KEY_ROUTES) {
    await page.goto(path);
    // /next-opponent redirects on the client; wait for the final page.
    await page.waitForLoadState("networkidle");
    const hrefs = await page.$$eval("a[href^='/']", (anchors) =>
      anchors.map((anchor) => anchor.getAttribute("href") ?? ""),
    );
    for (const href of hrefs) links.add(href.split("#")[0] ?? href);
  }
  const broken: Array<[string, number]> = [];
  for (const href of links) {
    const response = await request.get(href, { maxRedirects: 5 });
    const ok = href.startsWith("/api/")
      ? [200, 429, 503].includes(response.status())
      : response.ok();
    if (!ok) broken.push([href, response.status()]);
  }
  expect(broken).toEqual([]);
});
