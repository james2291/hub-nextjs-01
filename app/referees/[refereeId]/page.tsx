import { redirect } from "next/navigation";

export default async function RefereeIndex({ params }: { params: Promise<{ refereeId: string }> }) {
  redirect(`/referees/${(await params).refereeId}/match-room`);
}
