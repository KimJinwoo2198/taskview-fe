import { DataSourceDetailScreen } from "@/components/taskview/admin/data-sources";

export default async function DataSourceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DataSourceDetailScreen sourceId={id} />;
}
