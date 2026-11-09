import { redirect } from "next/navigation";

export default async function TeamIndex({ params }: { params: Promise<{ teamId: string }> }) {
  redirect(`/teams/${(await params).teamId}/match-room`);
}
