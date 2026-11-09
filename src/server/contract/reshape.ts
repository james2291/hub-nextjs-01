// Turns Oval Hub v2 upstream payloads into docs/openapi.yaml response bodies, one operation at a time.
//
// An endpoint with no entry in `reshapers` keeps answering with the upstream pass-through
// (contract: "upstream-passthrough"). Add an entry and it answers with the contract body instead;
// nothing else changes. Write each reshaper against captured payloads in fixtures/upstream/
// (see fixtures/upstream/README.md) and check it with `npm run check:contract`.
import type { operations } from "@/api/openapi";
import type { UpstreamCallResult } from "@/server/upstream/client.server";

export type OperationId = keyof operations;

type JsonOk<Op extends OperationId> = operations[Op]["responses"] extends {
  200: { content: { "application/json": infer Body } };
}
  ? Body
  : never;

/** The 200 response body docs/openapi.yaml defines for an operation. */
export type ContractBody<Op extends OperationId> = JsonOk<Op>;

export type ReshapeContext = {
  /** Path parameters exactly as the request gave them (Hub ids). */
  params: Record<string, string>;
  query: URLSearchParams;
};

/** Returned instead of a body when the payload has nothing for the request, e.g. an unknown id. */
export type ReshapeMiss = { miss: "not_found"; message: string };

export type Reshaper<Op extends OperationId> = (
  calls: UpstreamCallResult[],
  context: ReshapeContext,
) => ContractBody<Op> | ReshapeMiss;

export type ReshaperTable = { [Op in OperationId]?: Reshaper<Op> };

/**
 * Reshapers by operationId. Empty until payloads are captured: no mapping is written against a
 * payload nobody has seen. Order of work: the 33 routed spec endpoints (`GET /api/v1/routing`).
 */
export const reshapers: ReshaperTable = {};

/** operationId docs/openapi.yaml uses for a catalog pattern: competitions/:competitionId → get_competitions_competitionId. */
export function operationIdFor(pattern: string): string {
  return `get_${pattern.replace(/:/g, "").replace(/\//g, "_")}`;
}

export function reshaperFor(pattern: string): Reshaper<OperationId> | undefined {
  const id = operationIdFor(pattern) as OperationId;
  return reshapers[id] as Reshaper<OperationId> | undefined;
}

export function isMiss(value: unknown): value is ReshapeMiss {
  return typeof value === "object" && value !== null && "miss" in value;
}
