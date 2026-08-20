import { EvidenceDetailScreen } from "@/components/taskview/admin/governance";

export default async function EvidencePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EvidenceDetailScreen evidenceId={id} />;
}
