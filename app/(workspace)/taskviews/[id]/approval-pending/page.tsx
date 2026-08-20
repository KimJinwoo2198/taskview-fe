import { ApprovalPendingCore } from "@/components/taskview/core/approval-pending-core";

export default async function ApprovalPendingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ApprovalPendingCore viewId={id} />;
}
