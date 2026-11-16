// Runs once when a server instance starts (node_modules/next/dist/docs/01-app/03-api-reference/
// 03-file-conventions/instrumentation.md).
import type { Instrumentation } from "next";

/** Validate the environment before serving: a production server without its secrets exits. */
export async function register() {
  if (process.env["NEXT_RUNTIME"] !== "nodejs") return;
  const { serverEnv } = await import("@/server/env");
  try {
    serverEnv();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
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
