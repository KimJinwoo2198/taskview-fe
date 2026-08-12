import { TaskViewDetailScreen } from "@/components/screens/task-view-detail-screen";

export default async function TaskViewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TaskViewDetailScreen viewId={id} />;
}
