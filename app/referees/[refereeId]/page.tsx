import { RefereeOverview } from "@/components/oval/referee/overview";

// Overview tab.
export default async function Page({ params }: { params: Promise<{ refereeId: string }> }) {
  return <RefereeOverview slug={(await params).refereeId} />;
}
