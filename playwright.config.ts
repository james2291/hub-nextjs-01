import { defineConfig, devices } from "@playwright/test";

// End-to-end checks against a production build. Run `npm run build` first; CI does.
// HUB_NOW pins the hub clock so "played" / "next opponent" are stable between runs.
const PORT = Number(process.env["E2E_PORT"] ?? 3100);
const baseURL = process.env["E2E_BASE_URL"] ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env["CI"]),
  retries: process.env["CI"] ? 1 : 0,
  reporter: process.env["CI"] ? [["github"], ["html", { open: "never" }]] : "list",
  use: { baseURL, trace: "off" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  ...(process.env["E2E_BASE_URL"]
    ? {}
    : {
        webServer: {
          command: `npx next start -p ${PORT}`,
          url: `${baseURL}/api/health`,
          reuseExistingServer: !process.env["CI"],
          timeout: 60_000,
          env: {
            HUB_NOW: "2026-05-16T14:30:00+01:00",
            HUB_COOKIE_SECRET: "e2e-only-secret-not-for-production-use",
          },
        },
      }),
});
