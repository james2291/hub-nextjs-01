// Next fixture changes over time; resolve per request rather than at build.
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";

import { getNextFixture } from "@/data/hub";

// Server-side redirect to the next opponent's Head-to-head tab (was TanStack beforeLoad).
export default function NextOpponentPage() {
  const next = getNextFixture("harlequins");
  redirect(`/teams/${next?.opponent?.id ?? "bath-rugby"}/head-to-head`);
}
