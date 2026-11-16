import { devices, expect, test } from "@playwright/test";

import { CORE_ROUTES } from "./routes";

const { defaultBrowserType: _ignored, ...iPhone } = devices["iPhone 13"];
test.use(iPhone);

for (const path of CORE_ROUTES) {
  test(`no horizontal page scroll at phone width on ${path}`, async ({ page }) => {
    await page.goto(path);
    // Try to scroll sideways: wide tables scroll inside their own panel, the page must not move.
    const scrollX = await page.evaluate(() => {
      window.scrollTo(500, 0);
      return window.scrollX;
    });
    expect(scrollX).toBe(0);
  });
}
