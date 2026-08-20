import { ValidationCore } from "@/components/taskview/core/validation-core";
import { fetchNeedexBackend } from "@/components/taskview/core/server";
import type { CompilationResponse } from "@/components/taskview/core/model";

export default async function ValidationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const compilation = await fetchNeedexBackend<CompilationResponse>(`/v1/taskviews/${encodeURIComponent(id)}/compilation`);
  return <ValidationCore compilationError={compilation.error} initialCompilation={compilation.data} viewId={id} />;
}
