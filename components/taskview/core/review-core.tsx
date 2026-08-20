"use client";

import { AlertTriangle, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { isNeedexDemoMode } from "@/lib/demo-mode";
import type { Needex } from "@/lib/types";

import { useCoreNeedex } from "./client";
import type { ApprovalDecision, ApprovalReview, ServerResult } from "./model";
import { CoreError, CoreHeading, CorePage, CorePanel, CorePill, DemoNotice, SectionHeading } from "./shared";

const demoReview: ApprovalReview = {
  request_id: "REQ-024", view_id: "demo", view_name: "JP_SIGNUP_DIAGNOSIS_V7", risk_level: "high", request_blocked: true,
  requested_purpose: "도쿄 시부야에 거주하는 22세 사용자의 실제 상담 내용도 보여줘.", requester: "Product Team", existing_view: "JP_SIGNUP_DIAGNOSIS_V7",
  reasons: [{ title: "업무 목적 범위를 초과함", detail: "가입 이탈 원인 분석에는 특정 사용자의 실제 상담 원문이 필요하지 않습니다." }, { title: "기존 View와 결합 시 재식별 위험", detail: "상세 지역·정확한 나이·상담 원문을 결합하면 개인을 좁힐 수 있습니다." }],
  policy_findings: [{ code: "RAW_VOC_FOR_PRODUCT", severity: "block", field: "raw_ticket_text", message: "Product 조직에 원문 제공 불가", action: "EXTRACT_CATEGORY" }, { code: "SENSITIVE_FIELD_TRANSFORM", severity: "block", field: "exact_address", message: "상세 주소 일반화 필요", action: "GENERALIZE" }],
  recommended_alternative: { available: true, changes: [{ before: "Tokyo · Shibuya", after: "Kanto", operator: "GENERALIZE" }, { before: "Age 22", after: "20–29", operator: "BUCKET" }, { before: "Raw Ticket", after: "Issue Category", operator: "EXTRACT_CATEGORY" }], unresolved_findings: [] },
  assigned_owner: "Tokyo Operations", can_approve_as_is: false, evidence_state: "pending",
};

export function ReviewCore({ viewId, initialReview, reviewError, decisionAction }: { viewId: string; initialReview?: ApprovalReview | null; reviewError?: string | null; decisionAction: (decision: ApprovalDecision, reason: string) => Promise<ServerResult<Needex>> }) {
  const router = useRouter();
  const { view, loading, error, isFallback, reload } = useCoreNeedex(viewId);
  const review = initialReview ?? (isNeedexDemoMode ? demoReview : null);
  const [reason, setReason] = useState("업무 목적과 정책 범위를 확인했습니다.");
  const [busy, setBusy] = useState<ApprovalDecision | null>(null);
  const [decisionError, setDecisionError] = useState<string | null>(null);
  if (loading) return <div className="tv-page"><div className="h-[760px] animate-pulse rounded-2xl bg-tv-subtle" role="status" aria-label="승인 요청 로딩 중" /></div>;
  if (error && !isFallback) return <CoreError message={error} retry={() => void reload()} />;
  if (!review) return <CoreError message={reviewError ?? "승인 요청 상세를 불러오지 못했습니다."} href="/approvals" />;
  const approveDecision: ApprovalDecision | null = review.can_approve_as_is ? "approve" : review.request_blocked && review.recommended_alternative.available ? "approve_recommended_alternative" : null;
  const approveLabel = approveDecision === "approve" ? "요청 승인" : approveDecision === "approve_recommended_alternative" ? "안전한 대안으로 승인" : "승인 가능한 대안 없음";

  async function decide(decision: ApprovalDecision) {
    if (reason.trim().length < 2) {
      setDecisionError("승인 또는 거절 사유를 2자 이상 입력해 주세요.");
      return;
    }
    setBusy(decision);
    setDecisionError(null);
    const result = await decisionAction(decision, reason.trim());
    setBusy(null);
    if (!result.data) {
      setDecisionError(result.error ?? "결정을 저장하지 못했습니다.");
      return;
    }
    toast.success(decision === "reject" ? "요청을 거절했습니다." : decision === "approve" ? "요청을 승인했습니다." : "안전한 대안으로 승인했습니다.");
    router.push(`/taskviews/${result.data.id}`);
    router.refresh();
  }

  return (
    <CorePage className="gap-4 pb-8">
      <CoreHeading title={<span className="flex items-center gap-3">Data Owner Approval <CorePill tone={review.risk_level === "high" ? "danger" : "warning"}>{review.risk_level.toUpperCase()} RISK</CorePill></span>} description="신규 목적 또는 고위험 요청은 자동 승인하지 않고 데이터 소유자가 최종 판단합니다." />

      <section className="flex min-h-[98px] items-center gap-4 rounded-[14px] border border-tv-red-200 bg-tv-red-50 px-[18px] py-3.5">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-tv-red-600"><AlertTriangle className="size-5" /></span>
        <div className="min-w-0 flex-1"><strong className="text-[9px] text-tv-red-600">{review.request_blocked ? "REQUEST BLOCKED" : "APPROVAL REQUIRED"}</strong><p className="mt-1 truncate text-[11px] font-bold text-tv-ink">“{review.requested_purpose}”</p><span className="mt-1 block text-[8px] text-tv-gray">Requester: {review.requester ?? view.requester?.display_name ?? "—"}{review.existing_view ? ` · Existing View: ${review.existing_view}` : ""}</span></div>
        <CorePill tone={review.request_blocked ? "danger" : "warning"}>{review.request_blocked ? "Policy + Inference Risk" : "Human Review"}</CorePill>
      </section>

      {isFallback || !initialReview ? <DemoNotice error={error ?? reviewError} /> : null}

      <div className="grid min-h-[630px] gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <div className="flex flex-col gap-4">
          <CorePanel className="min-h-[140px] p-4"><SectionHeading title={review.request_blocked ? "왜 차단되었나요?" : "왜 검토가 필요한가요?"} description="업무 목적과 정책 판단 근거를 확인합니다." /><div className="mt-4 grid gap-4 sm:grid-cols-2">{review.reasons.map((item, index) => <Reason detail={item.detail} index={String(index + 1)} key={`${item.title}-${index}`} title={item.title} />)}</div></CorePanel>
          <CorePanel className="min-h-[180px] p-4"><SectionHeading title="Policy Findings" aside={<CorePill tone={review.policy_findings.some((item) => item.severity === "block") ? "danger" : "success"}>{review.policy_findings.filter((item) => item.severity === "block").length} violations</CorePill>} /><div className="mt-4 space-y-3">{review.policy_findings.map((item) => <Finding detail={item.message} field={item.field ?? item.code} key={item.code} result={item.severity === "block" ? "DENY" : "PASS"} />)}{!review.policy_findings.length ? <p className="text-[9px] text-tv-gray">정책 위반이 없습니다.</p> : null}</div></CorePanel>
          <CorePanel className="min-h-[278px] border-tv-teal-100 bg-tv-teal-50 p-4"><SectionHeading title="같은 업무를 계속할 수 있는 안전한 대안" aside={<CorePill tone={review.recommended_alternative.available ? "primary" : "neutral"}>{review.recommended_alternative.available ? "RECOMMENDED" : "UNAVAILABLE"}</CorePill>} />{review.recommended_alternative.available ? <div className="mt-4 space-y-3">{review.recommended_alternative.changes.map((item, index) => <Alternative after={item.after} before={item.before} key={`${item.before}-${index}`} operator={item.operator} />)}</div> : <p className="mt-5 text-[10px] leading-5 text-tv-gray">자동 적용 가능한 안전한 대안이 없습니다. 요청을 거절하거나 목적 수정을 요청해 주세요.</p>}</CorePanel>
        </div>

        <div className="flex flex-col gap-[14px]">
          <CorePanel className="min-h-[330px] p-4">
            <SectionHeading title="승인 결정" description={`Data Owner · ${review.assigned_owner}`} />
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-tv-canvas p-3"><span className="grid size-8 place-items-center rounded-full bg-tv-blue-50 text-[9px] font-bold text-tv-blue-500">DO</span><div><strong className="block text-[10px] text-tv-ink">{review.assigned_owner}</strong><span className="text-[8px] text-tv-slate">Data Owner</span></div></div>
            <label className="mt-4 block text-[9px] text-tv-gray" htmlFor="approval-reason">승인 메모</label>
            <Textarea className="mt-1.5 min-h-[72px] resize-none rounded-[10px] text-[10px]" id="approval-reason" onChange={(event) => setReason(event.target.value)} value={reason} />
            {decisionError ? <p className="mt-2 text-[9px] text-tv-red-600" role="alert">{decisionError}</p> : null}
            <Button className="mt-4 h-11 w-full rounded-[10px]" disabled={busy !== null || !approveDecision} onClick={() => { if (approveDecision) void decide(approveDecision); }}>{busy === approveDecision ? "승인 저장 중…" : approveLabel}</Button>
            <Button className="mt-2 h-10 w-full rounded-[10px] border-tv-red-200 text-tv-red-600 hover:bg-tv-red-50" disabled={busy !== null} onClick={() => void decide("reject")} variant="outline">{busy === "reject" ? "거절 저장 중…" : "요청 거절"}</Button>
          </CorePanel>
          <CorePanel className="min-h-[286px] p-4"><SectionHeading title="Evidence Contract Update" aside={<CorePill tone="warning">{review.evidence_state.toUpperCase()}</CorePill>} /><dl className="mt-5 grid grid-cols-[80px_1fr] gap-y-4 text-[8px]"><dt className="text-tv-slate">Request</dt><dd>{review.request_id}</dd><dt className="text-tv-slate">Policy</dt><dd>{review.policy_findings.filter((item) => item.severity === "block").length} DENY</dd><dt className="text-tv-slate">Risk</dt><dd>{review.risk_level.toUpperCase()}</dd><dt className="text-tv-slate">Alternative</dt><dd>{review.recommended_alternative.changes.map((item) => item.operator).join(" · ") || "없음"}</dd><dt className="text-tv-slate">Approver</dt><dd>{review.assigned_owner}</dd><dt className="text-tv-slate">Audit</dt><dd>Reason + decision will be logged</dd></dl></CorePanel>
        </div>
      </div>

      <div className="flex items-center justify-between text-[9px] text-tv-slate"><p>Needex는 위험한 항목을 제외하고도 업무를 계속할 수 있는 안전한 방법을 제안합니다.</p><CorePill tone="primary">결합 위험 확인됨</CorePill></div>
    </CorePage>
  );
}

function Reason({ index, title, detail }: { index: string; title: string; detail: string }) {
  return <div className="flex items-start gap-3"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-tv-red-50 text-[10px] text-tv-red-600">{index}</span><div><strong className="block text-[9px] text-tv-ink">{title}</strong><p className="mt-1 text-[8px] leading-4 text-tv-gray">{detail}</p></div></div>;
}

function Finding({ field, detail, result }: { field: string; detail: string; result: "DENY" | "PASS" }) {
  return <div className="grid grid-cols-[160px_1fr_auto] items-center gap-3 text-[8px]"><strong className="truncate text-tv-ink">{field}</strong><span className="truncate text-tv-gray">{detail}</span><CorePill tone={result === "PASS" ? "success" : "danger"}>{result}</CorePill></div>;
}

function Alternative({ before, after, operator }: { before: string; after: string; operator: string }) {
  return <div className="grid min-h-12 grid-cols-[1fr_24px_1fr_auto] items-center gap-3 rounded-xl bg-white/80 px-3 text-[9px]"><span className="text-tv-gray">{before}</span><ArrowRight className="size-4 text-tv-blue-500" /><strong className="text-tv-ink">{after}</strong><CorePill tone="safe">{operator}</CorePill></div>;
}
