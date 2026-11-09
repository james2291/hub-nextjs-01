import { redirect } from "next/navigation";

export default async function MatchIndex({ params }: { params: Promise<{ matchId: string }> }) {
  redirect(`/matches/${(await params).matchId}/overview`);
}
