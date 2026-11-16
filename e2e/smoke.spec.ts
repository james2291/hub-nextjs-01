import { expect, test } from "@playwright/test";

import { KEY_ROUTES } from "./routes";

for (const path of KEY_ROUTES) {
  test(`renders ${path} without errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(String(error)));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.locator("main")).toBeVisible();
    await expect(page.getByRole("heading").first()).toBeVisible();
    expect(errors).toEqual([]);
  });
}

// Pages stream behind loading.tsx, so an unknown id answers 200 and renders the not-found page
// (Next sets <meta name="robots" content="noindex">). Check what the user sees.
test("unknown entity shows the not-found page", async ({ page }) => {
  await page.goto("/teams/not-a-club");
  await expect(page.getByRole("heading", { name: /not found/i })).toBeVisible();
});
