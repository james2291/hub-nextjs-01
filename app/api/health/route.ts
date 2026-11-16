// GET /api/health — liveness for load balancers and uptime checks. Reports which upstreams are
// configured (true/false only, never values) so a deploy with missing settings is easy to spot.
// Does not call the upstreams: a slow RugbyViz must not take the app out of rotation.
import { NextResponse } from "next/server";

import { isDemo, serverEnv } from "@/server/env";

export const dynamic = "force-dynamic";

export function GET() {
  const env = serverEnv();
  return NextResponse.json(
    {
      status: "ok",
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
