// Server environment, validated once with zod. Import `serverEnv()` instead of reading
// process.env directly so a missing production secret fails at start-up, not on first use.
// Every variable is documented in .env.example and typed in src/env.d.ts.
import { z } from "zod";

const optional = z
  .string()
  .optional()
  .transform((value) => (value ? value : undefined));

const Schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  // Hub
  HUB_NOW: optional,
  HUB_COOKIE_SECRET: optional,
  HUB_DEMO: z.enum(["0", "1"]).optional(),
  AUTH_MODE: z.enum(["none", "cognito"]).default("none"),
  // Upstreams
  INSIGHTS_API_URL: optional,
  INSIGHTS_API_KEY: optional,
  OVAL_API_GATEWAY_URL: optional,
  OVAL_PROXY_URL: optional,
  RUGBYVIZ_API_URL: optional,
  RUGBYVIZ_BASIC_USER: optional,
  RUGBYVIZ_BASIC_PASSWORD: optional,
  OVAL_UPSTREAM_AUTHORIZATION: optional,
  ALLOW_SHARED_UPSTREAM_TOKEN: z.enum(["0", "1"]).optional(),
  XEATRE_API_URL: optional,
  XEATRE_API_USER: optional,
  XEATRE_API_PASSWORD: optional,
  XEATRE_API_KEY: optional,
});

export type ServerEnv = z.infer<typeof Schema>;

let cached: ServerEnv | undefined;

/** Parsed server env. Throws in production when a required secret is missing. */
export function serverEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = Schema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      `Invalid environment: ${JSON.stringify(z.flattenError(parsed.error).fieldErrors)}`,
    );
  }
  const env = parsed.data;
  // `next build` runs with NODE_ENV=production but has no runtime secrets; only enforce at runtime.
  const building = process.env["NEXT_PHASE"] === "phase-production-build";
  if (env.NODE_ENV === "production" && !building) {
    const missing: string[] = [];
    if (!env.HUB_COOKIE_SECRET || env.HUB_COOKIE_SECRET.length < 32) {
      missing.push("HUB_COOKIE_SECRET (at least 32 characters)");
    }
    if (missing.length > 0) {
      throw new Error(`Missing production environment: ${missing.join(", ")}`);
    }
  }
  cached = env;
  return env;
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
