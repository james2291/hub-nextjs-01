import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { CORE_ROUTES } from "./routes";

for (const path of CORE_ROUTES) {
  test(`no WCAG 2 A/AA violations on ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const summary = results.violations.map(
      (violation) => `${violation.id}: ${violation.nodes.length} node(s)`,
    );
    expect(summary).toEqual([]);
  });
}
