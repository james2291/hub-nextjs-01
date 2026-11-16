// Runs once when a server instance starts (node_modules/next/dist/docs/01-app/03-api-reference/
// 03-file-conventions/instrumentation.md). On Vercel this also runs inside the proxy.ts function,
// so it must never throw or exit: a missing setting is logged, not fatal.
import type { Instrumentation } from "next";

export async function register() {
  if (process.env["NEXT_RUNTIME"] !== "nodejs") return;
  const { configProblems } = await import("@/server/env");
  for (const problem of configProblems()) {
    console.warn(JSON.stringify({ level: "warn", msg: "config", problem }));
  }
}

/**
 * One JSON line per unhandled server error. Swap for Sentry (or similar) here; see
 * docs/production-review.md "Error reporting".
 */
export const onRequestError: Instrumentation.onRequestError = (error, request, context) => {
  const message = error instanceof Error ? error.message : String(error);
  const digest =
    typeof error === "object" && error !== null && "digest" in error
      ? String(error.digest)
      : undefined;
  console.error(
    JSON.stringify({
      level: "error",
      msg: "request_error",
      message,
      digest,
      method: request.method,
      path: request.path.split("?")[0],
      route: context.routePath,
      routeType: context.routeType,
    }),
  );
};
