import { AnalyticsCore } from "@/components/taskview/core/analytics-core";
import type { MaterializedData } from "@/components/taskview/core/model";
import { fetchNeedexBackend } from "@/components/taskview/core/server";

export default async function AnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await fetchNeedexBackend<MaterializedData>(`/v1/taskviews/${encodeURIComponent(id)}/data`);
  return <AnalyticsCore dataError={data.error} initialData={data.data} viewId={id} />;
}
