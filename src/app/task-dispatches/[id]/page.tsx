import { TaskDispatchDetailClient } from "./TaskDispatchDetailClient";

export default async function TaskDispatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TaskDispatchDetailClient taskId={id} />;
}
