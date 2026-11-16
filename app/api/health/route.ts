// GET /api/health — liveness for load balancers and uptime checks. Reports which upstreams are
// configured (true/false only, never values) so a deploy with missing settings is easy to spot.
// Does not call the upstreams: a slow RugbyViz must not take the app out of rotation.
import { NextResponse } from "next/server";

import { configProblems, isDemo, serverEnv } from "@/server/env";

export const dynamic = "force-dynamic";

export function GET() {
  const env = serverEnv();
  const problems = configProblems();
  // Still 200 when settings are missing: the pages work, so the instance should stay in rotation.
  return NextResponse.json(
    {
      status: problems.length ? "degraded" : "ok",
      problems,
      version: process.env["VERCEL_GIT_COMMIT_SHA"]?.slice(0, 7) ?? "local",
      demo: isDemo(),
      auth: env.AUTH_MODE,
      upstreams: {
        gateway: Boolean(env.OVAL_API_GATEWAY_URL),
        rugbyviz: Boolean(env.RUGBYVIZ_API_URL),
        xeatre: Boolean(env.XEATRE_API_USER && env.XEATRE_API_PASSWORD && env.XEATRE_API_KEY),
        insights: Boolean(env.INSIGHTS_API_URL),
      },
    },
    { headers: { "cache-control": "no-store" } },
  );
}
