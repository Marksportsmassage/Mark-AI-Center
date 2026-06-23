import { DecisionReportDetailClient } from "./DecisionReportDetailClient";

export default async function DecisionReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DecisionReportDetailClient reportId={id} />;
}
