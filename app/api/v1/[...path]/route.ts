import { createHash } from "node:crypto";

import { NextResponse } from "next/server";

import { isMiss, reshaperFor } from "@/server/contract/reshape";
import { listHubRoutes, resolveHubRoute } from "@/server/upstream/catalog";
import {
  UpstreamConfigError,
  callUpstream,
  type UpstreamCallResult,
} from "@/server/upstream/client.server";

export const dynamic = "force-dynamic";

const PASSTHROUGH =
  "Payloads are the Oval Hub v2 upstream responses. They are not reshaped to the schemas in docs/openapi.yaml.";

type ErrorCode =
  | "unauthenticated"
  | "forbidden"
  | "not_found"
  | "validation_failed"
  | "conflict"
  | "rate_limited"
  | "upstream_unavailable"
  | "internal";

function json(body: unknown, status: number) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}

/** Error body in the docs/openapi.yaml ApiError shape: { error: { code, message, details? } }. */
function apiError(
  status: number,
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>,
) {
  return json(
    { error: details === undefined ? { code, message } : { code, message, details } },
    status,
  );
}

/** Maps a failed upstream call onto an ApiError, without passing the upstream body to the browser. */
function upstreamFailure(failed: UpstreamCallResult) {
  const details = { upstreamStatus: failed.status, source: failed.source };
  if (failed.status === 401)
    return apiError(401, "unauthenticated", "No or expired session.", details);
  if (failed.status === 403)
    return apiError(403, "forbidden", "Not allowed to read this.", details);
  if (failed.status === 404)
    return apiError(404, "not_found", "Upstream has no record for this request.", details);
  if (failed.status === 429)
    return apiError(429, "rate_limited", "Upstream rate limit reached.", details);
  return apiError(502, "upstream_unavailable", "Upstream request failed.", details);
}

/**
 * Routes whose response is a file. matches/:matchId/live-xml is the contract endpoint
 * (docs/openapi.yaml: application/xml, ETag, 304, no-store); download/:kind serves the v2 event
 * files. Add ?download=1 to save the body as a file.
 */
const FILE_ROUTES = new Set(["matches/:matchId/live-xml", "matches/:matchId/download/:kind"]);

const FILE_TYPES: Record<string, { type: string; ext: string }> = {
  xml: { type: "application/xml; charset=utf-8", ext: "xml" },
  csv: { type: "text/csv; charset=utf-8", ext: "csv" },
  superscout: { type: "application/xml; charset=utf-8", ext: "xml" },
  events: { type: "application/json; charset=utf-8", ext: "json" },
};

function fileResponse(
  request: Request,
  call: UpstreamCallResult | undefined,
  params: Record<string, string>,
  segments: string[],
  query: URLSearchParams,
) {
  const kind = segments.at(-1) === "live-xml" ? "live-xml" : (params["kind"] ?? "xml");
  const format = kind === "live-xml" ? FILE_TYPES["xml"] : (FILE_TYPES[kind] ?? FILE_TYPES["xml"]);
  const data = call?.data;
  const body = typeof data === "string" ? data : JSON.stringify(data ?? null, null, 2);
  const etag = `"${createHash("sha256").update(body).digest("base64url").slice(0, 27)}"`;
  const headers: Record<string, string> = {
    "Content-Type": format?.type ?? "application/octet-stream",
    "Cache-Control": "no-store",
    ETag: etag,
  };
  if (query.get("download") === "1") {
    const name =
      kind === "live-xml"
        ? `${params["matchId"]}-live.xml`
        : `${params["matchId"]}-events.${format?.ext ?? "dat"}`;
    headers["Content-Disposition"] = `attachment; filename="${name}"`;
  }
  if (request.headers.get("if-none-match") === etag)
    return new Response(null, { status: 304, headers });
  return new Response(body, { status: 200, headers });
}

export async function GET(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const segments = path.map((segment) => {
    try {
      return decodeURIComponent(segment);
    } catch {
      return segment;
    }
  });

  if (segments.length === 1 && segments[0] === "routing") {
    return json(listHubRoutes(), 200);
  }

  const query = new URL(request.url).searchParams;
  const resolved = resolveHubRoute("GET", segments, query);
  if (!resolved) return apiError(404, "not_found", "No Hub route for this path.");
  if (resolved.kind === "invalid") return apiError(422, "validation_failed", resolved.message);
  if (resolved.kind === "gap") {
    // 501: the spec has the endpoint, but v2 has nothing to read it from.
    return apiError(501, "upstream_unavailable", resolved.message, {
      reason: "no_v2_source",
      hub: resolved.hub,
    });
  }

  const authorization =
    request.headers.get("authorization") ?? process.env.OVAL_UPSTREAM_AUTHORIZATION ?? null;
  let calls: UpstreamCallResult[];
  try {
    calls = await Promise.all(resolved.calls.map((item) => callUpstream(item, authorization)));
  } catch (error) {
    if (error instanceof UpstreamConfigError)
      return apiError(503, "upstream_unavailable", error.message);
    console.error("Upstream routing failed", error);
    return apiError(502, "upstream_unavailable", "Upstream request failed.");
  }
  const failed = calls.find((item) => item.status < 200 || item.status >= 300);

  // File endpoints: the upstream body is the response (XML/CSV), not a JSON envelope.
  if (FILE_ROUTES.has(resolved.pattern)) {
    if (failed) return upstreamFailure(failed);
    return fileResponse(request, calls[0], resolved.params, segments, query);
  }

  const reshape = reshaperFor(resolved.pattern);
  if (reshape) {
    if (failed) return upstreamFailure(failed);
    try {
      const body = reshape(calls, { params: resolved.params, query });
      if (isMiss(body)) return apiError(404, "not_found", body.message);
      return json(body, 200);
    } catch (error) {
      console.error(`Reshape failed for ${resolved.hub}`, error);
      return apiError(500, "internal", "Could not read the upstream response.", {
        hub: resolved.hub,
      });
    }
  }

  const status = !failed ? 200 : failed.status > 0 ? failed.status : 502;
  return json(
    {
      hub: resolved.hub,
      spec: resolved.spec,
      contract: "upstream-passthrough",
      // Saved as-is, this body is a fixture for npm run check:contract (fixtures/upstream/README.md).
      request: { params: resolved.params, query: Object.fromEntries(query) },
      note: resolved.note ? `${resolved.note} ${PASSTHROUGH}` : PASSTHROUGH,
      calls,
    },
    status,
  );
}
