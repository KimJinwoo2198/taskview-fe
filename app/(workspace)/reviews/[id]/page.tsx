import { ReviewCore } from "@/components/taskview/core/review-core";
import { fetchNeedexBackend } from "@/components/taskview/core/server";
import type { ApprovalDecision, ApprovalReview, ServerResult } from "@/components/taskview/core/model";
import type { Needex } from "@/lib/types";

async function decideApproval(viewId: string, decision: ApprovalDecision, reason: string): Promise<ServerResult<Needex>> {
  "use server";
  return fetchNeedexBackend<Needex>(`/v1/approval-requests/${encodeURIComponent(viewId)}/decision`, {
    method: "POST",
    body: JSON.stringify({ decision, reason }),
  });
}

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const review = await fetchNeedexBackend<ApprovalReview>(`/v1/approval-requests/${encodeURIComponent(id)}`);
  const decisionAction = decideApproval.bind(null, id);
  return <ReviewCore decisionAction={decisionAction} initialReview={review.data} reviewError={review.error} viewId={id} />;
}
