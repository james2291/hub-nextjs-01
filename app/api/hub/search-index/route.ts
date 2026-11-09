// Internal (not part of /api/v1): the ⌘K search index, fetched the first time Search opens
// instead of being sent with every page. Built from the feeds.
import { NextResponse } from "next/server";

import { buildSearchIndex } from "@/server/search";

export function GET() {
  return NextResponse.json(
    { items: buildSearchIndex() },
    { headers: { "Cache-Control": "private, max-age=300" } },
  );
}
