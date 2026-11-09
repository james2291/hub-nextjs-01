// Server-only. Never import from a "use client" file.
//
// Reads AI insights from the AWS Oval Insights API:
//   GET {INSIGHTS_API_URL}/v1/insights?subject=team:harlequins&scope=match&matchId=…&season=2025-26&perspective=team
//
// TEMPORARY HOLD: while INSIGHTS_API_URL is unset (the API isn't built yet) every request
// returns placeholder text with `placeholder: true`, so the UI can be built and demoed now.
// Delete placeholderInsight() once the AWS API is live in every environment.
import type { AiInsightResult, InsightRequestItem } from "@/lib/ai-insights";

const TIMEOUT_MS = 10_000;

const scopeLabel: Record<InsightRequestItem["scope"], string> = {
  round: "round summary",
  match: "match summary",
  form: "recent-form summary",
};

export function insightsApiConfigured() {
  return Boolean(process.env.INSIGHTS_API_URL);
}

function placeholderInsight(item: InsightRequestItem): AiInsightResult {
  const kind = item.subject.split(":")[0] ?? "subject";
  return {
    cacheKey: item.cacheKey,
    status: "placeholder",
    summary: `Placeholder text. The AI ${scopeLabel[item.scope]} for this ${kind} will appear here once the Oval Insights API is connected.`,
    placeholder: true,
    generatedAt: null,
    modelVersion: null,
  };
}

type UpstreamInsight = {
  status: "ready" | "pending";
  summary: string | null;
  generatedAt: string | null;
  modelVersion: string | null;
};

export async function getInsight(item: InsightRequestItem): Promise<AiInsightResult> {
  const baseUrl = process.env.INSIGHTS_API_URL;
  if (!baseUrl) return placeholderInsight(item);

  const query = new URLSearchParams({ subject: item.subject, scope: item.scope, season: item.season, perspective: item.perspective, sentences: item.sentenceLimit });
  if (item.matchId) query.set("matchId", item.matchId);
  if (item.round) query.set("round", item.round);
  if (item.window) query.set("window", item.window);

  const unavailable = (error: string): AiInsightResult => ({ cacheKey: item.cacheKey, status: "unavailable", summary: null, placeholder: false, generatedAt: null, modelVersion: null, error });

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/v1/insights?${query}`, {
      headers: { Accept: "application/json", ...(process.env.INSIGHTS_API_KEY ? { "x-api-key": process.env.INSIGHTS_API_KEY } : {}) },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      next: { revalidate: 300 },
    });
    if (response.status === 404) return { cacheKey: item.cacheKey, status: "pending", summary: null, placeholder: false, generatedAt: null, modelVersion: null, error: "Insight not generated yet" };
    if (response.status === 429) return unavailable("AI is temporarily busy");
    if (!response.ok) return unavailable("Insights unavailable");
    const body = (await response.json()) as UpstreamInsight;
    return {
      cacheKey: item.cacheKey,
      status: body.status === "ready" && body.summary ? "ready" : "pending",
      summary: body.summary,
      placeholder: false,
      generatedAt: body.generatedAt,
      modelVersion: body.modelVersion,
      ...(body.status === "ready" && body.summary ? {} : { error: "Insight not generated yet" }),
    };
  } catch (error) {
    console.error("Oval Insights API request failed", error);
    return unavailable("Insights unavailable");
  }
}
