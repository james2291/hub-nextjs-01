"use client";

// Fetches one Hub /api/v1 match route and lays out the v2 payload it passes through. The v2
// responses aren't reshaped to docs/openapi.yaml yet, so this shows them generically: lists of
// records become tables, single records become label/value pairs. When a reshaper exists for the
// route, swap this for a purpose-built panel.
import { useQuery } from "@tanstack/react-query";

import { cn } from "@/lib/utils";

type Envelope = { calls?: Array<{ path: string; status: number; data: unknown }> };
type ApiErrorBody = { error?: { code?: string; message?: string } };

export class HubFetchError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function fetchHub(url: string): Promise<Envelope> {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  const body = (await response.json().catch(() => null)) as (Envelope & ApiErrorBody) | null;
  if (!response.ok)
    throw new HubFetchError(
      body?.error?.message ?? `Request failed (${response.status}).`,
      response.status,
    );
  return body ?? {};
}

export function errorText(error: unknown): string {
  if (error instanceof HubFetchError && error.status === 503) {
    return "The v2 data service isn't connected in this environment (set OVAL_API_GATEWAY_URL and a Cognito token). The request is wired up and will fill in once it is.";
  }
  if (error instanceof HubFetchError && error.status === 404)
    return "The data service has no record of this match yet.";
  if (error instanceof HubFetchError && error.status === 401)
    return "Your session has expired. Sign in again to load match data.";
  return error instanceof Error ? error.message : "This data couldn't be loaded.";
}

export function UpstreamView({
  url,
  empty = "No data in the feed for this match yet.",
}: {
  url: string;
  empty?: string;
}) {
  const query = useQuery({ queryKey: ["hub", url], queryFn: () => fetchHub(url), retry: false });
  if (query.isPending) return <Notice role="status">Loading…</Notice>;
  if (query.isError) return <Notice tone="warn">{errorText(query.error)}</Notice>;
  const blocks = (query.data.calls ?? []).flatMap((call) => toBlocks(call.data));
  if (blocks.length === 0) return <Notice>{empty}</Notice>;
  return (
    <div className="flex flex-col gap-4">
      {blocks.map((block, index) => (
        <Block key={index} block={block} />
      ))}
      <p className="text-[11px] text-faint">
        Raw v2 data via the Hub, not yet reshaped to the Hub contract.
      </p>
    </div>
  );
}

export function Notice({
  children,
  tone,
  role,
}: {
  children: React.ReactNode;
  tone?: "warn";
  role?: "status";
}) {
  return (
    <div
      role={role}
      className={cn(
        "rounded border px-4 py-6 text-center text-[13px]",
        tone === "warn" ? "border-dashed border-line text-mute" : "border-line2 text-mute",
      )}
    >
      {children}
    </div>
  );
}

type Row = Record<string, unknown>;
type BlockData =
  { title: string | null; rows: Row[] } | { title: string | null; pairs: Array<[string, unknown]> };

function isRecord(value: unknown): value is Row {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Turns a payload into displayable blocks: arrays of records as tables, records as pairs. */
function toBlocks(data: unknown, title: string | null = null, depth = 0): BlockData[] {
  if (Array.isArray(data)) {
    const rows = data.filter(isRecord);
    if (rows.length) return [{ title, rows }];
    return data.length
      ? [
          {
            title,
            pairs: data.map((value, index) => [String(index + 1), value] as [string, unknown]),
          },
        ]
      : [];
  }
  if (!isRecord(data))
    return data === null || data === undefined || data === ""
      ? []
      : [{ title, pairs: [["Value", data]] }];
  const scalars = Object.entries(data).filter(
    ([, value]) => !Array.isArray(value) && !isRecord(value),
  );
  const nested = Object.entries(data).filter(
    ([, value]) => Array.isArray(value) || isRecord(value),
  );
  const blocks: BlockData[] = scalars.length ? [{ title, pairs: scalars }] : [];
  if (depth < 3)
    for (const [key, value] of nested) blocks.push(...toBlocks(value, humanise(key), depth + 1));
  return blocks;
}

function humanise(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^./, (c) => c.toUpperCase());
}

function show(value: unknown, key = ""): string {
  if (value === null || value === undefined || value === "") return "–";
  if (typeof value === "number")
    return /id$/i.test(key) ? String(value) : value.toLocaleString("en-GB");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value).slice(0, 80);
  return String(value);
}

function Block({ block }: { block: BlockData }) {
  if ("pairs" in block) {
    return (
      <section className="overflow-hidden rounded border border-line">
        {block.title && (
          <h3 className="border-b border-line2 bg-[#F9FAFB] px-4 py-2 text-xs font-semibold">
            {block.title}
          </h3>
        )}
        <dl className="grid grid-cols-1 sm:grid-cols-2">
          {block.pairs.map(([key, value]) => (
            <div
              key={key}
              className="flex justify-between gap-3 border-b border-line2 px-4 py-2 text-[13px]"
            >
              <dt className="text-mute">{humanise(key)}</dt>
              <dd className="text-right font-medium tabular-nums">{show(value, key)}</dd>
            </div>
          ))}
        </dl>
      </section>
    );
  }
  const keys = [...new Set(block.rows.flatMap((row) => Object.keys(row)))]
    .filter((key) => block.rows.some((row) => !isRecord(row[key]) && !Array.isArray(row[key])))
    .slice(0, 12);
  const rows = block.rows.slice(0, 100);
  return (
    <section className="overflow-hidden rounded border border-line">
      {block.title && (
        <h3 className="border-b border-line2 bg-[#F9FAFB] px-4 py-2 text-xs font-semibold">
          {block.title}
        </h3>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-[13px]">
          <thead>
            <tr className="border-b border-line2">
              {keys.map((key) => (
                <th key={key} scope="col" className="whitespace-nowrap px-3 py-2 text-left">
                  {humanise(key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className="border-b border-line2 last:border-b-0">
                {keys.map((key) => (
                  <td key={key} className="whitespace-nowrap px-3 py-1.5 tabular-nums">
                    {show(row[key], key)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {block.rows.length > rows.length && (
        <p className="px-3 py-2 text-[11px] text-faint">
          Showing {rows.length} of {block.rows.length} rows.
        </p>
      )}
    </section>
  );
}
