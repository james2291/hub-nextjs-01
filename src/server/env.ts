// Server environment, parsed once with zod. Import `serverEnv()` instead of reading process.env.
// It never throws: a bad or missing setting switches off the feature that needs it and is listed
// by configProblems() (logged at start-up, reported by /api/health). Throwing here would also take
// down proxy.ts on Vercel (500 MIDDLEWARE_INVOCATION_FAILED) and with it every page.
// Every variable is documented in .env.example and typed in src/env.d.ts.
import { z } from "zod";

const optional = z
  .string()
  .optional()
  .transform((value) => (value ? value : undefined));

const Schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).catch("development"),
  // Hub
  HUB_NOW: optional,
  HUB_COOKIE_SECRET: optional,
  HUB_DEMO: z.enum(["0", "1"]).optional().catch(undefined),
  AUTH_MODE: z.enum(["none", "cognito"]).catch("none"),
  // Upstreams
  INSIGHTS_API_URL: optional,
  INSIGHTS_API_KEY: optional,
  OVAL_API_GATEWAY_URL: optional,
  OVAL_PROXY_URL: optional,
  RUGBYVIZ_API_URL: optional,
  RUGBYVIZ_BASIC_USER: optional,
  RUGBYVIZ_BASIC_PASSWORD: optional,
  OVAL_UPSTREAM_AUTHORIZATION: optional,
  ALLOW_SHARED_UPSTREAM_TOKEN: z.enum(["0", "1"]).optional().catch(undefined),
  XEATRE_API_URL: optional,
  XEATRE_API_USER: optional,
  XEATRE_API_PASSWORD: optional,
  XEATRE_API_KEY: optional,
});

export type ServerEnv = z.infer<typeof Schema>;

let cached: ServerEnv | undefined;

/** Parsed server env. Unrecognised values fall back to their defaults. */
export function serverEnv(): ServerEnv {
  cached ??= Schema.parse(process.env);
  return cached;
}

/** The pins cookie key, or null in production when it is missing or too short (pins read-only). */
export function cookieSecret(): string | null {
  const env = serverEnv();
  if (env.HUB_COOKIE_SECRET && env.HUB_COOKIE_SECRET.length >= 32) return env.HUB_COOKIE_SECRET;
  if (env.NODE_ENV === "production") return null;
  return env.HUB_COOKIE_SECRET ?? "oval-hub-development-key";
}

/** Settings a production deploy should fix. Names only, never values. */
export function configProblems(): string[] {
  const problems: string[] = [];
  if (serverEnv().NODE_ENV === "production" && cookieSecret() === null) {
    problems.push(
      "HUB_COOKIE_SECRET is missing or shorter than 32 characters: pins can't be saved.",
    );
  }
  return problems;
}

/** Demo mode: the bundled 2025/26 feeds and seeded data are shown and labelled as such. */
export function isDemo(): boolean {
  return serverEnv().HUB_DEMO !== "0";
}

/**
 * Whether OVAL_UPSTREAM_AUTHORIZATION may stand in for a missing Authorization header. A shared
 * token means every visitor reads upstream as the same user, so it is for local development only,
 * or an explicit ALLOW_SHARED_UPSTREAM_TOKEN=1 on a private preview.
 */
export function sharedUpstreamToken(): string | undefined {
  const env = serverEnv();
  if (env.NODE_ENV === "production" && env.ALLOW_SHARED_UPSTREAM_TOKEN !== "1") return undefined;
  return env.OVAL_UPSTREAM_AUTHORIZATION;
}
