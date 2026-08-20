import { NeedexDetailCore } from "@/components/taskview/core/detail-core";
import type { NeedexArtifacts } from "@/components/taskview/core/model";
import { fetchNeedexBackend } from "@/components/taskview/core/server";

export default async function NeedexDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const artifacts = await fetchNeedexBackend<NeedexArtifacts>(`/v1/taskviews/${encodeURIComponent(id)}/artifacts`);
  return <NeedexDetailCore artifactsError={artifacts.error} initialArtifacts={artifacts.data} viewId={id} />;
}
