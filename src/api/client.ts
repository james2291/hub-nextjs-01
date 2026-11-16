// Typed client for the Hub API (docs/openapi.yaml → src/api/openapi.d.ts via `npm run gen:api`).
// Paths, params, bodies and responses are checked at compile time, so a contract change shows up
// as a type error wherever it matters:
//
//   const { data, error } = await hubApi.GET("/api/v1/user/pins");
//   await hubApi.DELETE("/api/v1/user/pins/{pinId}", { params: { path: { pinId } } });
//
// Use it from client components (same origin, cookies sent). Server code calls the feeds and
// upstream modules directly rather than making an HTTP round trip to itself.
import createClient from "openapi-fetch";

import type { paths } from "@/api/openapi";

export const hubApi = createClient<paths>({ baseUrl: "", credentials: "same-origin" });

export type HubPaths = paths;
