"use client";

import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { requestJson } from "@/lib/client-api";
import { isNeedexDemoMode } from "@/lib/demo-mode";

import { useCoreNeedex } from "./client";
import { toCompilation } from "./fixtures";
import type { ApprovalSubmission, CompilationResponse, CoreTone } from "./model";
import { CoreError, CoreHeading, CorePage, CorePanel, CorePill, CoreStepper, DemoNotice, FooterActions, SectionHeading } from "./shared";

const operatorTone: Record<string, CoreTone> = { SELECT: "neutral", DROP: "danger", MASK: "warning", GENERALIZE: "safe", BUCKET: "safe", AGGREGATE: "safe", EXTRACT_CATEGORY: "safe" };
const operatorLabel: Record<string, string> = { SELECT: "그대로 사용", DROP: "제외", MASK: "일부 가림", GENERALIZE: "넓은 범위로 변경", BUCKET: "구간으로 묶음", AGGREGATE: "합계로 묶음", EXTRACT_CATEGORY: "주제만 사용" };
const resultLabel: Record<string, string> = { PASS: "기준 충족", DENY: "제외됨", GENERALIZE: "넓게 표시", WARN: "확인 필요" };
const fieldLabel = (value: string) => value.replaceAll("_", " ").replace("exact address", "지역").replace("birth date", "연령대").replace("ticket text", "문의 주제");

export function ValidationCore({ viewId, initialCompilation, compilationError }: { viewId: string; initialCompilation?: CompilationResponse | null; compilationError?: string | null }) {
  const router = useRouter();
  const { view, loading, error, isFallback, reload } = useCoreNeedex(viewId);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  if (loading) return <div className="tv-page"><div className="h-[760px] animate-pulse rounded-2xl bg-tv-subtle" role="status" aria-label="검증 결과 로딩 중" /></div>;
  if (error && !isFallback) return <CoreError message={error} retry={() => void reload()} />;
  if (!initialCompilation && !isNeedexDemoMode) return <CoreError message={compilationError ?? "검증 결과를 불러오지 못했습니다."} />;
  const usingDemoCompilation = !initialCompilation;
  const compilation = initialCompilation ?? toCompilation(view);

  async function submitForApproval() {
    if (!compilation.can_submit_for_approval || submitting) return;
    if (isFallback || usingDemoCompilation) {
      router.push(`/taskviews/${view.id}/approval-pending`);
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await requestJson<ApprovalSubmission>(`/api/taskviews/${encodeURIComponent(view.id)}/submit`, { method: "POST" });
      router.push(`/taskviews/${view.id}/approval-pending`);
      router.refresh();
    } catch (cause) {
      setSubmitError(cause instanceof Error ? cause.message : "승인 요청을 전송하지 못했습니다.");
      setSubmitting(false);
    }
  }

  return (
    <CorePage className="gap-4 pb-8">
      <CoreHeading title="데이터 구성과 개인정보를 확인했어요" description="업무에 필요한 항목은 남기고, 개인을 알아볼 수 있는 정보는 제외하거나 안전한 범위로 바꿨습니다." />
      <CoreStepper current={2} />
      <section className="flex min-h-[72px] flex-col justify-center gap-3 rounded-[14px] border border-tv-blue-200 bg-tv-blue-50 px-[18px] sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0"><strong className="block truncate text-[11px] text-tv-ink">“{view.purpose}”</strong><span className="mt-1 block text-[8px] text-tv-gray">사용 가능 기간 {view.ttl_days}일</span></div>
        <div className="flex gap-2"><CorePill tone="safe">데이터 {compilation.source_match_count}곳 사용</CorePill><CorePill className="bg-tv-blue-500 text-white" tone="primary">확인 완료</CorePill></div>
      </section>

      {isFallback || usingDemoCompilation ? <DemoNotice error={error ?? compilationError} /> : null}

      <div className="grid min-h-[596px] gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <CorePanel className="flex min-w-0 flex-col overflow-hidden">
          <div className="p-4 pb-3"><SectionHeading title="데이터 처리 방법" description="원본 정보가 결과에 어떻게 포함되는지 쉬운 말로 보여드립니다." /></div>
          <div className="grid h-10 grid-cols-[minmax(90px,1fr)_minmax(110px,1.2fr)_minmax(120px,1.2fr)_minmax(90px,1fr)] items-center bg-tv-canvas px-4 text-[8px] font-medium text-tv-slate"><span>데이터</span><span>원래 항목</span><span>처리 방법</span><span>결과 항목</span></div>
          <div className="divide-y divide-tv-border">
            {compilation.transforms.slice(0, 6).map((item, index) => (
              <div className="grid min-h-[57px] grid-cols-[minmax(90px,1fr)_minmax(110px,1.2fr)_minmax(120px,1.2fr)_minmax(90px,1fr)] items-center gap-2 px-4 text-[9px]" key={`${item.source_key}-${item.raw_fields.join("-")}-${index}`}>
                <span className="truncate text-tv-gray">{item.source_name.replace("Tokyo Operations", "Tokyo Ops")}</span>
                <strong className="truncate text-tv-ink">{fieldLabel(item.raw_fields.join(" / "))}</strong>
                <CorePill className="max-w-[138px]" tone={operatorTone[item.operator]}>{operatorLabel[item.operator] ?? item.operator}</CorePill>
                <span className="truncate text-tv-ink">{item.task_field ? fieldLabel(item.task_field) : "사용하지 않음"}</span>
              </div>
            ))}
          </div>
          <div className="mt-auto flex min-h-[48px] items-center gap-2 bg-tv-blue-50 px-4 text-[9px] text-tv-blue-700"><Sparkles className="size-4 shrink-0" />이름·전화번호·이메일·상담 원문은 Task View에 존재하지 않습니다.</div>
        </CorePanel>

        <div className="flex min-w-0 flex-col gap-4">
          <CorePanel className="min-h-[184px] p-4">
            <SectionHeading title="분석에 충분한가요?" aside={<CorePill tone="success">기준 충족</CorePill>} description="개인정보를 줄여도 필요한 비교와 판단이 가능한지 확인했습니다." />
            <div className="mt-3 space-y-3">
              {compilation.utility_candidates.map((candidate) => <UtilityMeter key={candidate.mode} label={candidate.mode === "raw" ? "원본 데이터" : candidate.mode === "static_masking" ? "일부 가린 데이터" : "안전하게 만든 데이터"} score={candidate.score} verdict={candidate.mode === "raw" ? "정보가 너무 많음" : candidate.mode === "static_masking" ? "분석 정확도 낮음" : "업무 판단 가능"} tone={candidate.mode === "raw" ? "neutral" : candidate.mode === "static_masking" ? "warning" : "primary"} />)}
            </div>
          </CorePanel>
          <CorePanel className="min-h-[396px] p-4">
            <div className="flex items-center gap-2"><h2 className="text-[16px] font-bold text-tv-ink">개인정보 확인</h2><CorePill>자동 보호</CorePill></div>
            <div className="mt-4 space-y-2.5">
              {compilation.firewall_checks.slice(0, 5).map((check) => <div className="flex items-center justify-between gap-3" key={check.code}><span className="min-w-0 truncate text-[9px] text-tv-slate-dark">{fieldLabel(check.label)}</span><CorePill tone={check.result === "PASS" ? "success" : check.result === "DENY" ? "danger" : check.result === "GENERALIZE" ? "safe" : "warning"}>{resultLabel[check.result] ?? check.result}</CorePill></div>)}
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-tv-blue-50 px-3 py-2.5 text-tv-blue-700"><span className="grid size-5 place-items-center rounded-full border border-tv-blue-300">◎</span><div><strong className="block text-[9px]">다른 데이터와 함께 사용해도 안전해요</strong><span className="text-[8px]">여러 결과를 합쳐 개인을 알아낼 위험도 확인했습니다.</span></div></div>
          </CorePanel>
        </div>
      </div>

      {submitError ? <div className="rounded-xl border border-tv-red-200 bg-tv-red-50 px-4 py-2.5 text-[10px] text-tv-red-700" role="alert">{submitError}</div> : null}
      <FooterActions note="다음 단계에서 데이터 담당자가 사용 범위를 최종 확인합니다.">
        <Button asChild className="h-11 rounded-[10px]" variant="outline"><Link href={`/taskviews/${view.id}/discovery`}><ArrowLeft className="size-4" />목적 수정</Link></Button>
        <Button className="h-11 min-w-40 rounded-[10px]" disabled={!compilation.can_submit_for_approval || submitting} onClick={() => void submitForApproval()}>{submitting ? "승인 요청 전송 중…" : compilation.stage === "blocked" && compilation.can_submit_for_approval ? "안전한 대안 승인 요청" : "승인 요청 보내기"}<ArrowRight className="size-4" /></Button>
      </FooterActions>
    </CorePage>
  );
}

function UtilityMeter({ label, score, verdict, tone }: { label: string; score: number; verdict: string; tone: CoreTone }) {
  return <div><div className="flex items-center justify-between text-[8px]"><strong className="text-tv-ink">{label}</strong><span className={tone === "warning" ? "text-tv-amber-700" : tone === "primary" ? "text-tv-blue-500" : "text-tv-gray"}>{verdict}</span></div><div className="mt-1 h-1.5 overflow-hidden rounded-full bg-tv-subtle"><div className={cn("h-full rounded-full", tone === "warning" ? "bg-tv-amber-600" : tone === "primary" ? "bg-tv-blue-500" : "bg-tv-border")} style={{ width: `${Math.max(6, Math.min(100, score))}%` }} /></div></div>;
}
