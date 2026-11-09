import { redirect } from "next/navigation";

export default async function PlayerIndex({ params }: { params: Promise<{ playerId: string }> }) {
  redirect(`/players/${(await params).playerId}/match-room`);
}
