// Runs before every page and API request (Next 16 renamed middleware to proxy; see
// node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md).
//
// 1. Legacy tab URLs → 307 to the current tab (src/lib/legacy-routes.ts).
// 2. Live XML rate limit: one request per 5 s per client and match.
// 3. Sign-in hook: AUTH_MODE=cognito is where the session check goes (not built yet).
//
// Keep this file light: no feeds data, no React. Data-dependent redirects (e.g. /next-opponent,
// which depends on the hub clock) stay in their route files.
import { NextResponse, type NextRequest } from "next/server";

import { legacyRedirect } from "@/lib/legacy-routes";

// ---- Live XML rate limit ------------------------------------------------------------------------
// TEMPORARY HOLD: an in-memory window, so the limit is per server instance and resets on deploy.
// With more than one instance, move this to a shared store (Redis / Upstash / API Gateway usage
// plans) keyed the same way.
const LIVE_XML = /^\/api\/v1\/matches\/([^/]+)\/live-xml$/;
const WINDOW_MS = 5_000;
const MAX_KEYS = 10_000;
const lastSeen = new Map<string, number>();

function clientKey(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
}

function rateLimited(key: string, now: number): number | null {
  const previous = lastSeen.get(key);
  if (previous !== undefined && now - previous < WINDOW_MS) {
    return Math.ceil((WINDOW_MS - (now - previous)) / 1000);
  }
  if (lastSeen.size >= MAX_KEYS) {
    for (const [stale, at] of lastSeen) if (now - at >= WINDOW_MS) lastSeen.delete(stale);
    if (lastSeen.size >= MAX_KEYS) lastSeen.clear();
  }
  lastSeen.set(key, now);
  return null;
}

// ---- Sign-in -----------------------------------------------------------------------------------
// TEMPORARY HOLD: there is no sign-in yet (AUTH_MODE=none). For Cognito, verify the session
// cookie's id token here (JWKS from the user pool; `jose` works in proxy), redirect pages to the
// hosted UI when it is missing or expired, answer /api/v1/* with 401, and forward the token to
// route handlers as the Authorization header. See docs/production-review.md "Sign-in".
function requireSession(_request: NextRequest): NextResponse | null {
  return null;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const legacy = legacyRedirect(pathname);
  if (legacy) {
    const url = request.nextUrl.clone();
    url.pathname = legacy;
    return NextResponse.redirect(url, 307);
  }

  if (process.env["AUTH_MODE"] === "cognito" && pathname !== "/api/health") {
    const denied = requireSession(request);
    if (denied) return denied;
  }

  const liveXml = LIVE_XML.exec(pathname);
  if (liveXml && request.method === "GET") {
    const retryAfter = rateLimited(`${clientKey(request)}:${liveXml[1]}`, Date.now());
    if (retryAfter !== null) {
      return NextResponse.json(
        { error: { code: "rate_limited", message: "Live XML can be refreshed every 5 seconds." } },
        {
          status: 429,
          headers: { "retry-after": String(retryAfter), "cache-control": "no-store" },
        },
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  // Everything except Next's static assets, image optimisation and files with an extension.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.[a-zA-Z0-9]+$).*)"],
};
