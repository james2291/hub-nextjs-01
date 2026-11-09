import { redirect } from "next/navigation";

import { CURRENT_USER } from "@/lib/user";
import { nextOpponentSlug } from "@/server/links";

// The next opponent depends on the hub clock, so resolve per request.
export const dynamic = "force-dynamic";

export default function NextOpponentPage() {
  const slug = nextOpponentSlug();
  redirect(slug ? `/opposition/${slug}` : `/teams/${CURRENT_USER.clubSlug}/fixtures`);
}
