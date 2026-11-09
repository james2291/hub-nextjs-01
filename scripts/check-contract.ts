// Checks the Hub routes against docs/openapi.yaml and every reshaper against captured payloads.
//
//   npm run check:contract
//
// 1. Every catalog route marked spec: true exists in the spec as a GET with the derived operationId.
// 2. Every reshaper is keyed by a routed spec operation.
// 3. Every fixture in fixtures/upstream/<operationId>/*.json is run through its reshaper and the
//    result is validated against that operation's 200 schema. A fixture with no reshaper yet is
//    counted as ready to map.
// Exits 1 on any failure.
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

import Ajv2020 from "ajv/dist/2020";
import { parse } from "yaml";

import {
  fileContractRoutes,
  isMiss,
  operationIdFor,
  reshapers,
} from "../src/server/contract/reshape";
import { hubRoutes } from "../src/server/upstream/catalog";
import type { UpstreamCallResult } from "../src/server/upstream/client.server";

type Operation = {
  operationId?: string;
  responses?: Record<string, { content?: Record<string, { schema?: unknown }> }>;
};
type Spec = { paths: Record<string, Record<string, Operation>> };

const root = join(import.meta.dirname, "..");
const spec = parse(readFileSync(join(root, "docs/openapi.yaml"), "utf8")) as Spec;
const failures: string[] = [];

const ajv = new Ajv2020({ strict: false, allErrors: true });
ajv.addSchema(spec, "openapi");

function specPath(pattern: string): string {
  return `/api/v1/${pattern.replace(/:([A-Za-z]+)/g, "{$1}")}`;
}

function pointer(path: string): string {
  return path.replace(/~/g, "~0").replace(/\//g, "~1");
}

// 1. Catalog ↔ spec.
const routedSpec = hubRoutes.filter((route) => route.spec && route.status === "routed");
const byOperation = new Map<string, { path: string; routed: boolean }>();
for (const route of hubRoutes) {
  if (!route.spec) continue;
  const path = specPath(route.pattern);
  const operation = spec.paths[path]?.["get"];
  const expected = operationIdFor(route.pattern);
  if (!operation) failures.push(`${path}: catalog says spec: true but the spec has no GET`);
  else if (operation.operationId !== expected)
    failures.push(
      `${path}: spec operationId ${operation.operationId}, catalog derives ${expected}`,
    );
  byOperation.set(expected, { path, routed: route.status === "routed" });
}

// 2. Reshapers ↔ catalog.
for (const id of Object.keys(reshapers)) {
  const entry = byOperation.get(id);
  if (!entry) failures.push(`reshaper ${id}: no catalog route with that operationId`);
  else if (!entry.routed) failures.push(`reshaper ${id}: the route has no v2 source`);
}

// 3. Fixtures.
const fixtureRoot = join(root, "fixtures/upstream");
let validated = 0;
const awaiting: string[] = [];
const dirs = existsSync(fixtureRoot)
  ? readdirSync(fixtureRoot).filter((name) => statSync(join(fixtureRoot, name)).isDirectory())
  : [];
for (const id of dirs) {
  const entry = byOperation.get(id);
  if (!entry) {
    failures.push(`fixtures/upstream/${id}: not an operationId of a spec route`);
    continue;
  }
  const reshape = reshapers[id as keyof typeof reshapers] as
    | ((
        calls: UpstreamCallResult[],
        context: { params: Record<string, string>; query: URLSearchParams },
      ) => unknown)
    | undefined;
  const files = readdirSync(join(fixtureRoot, id)).filter((name) => name.endsWith(".json"));
  if (!reshape) {
    if (files.length) awaiting.push(`${id} (${files.length})`);
    continue;
  }
  const ref = `openapi#/paths/${pointer(entry.path)}/get/responses/200/content/${pointer("application/json")}/schema`;
  const validate = ajv.getSchema(ref) ?? ajv.compile({ $ref: ref });
  for (const file of files) {
    const label = `fixtures/upstream/${id}/${file}`;
    const fixture = JSON.parse(readFileSync(join(fixtureRoot, id, file), "utf8")) as {
      calls?: UpstreamCallResult[];
      request?: { params?: Record<string, string>; query?: Record<string, string> };
    };
    if (!Array.isArray(fixture.calls)) {
      failures.push(`${label}: no calls array. Save the whole pass-through response body.`);
      continue;
    }
    let body: unknown;
    try {
      body = reshape(fixture.calls, {
        params: fixture.request?.params ?? {},
        query: new URLSearchParams(fixture.request?.query ?? {}),
      });
    } catch (error) {
      failures.push(
        `${label}: reshaper threw ${error instanceof Error ? error.message : String(error)}`,
      );
      continue;
    }
    if (isMiss(body)) {
      failures.push(`${label}: reshaper returned not_found (${body.message})`);
      continue;
    }
    if (!validate(body)) {
      const errors = (validate.errors ?? [])
        .slice(0, 5)
        .map((e) => `${e.instancePath || "/"} ${e.message}`);
      failures.push(`${label}: does not match the 200 schema\n    ${errors.join("\n    ")}`);
      continue;
    }
    validated += 1;
  }
}

const reshaped = routedSpec.filter(
  (route) => operationIdFor(route.pattern) in reshapers || fileContractRoutes.has(route.pattern),
).length;
console.log(
  `Routed spec endpoints: ${routedSpec.length}. Reshaped to the contract: ${reshaped}. Still pass-through: ${routedSpec.length - reshaped}.`,
);
console.log(`Fixtures validated: ${validated}.`);
if (awaiting.length) console.log(`Captured, awaiting a reshaper: ${awaiting.join(", ")}.`);
if (failures.length) {
  console.error(`\n${failures.length} failure(s):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("Contract check passed.");
