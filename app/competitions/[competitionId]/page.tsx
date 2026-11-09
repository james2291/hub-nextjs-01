import { redirect } from "next/navigation";

export default async function CompetitionIndex({ params }: { params: Promise<{ competitionId: string }> }) {
  redirect(`/competitions/${(await params).competitionId}/match-room`);
}
