// Link rules (HANDOFF.md section 7) for server components. Client components use useClubHref().
import { hubNow } from "@/lib/now";
import { CURRENT_USER } from "@/lib/user";
import { opponentOf } from "@/lib/rugby";
import { getNextFixture } from "@/server/feeds";

/** Slug of the user's club's next opponent, from the hub clock. */
export function nextOpponentSlug(): string | null {
  const next = getNextFixture(CURRENT_USER.clubSlug, hubNow());
  return next ? (opponentOf(next, CURRENT_USER.clubSlug)?.slug ?? null) : null;
}

/** Returns a function: club slug → that team's Overview, or Next opponent for the next opponent. */
export function clubHrefs(): (slug: string) => string {
  const next = nextOpponentSlug();
  return (slug: string) => (slug === next ? "/next-opponent" : `/teams/${slug}`);
}
