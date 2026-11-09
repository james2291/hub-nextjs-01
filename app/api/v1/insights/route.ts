import { NextResponse } from "next/server";

import { InsightRequestSchema } from "@/lib/ai-insights";
import { getInsight, insightsApiConfigured } from "@/server/insights/client.server";

// POST /api/v1/insights — batch read of up to 6 AI insights for the Overview tabs.
//
// The Hub does not generate AI text. It forwards each item to the AWS Oval Insights API and
// returns what that API stored. TEMPORARY HOLD: until INSIGHTS_API_URL is set, every item
// comes back as labelled placeholder text (`placeholder: true`, `status: "placeholder"`).
export async function POST(request: Request) {
  const parsed = InsightRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "validation_failed",
          message: "Invalid insight request",
          details: parsed.error.flatten(),
        },
      },
      { status: 422 },
    );
  }
  const items = await Promise.all(parsed.data.items.map(getInsight));
  return NextResponse.json(
    { items, source: insightsApiConfigured() ? "oval-insights-api" : "placeholder" },
    { headers: { "Cache-Control": "private, max-age=60" } },
  );
}
