import { PlayerOverview } from "@/components/oval/player/overview";

// Overview tab.
export default async function Page({ params }: { params: Promise<{ playerId: string }> }) {
  return <PlayerOverview slug={(await params).playerId} />;
}
