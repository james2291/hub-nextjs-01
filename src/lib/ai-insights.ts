// AI insight types shared by the browser and the /api/v1/insights route handler.
//
// TEMPORARY HOLD: the Hub does not generate AI text. Insights are produced and stored by the
// AWS Oval Insights API (spec: docs/openapi.yaml, "Oval Insights API"). Until that API exists,
// /api/v1/insights returns clearly labelled placeholder text. See src/server/insights/.
import { z } from "zod";

export const InsightScope = z.enum(["round", "match", "form"]);
export const InsightPerspective = z.enum(["neutral", "team", "player", "referee"]);
export const SubjectKind = z.enum(["competition", "team", "player", "referee"]);

/** What the UI components build. `entityName` is display-only and never sent to the API. */
export type AiInsightItem = {
  cacheKey: string;
  scope: z.infer<typeof InsightScope>;
  /** Match ID for scope "match", round label for "round", window ("last-5") for "form". */
  matchId: string;
  entityId: string;
  entityName: string;
  season: string;
  perspective: z.infer<typeof InsightPerspective>;
  sentenceLimit: "2-3" | "3-4" | "3-5";
};

/** One item on the wire to POST /api/v1/insights. No prompt data: the AWS service loads its own. */
export const InsightRequestItemSchema = z.object({
  cacheKey: z.string().min(1).max(300),
  scope: InsightScope,
  subject: z.string().regex(/^(competition|team|player|referee):[A-Za-z0-9._-]{1,100}$/),
  matchId: z.string().min(1).max(200).optional(),
  round: z.string().min(1).max(100).optional(),
  window: z.string().min(1).max(30).optional(),
  season: z.string().min(1).max(30),
  perspective: InsightPerspective,
  sentenceLimit: z.enum(["2-3", "3-4", "3-5"]),
});
export const InsightRequestSchema = z.object({ items: z.array(InsightRequestItemSchema).min(1).max(6) });
export type InsightRequestItem = z.infer<typeof InsightRequestItemSchema>;

export type InsightStatus = "ready" | "pending" | "unavailable" | "placeholder";

export type AiInsightResult = {
  cacheKey: string;
  status: InsightStatus;
  summary: string | null;
  /** true while the Hub is on the temporary hold (no INSIGHTS_API_URL configured). */
  placeholder: boolean;
  generatedAt: string | null;
  modelVersion: string | null;
  error?: string;
};

const subjectKindFor: Record<AiInsightItem["perspective"], z.infer<typeof SubjectKind>> = {
  neutral: "competition",
  team: "team",
  player: "player",
  referee: "referee",
};

/** Converts a UI request into the wire format: subject + scope key, nothing else. */
export function toWireItem(item: AiInsightItem): InsightRequestItem {
  const base = {
    cacheKey: item.cacheKey,
    scope: item.scope,
    subject: `${subjectKindFor[item.perspective]}:${item.entityId}`,
    season: item.season,
    perspective: item.perspective,
    sentenceLimit: item.sentenceLimit,
  };
  if (item.scope === "round") return { ...base, round: item.matchId };
  if (item.scope === "form") return { ...base, window: item.matchId };
  return { ...base, matchId: item.matchId };
}
