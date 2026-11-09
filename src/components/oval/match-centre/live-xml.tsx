"use client";

// Live XML for one match: preview of GET /api/v1/matches/{matchId}/live-xml (application/xml,
// ETag) with Refresh and Download. Refresh sends If-None-Match (a 304 keeps the current snapshot)
// and is limited to once every 5 s, as the contract asks.
import { useQuery } from "@tanstack/react-query";
import { Download, RefreshCw } from "lucide-react";
import { useRef, useState } from "react";

import { Notice } from "@/components/oval/match-centre/upstream-view";
import { Button } from "@/components/ui/button";

const MIN_INTERVAL_MS = 5000;

type Snapshot = { xml: string; etag: string | null; at: Date };

class LiveXmlError extends Error {}

async function fetchSnapshot(url: string, previous: Snapshot | undefined): Promise<Snapshot> {
  const response = await fetch(url, {
    headers: previous?.etag ? { "If-None-Match": previous.etag } : {},
  });
  if (response.status === 304 && previous) return { ...previous, at: new Date() };
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: { message?: string };
    } | null;
    throw new LiveXmlError(
      response.status === 503
        ? "The v2 data service isn't connected in this environment (set OVAL_API_GATEWAY_URL and a Cognito token). Live XML will load once it is."
        : (body?.error?.message ?? `Live XML couldn't be loaded (${response.status}).`),
    );
  }
  return { xml: await response.text(), etag: response.headers.get("ETag"), at: new Date() };
}

export function LiveXmlPanel({ matchId }: { matchId: number }) {
  const url = `/api/v1/matches/${matchId}/live-xml`;
  const last = useRef<Snapshot | undefined>(undefined);
  const query = useQuery({
    queryKey: ["live-xml", matchId],
    queryFn: async () => {
      last.current = await fetchSnapshot(url, last.current);
      return last.current;
    },
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });
  const [cooling, setCooling] = useState(false);
  const refresh = () => {
    setCooling(true);
    window.setTimeout(() => setCooling(false), MIN_INTERVAL_MS);
    void query.refetch();
  };

  const lines = query.data ? query.data.xml.split("\n") : [];
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-mute">
          {query.data
            ? `Snapshot loaded ${query.data.at.toLocaleTimeString("en-GB")} · ${lines.length.toLocaleString("en-GB")} lines`
            : "Latest live feed snapshot"}
        </span>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto"
          disabled={cooling || query.isFetching}
          onClick={refresh}
          title={
            cooling ? "Refresh is limited to once every 5 seconds" : "Fetch the latest snapshot"
          }
        >
          <RefreshCw className="size-3.5" /> Refresh
        </Button>
        <a
          href={`${url}?download=1`}
          className="inline-flex h-7 items-center gap-1.5 rounded-[3px] bg-ink px-2.5 text-xs font-medium text-white hover:bg-ink/88"
        >
          <Download className="size-3.5" /> Download XML
        </a>
      </div>
      {query.isPending && <Notice role="status">Loading Live XML…</Notice>}
      {query.isError && (
        <Notice tone="warn">
          {query.error instanceof LiveXmlError
            ? query.error.message
            : "Live XML couldn't be loaded."}
        </Notice>
      )}
      {query.data && (
        <pre
          aria-label="Live XML preview"
          className="max-h-[420px] overflow-auto rounded border border-line bg-[#F9FAFB] p-3 font-mono text-[11px] leading-relaxed text-ink"
        >
          {lines.slice(0, 400).join("\n")}
          {lines.length > 400 ? `\n… ${lines.length - 400} more lines in the download` : ""}
        </pre>
      )}
    </div>
  );
}
