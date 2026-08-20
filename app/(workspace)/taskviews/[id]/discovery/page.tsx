import { DiscoveryCore } from "@/components/taskview/core/discovery-core";

export default async function DiscoveryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DiscoveryCore viewId={id} />;
}
