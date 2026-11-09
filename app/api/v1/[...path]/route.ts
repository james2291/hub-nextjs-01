import { NextResponse } from "next/server";

import { listHubRoutes, resolveHubRoute } from "@/server/upstream/catalog";
import { UpstreamConfigError, callUpstream } from "@/server/upstream/client.server";

export const dynamic = "force-dynamic";

const PASSTHROUGH =
  "Payloads are the Oval Hub v2 upstream responses. They are not reshaped to the schemas in docs/openapi.yaml.";

function json(body: unknown, status: number) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
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

  const resolved = resolveHubRoute("GET", segments, new URL(request.url).searchParams);
  if (!resolved) return json({ error: { code: "not_found", message: "No Hub route for this path." } }, 404);
  if (resolved.kind === "invalid") return json({ error: { code: "validation_failed", message: resolved.message } }, 422);
  if (resolved.kind === "gap") return json({ error: { code: "not_implemented", message: resolved.message }, hub: resolved.hub }, 501);

  const authorization = request.headers.get("authorization") ?? process.env.OVAL_UPSTREAM_AUTHORIZATION ?? null;
  try {
    const calls = await Promise.all(resolved.calls.map((item) => callUpstream(item, authorization)));
    const ok = calls.every((item) => item.status >= 200 && item.status < 300);
    const failed = calls.find((item) => item.status < 200 || item.status >= 300);
    const status = ok ? 200 : failed && failed.status > 0 ? failed.status : 502;
    return json(
      {
        hub: resolved.hub,
        spec: resolved.spec,
        contract: "upstream-passthrough",
        note: resolved.note ? `${resolved.note} ${PASSTHROUGH}` : PASSTHROUGH,
        calls,
      },
      status,
    );
  } catch (error) {
    if (error instanceof UpstreamConfigError) {
      return json({ error: { code: "upstream_unavailable", message: error.message } }, 503);
    }
    console.error("Upstream routing failed", error);
    return json({ error: { code: "upstream_unavailable", message: "Upstream request failed." } }, 502);
  }
}
