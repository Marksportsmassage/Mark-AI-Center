import { DailyBriefDetailClient } from "./DailyBriefDetailClient";

export default async function DailyBriefDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DailyBriefDetailClient briefId={id} />;
}
